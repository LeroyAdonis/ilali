import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRideRequests } from "@/lib/data-source";
import { clubEvents, childProfiles, rideRequests } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

const VALID_DIRECTIONS = new Set(["to", "from"]);

/**
 * GET /api/rides?providerId=<id>
 * Public read — club pages are public. Returns ride requests (newest-first)
 * for the given provider/club, with requester/claimer/child names and
 * two-sided confirmation flags. `providerId` is required.
 */
export async function GET(request: NextRequest) {
  const providerId = request.nextUrl.searchParams.get("providerId");

  if (!providerId) {
    return NextResponse.json(
      { error: "Missing required query parameter: providerId" },
      { status: 400 }
    );
  }

  try {
    const rides = await getRideRequests({ providerId });
    return NextResponse.json(rides);
  } catch (error) {
    console.error("[rides] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load ride requests. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rides
 * Auth required. Body: { eventId, childId, direction }.
 * Creates a ride request (status "open"). Validates that the event exists
 * and the child belongs to the signed-in parent.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to post a ride request" },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const b = (body ?? {}) as Record<string, unknown>;
    const eventId = typeof b.eventId === "string" ? b.eventId.trim() : "";
    const childId = typeof b.childId === "string" ? b.childId.trim() : "";
    const direction = b.direction;

    if (!eventId || !childId) {
      return NextResponse.json(
        { error: "eventId and childId are required" },
        { status: 400 }
      );
    }
    if (typeof direction !== "string" || !VALID_DIRECTIONS.has(direction)) {
      return NextResponse.json(
        { error: "direction must be 'to' or 'from'" },
        { status: 400 }
      );
    }

    // Lazy import keeps mock-mode builds from touching DATABASE_URL at module scope
    const { db } = await import("@/lib/db/index");

    // Validate event exists
    const [event] = await db
      .select({ id: clubEvents.id })
      .from(clubEvents)
      .where(eq(clubEvents.id, eventId));
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Validate child belongs to the signed-in parent
    const [child] = await db
      .select({ id: childProfiles.id })
      .from(childProfiles)
      .where(
        and(
          eq(childProfiles.id, childId),
          eq(childProfiles.parentId, session.user.id)
        )
      );
    if (!child) {
      return NextResponse.json(
        { error: "Child not found for this parent" },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(rideRequests)
      .values({
        eventId,
        parentId: session.user.id,
        childId,
        direction: direction as "to" | "from",
        status: "open",
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[rides] POST error:", error);
    return NextResponse.json(
      { error: "Failed to post ride request. Please try again." },
      { status: 500 }
    );
  }
}
