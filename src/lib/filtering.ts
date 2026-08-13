/**
 * Browse filters — pure helpers so the filter logic is unit-testable.
 * Prices are stored as integer CENTS (see src/lib/db/mappers.ts), so
 * the bucket bounds are expressed in cents to match provider priceValue.
 */

const PRICE_BUCKETS_CENTS: Record<string, [number, number]> = {
  free: [0, 0], // R0
  "under-100": [0, 9900], // R0–R99
  "100-250": [10000, 25000], // R100–R250
  "250-500": [25100, 50000], // R251–R500
  "over-500": [50100, Number.MAX_SAFE_INTEGER], // R501+
};

/**
 * True when a provider's priceValue (in cents) falls in the named bucket.
 * Unknown buckets match nothing — the caller only passes validated keys.
 */
export function matchPriceBucket(priceValueCents: number, bucket: string): boolean {
  const range = PRICE_BUCKETS_CENTS[bucket];
  if (!range) return false;
  return priceValueCents >= range[0] && priceValueCents <= range[1];
}
