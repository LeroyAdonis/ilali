import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { clubMemberships, providers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/clubs/[slug]/membership
 * Auth required. Returns the current user's membership status for
 * the given club.
 *
 * Response: {
 *   isMember: boolean,
 *   status: "active" | "inactive" | null,
 *   memberNumber: string | null,
 *   joinedAt: string | null,
 * }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const session = await auth.api.getSession({
      headers: _request.headers,
    });
    if (!session) {
      return NextResponse.json(
        { isMember: false, status: null, memberNumber: null, joinedAt: null }
      );
    }

    // Resolve slug to provider ID
    const [provider] = await db
      .select({ id: providers.id })
      .from(providers)
      .where(eq(providers.slug, slug))
      .limit(1);

    if (!provider) {
      return NextResponse.json(
        { isMember: false, status: null, memberNumber: null, joinedAt: null }
      );
    }

    // Find membership
    const [membership] = await db
      .select()
      .from(clubMemberships)
      .where(
        and(
          eq(clubMemberships.providerId, provider.id),
          eq(clubMemberships.parentId, session.user.id)
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json({
        isMember: false,
        status: null,
        memberNumber: null,
        joinedAt: null,
      });
    }

    return NextResponse.json({
      isMember: true,
      status: membership.status,
      memberNumber: membership.id.substring(0, 8).toUpperCase(),
      joinedAt: membership.joinedAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("[clubs/membership] GET error:", error);
    return NextResponse.json(
      { error: "Failed to check membership. Please try again." },
      { status: 500 }
    );
  }
}
