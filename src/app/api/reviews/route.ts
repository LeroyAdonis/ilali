import { NextResponse } from "next/server";
import { reviewSubmissionSchema } from "@/lib/validations/review";
import { db } from "@/lib/db/index";
import { reviews } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { selfBaseUrl } from "@/lib/rewards/self-url";
import { eq, or, desc } from "drizzle-orm";

// GET /api/reviews?providerId=...&venueId=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get("providerId");
  const venueId = searchParams.get("venueId");

  if (!providerId && !venueId) {
    return NextResponse.json(
      { error: "Missing providerId or venueId parameter" },
      { status: 400 }
    );
  }

  const conditions = [];
  if (providerId) conditions.push(eq(reviews.providerId, providerId));
  if (venueId) conditions.push(eq(reviews.venueId, venueId));

  const results = await db
    .select()
    .from(reviews)
    .where(or(...conditions))
    .orderBy(desc(reviews.createdAt))
    .limit(20);

  return NextResponse.json(results);
}

// POST /api/reviews
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const validated = reviewSubmissionSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { errors: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { providerId, venueId, reviewerName, rating, content } = validated.data;

  const [inserted] = await db
    .insert(reviews)
    .values({
      providerId: providerId ?? null,
      venueId: venueId ?? null,
      userId: reviewerName,
      rating,
      content,
    })
    .returning();

  // ── Ubuntu Rewards: 25 pts for signed-in reviewers (non-blocking) ──
  // Reviews are public and may be anonymous — only award when a session
  // exists, and never let a rewards hiccup block the review itself.
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session) {
      void awardReviewPoints(request, session.user.id, inserted.id);
    }
  } catch {
    // Rewards unavailable — review still succeeds.
  }

  return NextResponse.json(inserted, { status: 201 });
}

const REVIEW_REWARD_POINTS = 25;

/**
 * Fire-and-forget: award 25 pts for a signed-in reviewer. Forwards the
 * session cookie so POST /api/rewards/earn authenticates, and keys the
 * dedupe on the review id. Never throws into the review flow.
 */
async function awardReviewPoints(
  request: Request,
  userId: string,
  reviewId: string
): Promise<void> {
  try {
    const res = await fetch(`${selfBaseUrl(request)}/api/rewards/earn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("cookie") ?? "",
      },
      body: JSON.stringify({
        action: "review",
        referenceId: reviewId,
        userId,
        // REVIEW_REWARD_POINTS is informational — /api/rewards/earn
        // derives the award from the server-side map (review = 25) and
        // ignores any client-supplied amount.
        amount: REVIEW_REWARD_POINTS,
      }),
    });
    // Consume the body so the connection is released promptly.
    await res.arrayBuffer();
  } catch {
    // Rewards endpoint unavailable — review creation still succeeds.
  }
}
