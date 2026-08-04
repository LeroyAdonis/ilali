import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { providers, clubMemberships, clubEvents, reviews, providerInquiries } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * GET /api/provider
 *
 * Returns the current provider's dashboard data.
 * Requires session with role='provider'.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRecord = session.user as { id: string; role?: string };
    if (userRecord.role !== "provider") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find provider by linked userId
    const [providerRecord] = await db
      .select()
      .from(providers)
      .where(eq(providers.userId, userRecord.id))
      .limit(1);

    if (!providerRecord) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Get inquiries (last 10)
    const inquiries = await db
      .select()
      .from(providerInquiries)
      .where(eq(providerInquiries.providerId, providerRecord.id))
      .orderBy(desc(providerInquiries.matchedAt))
      .limit(10);

    // Get stats
    const [memberCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(clubMemberships)
      .where(
        and(
          eq(clubMemberships.providerId, providerRecord.id),
          eq(clubMemberships.status, "active")
        )
      );

    const [eventCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(clubEvents)
      .where(eq(clubEvents.providerId, providerRecord.id));

    const [reviewCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviews)
      .where(eq(reviews.providerId, providerRecord.id));

    // Get upcoming events (max 3)
    const upcomingEvents = await db
      .select()
      .from(clubEvents)
      .where(
        and(
          eq(clubEvents.providerId, providerRecord.id),
          sql`${clubEvents.startTime} >= NOW()`
        )
      )
      .orderBy(sql`${clubEvents.startTime} ASC`)
      .limit(3);

    // Get recent reviews (max 3)
    const recentReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.providerId, providerRecord.id))
      .orderBy(desc(reviews.createdAt))
      .limit(3);

    // Get inquiry count for this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const [inquiryCountRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(providerInquiries)
      .where(
        and(
          eq(providerInquiries.providerId, providerRecord.id),
          sql`${providerInquiries.matchedAt} >= ${oneWeekAgo.toISOString()}`
        )
      );

    return NextResponse.json({
      provider: providerRecord,
      inquiries,
      stats: {
        inquiryCount: inquiryCountRow?.count ?? 0,
        memberCount: memberCountRow?.count ?? 0,
        eventCount: eventCountRow?.count ?? 0,
        reviewCount: reviewCountRow?.count ?? 0,
      },
      upcomingEvents,
      recentReviews,
    });
  } catch (e) {
    console.error("GET /api/provider error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/provider
 *
 * Updates the current provider's listing fields.
 * Requires session with role='provider'.
 * Category is NOT editable (set during application, admin-only change).
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRecord = session.user as { id: string; role?: string };
    if (userRecord.role !== "provider") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find provider by linked userId
    const [providerRecord] = await db
      .select()
      .from(providers)
      .where(eq(providers.userId, userRecord.id))
      .limit(1);

    if (!providerRecord) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const body = await request.json();

    // Build update object with only allowed fields
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description;
    }

    if (body.ageMin !== undefined) {
      const ageMin = Number(body.ageMin);
      if (isNaN(ageMin) || ageMin < 0) {
        return NextResponse.json({ error: "Invalid ageMin" }, { status: 400 });
      }
      updates.ageMin = ageMin;
    }

    if (body.ageMax !== undefined) {
      const ageMax = Number(body.ageMax);
      if (isNaN(ageMax) || ageMax < 0) {
        return NextResponse.json({ error: "Invalid ageMax" }, { status: 400 });
      }
      updates.ageMax = ageMax;
    }

    // Enforce ageMin <= ageMax if both provided or one already exists
    const finalAgeMin = (updates.ageMin as number) ?? providerRecord.ageMin;
    const finalAgeMax = (updates.ageMax as number) ?? providerRecord.ageMax;
    if (finalAgeMin > finalAgeMax) {
      return NextResponse.json(
        { error: "Age minimum cannot exceed age maximum" },
        { status: 400 }
      );
    }

    if (body.priceValue !== undefined) {
      const priceValue = Number(body.priceValue);
      if (isNaN(priceValue) || priceValue < 0) {
        return NextResponse.json({ error: "Invalid price" }, { status: 400 });
      }
      updates.priceValue = priceValue;
    }

    if (body.priceLabel !== undefined) {
      updates.priceLabel = body.priceLabel;
    }

    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags)) {
        return NextResponse.json({ error: "Tags must be an array" }, { status: 400 });
      }
      updates.tags = body.tags;
    }

    if (body.location !== undefined) {
      updates.location = body.location;
    }

    if (body.imageUrl !== undefined) {
      updates.imageUrl = body.imageUrl;
    }

    if (body.phone !== undefined) {
      updates.phone = body.phone;
    }

    if (body.isFree !== undefined) {
      updates.isFree = Boolean(body.isFree);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    updates.updatedAt = new Date();

    const [updated] = await db
      .update(providers)
      .set(updates)
      .where(eq(providers.id, providerRecord.id))
      .returning();

    return NextResponse.json({ provider: updated });
  } catch (e) {
    console.error("PATCH /api/provider error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
