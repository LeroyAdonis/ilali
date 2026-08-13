import { describe, it, expect } from "vitest";
import {
  REWARD_ACTIONS,
  REDEMPTION_COSTS,
  getPointsForAction,
  isRewardAction,
  getCostForRedemption,
  isRedemptionType,
  calculateBalance,
} from "@/lib/rewards/calculate";

describe("REWARD_ACTIONS — points map (spec §3.1)", () => {
  it("maps every action to its spec'd point value", () => {
    expect(REWARD_ACTIONS).toEqual({
      lift: 50,
      volunteer: 100,
      referral: 200,
      review: 25,
      welcome: 10,
      attendance: 30,
      "club-invite": 50,
      community: 25,
    });
  });

  it("getPointsForAction returns the points for known actions", () => {
    expect(getPointsForAction("lift")).toBe(50);
    expect(getPointsForAction("volunteer")).toBe(100);
    expect(getPointsForAction("referral")).toBe(200);
    expect(getPointsForAction("review")).toBe(25);
    expect(getPointsForAction("welcome")).toBe(10);
    expect(getPointsForAction("attendance")).toBe(30);
    expect(getPointsForAction("community")).toBe(25);
  });

  it("getPointsForAction returns null for unknown actions", () => {
    expect(getPointsForAction("hack")).toBeNull();
    expect(getPointsForAction("")).toBeNull();
  });

  it("isRewardAction guards known keys and rejects everything else", () => {
    for (const action of Object.keys(REWARD_ACTIONS)) {
      expect(isRewardAction(action)).toBe(true);
    }
    expect(isRewardAction("nope")).toBe(false);
    expect(isRewardAction(undefined as unknown as string)).toBe(false);
  });
});

describe("REDEMPTION_COSTS — redemption cost map", () => {
  it("defines the spec'd costs", () => {
    expect(REDEMPTION_COSTS).toEqual({
      activityDiscount: 100,
      freeTrial: 150,
      priorityBooking: 50,
      airtime: 200,
    });
  });

  it("getCostForRedemption returns the cost for known types", () => {
    expect(getCostForRedemption("activityDiscount")).toBe(100);
    expect(getCostForRedemption("freeTrial")).toBe(150);
    expect(getCostForRedemption("priorityBooking")).toBe(50);
    expect(getCostForRedemption("airtime")).toBe(200);
  });

  it("getCostForRedemption returns null for unknown types", () => {
    expect(getCostForRedemption("yacht")).toBeNull();
  });

  it("isRedemptionType guards known types", () => {
    expect(isRedemptionType("airtime")).toBe(true);
    expect(isRedemptionType("airtime ")).toBe(false);
  });
});

describe("calculateBalance", () => {
  it("sums a ledger of earned points", () => {
    expect(
      calculateBalance([{ amount: 50 }, { amount: 100 }, { amount: 25 }])
    ).toBe(175);
  });

  it("returns 0 for an empty ledger", () => {
    expect(calculateBalance([])).toBe(0);
  });

  it("subtracts redemptions from the earned total", () => {
    expect(
      calculateBalance(
        [{ amount: 200 }, { amount: 100 }],
        [{ pointsSpent: 150 }, { pointsSpent: 50 }]
      )
    ).toBe(100);
  });

  it("defaults redemptions to an empty list", () => {
    expect(calculateBalance([{ amount: 30 }])).toBe(30);
  });

  it("can go negative when redemptions exceed earnings", () => {
    expect(
      calculateBalance([{ amount: 50 }], [{ pointsSpent: 100 }])
    ).toBe(-50);
  });

  it("ignores zero and negative ledger entries", () => {
    expect(calculateBalance([{ amount: 0 }, { amount: -5 }, { amount: 10 }])).toBe(
      5
    );
  });
});
