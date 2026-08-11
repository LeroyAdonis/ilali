import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock every route dependency so the fast path can be asserted in isolation.
const {
  getCachedIntentMock,
  setCachedIntentMock,
  normalizeQueryKeyMock,
  extractIntentDeterministicMock,
  extractIntentMock,
  scoreAllProvidersMock,
  getProvidersMock,
  searchProvidersMock,
  getCategoriesMock,
  mapProviderMock,
} = vi.hoisted(() => ({
  getCachedIntentMock: vi.fn(),
  setCachedIntentMock: vi.fn(),
  normalizeQueryKeyMock: vi.fn(
    (q: string) => q.trim().toLowerCase().replace(/\s+/g, " ")
  ),
  extractIntentDeterministicMock: vi.fn(),
  extractIntentMock: vi.fn(),
  scoreAllProvidersMock: vi.fn(),
  getProvidersMock: vi.fn(),
  searchProvidersMock: vi.fn(),
  getCategoriesMock: vi.fn(),
  mapProviderMock: vi.fn(),
}));

vi.mock("@/lib/ai/intent-cache", () => ({
  getCachedIntent: getCachedIntentMock,
  setCachedIntent: setCachedIntentMock,
  normalizeQueryKey: normalizeQueryKeyMock,
  deleteCachedIntent: vi.fn(),
}));

vi.mock("@/lib/ai/deterministic", () => ({
  extractIntentDeterministic: extractIntentDeterministicMock,
}));

vi.mock("@/lib/ai/match", () => ({
  extractIntent: extractIntentMock,
}));

vi.mock("@/lib/ai/score", () => ({
  scoreAllProviders: scoreAllProvidersMock,
}));

vi.mock("@/lib/data-source", () => ({
  getProviders: getProvidersMock,
  searchProviders: searchProvidersMock,
  getCategories: getCategoriesMock,
}));

vi.mock("@/lib/db/mappers", () => ({
  mapProvider: mapProviderMock,
}));

import { POST } from "@/app/api/match/route";

const PROVIDER = { id: "p1", name: "Sea Point Football" };

function postJson(query: string): Promise<Response> {
  return POST(
    new Request("http://localhost/api/match", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query }),
    })
  );
}

async function jsonOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

/** Default happy-path scoring: one good match so the response is `fallback: false`. */
function stubGoodMatch(): void {
  scoreAllProvidersMock.mockReturnValue([
    { provider: PROVIDER, score: 85, reasons: ["Tags: sport"] },
  ]);
  mapProviderMock.mockImplementation((p: { id: string; name: string }) => ({
    id: p.id,
    name: p.name,
  }));
}

describe("POST /api/match — fast path (cache → deterministic → ai → keyword)", () => {
  beforeEach(() => {
    getCachedIntentMock.mockReset();
    setCachedIntentMock.mockReset().mockResolvedValue(undefined);
    extractIntentDeterministicMock.mockReset();
    extractIntentMock.mockReset();
    scoreAllProvidersMock.mockReset();
    getProvidersMock.mockReset().mockResolvedValue([PROVIDER]);
    getCategoriesMock.mockReset().mockResolvedValue([]);
    searchProvidersMock.mockReset();
    mapProviderMock.mockReset();
  });

  it("uses the cached intent and skips both extractors (mode: cache)", async () => {
    getCachedIntentMock.mockResolvedValue({
      intent: { ageMin: 7, ageMax: 7, tags: ["sport"], location: "Sea Point" },
      mode: "ai",
    });
    stubGoodMatch();

    const res = await postJson("football for my 7 year old near Sea Point");
    const body = await jsonOf(res);

    expect(res.status).toBe(200);
    expect(body.mode).toBe("cache");
    expect(body.fallback).toBe(false);
    expect(body.intent).toEqual({
      ageMin: 7,
      ageMax: 7,
      tags: ["sport"],
      location: "Sea Point",
    });
    expect(body.total).toBe(1);
    expect(body.query).toBe("football for my 7 year old near Sea Point");
    expect(extractIntentDeterministicMock).not.toHaveBeenCalled();
    expect(extractIntentMock).not.toHaveBeenCalled();
    expect(setCachedIntentMock).not.toHaveBeenCalled();
  });

  it("treats a null-shaped cached intent as a miss and falls through to deterministic", async () => {
    getCachedIntentMock.mockResolvedValue({
      intent: { tags: [] },
      mode: "ai",
    });
    extractIntentDeterministicMock.mockReturnValue({
      ageMin: 7,
      ageMax: 7,
      tags: ["sport", "outdoor"],
      location: "Sea Point",
    });
    stubGoodMatch();

    const body = await jsonOf(await postJson("football for my 7 year old"));

    expect(body.mode).toBe("deterministic");
    expect(extractIntentMock).not.toHaveBeenCalled();
    expect(setCachedIntentMock).toHaveBeenCalledWith(
      "football for my 7 year old",
      expect.objectContaining({ tags: ["sport", "outdoor"] }),
      "deterministic"
    );
  });

  it("uses deterministic extraction on cache miss (mode: deterministic)", async () => {
    getCachedIntentMock.mockResolvedValue(null);
    extractIntentDeterministicMock.mockReturnValue({
      ageMin: 7,
      ageMax: 7,
      tags: ["sport", "outdoor"],
      location: "Sea Point",
    });
    stubGoodMatch();

    const body = await jsonOf(await postJson("football for my 7 year old"));

    expect(body.mode).toBe("deterministic");
    expect(body.fallback).toBe(false);
    expect(extractIntentMock).not.toHaveBeenCalled();
    expect(setCachedIntentMock).toHaveBeenCalledWith(
      "football for my 7 year old",
      expect.objectContaining({ ageMin: 7, ageMax: 7 }),
      "deterministic"
    );
  });

  it("falls through to AI when deterministic is not confident (mode: ai)", async () => {
    getCachedIntentMock.mockResolvedValue(null);
    extractIntentDeterministicMock.mockReturnValue(null);
    extractIntentMock.mockResolvedValue({ tags: ["music"], ageMin: 5, ageMax: 8 });
    stubGoodMatch();

    const body = await jsonOf(await postJson("something musical for my kid"));

    expect(body.mode).toBe("ai");
    expect(body.intent).toEqual({ tags: ["music"], ageMin: 5, ageMax: 8 });
    expect(setCachedIntentMock).toHaveBeenCalledWith(
      "something musical for my kid",
      expect.objectContaining({ tags: ["music"] }),
      "ai"
    );
  });

  it("keeps the keyword fallback exactly as before when everything misses", async () => {
    getCachedIntentMock.mockResolvedValue(null);
    extractIntentDeterministicMock.mockReturnValue(null);
    extractIntentMock.mockResolvedValue(null);
    searchProvidersMock.mockResolvedValue([PROVIDER]);
    getCategoriesMock.mockResolvedValue([]);
    mapProviderMock.mockImplementation((p: { id: string; name: string }) => ({
      id: p.id,
      name: p.name,
    }));

    const body = await jsonOf(await postJson("something fun"));

    expect(body.mode).toBe("keyword");
    expect(body.fallback).toBe(true);
    expect(body.matches).toEqual([
      { provider: { id: "p1", name: "Sea Point Football" }, score: 50, reasons: ["Keyword match"] },
    ]);
    expect(body.total).toBe(1);
    expect(scoreAllProvidersMock).not.toHaveBeenCalled();
  });

  it("returns 400 for a missing query", async () => {
    const res = await POST(
      new Request("http://localhost/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(400);
  });
});
