import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/index";
import { providers } from "@/lib/db/schema";
import { getClubHealth } from "@/lib/data-source";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/clubs/[slug]/health
 * Public read — returns club contribution health metrics.
 * Resolves the slug to a provider ID, then computes:
 *   - total contributors this month
 *   - unique contributors
 *   - concentration ratio
 *   - health indicator (green / yellow / red)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    // Resolve slug to provider ID
    const [provider] = await db
      .select({ id: providers.id })
      .from(providers)
      .where(eq(providers.slug, slug))
      .limit(1);

    if (!provider) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    const health = await getClubHealth(provider.id);

    return NextResponse.json(health);
  } catch (error) {
    console.error("[clubs/health] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load club health" },
      { status: 500 }
    );
  }
}
