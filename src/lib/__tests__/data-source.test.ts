import { describe, it, expect, beforeAll } from "vitest";

describe("Data Source — USE_MOCK toggle", () => {
  let dataSource: typeof import("@/lib/data-source");

  beforeAll(async () => {
    // Force USE_MOCK=true for testing
    process.env.NEXT_PUBLIC_USE_MOCK = "true";
    dataSource = await import("@/lib/data-source");
  });

  it("getProviders returns mock data when USE_MOCK=true", async () => {
    const providers = await dataSource.getProviders();
    expect(providers.length).toBeGreaterThanOrEqual(10);
  });

  it("getProviders filters by category", async () => {
    const sports = await dataSource.getProviders({ category: "sports" });
    expect(sports.length).toBeGreaterThan(0);
    for (const p of sports) {
      expect(p.category).toBe("sports");
    }
  });

  it("getProviders filters by age range", async () => {
    const results = await dataSource.getProviders({ ageMin: 10 });
    for (const p of results) {
      expect(p.ageMin).toBeGreaterThanOrEqual(10);
    }
  });

  it("getProviders filters by max price", async () => {
    const results = await dataSource.getProviders({ maxPrice: 15000 });
    for (const p of results) {
      expect(p.priceValue).toBeLessThanOrEqual(15000);
    }
  });

  it("getProviders filters by location (case-insensitive)", async () => {
    const results = await dataSource.getProviders({ location: "claremont" });
    expect(results.length).toBeGreaterThan(0);
    for (const p of results) {
      expect(p.location.toLowerCase()).toContain("claremont");
    }
  });

  it("getProviderBySlug returns a provider", async () => {
    const provider = await dataSource.getProviderBySlug("soccer-stars-academy");
    expect(provider).toBeDefined();
    expect(provider?.name).toBeTruthy();
  });

  it("getProviderBySlug returns null for unknown slug", async () => {
    const provider = await dataSource.getProviderBySlug("nonexistent-12345");
    expect(provider).toBeNull();
  });

  it("getCategories returns all categories", async () => {
    const cats = await dataSource.getCategories();
    expect(cats.length).toBeGreaterThanOrEqual(5);
    expect(cats[0].name).toBeTruthy();
    expect(cats[0].icon).toBeTruthy();
  });

  it("searchProviders finds by name", async () => {
    const results = await dataSource.searchProviders("Soccer");
    expect(results.length).toBeGreaterThan(0);
    const names = results.map((r) => r.name.toLowerCase());
    expect(names.some((n: string) => n.includes("soccer"))).toBe(true);
  });

  it("searchProviders finds by location", async () => {
    const results = await dataSource.searchProviders("Sea Point");
    expect(results.length).toBeGreaterThan(0);
    const locs = results.map((r) => r.location);
    expect(locs.some((l: string) => l.includes("Sea Point"))).toBe(true);
  });

  it("searchProviders with empty query returns all", async () => {
    const results = await dataSource.searchProviders("");
    expect(results.length).toBeGreaterThanOrEqual(10);
  });

  it("searchProviders with filters combines text + category", async () => {
    const results = await dataSource.searchProviders("academy", {
      category: "sports",
    });
    for (const p of results) {
      expect(p.category).toBe("sports");
    }
  });

  it("getSimilarProviders returns tag-overlap results", async () => {
    const soccer = (await dataSource.getProviders({ category: "sports" }))[0];
    if (soccer?.tags?.length) {
      const similar = await dataSource.getSimilarProviders(soccer.id, 3);
      expect(similar.length).toBeGreaterThanOrEqual(0);
      // Results should not include the source provider
      const ids = similar.map((s) => s.id);
      expect(ids).not.toContain(soccer.id);
    }
  });

  it("getVenues returns array (may be empty in mock mode)", async () => {
    const venues = await dataSource.getVenues();
    expect(Array.isArray(venues)).toBe(true);
  });

  it("getVenueBySlug returns null for unknown slug in mock mode", async () => {
    const venue = await dataSource.getVenueBySlug("nonexistent");
    expect(venue).toBeNull();
  });
});
