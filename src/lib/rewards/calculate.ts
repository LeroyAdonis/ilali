/**
 * Ubuntu Rewards — points engine (spec §3.1).
 *
 * Single source of truth for how many points an action earns and how much
 * a redemption costs. Pure functions only — no DB, no I/O — so the maps
 * and balance math are trivially unit-testable and safe to import from
 * server components, route handlers, and client components alike.
 */

// ── Points earned per action ──
export const REWARD_ACTIONS = {
  lift: 50, // Complete a ride share
  volunteer: 100, // Volunteer at a club event
  referral: 200, // Refer a friend who joins
  review: 25, // Leave a review of an activity / venue
  welcome: 10, // Welcome bonus for joining Ubuntu Rewards
  attendance: 30, // Attend a club event
} as const;

export type RewardAction = keyof typeof REWARD_ACTIONS;

// ── Points cost per redemption ──
export const REDEMPTION_COSTS = {
  activityDiscount: 100, // R50 off an activity booking
  freeTrial: 150, // Free trial session at a partner club
  priorityBooking: 50, // Early access to popular camps
  airtime: 200, // Airtime top-up
} as const;

export type RedemptionType = keyof typeof REDEMPTION_COSTS;

/** Points awarded for a reward action, or null if the action is unknown. */
export function getPointsForAction(action: string): number | null {
  return (REWARD_ACTIONS as Record<string, number>)[action] ?? null;
}

/** Type guard: is this a known reward action key? */
export function isRewardAction(action: string): action is RewardAction {
  return action in REWARD_ACTIONS;
}

/** Points cost of a redemption type, or null if the type is unknown. */
export function getCostForRedemption(type: string): number | null {
  return (REDEMPTION_COSTS as Record<string, number>)[type] ?? null;
}

/** Type guard: is this a known redemption type key? */
export function isRedemptionType(type: string): type is RedemptionType {
  return type in REDEMPTION_COSTS;
}

// ── Balance ──

export interface RewardLedgerEntry {
  amount: number;
}

export interface RewardRedemptionEntry {
  pointsSpent: number;
}

/**
 * Balance = sum of earned points minus sum of redeemed points.
 * Ledger entries carry signed amounts (all positive for reward_points,
 * but the helper is agnostic), redemptions are subtracted by pointsSpent.
 */
export function calculateBalance(
  ledger: RewardLedgerEntry[],
  redemptions: RewardRedemptionEntry[] = []
): number {
  const earned = ledger.reduce((sum, entry) => sum + entry.amount, 0);
  const spent = redemptions.reduce((sum, entry) => sum + entry.pointsSpent, 0);
  return earned - spent;
}
