import { NextRequest, NextResponse } from "next/server";
import { referralSchema } from "@/lib/validations";
import { checkRateLimit, getRateLimitReset } from "@/lib/rate-limit";
import { referrals } from "@/lib/db/schema";
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
          "Too many referrals. Please try again later.",
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
  const parsed = referralSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json({ errors: fieldErrors }, { status: 400 });
  }

  // ── Insert into DB ──
  try {
    await db.insert(referrals).values({
      referrerName: parsed.data.referrer_name,
      referrerEmail: parsed.data.referrer_email,
      providerName: parsed.data.provider_name,
      providerEmail: parsed.data.provider_email,
      providerPhone: parsed.data.provider_phone || null,
      status: "pending",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to insert referral:", error);
    return NextResponse.json(
      {
        error:
          "Something went wrong. Please try again or email hello@ilali.co",
      },
      { status: 500 }
    );
  }
}
