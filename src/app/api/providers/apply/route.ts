import { NextRequest, NextResponse } from "next/server";
import { providerApplicationSchema } from "@/lib/validations";
import { checkRateLimit, getRateLimitReset } from "@/lib/rate-limit";
import { providerApplications } from "@/lib/db/schema";
import { db } from "@/lib/db/index";

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  // ── Rate limit check ──
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous";

  if (!checkRateLimit(ip, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS)) {
    const retryAfter = getRateLimitReset(ip, RATE_LIMIT_WINDOW_MS);
    return NextResponse.json(
      {
        error:
          "Too many applications. Please try again later.",
        retryAfter,
      },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  // ── Parse body ──
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  // ── Validate ──
  const parsed = providerApplicationSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json({ errors: fieldErrors }, { status: 400 });
  }

  // ── Insert into DB ──
  try {
    await db.insert(providerApplications).values({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      activityType: parsed.data.activity_type,
      description: parsed.data.description || null,
      location: parsed.data.location || null,
      ageMin: parsed.data.age_min ?? null,
      ageMax: parsed.data.age_max ?? null,
      priceValue: parsed.data.price_value ?? null,
      imageUrl: parsed.data.image_url || null,
      status: "pending",
      onboardSource: "form",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to insert provider application:", error);
    return NextResponse.json(
      {
        error:
          "Something went wrong. Please try again or email hello@ilali.co",
      },
      { status: 500 }
    );
  }
}
