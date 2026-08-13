import { describe, it, expect, vi, afterEach } from "vitest";

// The pricing module is evaluated once at import time, so env-driven tests
// re-import it fresh after mutating process.env (config flip = no rebuild).
async function loadPricing() {
  vi.resetModules();
  return import("@/lib/pricing");
}

describe("pricing config", () => {
  afterEach(() => {
    delete process.env.PROVIDER_MONTHLY_FEE_RANDS;
    delete process.env.PROVIDER_TRIAL_DAYS;
    delete process.env.PROVIDER_COMMISSION_PERCENT;
  });

  it("defaults to R99/month, 30 trial days, 10% commission when env unset", async () => {
    const { pricing } = await loadPricing();
    expect(pricing.monthlyFeeRands).toBe(99);
    expect(pricing.trialDays).toBe(30);
    expect(pricing.commissionPercent).toBe(10);
  });

  it("reads PRICING_* env vars when set (stakeholder deal flip, FR-14)", async () => {
    process.env.PROVIDER_MONTHLY_FEE_RANDS = "149";
    process.env.PROVIDER_TRIAL_DAYS = "14";
    process.env.PROVIDER_COMMISSION_PERCENT = "7";
    const { pricing, PRICING_EXPLAINER } = await loadPricing();
    expect(pricing.monthlyFeeRands).toBe(149);
    expect(pricing.trialDays).toBe(14);
    expect(pricing.commissionPercent).toBe(7);
    expect(PRICING_EXPLAINER).toBe(
      "R149/month (first 14 days free) plus a 7% commission on online bookings. No setup fees, no hidden costs.",
    );
  });

  it("falls back to defaults for empty or invalid values", async () => {
    process.env.PROVIDER_MONTHLY_FEE_RANDS = "";
    process.env.PROVIDER_TRIAL_DAYS = "abc";
    process.env.PROVIDER_COMMISSION_PERCENT = "-1";
    const { pricing } = await loadPricing();
    expect(pricing.monthlyFeeRands).toBe(99);
    expect(pricing.trialDays).toBe(30);
    expect(pricing.commissionPercent).toBe(10);
  });

  it("allows fractional commission (e.g. 7.5%)", async () => {
    process.env.PROVIDER_COMMISSION_PERCENT = "7.5";
    const { pricing } = await loadPricing();
    expect(pricing.commissionPercent).toBe(7.5);
  });
});
