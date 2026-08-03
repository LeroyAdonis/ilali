import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import { communityContributions, clubMemberships } from "@/lib/db/schema";
import { getCommunityContributions } from "@/lib/data-source";
import {
  CONTRIBUTION_TYPES,
  isContributionType,
} from "@/lib/rewards/calculate";
import {
  getReputation,
  getReputationTier,
  getWeeklyCap,
  getVouchesNeeded,
} from "@/lib/rewards/reputation";
import { eq, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** GET /api/community/contributions — public list with joined data */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const clubId = url.searchParams.get("clubId") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
    const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

    const contributions = await getCommunityContributions({
      clubId,
      status,
      limit: Math.min(limit, 100),
      offset,
    });

    return NextResponse.json(contributions);
  } catch (error) {
    console.error("[community/contributions] GET error:", error);
    return NextResponse.json(
      { error: "Failed to load contributions" },
      { status: 500 }
    );
  }
}

/** POST /api/community/contributions — submit a new community contribution */
export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to submit a contribution" },
        { status: 401 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Request body must be a JSON object" },
        { status: 400 }
      );
    }

    const b = body as Record<string, unknown>;

    // Validate required fields
    const clubId = typeof b.clubId === "string" ? b.clubId.trim() : null;
    const type = typeof b.type === "string" ? b.type.trim() : null;
    const description =
      typeof b.description === "string" && b.description.trim()
        ? b.description.trim()
        : null;

    if (!clubId) {
      return NextResponse.json(
        { error: "clubId is required" },
        { status: 400 }
      );
    }
    if (!type || !isContributionType(type)) {
      return NextResponse.json(
        {
          error: `Invalid contribution type "${type}". Valid types: ${Object.keys(CONTRIBUTION_TYPES).join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Check user is club member
    const [membership] = await db
      .select()
      .from(clubMemberships)
      .where(
        and(
          eq(clubMemberships.providerId, clubId),
          eq(clubMemberships.parentId, session.user.id)
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: "You must be a club member to submit a contribution" },
        { status: 403 }
      );
    }

    // Check weekly cap
    const reputation = await getReputation(session.user.id);
    const tier = getReputationTier(reputation);
    const weeklyCap = getWeeklyCap(tier);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const [weekCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(communityContributions)
      .where(
        and(
          eq(communityContributions.userId, session.user.id),
          sql`${communityContributions.createdAt} >= ${weekStart.toISOString()}`
        )
      );

    if ((weekCount?.count ?? 0) >= weeklyCap) {
      return NextResponse.json(
        {
          error: `Weekly cap of ${weeklyCap} contributions reached (${tier} tier). Try again next week.`,
        },
        { status: 429 }
      );
    }

    // Determine validationPath: "leader" if the club's provider has an owner user account
    let validationPath: "leader" | "peer" = "peer";

    try {
      const [provider] = await db
        .select({ providerName: sql<string>`${sql.raw("name")}` })
        .from(sql`(SELECT name FROM "providers" WHERE id = ${clubId}) AS p`)
        .limit(1);

      if (provider?.providerName) {
        // Check if there is a user whose name matches the provider name
        // (heuristic: club leader has a user account)
        const [leaderUser] = await db
          .select({ id: sql<string>`${sql.raw("id")}` })
          .from(
            sql`(SELECT id FROM "users" WHERE name ILIKE ${"%" + provider.providerName + "%"} AND role = 'provider' LIMIT 1) AS u`
          )
          .limit(1);
        validationPath = leaderUser?.id ? "leader" : "peer";
      }
    } catch {
      // Default to peer if provider lookup fails
    }

    // Points for this contribution type
    const points = CONTRIBUTION_TYPES[type];

    // Insert
    const [created] = await db
      .insert(communityContributions)
      .values({
        userId: session.user.id,
        clubId,
        type,
        description,
        points,
        validationPath,
      })
      .returning();

    return NextResponse.json(
      {
        id: created.id,
        status: created.status,
        validationPath: created.validationPath,
        points: created.points,
        vouchesNeeded: getVouchesNeeded(tier),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[community/contributions] POST error:", error);
    return NextResponse.json(
      { error: "Failed to submit contribution. Please try again." },
      { status: 500 }
    );
  }
}
