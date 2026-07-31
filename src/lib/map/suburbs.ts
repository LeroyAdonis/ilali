/**
 * Cape Town suburb → coordinates lookup for the map view.
 *
 * Providers only store a suburb text field; the map needs lat/lng.
 * This static table maps the suburbs we know about to realistic
 * coordinates so server routes can place pins/circles without a
 * geocoding service.
 *
 * Keys are normalised (lowercase, trimmed). Lookup is case-insensitive.
 */

export const CAPE_TOWN_CENTER: [number, number] = [-33.9249, 18.4241];

// suburb (normalised) → [lat, lng]
export const SUBURB_COORDS: Record<string, [number, number]> = {
  "claremont": [-33.9806, 18.4647],
  "rondebosch": [-33.9628, 18.4761],
  "observatory": [-33.9383, 18.4719],
  "sea point": [-33.9167, 18.3833],
  "constantia": [-34.02, 18.45],
  "bellville": [-33.9, 18.6333],
  "newlands": [-33.9786, 18.4508],
  "kenilworth": [-33.9939, 18.4717],
  "mowbray": [-33.9461, 18.4728],
  "pinelands": [-33.9272, 18.5006],
  "woodstock": [-33.9269, 18.4464],
  "muizenberg": [-34.105, 18.4683],
  "vrygrond": [-34.0839, 18.4644],
  "wynberg": [-34.005, 18.465],
  "plumstead": [-34.02, 18.475],
  "athlone": [-33.9611, 18.5064],
  "lansdowne": [-33.9872, 18.4978],
  "retreat": [-34.055, 18.475],
  "hout bay": [-34.04, 18.36],
  "camps bay": [-33.9508, 18.3847],
  "green point": [-33.9067, 18.405],
  "table view": [-33.82, 18.49],
  "milnerton": [-33.865, 18.51],
  "durbanville": [-33.833, 18.649],
  "parow": [-33.9033, 18.5814],
  "goodwood": [-33.905, 18.545],
  "maitland": [-33.9233, 18.4903],
  "stellenbosch": [-33.9321, 18.8602],
  "paarl": [-33.7242, 18.9619],
  "malmesbury": [-33.46, 18.727],
};

export const SUBURB_COUNT = Object.keys(SUBURB_COORDS).length;

function normalize(suburb: string): string {
  return suburb.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Look up a suburb's coordinates. Case-insensitive.
 * Returns null when the suburb isn't in the table.
 */
export function suburbToCoords(suburb: string): [number, number] | null {
  return SUBURB_COORDS[normalize(suburb)] ?? null;
}

/**
 * Resolve display coordinates for a provider.
 * Precedence:
 *   1. Explicit lat/lng columns (when both are present)
 *   2. Suburb lookup table
 *   3. Cape Town centre fallback (flagged `isFallback: true`)
 */
export function resolveProviderCoords(
  suburb: string,
  lat: string | number | null,
  lng: string | number | null
): { lat: number; lng: number; isFallback: boolean } {
  const explicitLat = lat !== null && lat !== undefined && lat !== "" ? Number(lat) : NaN;
  const explicitLng = lng !== null && lng !== undefined && lng !== "" ? Number(lng) : NaN;

  if (!Number.isNaN(explicitLat) && !Number.isNaN(explicitLng)) {
    return { lat: explicitLat, lng: explicitLng, isFallback: false };
  }

  const fromLookup = suburbToCoords(suburb);
  if (fromLookup) {
    return { lat: fromLookup[0], lng: fromLookup[1], isFallback: false };
  }

  return {
    lat: CAPE_TOWN_CENTER[0],
    lng: CAPE_TOWN_CENTER[1],
    isFallback: true,
  };
}
