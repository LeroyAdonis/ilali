import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRewardPoints, getRewardRedemptions } from "@/lib/data-source";
import { calculateBalance } from "@/lib/rewards/calculate";

export const dynamic = "force-dynamic";

/**
 * GET /api/rewards
 * Auth required. Returns { balance, ledger, redemptions } for the
 * signed-in user. Balance is computed dynamically as
 * sum(points) − sum(redemptions), so it always reflects the truth.
 */
export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to view rewards" },
        { status: 401 }
      );
    }

    const [ledger, redemptions] = await Promise.all([
      getRewardPoints(session.user.id),
      getRewardRedemptions(session.user.id),
    ]);

    return NextResponse.json({
      balance: calculateBalance(ledger, redemptions),
      ledger,
      redemptions,
    });
  } catch (error) {
    console.error("[rewards] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load rewards. Please try again." },
      { status: 500 }
    );
  }
}
