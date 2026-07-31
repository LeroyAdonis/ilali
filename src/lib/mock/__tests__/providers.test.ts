import { describe, it, expect } from "vitest";
import { mockProviders, mockProviderById, mockProviderBySlug } from "@/lib/mock/providers";
import { mockReviews } from "@/lib/mock/reviews";

describe("Mock Providers — data integrity", () => {
  it("has at least 10 mock providers", () => {
    expect(mockProviders.length).toBeGreaterThanOrEqual(10);
  });

  it("every provider has a unique ID", () => {
    const ids = mockProviders.map((p) => p.id);
    expect(new Set(ids).size).toBe(mockProviders.length);
  });

  it("every provider has a unique slug", () => {
    const slugs = mockProviders.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(mockProviders.length);
  });

  it("every provider has required fields", () => {
    for (const p of mockProviders) {
      expect(p.name).toBeTruthy();
      expect(p.slug).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.providerName).toBeTruthy();
      expect(p.location).toBeTruthy();
      expect(p.ageMin).toBeGreaterThanOrEqual(0);
      expect(p.ageMax).toBeGreaterThanOrEqual(p.ageMin);
      expect(p.priceValue).toBeGreaterThanOrEqual(0);
    }
  });

  it("age ranges are valid (ageMin <= ageMax)", () => {
    for (const p of mockProviders) {
      expect(p.ageMin).toBeLessThanOrEqual(p.ageMax);
    }
  });

  it("ratings are between 0 and 5", () => {
    for (const p of mockProviders) {
      const r = parseFloat(p.rating ?? "0");
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(5);
    }
  });

  it("mockProviderById has entries for all providers", () => {
    for (const p of mockProviders) {
      expect(mockProviderById[p.id]).toBeDefined();
      expect(mockProviderById[p.id].name).toBe(p.name);
    }
  });

  it("mockProviderBySlug has entries for all providers", () => {
    for (const p of mockProviders) {
      expect(mockProviderBySlug[p.slug]).toBeDefined();
      expect(mockProviderBySlug[p.slug].name).toBe(p.name);
    }
  });

  it("featured providers exist", () => {
    const featured = mockProviders.filter((p) => p.featured);
    expect(featured.length).toBeGreaterThanOrEqual(2);
  });

  it("prices are in cents (ZAR * 100) or 0 for free", () => {
    for (const p of mockProviders) {
      // Free providers have priceValue 0, paid are in cents R50-R300
      if (p.isFree) {
        expect(p.priceValue).toBe(0);
      } else {
        expect(p.priceValue).toBeGreaterThanOrEqual(5000);
        expect(p.priceValue).toBeLessThanOrEqual(50000);
      }
    }
  });

  it("tags are arrays", () => {
    for (const p of mockProviders) {
      if (p.tags) {
        expect(Array.isArray(p.tags)).toBe(true);
        expect(p.tags.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("Mock Reviews — data integrity", () => {
  it("has at least 30 reviews", () => {
    expect(mockReviews.length).toBeGreaterThanOrEqual(30);
  });

  it("every review references a valid provider", () => {
    const providerIds = new Set(mockProviders.map((p) => p.id));
    for (const r of mockReviews) {
      expect(providerIds.has(r.providerId!)).toBe(true);
    }
  });

  it("ratings are 1-5", () => {
    for (const r of mockReviews) {
      expect(r.rating).toBeGreaterThanOrEqual(1);
      expect(r.rating).toBeLessThanOrEqual(5);
    }
  });

  it("review content is non-empty", () => {
    for (const r of mockReviews) {
      expect(r.content).toBeTruthy();
    }
  });

  it("all reviews have unique IDs", () => {
    const ids = mockReviews.map((r) => r.id);
    expect(new Set(ids).size).toBe(mockReviews.length);
  });
});
