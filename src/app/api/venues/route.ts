import { NextRequest, NextResponse } from "next/server";
import { getVenues } from "@/lib/db/queries";
import { mapVenue } from "@/lib/db/mappers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location") || "";

  const dbVenues = await getVenues();
  let result = dbVenues.map(mapVenue);

  if (location) {
    result = result.filter((v) =>
      v.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  return NextResponse.json({
    data: result,
    total: result.length,
  });
}
