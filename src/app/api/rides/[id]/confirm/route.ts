import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rideRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const RIDE_REWARD_POINTS = 50;

/**
 * POST /api/rides/[id]/confirm
 * Auth required. Body: { as: "requester" | "claimer" }.
 * Two-sided confirmation — each parent confirms the ride happened from
 * their own side (requester_confirmed / claimer_confirmed). When BOTH
 * sides have confirmed, status becomes "completed" and both parents are
 * awarded points via POST /api/rewards/earn (defensive — that endpoint
 * lands in Task 6; a 404 here must not block the flow).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to confirm a ride" },
        { status: 401 }
      );
    }

    const { id } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const as =
      body && typeof body === "object" && "as" in body
        ? (body as { as: unknown }).as
        : null;

    if (as !== "requester" && as !== "claimer") {
      return NextResponse.json(
        { error: "Body must include as: 'requester' or 'claimer'" },
        { status: 400 }
      );
    }

    // Lazy import keeps mock-mode builds from touching DATABASE_URL at module scope
    const { db } = await import("@/lib/db/index");

    const [ride] = await db
      .select()
      .from(rideRequests)
      .where(eq(rideRequests.id, id));

    if (!ride) {
      return NextResponse.json(
        { error: "Ride request not found" },
        { status: 404 }
      );
    }

    if (ride.status !== "claimed") {
      return NextResponse.json(
        { error: "Only a claimed ride can be confirmed as complete" },
        { status: 409 }
      );
    }

    // Each side may only confirm for themselves
    const isRequester = ride.parentId === session.user.id;
    const isClaimer = ride.claimedBy === session.user.id;

    if (as === "requester" && !isRequester) {
      return NextResponse.json(
        { error: "Only the requester can confirm as 'requester'" },
        { status: 403 }
      );
    }
    if (as === "claimer" && !isClaimer) {
      return NextResponse.json(
        { error: "Only the claimer can confirm as 'claimer'" },
        { status: 403 }
      );
    }

    const [updated] = await db
      .update(rideRequests)
      .set(
        as === "requester"
          ? { requesterConfirmed: true }
          : { claimerConfirmed: true }
      )
      .where(eq(rideRequests.id, id))
      .returning();

    const bothConfirmed =
      updated.requesterConfirmed && updated.claimerConfirmed;

    if (bothConfirmed) {
      // Both sides confirmed → mark the ride complete
      await db
        .update(rideRequests)
        .set({ status: "completed" })
        .where(eq(rideRequests.id, id));

      // Award points to BOTH parents (defensive — /api/rewards/earn is
      // Task 6; it may 404 today, which must not break the ride flow).
      // TODO(Task 6): align body shape with the rewards earn endpoint once
      // it lands. 50 pts each for a completed lift share.
      await awardRidePoints(id, ride.parentId, ride.claimedBy ?? "");
    }

    return NextResponse.json({
      ...updated,
      status: bothConfirmed ? "completed" : updated.status,
    });
  } catch (error) {
    console.error("[rides/confirm] POST error:", error);
    return NextResponse.json(
      { error: "Failed to confirm ride. Please try again." },
      { status: 500 }
    );
  }
}

/** Fire-and-forget reward grant — never blocks or fails the confirm flow. */
async function awardRidePoints(
  referenceId: string,
  requesterId: string,
  claimerId: string
): Promise<void> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3001";

  const earn = async (userId: string) => {
    try {
      await fetch(`${baseUrl}/api/rewards/earn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lift",
          referenceId,
          userId,
          amount: RIDE_REWARD_POINTS,
        }),
      });
    } catch {
      // Rewards endpoint unavailable — ride completion still succeeds.
    }
  };

  await Promise.allSettled([earn(requesterId), earn(claimerId)]);
}
