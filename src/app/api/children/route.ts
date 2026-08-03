import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { childProfiles } from "@/lib/db/schema";
import { z } from "zod/v4";

// ── Zod Schema ──

const createChildSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  age: z.number().int().min(1, "Age must be between 1 and 18").max(18, "Age must be between 1 and 18"),
  interests: z.array(z.string()).min(1, "At least one interest is required"),
  suburb: z.string().min(1, "Suburb is required"),
  availability: z.object({
    days: z.array(z.string()).min(1, "At least one day is required"),
    timeSlots: z.array(z.string()).min(1, "At least one time slot is required"),
  }),
});

// ── POST Handler ──

export async function POST(request: Request) {
  try {
    // 1. Validate session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // 2. Parse and validate body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parseResult = createChildSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 },
      );
    }

    const { name, age, interests, suburb, availability } = parseResult.data;

    // 3. Insert
    const [created] = await db
      .insert(childProfiles)
      .values({
        parentId: userId,
        name: name.trim(),
        age,
        interests,
        suburb: suburb.trim(),
        availability,
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("[children] POST error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
