import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { communityContributions, providers } from "@/lib/db/schema";
import { getContributionById } from "@/lib/data-source";
import { selfBaseUrl } from "@/lib/rewards/self-url";
import { eq, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * POST /api/community/contributions/[id]/confirm
 * Auth required. Leader confirmation for a contribution.
 * Only the club leader (the provider account linked to the club)
 * can confirm leader-path contributions.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to confirm a contribution" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const contribution = await getContributionById(id);

    if (!contribution) {
      return NextResponse.json(
        { error: "Contribution not found" },
        { status: 404 }
      );
    }

    // Only leader-path contributions
    if (contribution.validationPath !== "leader") {
      return NextResponse.json(
        {
          error:
            "This contribution uses peer validation — vouch for it instead of confirming",
        },
        { status: 400 }
      );
    }

    // Must be pending
    if (contribution.status !== "pending") {
      return NextResponse.json(
        { error: `Contribution is already ${contribution.status}` },
        { status: 409 }
      );
    }

    // Confirmer must be the provider linked to this club
    const [provider] = await db
      .select()
      .from(providers)
      .where(eq(providers.id, contribution.clubId))
      .limit(1);

    if (!provider) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      );
    }

    // Check if the session user is the provider owner
    // Match by: user's name matches provider_name, and role is provider
    const isProviderOwner =
      session.user.role === "provider" &&
      session.user.name?.toLowerCase() === provider.providerName.toLowerCase();

    // Also allow admins to confirm
    const isAdmin = session.user.role === "admin";

    if (!isProviderOwner && !isAdmin) {
      return NextResponse.json(
        {
          error:
            "Only the club leader (provider owner) or an admin can confirm leader-path contributions",
        },
        { status: 403 }
      );
    }

    // Parse request body for action
    let actionBody: { action?: string } = {};
    try {
      actionBody = await request.json();
    } catch {
      // No body — default to confirm
    }

    const isDeny = actionBody.action === "deny";
    const leaderId = session.user.id;

    // ── Deny — reject the contribution (no points, no collusion check) ──
    if (isDeny) {
      await db
        .update(communityContributions)
        .set({
          status: "rejected",
          confirmedBy: leaderId,
          confirmedAt: new Date(),
        })
        .where(eq(communityContributions.id, id));

      return NextResponse.json({ denied: true });
    }

    // Anti-collusion: if leader has confirmed this user >3 times in 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentConfirms] = await db
      .select({ count: sql<number>`count(*)` })
      .from(communityContributions)
      .where(
        and(
          eq(communityContributions.confirmedBy, leaderId),
          eq(communityContributions.userId, contribution.userId),
          eq(communityContributions.status, "confirmed"),
          sql`${communityContributions.confirmedAt} >= ${sevenDaysAgo.toISOString()}`
        )
      );

    if ((recentConfirms?.count ?? 0) >= 3) {
      return NextResponse.json(
        {
          collusionFlag: true,
          requiresSecondOpinion: true,
          error:
            "You have confirmed 3+ contributions from this user in the last 7 days. A second opinion (admin review) is required.",
        },
        { status: 409 }
      );
    }

    // Confirm
    const now = new Date();
    await db
      .update(communityContributions)
      .set({
        status: "confirmed",
        confirmedBy: leaderId,
        confirmedAt: now,
      })
      .where(eq(communityContributions.id, id));

    // Award points (fire-and-forget)
    void awardContributionPoints(
      request,
      id,
      contribution.userId,
      contribution.points
    );

    return NextResponse.json({
      confirmed: true,
      points: contribution.points,
    });
  } catch (error) {
    console.error("[community/contributions/confirm] POST error:", error);
    return NextResponse.json(
      { error: "Failed to confirm contribution. Please try again." },
      { status: 500 }
    );
  }
}

/** Fire-and-forget reward grant — never blocks the confirm flow. */
async function awardContributionPoints(
  request: NextRequest,
  referenceId: string,
  userId: string,
  _points: number
): Promise<void> {
  try {
    await fetch(`${selfBaseUrl(request)}/api/rewards/earn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({
        action: "community",
        referenceId,
        userId,
      }),
    });
  } catch {
    // Rewards endpoint unavailable — confirm still succeeds.
  }
}
