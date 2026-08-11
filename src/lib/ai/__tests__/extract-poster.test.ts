import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AI client so extraction never hits the network.
const { chatMock } = vi.hoisted(() => ({ chatMock: vi.fn() }));

vi.mock("@/lib/ai/client", () => ({
  chat: chatMock,
  OPENROUTER_VISION_MODEL: "nvidia/nemotron-nano-12b-v2-vl:free",
}));

// Mock the Gemini fallback so tests are deterministic.
const { geminiMock } = vi.hoisted(() => ({ geminiMock: vi.fn() }));

vi.mock("../gemini-vision", () => ({
  extractPosterWithGemini: geminiMock,
}));

import { extractPoster, cleanPhone } from "../extract-poster";

describe("extractPoster — WS-7 vision extraction", () => {
  beforeEach(() => {
    chatMock.mockReset();
    geminiMock.mockReset();
  });

  it("returns null when both Gemini and chat() fail", async () => {
    geminiMock.mockResolvedValue(null);
    chatMock.mockResolvedValue(null);
    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result).toBeNull();
    expect(chatMock).toHaveBeenCalled(); // chat() fallback attempted
  });

  it("uses Gemini FIRST when it succeeds (chat() not called)", async () => {
    geminiMock.mockResolvedValue({
      name: "Mini Maestros",
      phone: "082 555 1234",
      tags: ["music", "group"],
    });
    // Logo pass: Gemini returns nothing again, chat() returns null → no logo.
    chatMock.mockResolvedValue(null);
    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result?.name).toBe("Mini Maestros");
    expect(result?.phone).toBe(cleanPhone("082 555 1234")); // normalised through cleanPhone
    expect(result?.tags).toEqual(["music", "group"]);
    // Main extraction used Gemini; the logo pass may hit chat() only.
    expect(chatMock).toHaveBeenCalledTimes(1); // logo pass attempt
  });

  it("falls back to chat() when Gemini fails", async () => {
    geminiMock.mockResolvedValue(null); // Gemini unavailable
    chatMock.mockResolvedValue(JSON.stringify({ name: "Vision Winner" }));
    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result?.name).toBe("Vision Winner");
  });

  it("parses clean JSON from the vision model", async () => {
    // Main extraction (Gemini miss → chat()) returns the full poster object.
    geminiMock.mockResolvedValue(null); // main Gemini miss
    chatMock
      .mockResolvedValueOnce(
        JSON.stringify({
          name: "Little Stars Dance",
          category: "Dance & Movement",
          description: "Ballet and hip hop for little ones",
          location: "Claremont",
          ageMin: 3,
          ageMax: 8,
          priceValue: 150,
          phone: "+27821234567",
          website: "https://littlestars.example.com",
          tags: ["creative", "group"],
        })
      )
      // Logo pass: Gemini misses, chat() logo pass finds nothing.
      .mockResolvedValueOnce(JSON.stringify({ logoBox: null }));

    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result).toEqual({
      name: "Little Stars Dance",
      category: "Dance & Movement",
      description: "Ballet and hip hop for little ones",
      location: "Claremont",
      ageMin: 3,
      ageMax: 8,
      priceValue: 150,
      phone: "+27821234567",
      website: "https://littlestars.example.com",
      instagram: undefined,
      facebook: undefined,
      tags: ["creative", "group"],
    });
  });

  it("strips ```json fences", async () => {
    // Main extraction via chat() (Gemini miss); logo pass finds nothing.
    geminiMock.mockResolvedValue(null);
    chatMock
      .mockResolvedValueOnce(
        '```json\n{"name":"Soccer Stars","tags":["sport","outdoor"]}\n```'
      )
      .mockResolvedValueOnce(JSON.stringify({ logoBox: null }));
    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result?.name).toBe("Soccer Stars");
    expect(result?.tags).toEqual(["sport", "outdoor"]);
  });

  it("passes the vision model + image URL to chat", async () => {
    geminiMock.mockResolvedValue(null);
    chatMock
      .mockResolvedValueOnce('{"name":"Test"}')
      .mockResolvedValueOnce(JSON.stringify({ logoBox: null }));
    await extractPoster("https://example.com/poster.jpg");
    // The main extraction chat() call carries the vision model + image.
    expect(chatMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "nvidia/nemotron-nano-12b-v2-vl:free",
        imageUrl: "https://example.com/poster.jpg",
        responseFormat: "json",
      })
    );
  });

  it("filters invalid tags and caps at 5", async () => {
    geminiMock.mockResolvedValue(null);
    chatMock
      .mockResolvedValueOnce(
        JSON.stringify({
          tags: ["sport", "nonsense", "creative", "music", "x", "y", "z"],
        })
      )
      .mockResolvedValueOnce(JSON.stringify({ logoBox: null }));
    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result?.tags).toEqual(["sport", "creative", "music"]);
  });

  it("handles garbage JSON without throwing", async () => {
    chatMock.mockResolvedValue("not json at all");
    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result).toBeNull();
  });

  it("normalises local phone numbers to +27", async () => {
    geminiMock.mockResolvedValue(null);
    chatMock
      .mockResolvedValueOnce(JSON.stringify({ phone: "082 123 4567" }))
      .mockResolvedValueOnce(JSON.stringify({ logoBox: null }));
    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result?.phone).toBe("+27821234567");
  });

  it("passes a valid logoBox through from the vision model", async () => {
    geminiMock.mockResolvedValue({
      name: "Little Stars Dance",
      logoBox: { x: 72, y: 6, width: 20, height: 12 },
    });
    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result?.logoBox).toEqual({ x: 72, y: 6, width: 20, height: 12 });
    // logoBox present → no dedicated logo pass needed
    expect(chatMock).not.toHaveBeenCalled();
    expect(geminiMock).toHaveBeenCalledTimes(1);
  });

  it("clamps logoBox percentages to valid 0-100 bounds", async () => {
    geminiMock.mockResolvedValue({
      name: "Little Stars Dance",
      logoBox: { x: -10, y: 105, width: 0, height: 250 },
    });
    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result?.logoBox).toEqual({ x: 0, y: 100, width: 1, height: 100 });
  });

  it("runs the dedicated logo pass when the main extraction omits logoBox", async () => {
    // Main extraction succeeds but returns no logoBox.
    geminiMock
      .mockResolvedValueOnce({ name: "No Logo Club" }) // main extraction
      .mockResolvedValueOnce({ logoBox: { x: 82.5, y: 5.7, width: 12.6, height: 10.1 } }); // logo pass
    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result?.name).toBe("No Logo Club");
    expect(result?.logoBox).toEqual({ x: 82.5, y: 5.7, width: 12.6, height: 10.1 });
    // Logo pass found it via Gemini — chat() never called.
    expect(chatMock).not.toHaveBeenCalled();
    expect(geminiMock).toHaveBeenCalledTimes(2);
  });

  it("logo pass falls back to chat() when Gemini logo pass misses", async () => {
    // Main extraction: no logoBox. Gemini logo pass: null. chat() logo pass: box.
    geminiMock
      .mockResolvedValueOnce({ name: "No Logo Club" }) // main extraction
      .mockResolvedValueOnce(null); // Gemini logo pass miss
    chatMock.mockResolvedValue(
      JSON.stringify({ logoBox: { x: 10, y: 10, width: 20, height: 20 } })
    );
    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result?.name).toBe("No Logo Club");
    expect(result?.logoBox).toEqual({ x: 10, y: 10, width: 20, height: 20 });
  });

  it("returns undefined logoBox when the model omits it and logo pass finds nothing", async () => {
    geminiMock.mockResolvedValue({ name: "No Logo Club" });
    chatMock.mockResolvedValue(JSON.stringify({ logoBox: null }));
    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result?.logoBox).toBeUndefined();
  });
});

describe("cleanPhone — SA number normalisation", () => {
  it("keeps already-international numbers", () => {
    expect(cleanPhone("+2784567")).toBe("+2784567");
  });

  it("converts 0-prefix numbers", () => {
    expect(cleanPhone("0821234567")).toBe("+27821234567");
  });

  it("converts 00-prefix numbers", () => {
    expect(cleanPhone("0027821234567")).toBe("+27821234567");
  });

  it("strips spaces and dashes", () => {
    expect(cleanPhone("082 123 4567")).toBe("+27821234567");
    expect(cleanPhone("+27 82 123 4567")).toBe("+27821234567");
  });
});
