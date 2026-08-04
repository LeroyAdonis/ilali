import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { clubEvents, providers, clubMemberships, rideRequests } from "@/lib/db/schema";
import { eq, and, sql, asc } from "drizzle-orm";

/**
 * Helper: Authenticate provider session and return provider record.
 */
async function authenticateProvider(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const userRecord = session.user as { id: string; role?: string };
  if (userRecord.role !== "provider") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  const [providerRecord] = await db
    .select()
    .from(providers)
    .where(eq(providers.userId, userRecord.id))
    .limit(1);

  if (!providerRecord) {
    return { error: NextResponse.json({ error: "Provider not found" }, { status: 404 }) };
  }

  return { provider: providerRecord };
}

/**
 * GET /api/provider/events
 * Returns events for this provider, upcoming first, with attendee counts.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateProvider(request);
    if ("error" in auth) return auth.error;
    const provider = auth.provider;

    const events = await db
      .select()
      .from(clubEvents)
      .where(eq(clubEvents.providerId, provider.id))
      .orderBy(
        // Upcoming events first, then past events — each chronological
        sql`CASE WHEN ${clubEvents.startTime} >= NOW() THEN 0 ELSE 1 END`,
        asc(clubEvents.startTime)
      );

    // Enrich with attendee counts
    const enriched = await Promise.all(
      events.map(async (event) => {
        try {
          // Count rideRequests for this event
          const [rideCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(rideRequests)
            .where(eq(rideRequests.eventId, event.id));

          // Count clubMemberships for this provider (as a rough attendee estimate)
          const [memberCount] = await db
            .select({ count: sql<number>`count(*)` })
            .from(clubMemberships)
            .where(
              and(
                eq(clubMemberships.providerId, provider.id),
                eq(clubMemberships.status, "active")
              )
            );

          return {
            ...event,
            rideRequestCount: rideCount?.count ?? 0,
            memberCount: memberCount?.count ?? 0,
          };
        } catch {
          return { ...event, rideRequestCount: 0, memberCount: 0 };
        }
      })
    );

    return NextResponse.json({ events: enriched });
  } catch (e) {
    console.error("GET /api/provider/events error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/provider/events
 * Creates a new event for this provider.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateProvider(request);
    if ("error" in auth) return auth.error;
    const provider = auth.provider;

    const body = await request.json();
    const { title, eventType, startTime, endTime, location, description } = body;

    // Validate required fields
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const validTypes = ["practice", "game", "event", "other"];
    const type = eventType && validTypes.includes(eventType) ? eventType : "other";

    if (!startTime) {
      return NextResponse.json({ error: "Start time is required" }, { status: 400 });
    }

    const startDate = new Date(startTime);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
    }

    const endDate = endTime ? new Date(endTime) : null;
    if (endTime && isNaN(endDate!.getTime())) {
      return NextResponse.json({ error: "Invalid end time" }, { status: 400 });
    }

    const [created] = await db
      .insert(clubEvents)
      .values({
        id: crypto.randomUUID(),
        providerId: provider.id,
        title: title.trim(),
        eventType: type,
        startTime: startDate,
        endTime: endDate,
        location: location?.trim() ?? null,
        // Note: clubEvents schema doesn't have a 'description' column.
        // We'll log a warning and not store it since the column doesn't exist.
        createdAt: new Date(),
      })
      .returning();

    return NextResponse.json({ event: created }, { status: 201 });
  } catch (e) {
    console.error("POST /api/provider/events error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
