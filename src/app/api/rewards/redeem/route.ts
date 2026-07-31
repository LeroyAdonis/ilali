import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { rewardRedemptions } from "@/lib/db/schema";
import { getRewardPoints, getRewardRedemptions } from "@/lib/data-source";
import {
  REDEMPTION_COSTS,
  calculateBalance,
  getCostForRedemption,
  isRedemptionType,
} from "@/lib/rewards/calculate";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/rewards/redeem
 * Auth required. Body: { rewardType, providerId? }
 *  - rewardType: one of REDEMPTION_COSTS (activityDiscount=100,
 *    freeTrial=150, priorityBooking=50, airtime=200).
 *  - providerId: optional partner provider the reward is redeemed at.
 * Validates the user has enough points (balance = ledger − redemptions),
 * inserts a reward_redemptions row, and returns { pointsSpent, balance }.
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to redeem rewards" },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 }
      );
    }

    const b = body as Record<string, unknown>;

    // 1. Validate reward type against the cost map
    if (typeof b.rewardType !== "string" || !isRedemptionType(b.rewardType)) {
      return NextResponse.json(
        {
          error: `Unknown reward type "${String(b.rewardType)}". Available: ${Object.keys(
            REDEMPTION_COSTS
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }
    const rewardType = b.rewardType;
    const cost = getCostForRedemption(rewardType)!;

    // 2. Optional provider (must be a real UUID — FK to providers.id)
    const providerId =
      typeof b.providerId === "string" && b.providerId.trim()
        ? b.providerId.trim()
        : null;
    if (providerId && !UUID_RE.test(providerId)) {
      return NextResponse.json(
        { error: "providerId must be a valid UUID" },
        { status: 400 }
      );
    }

    // 3. Validate balance >= cost (computed dynamically)
    const [ledger, redemptions] = await Promise.all([
      getRewardPoints(session.user.id),
      getRewardRedemptions(session.user.id),
    ]);
    const balance = calculateBalance(ledger, redemptions);

    if (balance < cost) {
      return NextResponse.json(
        {
          error: `Insufficient points — ${rewardType} costs ${cost} pts and you have ${balance}.`,
          pointsSpent: 0,
          balance,
        },
        { status: 400 }
      );
    }

    // 4. Record the redemption
    await db.insert(rewardRedemptions).values({
      userId: session.user.id,
      pointsSpent: cost,
      rewardType,
      providerId,
    });

    return NextResponse.json({ pointsSpent: cost, balance: balance - cost });
  } catch (error) {
    console.error("[rewards/redeem] POST error:", error);
    return NextResponse.json(
      { error: "Failed to redeem reward. Please try again." },
      { status: 500 }
    );
  }
}
