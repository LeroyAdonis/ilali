/**
 * Mock rewards data — reward points ledger + reward redemptions.
 * User ids reference mock parents (parents.ts); reference ids point at
 * real provider ids and club event ids from communities.ts.
 * Dates are relative to module load.
 */

import type { RewardPoint, RewardRedemption } from "@/lib/db/types";
import { mockProviders } from "./providers";
import { mockClubEvents } from "./communities";

export type MockRewardPoint = RewardPoint;
export type MockRewardRedemption = RewardRedemption;

const DAY = 86400000;

// Anchor "now" at module load
const NOW = new Date();

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY);
}

const slugToId: Record<string, string> = Object.fromEntries(
  mockProviders.map((p) => [p.slug, p.id])
);
const soccerProviderId = slugToId["soccer-stars-academy"];
const aquaProviderId = slugToId["aquakids-swimming"];
const codecubsProviderId = slugToId["codecubs-programming-club"];

const eventByTitle: Record<string, string> = Object.fromEntries(
  mockClubEvents.map((e) => [e.title, e.id])
);
const soccerGameEventId = eventByTitle["U12 League Match vs Gardens Rangers"];
const aquaGalaEventId = eventByTitle["Junior Gala — Squad Trials"];
const pianoRecitalEventId = eventByTitle["Winter Recital — All Students"];

// ── Reward Points Ledger ──
// [userId, amount, action, referenceId, daysAgo]
const pointSpec: [string, number, string, string | null, number][] = [
  // parent_001 (Soccer Stars organizer)
  ["parent_001", 50, "welcome", null, 90],
  ["parent_001", 20, "review", null, 80],
  ["parent_001", 75, "volunteer", soccerProviderId, 60],
  ["parent_001", 15, "lift", soccerGameEventId, 30],
  ["parent_001", 100, "referral", null, 14],
  ["parent_001", 10, "attendance", soccerGameEventId, 7],
  ["parent_001", 75, "volunteer", soccerProviderId, 45],
  ["parent_001", 10, "attendance", soccerGameEventId, 30],
  // parent_002
  ["parent_002", 50, "welcome", null, 85],
  ["parent_002", 10, "attendance", soccerGameEventId, 20],
  ["parent_002", 75, "volunteer", soccerProviderId, 12],
  // parent_005 (regular lift driver)
  ["parent_005", 50, "welcome", null, 75],
  ["parent_005", 15, "lift", soccerGameEventId, 25],
  ["parent_005", 10, "attendance", soccerGameEventId, 6],
  // parent_009 (AquaKids volunteer)
  ["parent_009", 50, "welcome", null, 70],
  ["parent_009", 20, "review", null, 40],
  ["parent_009", 100, "referral", null, 35],
  ["parent_009", 10, "attendance", aquaGalaEventId, 3],
  // parent_013 (CodeCubs volunteer)
  ["parent_013", 50, "welcome", null, 60],
  ["parent_013", 75, "volunteer", codecubsProviderId, 18],
  // parent_016 (Piano Pathways organizer)
  ["parent_016", 50, "welcome", null, 55],
  ["parent_016", 100, "referral", null, 22],
  ["parent_016", 10, "attendance", pianoRecitalEventId, 4],
];

export const mockRewardPoints: MockRewardPoint[] = pointSpec.map(
  ([userId, amount, action, referenceId, createdDaysAgo], i) => ({
    id: `d1b2c3d4-${1001 + i}-4000-8000-${String(i + 1).padStart(12, "0")}`,
    userId,
    amount,
    action,
    referenceId,
    createdAt: daysAgo(createdDaysAgo),
  })
);

// ── Reward Redemptions ──
// [userId, pointsSpent, rewardType, providerId, daysAgo]
const redemptionSpec: [string, number, string, string | null, number][] = [
  ["parent_001", 200, "R50 Takealot voucher", null, 20],
  ["parent_001", 150, "Free Soccer Stars session", soccerProviderId, 9],
  ["parent_005", 50, "ILALI tote bag", null, 5],
  ["parent_009", 100, "R100 fuel voucher", aquaProviderId, 2],
];

export const mockRewardRedemptions: MockRewardRedemption[] = redemptionSpec.map(
  ([userId, pointsSpent, rewardType, providerId, createdDaysAgo], i) => ({
    id: `d1b2c3d4-${2001 + i}-4000-8000-${String(i + 1).padStart(12, "0")}`,
    userId,
    pointsSpent,
    rewardType,
    providerId,
    createdAt: daysAgo(createdDaysAgo),
  })
);

// ── Lookup helpers ──

export const rewardPointsByUserId: Record<string, MockRewardPoint[]> = {};

for (const point of mockRewardPoints) {
  (rewardPointsByUserId[point.userId] ??= []).push(point);
}

export const rewardRedemptionsByUserId: Record<string, MockRewardRedemption[]> =
  {};

for (const redemption of mockRewardRedemptions) {
  (rewardRedemptionsByUserId[redemption.userId] ??= []).push(redemption);
}
