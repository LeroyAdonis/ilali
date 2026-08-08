import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { chatMock } = vi.hoisted(() => ({ chatMock: vi.fn() }));

vi.mock("@/lib/ai/client", () => ({
  chat: chatMock,
}));

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

import { chatWithFallback } from "@/lib/ai/gemini-vision";

describe("chatWithFallback — NIM first, Gemini second", () => {
  beforeEach(() => {
    chatMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    process.env.GEMINI_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.GEMINI_API_KEY;
    vi.unstubAllGlobals();
  });

  it("returns NIM result when NIM succeeds (Gemini not called)", async () => {
    chatMock.mockResolvedValue("NIM response");
    const result = await chatWithFallback({
      systemPrompt: "sys",
      userMessage: "hi",
    });
    expect(result).toBe("NIM response");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("falls back to Gemini when NIM returns null", async () => {
    chatMock.mockResolvedValue(null);
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Gemini response" } }],
        }),
        { status: 200 }
      )
    );
    const result = await chatWithFallback({
      systemPrompt: "sys",
      userMessage: "hi",
    });
    expect(result).toBe("Gemini response");
    // Gemini endpoint was hit with the model alias
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("chat/completions");
    expect(JSON.parse(String(init.body)).model).toBe("gemini-flash-latest");
  });

  it("falls back to Gemini when NIM returns unparseable JSON (json mode)", async () => {
    chatMock.mockResolvedValue("this is not json at all");
    // Fresh Response per call — a Response body is a one-shot stream, and
    // json mode retries once (free-tier truncation handling).
    fetchMock.mockImplementation(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            choices: [{ message: { content: "Gemini JSON" } }],
          }),
          { status: 200 }
        )
      )
    );
    const result = await chatWithFallback({
      systemPrompt: "sys",
      userMessage: "hi",
      json: true,
    });
    expect(result).toBe("Gemini JSON");
    expect(fetchMock).toHaveBeenCalled();
  });

  it("returns NIM JSON without calling Gemini when parseable", async () => {
    chatMock.mockResolvedValue('{"ok": true}');
    const result = await chatWithFallback({
      systemPrompt: "sys",
      userMessage: "hi",
      json: true,
    });
    expect(result).toBe('{"ok": true}');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null when both fail", async () => {
    chatMock.mockResolvedValue(null);
    fetchMock.mockResolvedValue(
      new Response("{}", { status: 500 })
    );
    const result = await chatWithFallback({
      systemPrompt: "sys",
      userMessage: "hi",
    });
    expect(result).toBeNull();
  });

  it("passes timeout through to NIM call", async () => {
    chatMock.mockResolvedValue("ok");
    await chatWithFallback({
      systemPrompt: "sys",
      userMessage: "hi",
      timeoutMs: 42000,
    });
    expect(chatMock).toHaveBeenCalledWith(
      expect.objectContaining({ timeoutMs: 42000 })
    );
  });
});
