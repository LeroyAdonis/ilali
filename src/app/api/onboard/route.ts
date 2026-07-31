import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { extractProviderDetails } from "@/lib/ai/extract-provider";
import { providerApplications } from "@/lib/db/schema";
import { db } from "@/lib/db/index";
import { checkRateLimit, getRateLimitReset } from "@/lib/rate-limit";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

// ── Validation schema (simpler than full provider application) ──
const onboardSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must be under 2000 characters"),
});

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// ── Admin notification: log new onboard submissions ──
async function logOnboardSubmission(record: {
  id: string;
  name: string;
  email: string;
  description: string;
  aiExtracted: boolean;
  aiResult: Record<string, unknown> | null;
}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    ...record,
  };

  // 1. Console log (prominent)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📬 NEW PROVIDER ONBOARD SUBMISSION");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`  ID:          ${record.id}`);
  console.log(`  Name:        ${record.name}`);
  console.log(`  Email:       ${record.email}`);
  console.log(`  Description: ${record.description.slice(0, 120)}${record.description.length > 120 ? "..." : ""}`);
  console.log(`  AI Extracted: ${record.aiExtracted}`);
  if (record.aiResult) {
    console.log(`  AI Result:   ${JSON.stringify(record.aiResult)}`);
  }
  console.log(`  Time:        ${timestamp}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  // 2. File-based log (persistent)
  try {
    const logDir = path.join(process.cwd(), ".hermes", "logs");
    await mkdir(logDir, { recursive: true });
    const logPath = path.join(logDir, "onboard-submissions.jsonl");
    await writeFile(logPath, JSON.stringify(logEntry) + "\n", { flag: "a" });
    console.log(`[onboard] Logged to ${logPath}`);
  } catch (err) {
    console.warn("[onboard] Could not write log file:", err);
  }
}

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
        error: "Too many submissions. Please try again later.",
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
  const parsed = onboardSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json({ errors: fieldErrors }, { status: 400 });
  }

  const { name, email, description } = parsed.data;

  // ── AI extraction (best-effort, non-blocking) ──
  let aiExtracted = false;
  let aiResult: Record<string, unknown> | null = null;
  let extractedName = name;
  let extractedCategory: string | undefined;
  let extractedLocation: string | undefined;
  let extractedAgeMin: number | undefined;
  let extractedAgeMax: number | undefined;
  let extractedPriceValue: number | undefined;
  let extractedTags: string[] | undefined;

  try {
    const extracted = await extractProviderDetails(description);
    if (extracted) {
      aiExtracted = true;
      aiResult = extracted as unknown as Record<string, unknown>;
      if (extracted.name) extractedName = extracted.name;
      extractedCategory = extracted.category;
      extractedLocation = extracted.location;
      extractedAgeMin = extracted.ageMin;
      extractedAgeMax = extracted.ageMax;
      extractedPriceValue = extracted.priceValue;
      extractedTags = extracted.tags;
    }
  } catch (err) {
    console.warn("[onboard] AI extraction failed:", err);
    // Non-blocking — continue with raw description
  }

  // ── Insert into DB ──
  let recordId: string;
  try {
    const result = await db
      .insert(providerApplications)
      .values({
        name: extractedName,
        email,
        activityType: extractedCategory ?? "Other",
        description: description,
        location: extractedLocation ?? null,
        ageMin: extractedAgeMin ?? null,
        ageMax: extractedAgeMax ?? null,
        priceValue: extractedPriceValue ?? null,
        status: "pending",
        onboardSource: "form",
      })
      .returning({ id: providerApplications.id });

    recordId = result[0].id;
  } catch (error) {
    console.error("[onboard] Failed to insert provider application:", error);
    return NextResponse.json(
      {
        error:
          "Something went wrong. Please try again or email providers@ilali.co",
      },
      { status: 500 }
    );
  }

  // ── Admin notification (fire-and-forget) ──
  logOnboardSubmission({
    id: recordId,
    name: extractedName,
    email,
    description,
    aiExtracted,
    aiResult,
  }).catch((err) => console.warn("[onboard] Log notification failed:", err));

  // ── Return success ──
  return NextResponse.json({
    success: true,
    id: recordId,
    aiExtracted,
    message: aiExtracted
      ? "Thanks! Our AI helped extract your activity details. We'll review and add you within 48 hours."
      : "Thanks! We'll review your activity and add you within 48 hours.",
  });
}
