import { describe, it, expect } from "vitest";
import { matchPriceBucket } from "@/lib/filtering";

describe("matchPriceBucket — price filter (priceValue stored in cents)", () => {
  it("matches R150 (15000 cents) to the 100-250 bucket", () => {
    expect(matchPriceBucket(15000, "100-250")).toBe(true);
  });

  it("matches R99 (9900 cents) to the under-100 bucket", () => {
    expect(matchPriceBucket(9900, "under-100")).toBe(true);
  });

  it("matches only zero-priced providers to free", () => {
    expect(matchPriceBucket(0, "free")).toBe(true);
    expect(matchPriceBucket(100, "free")).toBe(false);
  });

  it("keeps bucket boundaries aligned to Rand increments", () => {
    expect(matchPriceBucket(9900, "under-100")).toBe(true);
    expect(matchPriceBucket(10000, "under-100")).toBe(false);
    expect(matchPriceBucket(10000, "100-250")).toBe(true);
    expect(matchPriceBucket(25000, "100-250")).toBe(true);
    expect(matchPriceBucket(25100, "100-250")).toBe(false);
    expect(matchPriceBucket(25100, "250-500")).toBe(true);
    expect(matchPriceBucket(50000, "250-500")).toBe(true);
    expect(matchPriceBucket(50100, "250-500")).toBe(false);
    expect(matchPriceBucket(50100, "over-500")).toBe(true);
  });
});
