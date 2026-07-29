import { NextResponse } from "next/server";
import { searchProviders, getCategories, SearchFilters } from "@/lib/db/queries";
import { mapProviders } from "@/lib/db/mappers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || undefined;
  const age = searchParams.get("age") || undefined;
  const location = searchParams.get("location") || undefined;
  const price = searchParams.get("price") || undefined;

  // Build filters
  const filters: SearchFilters = {};

  if (category) filters.category = category;

  // Parse age filter (e.g., "4-7")
  if (age) {
    const ageMap: Record<string, [number, number]> = {
      "0-3": [0, 3],
      "4-7": [4, 7],
      "8-12": [8, 12],
      "13-17": [13, 17],
    };
    const range = ageMap[age];
    if (range) {
      filters.ageMin = range[0];
      filters.ageMax = range[1];
    }
  }

  if (location) filters.location = location;

  // Fetch from DB with filters
  const [dbProviders, dbCategories] = await Promise.all([
    searchProviders(q, filters),
    getCategories(),
  ]);

  const providers = mapProviders(dbProviders, dbCategories);

  // Optional client-side price filtering (keep it simple for MVP)
  let results = providers;
  if (price) {
    const priceMap: Record<string, [number, number]> = {
      free: [0, 0],
      "under-100": [0, 99],
      "100-250": [100, 250],
      "250-500": [251, 500],
      "over-500": [501, 99999],
    };
    const range = priceMap[price];
    if (range) {
      results = results.filter(
        (p) => p.priceValue >= range[0] && p.priceValue <= range[1]
      );
    }
  }

  return NextResponse.json({
    providers: results,
    total: results.length,
    query: q || null,
    category: category || null,
    location: location || null,
    age: age || null,
    price: price || null,
  });
}
