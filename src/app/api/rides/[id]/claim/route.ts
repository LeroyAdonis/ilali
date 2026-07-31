import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rideRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * POST /api/rides/[id]/claim
 * Auth required. Claims an open ride request: sets claimed_by to the
 * signed-in user and moves status open → claimed.
 * Rejected when the request isn't open, or the requester tries to claim
 * their own request.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to offer a ride" },
        { status: 401 }
      );
    }

    const { id } = await params;

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

    if (ride.status !== "open") {
      return NextResponse.json(
        { error: "This ride request has already been claimed" },
        { status: 409 }
      );
    }

    if (ride.parentId === session.user.id) {
      return NextResponse.json(
        { error: "You can't claim your own ride request" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(rideRequests)
      .set({ claimedBy: session.user.id, status: "claimed" })
      .where(eq(rideRequests.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[rides/claim] POST error:", error);
    return NextResponse.json(
      { error: "Failed to claim ride request. Please try again." },
      { status: 500 }
    );
  }
}
