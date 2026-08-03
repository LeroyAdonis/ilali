/**
 * Mock community contributions data.
 * Returns empty arrays in mock mode — contributions require a live DB
 * for write operations; the read-back is just for UI wiring.
 */

import type { ClubHealth } from "@/lib/db/types";

export function mockGetCommunityContributions() {
  return [];
}

export function mockGetContributionById() {
  return null;
}

export function mockGetContributionVouches() {
  return [];
}

export function mockGetClubHealth(): {
  health: ClubHealth;
  totalContributors: number;
  uniqueContributors: number;
  concentrationRatio: number;
} {
  return { health: "red", totalContributors: 0, uniqueContributors: 0, concentrationRatio: 0 };
}
