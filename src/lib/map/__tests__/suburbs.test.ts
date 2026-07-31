import { describe, it, expect } from "vitest";
import {
  CAPE_TOWN_CENTER,
  SUBURB_COUNT,
  suburbToCoords,
  resolveProviderCoords,
} from "../suburbs";

describe("suburb lookup (src/lib/map/suburbs.ts)", () => {
  it("covers 20-30 Cape Town suburbs", () => {
    expect(SUBURB_COUNT).toBeGreaterThanOrEqual(20);
    expect(SUBURB_COUNT).toBeLessThanOrEqual(30);
  });

  it("resolves a known suburb to realistic coordinates", () => {
    const coords = suburbToCoords("Claremont");
    expect(coords).not.toBeNull();
    expect(coords![0]).toBeCloseTo(-33.9806, 3);
    expect(coords![1]).toBeCloseTo(18.4647, 3);
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(suburbToCoords("sea point")).toEqual(suburbToCoords("Sea Point"));
    expect(suburbToCoords("  Rondebosch  ")).toEqual(
      suburbToCoords("rondebosch")
    );
  });

  it("returns null for an unknown suburb", () => {
    expect(suburbToCoords("Narnia")).toBeNull();
  });

  it("prefers explicit lat/lng columns over the lookup", () => {
    const result = resolveProviderCoords("Claremont", "-34.1", "18.9");
    expect(result.lat).toBe(-34.1);
    expect(result.lng).toBe(18.9);
    expect(result.isFallback).toBe(false);
  });

  it("falls back to the lookup when lat/lng are missing", () => {
    const result = resolveProviderCoords("Claremont", null, null);
    expect(result.lat).toBeCloseTo(-33.9806, 3);
    expect(result.lng).toBeCloseTo(18.4647, 3);
    expect(result.isFallback).toBe(false);
  });

  it("falls back to Cape Town centre for unknown suburb without coords", () => {
    const result = resolveProviderCoords("Narnia", null, null);
    expect(result.lat).toBe(CAPE_TOWN_CENTER[0]);
    expect(result.lng).toBe(CAPE_TOWN_CENTER[1]);
    expect(result.isFallback).toBe(true);
  });

  it("handles empty-string lat/lng like missing", () => {
    const result = resolveProviderCoords("Sea Point", "", "");
    expect(result.isFallback).toBe(false);
    expect(result.lat).toBeCloseTo(-33.9167, 3);
  });
});
