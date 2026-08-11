import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the AI client so extractIntent never hits the network.
const { chatMock } = vi.hoisted(() => ({ chatMock: vi.fn() }));

vi.mock("@/lib/ai/client", () => ({
  chat: chatMock,
}));

import { extractIntent } from "../match";

describe("extractIntent — post-production AI extraction (f66e869)", () => {
  beforeEach(() => {
    chatMock.mockReset();
  });

  it("returns null when chat fails", async () => {
    chatMock.mockResolvedValue(null);

    const result = await extractIntent("tennis");
    expect(result).toBeNull();
  });

  it("parses clean JSON", async () => {
    chatMock.mockResolvedValue(
      '{"ageMin":9,"ageMax":9,"tags":["sport"],"location":"Claremont","priceMax":null}'
    );

    const result = await extractIntent("tennis for 9 year olds in Claremont");
    expect(result).toEqual({
      ageMin: 9,
      ageMax: 9,
      tags: ["sport"],
      location: "Claremont",
      priceMax: undefined,
    });
  });

  it("strips ```json fences", async () => {
    chatMock.mockResolvedValue(
      '```json\n{"ageMin":8,"tags":["sport"],"location":null,"priceMax":null}\n```'
    );

    const result = await extractIntent("8 year old");
    expect(result?.ageMin).toBe(8);
    expect(result?.tags).toEqual(["sport"]);
  });

  it("filters invalid tags to MATCH_TAGS only", async () => {
    chatMock.mockResolvedValue(
      '{"tags":["sport","not-a-real-tag","music","nonsense"]}'
    );

    const result = await extractIntent("music");
    expect(result?.tags).toEqual(["sport", "music"]);
  });

  it("handles garbage JSON without throwing", async () => {
    chatMock.mockResolvedValue("not json at all");

    const result = await extractIntent("???");
    expect(result).toBeNull();
  });

  it("uses the 25s timeout", async () => {
    chatMock.mockResolvedValue('{"tags":["sport"]}');

    await extractIntent("tennis");
    expect(chatMock).toHaveBeenCalledTimes(1);
    expect(chatMock).toHaveBeenCalledWith(
      expect.objectContaining({ timeoutMs: 25000 })
    );
  });
});
