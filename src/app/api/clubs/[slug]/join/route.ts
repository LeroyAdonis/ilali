import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db/index";
import {
  clubMemberships,
  clubMessages,
  providers,
  rewardPoints,
  rideRequests,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  REWARD_ACTIONS,
  getPointsForAction,
} from "@/lib/rewards/calculate";

export const dynamic = "force-dynamic";

/**
 * POST /api/clubs/[slug]/join
 * Auth required. Query param: ?invitedBy=userId (optional).
 *
 * Behavior:
 * - If user has active membership → 200 "already a member"
 * - If user has inactive membership → reactivate (status = "active")
 * - Otherwise → insert new membership
 *
 * Side effects:
 * - Welcome reward for the joiner (10 pts)
 * - Club-invite reward for the inviter (50 pts) if invitedBy is present
 * - System message posted to club chat
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return NextResponse.json(
        { error: "You must be signed in to join a club" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userName = session.user.name ?? "A club member";

    // Resolve slug to provider ID
    const [provider] = await db
      .select({ id: providers.id })
      .from(providers)
      .where(eq(providers.slug, slug))
      .limit(1);

    if (!provider) {
      return NextResponse.json({ error: "Club not found" }, { status: 404 });
    }

    const clubId = provider.id;

    // Parse invitedBy from query string
    const invitedBy = request.nextUrl.searchParams.get("invitedBy") ?? null;

    // Check for existing membership
    const [existing] = await db
      .select()
      .from(clubMemberships)
      .where(
        and(
          eq(clubMemberships.providerId, clubId),
          eq(clubMemberships.parentId, userId)
        )
      )
      .limit(1);

    let memberNumber: string;

    if (existing) {
      if (existing.status === "active") {
        // Generate a stable member number from the row insertion order or ID
        memberNumber = existing.id.substring(0, 8).toUpperCase();
        return NextResponse.json({
          joined: true,
          alreadyMember: true,
          memberNumber,
          pointsAwarded: 0,
        });
      }

      // Reactivate inactive membership
      const [updated] = await db
        .update(clubMemberships)
        .set({ status: "active" })
        .where(eq(clubMemberships.id, existing.id))
        .returning();

      memberNumber = updated.id.substring(0, 8).toUpperCase();
    } else {
      // Insert new membership (no childIds for now — empty array as default)
      const [created] = await db
        .insert(clubMemberships)
        .values({
          providerId: clubId,
          parentId: userId,
          childIds: [],
          role: "parent",
          status: "active",
          invitedBy,
        })
        .returning();

      memberNumber = created.id.substring(0, 8).toUpperCase();
    }

    // ── Fire-and-forget rewards ──

    // Welcome reward for the joiner (allow to fail silently)
    try {
      // Direct insert to avoid JSON body parsing in internal call
      const welcomePoints = getPointsForAction("welcome");
      if (welcomePoints) {
        await db.insert(rewardPoints).values({
          userId,
          amount: welcomePoints,
          action: "welcome",
          referenceId: clubId,
        });
      }
    } catch {
      // Silently continue — rewards are fire-and-forget
    }

    // Club-invite reward for the inviter
    if (invitedBy && invitedBy !== userId) {
      try {
        const invitePoints = getPointsForAction("club-invite");
        if (invitePoints) {
          await db.insert(rewardPoints).values({
            userId: invitedBy,
            amount: invitePoints,
            action: "club-invite",
            referenceId: clubId,
          });
        }
      } catch {
        // Silently continue
      }
    }

    // ── System message to club chat ──
    // Posts as the joining user (FK constraint requires real userId)
    try {
      await db.insert(clubMessages).values({
        clubId,
        senderId: userId,
        content: `👋 ${userName} just joined! Say hello!`,
      });
    } catch {
      // Silently continue
    }

    return NextResponse.json({
      joined: true,
      memberNumber,
      pointsAwarded: getPointsForAction("welcome") ?? 10,
    });
  } catch (error) {
    console.error("[clubs/join] POST error:", error);
    return NextResponse.json(
      { error: "Failed to join club. Please try again." },
      { status: 500 }
    );
  }
}
