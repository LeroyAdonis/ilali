import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import {
  communityContributions,
  contributionVouches,
  clubMemberships,
} from "@/lib/db/schema";
import { getContributionById, getContributionVouches } from "@/lib/data-source";
import {
  getReputation,
  getReputationTier,
  getVouchesNeeded,
} from "@/lib/rewards/reputation";
import { selfBaseUrl } from "@/lib/rewards/self-url";
import { eq, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * POST /api/community/contributions/[id]/vouch
 * Auth required. Peer vouching for a contribution.
 * Only Elder-tier users can vouch. Once enough vouches accumulate,
 * the contribution auto-confirms and awards points.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to vouch" },
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

    // Only peer-path contributions can be vouched
    if (contribution.validationPath !== "peer") {
      return NextResponse.json(
        { error: "This contribution uses leader validation, not peer vouching" },
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

    const voucherId = session.user.id;

    // Voucher must be a member of the SAME club
    const [voucherMembership] = await db
      .select()
      .from(clubMemberships)
      .where(
        and(
          eq(clubMemberships.providerId, contribution.clubId),
          eq(clubMemberships.parentId, voucherId)
        )
      )
      .limit(1);

    if (!voucherMembership) {
      return NextResponse.json(
        { error: "You must be a member of this club to vouch" },
        { status: 403 }
      );
    }

    // Voucher must not be the submitter
    if (voucherId === contribution.userId) {
      return NextResponse.json(
        { error: "You cannot vouch for your own contribution" },
        { status: 400 }
      );
    }

    // Voucher must be Elder tier
    const voucherReputation = await getReputation(voucherId);
    const voucherTier = getReputationTier(voucherReputation);
    if (voucherTier !== "elder") {
      return NextResponse.json(
        {
          error: `Only Elder-tier members (100+ reputation) can vouch. Your score: ${voucherReputation} (${voucherTier}).`,
        },
        { status: 403 }
      );
    }

    // Voucher hasn't vouched for this contribution already
    const existingVouches = await getContributionVouches(id);
    const alreadyVouched = existingVouches.some(
      (v) => v.voucherId === voucherId
    );
    if (alreadyVouched) {
      return NextResponse.json(
        { error: "You have already vouched for this contribution" },
        { status: 409 }
      );
    }

    // Voucher hasn't vouched for this person in 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentVouch] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contributionVouches)
      .innerJoin(
        communityContributions,
        eq(contributionVouches.contributionId, communityContributions.id)
      )
      .where(
        and(
          eq(contributionVouches.voucherId, voucherId),
          eq(communityContributions.userId, contribution.userId),
          sql`${contributionVouches.createdAt} >= ${sevenDaysAgo.toISOString()}`
        )
      );

    if ((recentVouch?.count ?? 0) > 0) {
      return NextResponse.json(
        {
          error:
            "You can only vouch for the same person once every 7 days. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Insert vouch
    await db.insert(contributionVouches).values({
      contributionId: id,
      voucherId,
    });

    const vouchesAfter = await getContributionVouches(id);
    const vouchesSoFar = vouchesAfter.length;

    // Determine submitter's tier for vouch threshold
    const submitterReputation = await getReputation(contribution.userId);
    const submitterTier = getReputationTier(submitterReputation);
    const vouchesNeeded = getVouchesNeeded(submitterTier);

    let newStatus = contribution.status;

    // Auto-confirm if enough vouches
    if (vouchesSoFar >= vouchesNeeded) {
      await db
        .update(communityContributions)
        .set({
          status: "confirmed",
          confirmedAt: new Date(),
        })
        .where(eq(communityContributions.id, id));

      newStatus = "confirmed";

      // Award points (fire-and-forget)
      void awardContributionPoints(
        request,
        id,
        contribution.userId,
        contribution.points
      );
    }

    return NextResponse.json({
      vouched: true,
      vouchesSoFar,
      vouchesNeeded,
      status: newStatus,
    });
  } catch (error) {
    console.error("[community/contributions/vouch] POST error:", error);
    return NextResponse.json(
      { error: "Failed to vouch. Please try again." },
      { status: 500 }
    );
  }
}

/** Fire-and-forget reward grant — never blocks the vouch flow. */
async function awardContributionPoints(
  request: NextRequest,
  referenceId: string,
  userId: string,
  points: number
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
        points,
      }),
    });
  } catch {
    // Rewards endpoint unavailable — vouch still succeeds.
  }
}
