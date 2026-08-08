import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

vi.mock("@/lib/ai/client", () => ({
  chat: vi.fn().mockResolvedValue(
    JSON.stringify([
      { field: "website", value: "https://stardance.example.com", sourceUrl: "https://example.com/page1" },
      { field: "instagram", value: "@stardance", sourceUrl: "https://example.com/page2" },
      { field: "madeup", value: "nope", sourceUrl: "https://example.com/page3" },
    ])
  ),
}));

import { enrichProvider } from "../enrich";

describe("enrichProvider — WS-7 web enrichment", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns empty when search yields no results", async () => {
    // Search returns a page with no DDG result links
    fetchMock.mockResolvedValueOnce(
      new Response("Title: no results\n\nMarkdown: nothing here", { status: 200 })
    );

    const result = await enrichProvider("Nonexistent Studio");
    expect(result).toEqual([]);
  });

  it("parses DDG result links and synthesises suggestions", async () => {
    // Search response contains one DDG-style result link
    fetchMock.mockResolvedValueOnce(
      new Response(
        '[Star Dance](https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fpage1&rut=x)',
        { status: 200 }
      )
    );
    // Page read response
    fetchMock.mockResolvedValueOnce(
      new Response("Title: Star Dance\n\nMarkdown: A ballet studio in Claremont.", { status: 200 })
    );

    const result = await enrichProvider("Star Dance");
    expect(result).toHaveLength(2); // chat mock returns 3 items, 1 filtered (bad field)
    expect(result[0]).toEqual({
      field: "website",
      value: "https://stardance.example.com",
      sourceUrl: "https://example.com/page1",
    });
    expect(result.map((r) => r.field)).not.toContain("madeup");
  });

  it("returns empty when page reads fail", async () => {
    // Search yields a link
    fetchMock.mockResolvedValueOnce(
      new Response(
        '[Star Dance](https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fpage1&rut=x)',
        { status: 200 }
      )
    );
    // Page read fails (non-OK)
    fetchMock.mockResolvedValueOnce(new Response("error", { status: 500 }));

    const result = await enrichProvider("Star Dance");
    expect(result).toEqual([]);
  });

  it("caps suggestions at 6", async () => {
    fetchMock.mockResolvedValueOnce(new Response("no links", { status: 200 }));
    const result = await enrichProvider("Whatever");
    expect(result.length).toBeLessThanOrEqual(6);
  });
});
