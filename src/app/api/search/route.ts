import { NextResponse } from "next/server";
import { categories, providers } from "@/lib/constants";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase() || "";
  const category = searchParams.get("category") || "";
  const location = searchParams.get("location") || "";

  let results = [...providers, ...([])];

  if (q) {
    results = results.filter(
      (p) =>
        ("name" in p ? p.name.toLowerCase().includes(q) : false) ||
        ("description" in p ? p.description.toLowerCase().includes(q) : false)
    );
  }

  if (category) {
    const slugs = category.split(",");
    results = results.filter(
      (p) => "categorySlug" in p && slugs.includes(p.categorySlug)
    );
  }

  return NextResponse.json({
    results,
    total: results.length,
    query: q || null,
    category: category || null,
    location: location || null,
  });
}
