import { NextResponse } from "next/server";
import { getSuburbDensity } from "@/lib/data-source";
import { suburbToCoords } from "@/lib/map/suburbs";

export const dynamic = "force-dynamic";

/**
 * GET /api/map/density
 *
 * Anonymised, suburb-level parent density for the map:
 *   [{ suburb, lat, lng, count }]
 *
 * DB path: childProfiles GROUP BY suburb (all parents, opt-in flag TBD —
 * see task report). Mock path: mock parents' suburbs.
 * Privacy: suburb-level only — never individual pins. Suburbs without a
 * known coordinate are skipped (avoids stacking circles at the centre).
 */
export async function GET() {
  const rows = await getSuburbDensity();

  const data = rows
    .map((row) => {
      const coords = suburbToCoords(row.suburb);
      if (!coords) return null;
      return {
        suburb: row.suburb,
        lat: coords[0],
        lng: coords[1],
        count: Number(row.count),
      };
    })
    .filter(
      (row): row is { suburb: string; lat: number; lng: number; count: number } =>
        row !== null
    )
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ data, total: data.length });
}
