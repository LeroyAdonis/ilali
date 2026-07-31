import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { childProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/rides/children
 * Auth required. Returns the signed-in parent's child profiles
 * ({ id, name, age }) — used by the ride-request form's child select.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to view your children" },
        { status: 401 }
      );
    }

    // Lazy import keeps mock-mode builds from touching DATABASE_URL at module scope
    const { db } = await import("@/lib/db/index");

    const children = await db
      .select({ id: childProfiles.id, name: childProfiles.name, age: childProfiles.age })
      .from(childProfiles)
      .where(eq(childProfiles.parentId, session.user.id))
      .orderBy(childProfiles.createdAt);

    return NextResponse.json(children);
  } catch (error) {
    console.error("[rides/children] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load your children. Please try again." },
      { status: 500 }
    );
  }
}
