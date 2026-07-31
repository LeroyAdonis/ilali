import { describe, it, expect } from "vitest";

/**
 * VerificationBadge tier logic (extracted for testability).
 *
 * Tiers:
 * - Listed    (no verification record)  → grey
 * - Verified  (approved verification)   → teal
 * - Trusted   (verified + 3+ vouches + 5+ reviews) → gold
 */

function getVerificationTier(params: {
  verificationStatus?: string | null;
  vouchCount?: number;
  reviewCount?: number;
}): "listed" | "verified" | "trusted" {
  const { verificationStatus, vouchCount = 0, reviewCount = 0 } = params;

  if (verificationStatus === "approved") {
    if (vouchCount >= 3 && reviewCount >= 5) {
      return "trusted";
    }
    return "verified";
  }
  return "listed";
}

describe("Verification Tier Logic", () => {
  it("returns 'listed' when no verification exists", () => {
    expect(getVerificationTier({})).toBe("listed");
  });

  it("returns 'listed' when verification is pending", () => {
    expect(getVerificationTier({ verificationStatus: "pending" })).toBe(
      "listed"
    );
  });

  it("returns 'listed' when verification is rejected", () => {
    expect(getVerificationTier({ verificationStatus: "rejected" })).toBe(
      "listed"
    );
  });

  it("returns 'verified' when approved but not enough vouches/reviews", () => {
    expect(
      getVerificationTier({
        verificationStatus: "approved",
        vouchCount: 2,
        reviewCount: 10,
      })
    ).toBe("verified");
    expect(
      getVerificationTier({
        verificationStatus: "approved",
        vouchCount: 5,
        reviewCount: 3,
      })
    ).toBe("verified");
  });

  it("returns 'trusted' when approved + 3+ vouches + 5+ reviews", () => {
    expect(
      getVerificationTier({
        verificationStatus: "approved",
        vouchCount: 3,
        reviewCount: 5,
      })
    ).toBe("trusted");
    expect(
      getVerificationTier({
        verificationStatus: "approved",
        vouchCount: 10,
        reviewCount: 20,
      })
    ).toBe("trusted");
  });

  it("returns 'trusted' on boundary exactly", () => {
    expect(
      getVerificationTier({
        verificationStatus: "approved",
        vouchCount: 3,
        reviewCount: 5,
      })
    ).toBe("trusted");
  });
});

describe("VerificationBadge — tier display labels", () => {
  const tierLabels: Record<string, string> = {
    listed: "Listed",
    verified: "Verified",
    trusted: "Trusted",
  };

  const tierIcons: Record<string, string> = {
    listed: "Medal",
    verified: "ShieldCheck",
    trusted: "Star",
  };

  it("all three tiers have labels", () => {
    expect(tierLabels.listed).toBe("Listed");
    expect(tierLabels.verified).toBe("Verified");
    expect(tierLabels.trusted).toBe("Trusted");
  });

  it("all three tiers have icons", () => {
    expect(tierIcons.listed).toBeTruthy();
    expect(tierIcons.verified).toBeTruthy();
    expect(tierIcons.trusted).toBeTruthy();
  });

  it("Trusted requires both conditions", () => {
    // Just vouches, not enough reviews
    expect(
      getVerificationTier({
        verificationStatus: "approved",
        vouchCount: 5,
        reviewCount: 4,
      })
    ).toBe("verified");

    // Just reviews, not enough vouches
    expect(
      getVerificationTier({
        verificationStatus: "approved",
        vouchCount: 2,
        reviewCount: 10,
      })
    ).toBe("verified");
  });
});
