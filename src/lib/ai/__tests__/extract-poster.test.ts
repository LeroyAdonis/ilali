import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AI client so extraction never hits the network.
const { chatMock } = vi.hoisted(() => ({ chatMock: vi.fn() }));

vi.mock("@/lib/ai/client", () => ({
  chat: chatMock,
}));

import { extractPoster, cleanPhone } from "../extract-poster";

describe("extractPoster — WS-7 vision extraction", () => {
  beforeEach(() => {
    chatMock.mockReset();
  });

  it("returns null when chat fails", async () => {
    chatMock.mockResolvedValue(null);
    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result).toBeNull();
  });

  it("parses clean JSON from the vision model", async () => {
    chatMock.mockResolvedValue(
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
    );

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
    chatMock.mockResolvedValue(
      '```json\n{"name":"Soccer Stars","tags":["sport","outdoor"]}\n```'
    );
    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result?.name).toBe("Soccer Stars");
    expect(result?.tags).toEqual(["sport", "outdoor"]);
  });

  it("passes the vision model + image URL to chat", async () => {
    chatMock.mockResolvedValue('{"name":"Test"}');
    await extractPoster("https://example.com/poster.jpg");
    expect(chatMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "meta/llama-3.2-90b-vision-instruct",
        imageUrl: "https://example.com/poster.jpg",
        responseFormat: "json",
      })
    );
  });

  it("filters invalid tags and caps at 5", async () => {
    chatMock.mockResolvedValue(
      JSON.stringify({
        tags: ["sport", "nonsense", "creative", "music", "x", "y", "z"],
      })
    );
    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result?.tags).toEqual(["sport", "creative", "music"]);
  });

  it("handles garbage JSON without throwing", async () => {
    chatMock.mockResolvedValue("not json at all");
    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result).toBeNull();
  });

  it("normalises local phone numbers to +27", async () => {
    chatMock.mockResolvedValue(JSON.stringify({ phone: "082 123 4567" }));
    const result = await extractPoster("https://example.com/poster.jpg");
    expect(result?.phone).toBe("+27821234567");
  });
});

describe("cleanPhone — SA number normalisation", () => {
  it("keeps already-international numbers", () => {
    expect(cleanPhone("+27821234567")).toBe("+27821234567");
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
