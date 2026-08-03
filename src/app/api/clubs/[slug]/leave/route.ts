import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import {
  clubMemberships,
  clubMessages,
  clubEvents,
  providers,
  rideRequests,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * POST /api/clubs/[slug]/leave
 * Auth required. Sets the user's membership status to "inactive",
 * cancels their open ride requests for this club, and posts a
 * system message to the club chat.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const session = await auth.api.getSession({
      headers: _request.headers,
    });
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to leave a club" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userName = session.user.name ?? "A club member";

    // Resolve slug to provider ID
    const [provider] = await db
      .select({ id: providers.id, name: providers.name })
      .from(providers)
      .where(eq(providers.slug, slug))
      .limit(1);

    if (!provider) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const clubId = provider.id;

    // Find active membership
    const [membership] = await db
      .select()
      .from(clubMemberships)
      .where(
        and(
          eq(clubMemberships.providerId, clubId),
          eq(clubMemberships.parentId, userId),
          eq(clubMemberships.status, "active")
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: "You are not an active member of this club" },
        { status: 400 }
      );
    }

    // Set status to inactive
    await db
      .update(clubMemberships)
      .set({ status: "inactive" })
      .where(eq(clubMemberships.id, membership.id));

    // Cancel open ride requests by this user for this club's events
    try {
      const eventRows = await db
        .select({ id: clubEvents.id })
        .from(clubEvents)
        .where(eq(clubEvents.providerId, clubId));

      const eventIds = eventRows.map((e) => e.id);

      if (eventIds.length > 0) {
        await db
          .update(rideRequests)
          .set({ status: "cancelled" })
          .where(
            and(
              eq(rideRequests.parentId, userId),
              inArray(rideRequests.eventId, eventIds),
              eq(rideRequests.status, "open")
            )
          );
      }
    } catch {
      // Silently continue — ride cancellation is best-effort
    }

    // System message
    try {
      await db.insert(clubMessages).values({
        clubId,
        senderId: userId,
        content: `👋 ${userName} has left the club`,
      });
    } catch {
      // Silently continue
    }

    return NextResponse.json({ left: true });
  } catch (error) {
    console.error("[clubs/leave] POST error:", error);
    return NextResponse.json(
      { error: "Failed to leave club. Please try again." },
      { status: 500 }
    );
  }
}
