import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { clubEvents, providers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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
 * PATCH /api/provider/events/[id]
 * Edits own event. Auth: provider owns the event.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateProvider(request);
    if ("error" in auth) return auth.error;
    const provider = auth.provider;

    const { id: eventId } = await params;

    // Find the event and verify ownership
    const [event] = await db
      .select()
      .from(clubEvents)
      .where(and(eq(clubEvents.id, eventId), eq(clubEvents.providerId, provider.id)))
      .limit(1);

    if (!event) {
      return NextResponse.json(
        { error: "Event not found or does not belong to your club" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, eventType, startTime, endTime, location } = body;

    // Build update object
    const updates: Record<string, unknown> = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
      }
      updates.title = title.trim();
    }

    if (eventType !== undefined) {
      const validTypes = ["practice", "game", "event", "other"];
      if (!validTypes.includes(eventType)) {
        return NextResponse.json(
          { error: "Invalid event type. Must be: practice, game, event, or other" },
          { status: 400 }
        );
      }
      updates.eventType = eventType;
    }

    if (startTime !== undefined) {
      const startDate = new Date(startTime);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
      }
      updates.startTime = startDate;
    }

    if (endTime !== undefined) {
      if (endTime === null) {
        updates.endTime = null;
      } else {
        const endDate = new Date(endTime);
        if (isNaN(endDate.getTime())) {
          return NextResponse.json({ error: "Invalid end time" }, { status: 400 });
        }
        updates.endTime = endDate;
      }
    }

    if (location !== undefined) {
      updates.location = location?.trim() ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const [updated] = await db
      .update(clubEvents)
      .set(updates)
      .where(eq(clubEvents.id, eventId))
      .returning();

    return NextResponse.json({ event: updated });
  } catch (e) {
    console.error("PATCH /api/provider/events/[id] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/provider/events/[id]
 * Deletes own event. Auth: provider owns the event.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateProvider(request);
    if ("error" in auth) return auth.error;
    const provider = auth.provider;

    const { id: eventId } = await params;

    // Find the event and verify ownership
    const [event] = await db
      .select()
      .from(clubEvents)
      .where(and(eq(clubEvents.id, eventId), eq(clubEvents.providerId, provider.id)))
      .limit(1);

    if (!event) {
      return NextResponse.json(
        { error: "Event not found or does not belong to your club" },
        { status: 404 }
      );
    }

    await db.delete(clubEvents).where(eq(clubEvents.id, eventId));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/provider/events/[id] error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
