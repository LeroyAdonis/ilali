import { describe, it, expect } from "vitest";
import {
  spreadCoLocatedProviders,
  MIN_SPREAD_SEPARATION_DEG,
} from "../spread";

function distance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  return Math.hypot(a.lat - b.lat, a.lng - b.lng);
}

describe("spreadCoLocatedProviders (src/lib/map/spread.ts)", () => {
  it("fans out 3 providers sharing identical coords with >= 0.006 deg separation", () => {
    const input = [
      { name: "Alpha", lat: -33.9628, lng: 18.4761 },
      { name: "Bravo", lat: -33.9628, lng: 18.4761 },
      { name: "Charlie", lat: -33.9628, lng: 18.4761 },
    ];
    const output = spreadCoLocatedProviders(input);

    expect(output).toHaveLength(3);
    expect(new Set(output.map((p) => `${p.lat},${p.lng}`)).size).toBe(3);
    for (const [i, j] of [
      [0, 1],
      [0, 2],
      [1, 2],
    ]) {
      expect(distance(output[i], output[j])).toBeGreaterThanOrEqual(
        MIN_SPREAD_SEPARATION_DEG
      );
    }
  });

  it("is deterministic for the same input", () => {
    const input = [
      { name: "Beta", lat: -33.9806, lng: 18.4647 },
      { name: "Alpha", lat: -33.9806, lng: 18.4647 },
      { name: "Gamma", lat: -33.9806, lng: 18.4647 },
    ];

    expect(spreadCoLocatedProviders(input)).toEqual(
      spreadCoLocatedProviders(input)
    );
  });

  it("returns unique/single providers unchanged", () => {
    const input = [
      { name: "Solo", lat: -34.0839, lng: 18.4644 },
      { name: "Bellville FC", lat: -33.9, lng: 18.6333 },
    ];

    expect(spreadCoLocatedProviders(input)).toEqual([
      { lat: -34.0839, lng: 18.4644 },
      { lat: -33.9, lng: 18.6333 },
    ]);
  });

  it("spreads only stacked providers, leaving unique ones untouched", () => {
    const input = [
      { name: "Claremont A", lat: -33.9806, lng: 18.4647 },
      { name: "Unique", lat: -34.105, lng: 18.4683 },
      { name: "Claremont B", lat: -33.9806, lng: 18.4647 },
    ];
    const output = spreadCoLocatedProviders(input);

    expect(output).toHaveLength(3);
    expect(output[1]).toEqual({ lat: -34.105, lng: 18.4683 });
    expect(distance(output[0], output[2])).toBeGreaterThanOrEqual(
      MIN_SPREAD_SEPARATION_DEG
    );
  });

  it("turns the live 20-provider/9-coord layout into 20 distinct pairs", () => {
    const layout: [number, number, number][] = [
      [-33.9628, 18.4761, 3],
      [-33.9806, 18.4647, 3],
      [-33.9383, 18.4719, 3],
      [-34.02, 18.45, 3],
      [-34.105, 18.4683, 3],
      [-33.9167, 18.3833, 2],
      [-34.0839, 18.4644, 1],
      [-33.9, 18.6333, 1],
      [-33.9249, 18.4241, 1],
    ];
    const input = layout.flatMap(([lat, lng, count], group) =>
      Array.from({ length: count }, (_, i) => ({
        name: `Provider ${group}-${i}`,
        lat,
        lng,
      }))
    );

    expect(input).toHaveLength(20);
    const output = spreadCoLocatedProviders(input);

    expect(output).toHaveLength(20);
    expect(new Set(output.map((p) => `${p.lat},${p.lng}`)).size).toBe(20);
  });
});
