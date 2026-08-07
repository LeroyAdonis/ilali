import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { chat, NIM_MODEL_POOL, getAIConfig } from "../ai/client";

const MOCK_KEY = "nvapi-test-key-123";

describe("NIM AI client — rotation (DeepSeek removed 2026-08-07)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NVIDIA_API_KEY = MOCK_KEY;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("exports a pool of verified free NIM models", () => {
    expect(NIM_MODEL_POOL.length).toBeGreaterThanOrEqual(3);
    // Primary is the benchmarked winner
    expect(NIM_MODEL_POOL[0]).toBe("nvidia/nemotron-3-super-120b-a12b");
    // No DeepSeek anywhere
    expect(NIM_MODEL_POOL.join(" ").toLowerCase()).not.toContain("deepseek");
  });

  it("returns the primary result when it succeeds", async () => {
    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "ok" } }] }),
    });
    vi.stubGlobal("fetch", fakeFetch);

    const result = await chat({ systemPrompt: "s", userMessage: "u" });
    expect(result).toBe("ok");
    // Exactly one attempt — no rotation when primary works
    expect(fakeFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(fakeFetch.mock.calls[0][1].body);
    expect(body.model).toBe(NIM_MODEL_POOL[0]);
    expect(body.messages).toEqual([
      { role: "system", content: "s" },
      { role: "user", content: "u" },
    ]);
  });

  it("rotates to the next NIM model when the primary fails (429)", async () => {
    const fakeFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "backup" } }] }),
      });
    vi.stubGlobal("fetch", fakeFetch);

    const result = await chat({ systemPrompt: "s", userMessage: "u" });
    expect(result).toBe("backup");
    expect(fakeFetch).toHaveBeenCalledTimes(2);
    const secondBody = JSON.parse(fakeFetch.mock.calls[1][1].body);
    expect(secondBody.model).toBe(NIM_MODEL_POOL[1]);
  });

  it("rotates through the whole pool when every model fails", async () => {
    const fakeFetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    vi.stubGlobal("fetch", fakeFetch);

    const result = await chat({ systemPrompt: "s", userMessage: "u" });
    expect(result).toBeNull();
    expect(fakeFetch).toHaveBeenCalledTimes(NIM_MODEL_POOL.length);
    // Each model tried exactly once, in pool order
    for (let i = 0; i < NIM_MODEL_POOL.length; i++) {
      const body = JSON.parse(fakeFetch.mock.calls[i][1].body);
      expect(body.model).toBe(NIM_MODEL_POOL[i]);
    }
  });

  it("respects a per-call model override as the first attempt", async () => {
    const fakeFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ choices: [{ message: { content: "rotated" } }] }),
      });
    vi.stubGlobal("fetch", fakeFetch);

    const result = await chat({
      systemPrompt: "s",
      userMessage: "u",
      model: "some/custom-model",
    });
    expect(result).toBe("rotated");
    const firstBody = JSON.parse(fakeFetch.mock.calls[0][1].body);
    expect(firstBody.model).toBe("some/custom-model");
    // Rotates to pool[0] next, not the override again
    const secondBody = JSON.parse(fakeFetch.mock.calls[1][1].body);
    expect(secondBody.model).toBe(NIM_MODEL_POOL[0]);
  });

  it("returns null immediately when NVIDIA_API_KEY is missing", async () => {
    delete process.env.NVIDIA_API_KEY;
    const fakeFetch = vi.fn();
    vi.stubGlobal("fetch", fakeFetch);

    const result = await chat({ systemPrompt: "s", userMessage: "u" });
    expect(result).toBeNull();
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  it("passes response_format json_object when requested", async () => {
    const fakeFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "{}" } }] }),
    });
    vi.stubGlobal("fetch", fakeFetch);

    await chat({ systemPrompt: "s", userMessage: "u", responseFormat: "json" });
    const body = JSON.parse(fakeFetch.mock.calls[0][1].body);
    expect(body.response_format).toEqual({ type: "json_object" });
  });

  it("never references DeepSeek in the config", () => {
    const cfg = getAIConfig();
    expect(cfg.provider).toBe("nvidia");
    expect(cfg.baseUrl).toContain("nvidia.com");
  });
});
