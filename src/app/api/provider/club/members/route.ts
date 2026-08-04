import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { clubMemberships, providers, users, childProfiles } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";

/**
 * GET /api/provider/club/members
 * Returns club members for the authenticated provider.
 * Includes parent name, child names, role, and joined date.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRecord = session.user as { id: string; role?: string };
    if (userRecord.role !== "provider") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find provider by linked userId
    const [providerRecord] = await db
      .select()
      .from(providers)
      .where(eq(providers.userId, userRecord.id))
      .limit(1);

    if (!providerRecord) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Get memberships with parent names
    const rows = await db
      .select({
        id: clubMemberships.id,
        providerId: clubMemberships.providerId,
        parentId: clubMemberships.parentId,
        parentName: users.name,
        childIds: clubMemberships.childIds,
        role: clubMemberships.role,
        status: clubMemberships.status,
        joinedAt: clubMemberships.joinedAt,
      })
      .from(clubMemberships)
      .innerJoin(users, eq(clubMemberships.parentId, users.id))
      .where(eq(clubMemberships.providerId, providerRecord.id))
      .orderBy(clubMemberships.joinedAt);

    // Collect all child IDs across all memberships
    const allChildIds = rows.flatMap((r) => r.childIds ?? []);
    const uniqueChildIds = [...new Set(allChildIds)];

    // Fetch child names
    let childNameMap = new Map<string, string>();
    if (uniqueChildIds.length > 0) {
      const childRows = await db
        .select({
          id: childProfiles.id,
          name: childProfiles.name,
        })
        .from(childProfiles)
        .where(inArray(childProfiles.id, uniqueChildIds));

      for (const child of childRows) {
        childNameMap.set(child.id, child.name);
      }
    }

    // Build member list
    const members = rows.map((row) => {
      const childNames = (row.childIds ?? []).map(
        (childId) => childNameMap.get(childId) ?? "Unknown"
      );

      return {
        id: row.id,
        parentName: row.parentName,
        childNames,
        role: row.role ?? "parent",
        joinedAt: row.joinedAt?.toISOString() ?? null,
      };
    });

    return NextResponse.json({
      members,
      count: members.length,
    });
  } catch (e) {
    console.error("GET /api/provider/club/members error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
