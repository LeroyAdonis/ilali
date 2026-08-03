/**
 * Community Reputation — score and tier calculation.
 *
 * Reputation = contributions × 10 + vouchesGiven × 5 + monthsActive × 2
 * Used to determine tier (newcomer / trusted / elder) which gates
 * weekly contribution caps and vouch requirements.
 */
import { db } from "@/lib/db/index";
import {
  communityContributions,
  contributionVouches,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Calculate the reputation score for a user.
 * Points from three sources:
 *   - confirmed contributions × 10
 *   - vouches given × 5
 *   - months since account creation × 2
 */
export async function getReputation(userId: string): Promise<number> {
  try {
    // Confirmed contributions
    const [contribRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(communityContributions)
      .where(
        sql`${communityContributions.userId} = ${userId} AND ${communityContributions.status} = 'confirmed'`
      );

    // Vouches given (the user vouched for others' contributions)
    const [vouchRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contributionVouches)
      .where(eq(contributionVouches.voucherId, userId));

    // Months active (from users.createdAt)
    const [userRow] = await db
      .select({ createdAt: sql<string>`${sql.raw("created_at")}` })
      .from(
        sql`(SELECT created_at FROM "users" WHERE id = ${userId}) AS u`
      );

    const monthsActive = userRow?.createdAt
      ? Math.max(
          1,
          Math.floor(
            (Date.now() - new Date(userRow.createdAt).getTime()) /
              (1000 * 60 * 60 * 24 * 30)
          )
        )
      : 1;

    return (
      (contribRow?.count ?? 0) * 10 +
      (vouchRow?.count ?? 0) * 5 +
      monthsActive * 2
    );
  } catch {
    return 0;
  }
}

/**
 * Map a reputation score to a tier.
 *   - elder:   score ≥ 100
 *   - trusted: score ≥ 21
 *   - newcomer: score < 21
 */
export function getReputationTier(
  score: number
): "newcomer" | "trusted" | "elder" {
  if (score >= 100) return "elder";
  if (score >= 21) return "trusted";
  return "newcomer";
}

/**
 * How many peer vouches a contribution needs to auto-confirm.
 * Higher tiers need fewer vouches.
 */
export function getVouchesNeeded(tier: string): number {
  return tier === "newcomer" ? 3 : tier === "trusted" ? 2 : 1;
}

/**
 * How many contributions a user can submit per week.
 * Higher tiers get more slack.
 */
export function getWeeklyCap(tier: string): number {
  return tier === "newcomer" ? 2 : tier === "trusted" ? 3 : 5;
}
