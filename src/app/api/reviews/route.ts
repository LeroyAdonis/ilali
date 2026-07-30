import { NextResponse } from "next/server";
import { reviewSubmissionSchema } from "@/lib/validations/review";
import { db } from "@/lib/db/index";
import { reviews } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/reviews?providerId=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get("providerId");

  if (!providerId) {
    return NextResponse.json(
      { error: "Missing providerId parameter" },
      { status: 400 }
    );
  }

  const results = await db
    .select()
    .from(reviews)
    .where(eq(reviews.providerId, providerId))
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

  const { providerId, reviewerName, rating, content } = validated.data;

  const [inserted] = await db
    .insert(reviews)
    .values({
      providerId,
      userId: reviewerName, // store reviewer name in userId field (no auth needed)
      rating,
      content,
    })
    .returning();

  return NextResponse.json(inserted, { status: 201 });
}
