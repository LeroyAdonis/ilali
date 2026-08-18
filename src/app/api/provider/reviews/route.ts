import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { reviews, reviewReplies, providers, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/provider/reviews
 * Returns all reviews for the authenticated provider's listing,
 * including any existing provider replies.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
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

    // Fetch reviews for this provider, newest first
    const reviewRows = await db
      .select({
        id: reviews.id,
        rating: reviews.rating,
        content: reviews.content,
        userId: reviews.userId,
        userName: users.name,
        createdAt: reviews.createdAt,
        providerId: reviews.providerId,
      })
      .from(reviews)
      .leftJoin(users, eq(reviews.userId, users.id))
      .where(eq(reviews.providerId, providerRecord.id))
      .orderBy(desc(reviews.createdAt));

    // Fetch all replies for these reviews
    const reviewIds = reviewRows.map((r) => r.id);
    const replyMap = new Map<string, { id: string; content: string; updatedAt: string }>();

    if (reviewIds.length > 0) {
      const replyRows = await db
        .select()
        .from(reviewReplies)
        .where(
          and(
            eq(reviewReplies.providerId, providerRecord.id)
          )
        );

      for (const reply of replyRows) {
        replyMap.set(reply.reviewId, {
          id: reply.id,
          content: reply.content,
          updatedAt: reply.updatedAt.toISOString(),
        });
      }
    }

    const enriched = reviewRows.map((r) => ({
      id: r.id,
      rating: r.rating,
      content: r.content,
      userId: r.userId,
      userName: r.userName ?? "Parent",
      createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
      reply: replyMap.get(r.id) ?? null,
    }));

    return NextResponse.json({ reviews: enriched });
  } catch (e) {
    console.error("GET /api/provider/reviews error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
