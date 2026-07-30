import { NextRequest, NextResponse } from "next/server";
import { getProviders, getCategories } from "@/lib/db/queries";
import { mapProvider } from "@/lib/db/mappers";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";

  const [dbProviders, dbCategories] = await Promise.all([
    getProviders(),
    getCategories(),
  ]);
  const result = dbProviders.map((p) => mapProvider(p, dbCategories));

  // Client-side filtering is acceptable for MVP (< 100 providers)
  const filtered = category
    ? result.filter((p) => p.categorySlug === category)
    : result;

  return NextResponse.json({ data: filtered, total: filtered.length });
}
