import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { reviewReplies, reviews, providers } from "@/lib/db/schema";
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
 * POST /api/provider/reviews/[id]/reply
 * Creates a reply to a review. Upsert pattern: one reply per review.
 * Auth: provider role + review belongs to this provider's listing.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateProvider(request);
    if ("error" in auth) return auth.error;
    const provider = auth.provider;

    const { id: reviewId } = await params;

    // Verify the review belongs to this provider's listing
    const [review] = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.id, reviewId), eq(reviews.providerId, provider.id)))
      .limit(1);

    if (!review) {
      return NextResponse.json(
        { error: "Review not found or does not belong to your listing" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const trimmedContent = content.trim();

    // Upsert: check if a reply already exists for this review
    const [existing] = await db
      .select()
      .from(reviewReplies)
      .where(eq(reviewReplies.reviewId, reviewId))
      .limit(1);

    if (existing) {
      // Update existing reply
      const [updated] = await db
        .update(reviewReplies)
        .set({ content: trimmedContent, updatedAt: new Date() })
        .where(eq(reviewReplies.id, existing.id))
        .returning();

      return NextResponse.json({ reply: updated });
    }

    // Create new reply
    const [created] = await db
      .insert(reviewReplies)
      .values({
        id: crypto.randomUUID(),
        reviewId,
        providerId: provider.id,
        content: trimmedContent,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ reply: created }, { status: 201 });
  } catch (e) {
    console.error("POST /api/provider/reviews/[id]/reply error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/provider/reviews/[id]/reply
 * Edits own reply. Auth: provider owns the reply.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateProvider(request);
    if ("error" in auth) return auth.error;
    const provider = auth.provider;

    const { id: reviewId } = await params;

    // Find the reply for this review that belongs to this provider
    const [reply] = await db
      .select()
      .from(reviewReplies)
      .where(
        and(
          eq(reviewReplies.reviewId, reviewId),
          eq(reviewReplies.providerId, provider.id)
        )
      )
      .limit(1);

    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const [updated] = await db
      .update(reviewReplies)
      .set({ content: content.trim(), updatedAt: new Date() })
      .where(eq(reviewReplies.id, reply.id))
      .returning();

    return NextResponse.json({ reply: updated });
  } catch (e) {
    console.error("PATCH /api/provider/reviews/[id]/reply error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/provider/reviews/[id]/reply
 * Deletes own reply. Auth: provider owns the reply.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateProvider(request);
    if ("error" in auth) return auth.error;
    const provider = auth.provider;

    const { id: reviewId } = await params;

    // Find the reply for this review that belongs to this provider
    const [reply] = await db
      .select()
      .from(reviewReplies)
      .where(
        and(
          eq(reviewReplies.reviewId, reviewId),
          eq(reviewReplies.providerId, provider.id)
        )
      )
      .limit(1);

    if (!reply) {
      return NextResponse.json({ error: "Reply not found" }, { status: 404 });
    }

    await db.delete(reviewReplies).where(eq(reviewReplies.id, reply.id));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/provider/reviews/[id]/reply error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
