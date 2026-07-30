import { NextResponse } from "next/server";
import { reviewSubmissionSchema } from "@/lib/validations/review";
import { db } from "@/lib/db/index";
import { reviews } from "@/lib/db/schema";
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

  return NextResponse.json(inserted, { status: 201 });
}
