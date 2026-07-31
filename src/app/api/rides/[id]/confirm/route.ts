import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rideRequests } from "@/lib/db/schema";
import { selfBaseUrl } from "@/lib/rewards/self-url";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * POST /api/rides/[id]/confirm
 * Auth required. Body: { as: "requester" | "claimer" }.
 * Two-sided confirmation — each parent confirms the ride happened from
 * their own side (requester_confirmed / claimer_confirmed). When BOTH
 * sides have confirmed, status becomes "completed" and both parents are
 * awarded 50 pts each via POST /api/rewards/earn (fire-and-forget — a
 * rewards failure must not block the ride flow).
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

      // Award 50 pts to BOTH parents (fire-and-forget — /api/rewards/earn
      // derives the value from its server-side map; a failure here must
      // not break the ride flow).
      await awardRidePoints(
        request,
        id,
        ride.parentId,
        ride.claimedBy ?? ""
      );
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
  request: NextRequest,
  referenceId: string,
  requesterId: string,
  claimerId: string
): Promise<void> {
  const earn = async (userId: string) => {
    try {
      const res = await fetch(`${selfBaseUrl(request)}/api/rewards/earn`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Forward the confirming parent's session cookie so the earn
          // endpoint authenticates; the explicit userId targets the
          // award at each parent of the completed ride.
          Cookie: request.headers.get("cookie") ?? "",
        },
        body: JSON.stringify({
          action: "lift",
          referenceId,
          userId,
        }),
      });
      // Consume the body so the connection is released promptly.
      await res.arrayBuffer();
    } catch {
      // Rewards endpoint unavailable — ride completion still succeeds.
    }
  };

  await Promise.allSettled([earn(requesterId), earn(claimerId)]);
}
