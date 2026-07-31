import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { rewardPoints } from "@/lib/db/schema";
import { getRewardPoints, getRewardRedemptions } from "@/lib/data-source";
import {
  REWARD_ACTIONS,
  calculateBalance,
  getPointsForAction,
  isRewardAction,
} from "@/lib/rewards/calculate";

export const dynamic = "force-dynamic";

/**
 * Live balance = sum of earned points − sum of redeemed points.
 * Computed dynamically from the ledger + redemptions so it can never
 * drift from the source of truth.
 */
async function computeBalance(userId: string): Promise<number> {
  const [ledger, redemptions] = await Promise.all([
    getRewardPoints(userId),
    getRewardRedemptions(userId),
  ]);
  return calculateBalance(ledger, redemptions);
}

/**
 * POST /api/rewards/earn
 * Auth required. Body: { action, referenceId?, userId? }
 *  - action: one of REWARD_ACTIONS (server-authoritative point values —
 *    any `amount` in the body is IGNORED to prevent point farming).
 *  - referenceId: optional dedupe key. When present, an identical
 *    (user, action, referenceId) grant is a 200 no-op, not a double award.
 *  - userId: optional override used by internal server-to-server callers
 *    (e.g. the ride confirm flow, which awards BOTH parents of a completed
 *    lift share). Defaults to the session user.
 * Returns { points, balance }.
 */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to earn rewards" },
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

    // 1. Validate action against the points map
    if (typeof b.action !== "string" || !isRewardAction(b.action)) {
      return NextResponse.json(
        {
          error: `Unknown reward action "${String(b.action)}". Valid actions: ${Object.keys(
            REWARD_ACTIONS
          ).join(", ")}`,
        },
        { status: 400 }
      );
    }
    const action = b.action;
    const points = getPointsForAction(action)!;

    // 2. Resolve the earning user (server-to-server override, else session)
    const targetUserId =
      typeof b.userId === "string" && b.userId.trim()
        ? b.userId.trim()
        : session.user.id;

    // 3. Optional dedupe key — one grant per (user, action, referenceId)
    const referenceId =
      typeof b.referenceId === "string" && b.referenceId.trim()
        ? b.referenceId.trim()
        : null;

    if (referenceId) {
      const existing = await getRewardPoints(targetUserId);
      const duplicate = existing.some(
        (p) => p.action === action && p.referenceId === referenceId
      );
      if (duplicate) {
        // Already awarded — return the current balance as a 200 no-op.
        const balance = await computeBalance(targetUserId);
        return NextResponse.json({
          points: 0,
          balance,
          alreadyEarned: true,
          duplicate: true,
        });
      }
    }

    // 4. Award
    await db.insert(rewardPoints).values({
      userId: targetUserId,
      amount: points,
      action,
      referenceId,
    });

    const balance = await computeBalance(targetUserId);

    return NextResponse.json({ points, balance });
  } catch (error) {
    console.error("[rewards/earn] POST error:", error);
    return NextResponse.json(
      { error: "Failed to award points. Please try again." },
      { status: 500 }
    );
  }
}
