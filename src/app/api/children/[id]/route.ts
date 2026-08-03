import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { childProfiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";

// ── Zod Schema for PATCH ──

const updateChildSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  age: z.number().int().min(1).max(18).optional(),
  interests: z.array(z.string()).min(1).optional(),
  suburb: z.string().min(1).optional(),
  availability: z
    .object({
      days: z.array(z.string()).min(1),
      timeSlots: z.array(z.string()).min(1),
    })
    .optional(),
});

// ── Helpers ──

async function getAuthenticatedUserId(
  request: Request,
): Promise<{ userId: string } | NextResponse> {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return { userId: session.user.id };
}

async function verifyOwnership(
  childId: string,
  userId: string,
): Promise<NextResponse | null> {
  const child = await db
    .select()
    .from(childProfiles)
    .where(and(eq(childProfiles.id, childId), eq(childProfiles.parentId, userId)))
    .limit(1);

  if (child.length === 0) {
    // Check if child exists at all (differentiate 403 vs 404)
    const anyChild = await db
      .select({ id: childProfiles.id })
      .from(childProfiles)
      .where(eq(childProfiles.id, childId))
      .limit(1);

    if (anyChild.length === 0) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Not your child" },
      { status: 403 },
    );
  }

  return null;
}

// ── GET Handler ──

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Auth check
    const authResult = await getAuthenticatedUserId(request);
    if (authResult instanceof NextResponse) return authResult;

    // Ownership check
    const ownershipError = await verifyOwnership(id, authResult.userId);
    if (ownershipError) return ownershipError;

    // Fetch child
    const child = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.id, id))
      .limit(1);

    if (child.length === 0) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    return NextResponse.json(child[0]);
  } catch (error) {
    console.error("[children/[id]] GET error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}

// ── PATCH Handler ──

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Auth check
    const authResult = await getAuthenticatedUserId(request);
    if (authResult instanceof NextResponse) return authResult;

    // Ownership check
    const ownershipError = await verifyOwnership(id, authResult.userId);
    if (ownershipError) return ownershipError;

    // Parse and validate body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parseResult = updateChildSchema.safeParse(rawBody);
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

    const updates = parseResult.data;

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updates.name !== undefined) updateData.name = updates.name.trim();
    if (updates.age !== undefined) updateData.age = updates.age;
    if (updates.interests !== undefined) updateData.interests = updates.interests;
    if (updates.suburb !== undefined) updateData.suburb = updates.suburb.trim();
    if (updates.availability !== undefined) updateData.availability = updates.availability;

    // Only update if there are actual changes
    if (Object.keys(updateData).length <= 1) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    const [updated] = await db
      .update(childProfiles)
      .set(updateData)
      .where(eq(childProfiles.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[children/[id]] PATCH error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
