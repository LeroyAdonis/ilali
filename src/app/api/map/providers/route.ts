import { NextRequest, NextResponse } from "next/server";
import {
  getProviders,
  getCategories,
  getProviderVerificationStatuses,
  getProviderVouchCounts,
} from "@/lib/data-source";
import { resolveProviderCoords } from "@/lib/map/suburbs";

export const dynamic = "force-dynamic";

/**
 * GET /api/map/providers
 *
 * Providers with coordinates for the map view.
 * - lat/lng: provider columns when present, else suburb lookup, else Cape Town
 *   centre fallback (flagged `coordsFallback: true`).
 * - verifiedTier: best-effort from providerVerifications (approved →
 *   trusted/verified); falls back to the legacy providers.verified flag.
 * - ?verified=true filters to verified+trusted only.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const verifiedOnly = searchParams.get("verified") === "true";

  const [providers, categories, verifications, vouchCounts] = await Promise.all([
    getProviders(),
    getCategories(),
    getProviderVerificationStatuses(),
    getProviderVouchCounts(),
  ]);

  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
  const verificationStatus = new Map(
    verifications.map((v) => [v.providerId, v.status])
  );
  const vouches = new Map(vouchCounts.map((v) => [v.providerId, v.count]));

  const data = providers.map((p) => {
    const { lat, lng, isFallback } = resolveProviderCoords(
      p.location,
      p.lat,
      p.lng
    );

    const status = verificationStatus.get(p.id) ?? null;
    let verifiedTier: "trusted" | "verified" | "listed";
    if (status === "approved") {
      verifiedTier =
        (vouches.get(p.id) ?? 0) >= 3 && (p.reviewCount ?? 0) >= 5
          ? "trusted"
          : "verified";
    } else if (p.verified) {
      // Legacy flag — no providerVerifications row yet
      verifiedTier = "verified";
    } else {
      verifiedTier = "listed";
    }

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      category: p.category,
      categoryName: categoryNames.get(p.category) ?? p.category,
      lat,
      lng,
      coordsFallback: isFallback,
      rating: Number(p.rating ?? 0),
      verifiedTier,
      suburb: p.location,
    };
  });

  const filtered = verifiedOnly
    ? data.filter((d) => d.verifiedTier !== "listed")
    : data;

  return NextResponse.json({ data: filtered, total: filtered.length });
}
