/**
 * Deterministically spread co-located providers so every map pin is visible.
 *
 * Providers that resolve to the same suburb centroid stack perfectly on top
 * of each other as Leaflet circle markers (the "20 of 20 clubs shown" vs ~9
 * visible pins bug). This helper fans stacked providers out on a small ring
 * around the shared point, keeping offsets small enough to stay inside the
 * same suburb while guaranteeing ~18px markers separate at zoom 12.
 */

export interface SpreadProvider {
  lat: number;
  lng: number;
  name: string;
}

// At zoom 12 the map renders ~2913 px/degree, so an 18px marker is ~0.0062
// degrees wide. Anything closer than this overlaps.
export const MIN_SPREAD_SEPARATION_DEG = 0.006;
// Ring radius for N=2-4; scaled up for larger groups so adjacent pins stay
// >= MIN_SPREAD_SEPARATION_DEG apart. Suburb centroids are km-scale, so these
// offsets (0.0045-0.007 deg) stay plausibly in the same suburb.
export const BASE_SPREAD_RADIUS_DEG = 0.0045;
// Small fixed rotation so stacked groups never align at the same angle.
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function ringRadius(groupSize: number): number {
  // Adjacent pins on a ring sit 2*r*sin(PI/N) apart; keep that >=
  // MIN_SPREAD_SEPARATION_DEG so markers don't overlap.
  const minRadius =
    MIN_SPREAD_SEPARATION_DEG / (2 * Math.sin(Math.PI / groupSize));
  return Math.max(BASE_SPREAD_RADIUS_DEG, minRadius);
}

/**
 * Returns one coordinate pair per input provider, in the same order.
 * Providers that are alone at their (lat,lng) come back unchanged; groups of
 * N>1 are sorted by name and fanned out on a ring around the shared point.
 * Same input array always yields the same output.
 */
export function spreadCoLocatedProviders(
  providers: readonly SpreadProvider[]
): { lat: number; lng: number }[] {
  const groups = new Map<string, { provider: SpreadProvider; index: number }[]>();
  providers.forEach((provider, index) => {
    const key = `${provider.lat},${provider.lng}`;
    const group = groups.get(key);
    if (group) {
      group.push({ provider, index });
    } else {
      groups.set(key, [{ provider, index }]);
    }
  });

  const spread = new Map<number, { lat: number; lng: number }>();

  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) =>
      a.provider.name.localeCompare(b.provider.name)
    );
    const radius = ringRadius(sorted.length);
    sorted.forEach(({ provider, index }, i) => {
      const angle = (i / sorted.length) * 2 * Math.PI + GOLDEN_ANGLE;
      spread.set(index, {
        lat: provider.lat + radius * Math.cos(angle),
        lng: provider.lng + radius * Math.sin(angle),
      });
    });
  }

  return providers.map((provider, i) => spread.get(i) ?? { lat: provider.lat, lng: provider.lng });
}
