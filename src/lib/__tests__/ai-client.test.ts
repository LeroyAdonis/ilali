import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  chat,
  OPENCODE_MODEL,
  OPENROUTER_MODEL_POOL,
  OPENROUTER_VISION_MODEL,
  getAIConfig,
} from "../ai/client";

// Audit logging is an external side effect (DB insert through the neon HTTP
// driver, which itself uses global fetch) — mock it so it never pollutes the
// mocked fetch call counts these tests assert on.
vi.mock("../ai/audit", () => ({
  logAiCallAsync: vi.fn(),
}));

const MOCK_OC_PASS = "oc-test-password-123";
const MOCK_OR_KEY = "sk-or-v1-test-key-123";

describe("AI client — OpenCode primary → OpenRouter fallback (NIM removed 2026-08-11)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.OPENCODE_SERVER_PASSWORD = MOCK_OC_PASS;
    process.env.OPENCODE_SERVER_URL = "http://opencode.test:4055";
    process.env.OPENROUTER_API_KEY = MOCK_OR_KEY;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("exports the OpenCode big-pickle model and OpenRouter free pool", () => {
    expect(OPENCODE_MODEL).toEqual({ providerID: "opencode", modelID: "big-pickle" });
    // Free pool: gpt-oss-20b first (4.8s benchmark winner), 4 models, all :free
    expect(OPENROUTER_MODEL_POOL.length).toBeGreaterThanOrEqual(4);
    expect(OPENROUTER_MODEL_POOL[0]).toBe("openai/gpt-oss-20b:free");
    for (const m of OPENROUTER_MODEL_POOL) {
      expect(m).toContain(":free");
    }
    // No NIM base URL anywhere in the pool (all :free OpenRouter models)
    expect(OPENROUTER_MODEL_POOL.join(" ")).not.toContain("integrate.api.nvidia.com");
  });

  it("getAIConfig reads OpenCode + OpenRouter env with defaults", () => {
    const cfg = getAIConfig();
    expect(cfg.opencodeUrl).toBe("http://opencode.test:4055");
    expect(cfg.opencodeUsername).toBe("opencode");
    expect(cfg.opencodePassword).toBe(MOCK_OC_PASS);
    expect(cfg.openRouterKey).toBe(MOCK_OR_KEY);
  });

  it("getAIConfig defaults OpenCode URL to localhost when env missing", () => {
    delete process.env.OPENCODE_SERVER_URL;
    const cfg = getAIConfig();
    expect(cfg.opencodeUrl).toBe("http://127.0.0.1:4055");
  });

  it("chat() calls OpenCode (session create + message) and returns its text", async () => {
    const fetchMock = vi
      .fn()
      // session create
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "ses_test123" }),
      })
      // message
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          parts: [
            { type: "step-start", title: "" },
            { type: "text", text: '{"ageMin":7}' },
          ],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await chat({ systemPrompt: "sys", userMessage: "7yo football" });

    expect(result).toBe('{"ageMin":7}');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    // Session create: POST to /session with Basic auth
    const [createUrl, createInit] = fetchMock.mock.calls[0];
    expect(String(createUrl)).toContain("/session");
    expect(createInit.method).toBe("POST");
    expect(String(createInit.headers.Authorization)).toContain("Basic ");

    // Message: POST to /session/{id}/message with system + disabled tools
    const [msgUrl, msgInit] = fetchMock.mock.calls[1];
    expect(String(msgUrl)).toContain("/session/ses_test123/message");
    const body = JSON.parse(msgInit.body);
    expect(body.system).toBe("sys");
    expect(body.parts[0].text).toBe("7yo football");
    expect(body.model).toEqual({ providerID: "opencode", modelID: "big-pickle" });
    // Agent tools explicitly disabled — pure completion, no bash/file access
    expect(body.tools.bash).toBe(false);
    expect(body.tools.edit).toBe(false);
  });

  it("falls back to OpenRouter pool when OpenCode fails", async () => {
    const fetchMock = vi
      .fn()
      // session create fails (500)
      .mockResolvedValueOnce({ ok: false, status: 500 })
      // OpenRouter first model succeeds
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "or-fallback" } }],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await chat({ systemPrompt: "s", userMessage: "u" });

    expect(result).toBe("or-fallback");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [orUrl, orInit] = fetchMock.mock.calls[1];
    expect(String(orUrl)).toContain("openrouter.ai");
    expect(JSON.parse(orInit.body).model).toBe(OPENROUTER_MODEL_POOL[0]);
  });

  it("rotates through OpenRouter pool when earlier models fail", async () => {
    const fetchMock = vi
      .fn()
      // OpenCode session create fails
      .mockResolvedValueOnce({ ok: false, status: 503 })
      // OpenRouter model 1: 429
      .mockResolvedValueOnce({ ok: false, status: 429 })
      // OpenRouter model 2: success
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "rotated" } }] }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await chat({ systemPrompt: "s", userMessage: "u" });
    expect(result).toBe("rotated");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const secondBody = JSON.parse(fetchMock.mock.calls[2][1].body);
    expect(secondBody.model).toBe(OPENROUTER_MODEL_POOL[1]);
  });

  it("tries model override first in the OpenRouter pool", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 }) // OpenCode down
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "override" } }] }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await chat({
      systemPrompt: "s",
      userMessage: "u",
      model: "some/custom-model:free",
    });
    expect(result).toBe("override");
    const firstOrBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(firstOrBody.model).toBe("some/custom-model:free");
  });

  it("returns null when every tier fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 503 });
    vi.stubGlobal("fetch", fetchMock);

    const result = await chat({ systemPrompt: "s", userMessage: "u" });
    expect(result).toBeNull();
    // OpenCode session + 4 OpenRouter models
    expect(fetchMock).toHaveBeenCalledTimes(1 + OPENROUTER_MODEL_POOL.length);
  });

  it("returns null immediately when OpenCode + OpenRouter keys are missing", async () => {
    delete process.env.OPENCODE_SERVER_PASSWORD;
    delete process.env.OPENROUTER_API_KEY;
    const fakeFetch = vi.fn();
    vi.stubGlobal("fetch", fakeFetch);

    const result = await chat({ systemPrompt: "s", userMessage: "u" });
    expect(result).toBeNull();
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it("vision requests skip OpenCode and try the OpenRouter vision model once", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "vision-ok" } }],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await chat({
      systemPrompt: "s",
      userMessage: "u",
      imageUrl: "https://example.com/poster.png",
    });

    expect(result).toBe("vision-ok");
    expect(fetchMock).toHaveBeenCalledTimes(1); // no OpenCode session call
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("openrouter.ai");
    expect(JSON.parse(init.body).model).toBe(OPENROUTER_VISION_MODEL);
  });

  it("vision requests use the model override when provided", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "vision-override" } }],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await chat({
      systemPrompt: "s",
      userMessage: "u",
      imageUrl: "https://example.com/poster.png",
      model: "my/custom-vision-model",
    });

    expect(result).toBe("vision-override");
    expect(fetchMock).toHaveBeenCalledTimes(1); // single attempt, no text-pool rotation
    const [url, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body).model).toBe("my/custom-vision-model");
  });

  it("passes response_format json_object when requested", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 }) // OpenCode down
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "{}" } }] }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await chat({ systemPrompt: "s", userMessage: "u", responseFormat: "json" });
    const orBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(orBody.response_format).toEqual({ type: "json_object" });
  });
});
