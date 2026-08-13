// ── Provider pricing (single source of truth) ──
// Values are env-driven (PRICING_* vars) so stakeholder deals (e.g. the
// Assitej agreement, FR-14) are a config flip, never a rebuild. Defaults match
// the website: providers R99/month (first 30 days free) + 10% commission on
// online bookings; parents always free. The 10% is only collectible once
// Paystack online booking is live (WS-6) — until then the effective charge is
// the R99 subscription.

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export const pricing = {
  monthlyFeeRands: envNumber("PROVIDER_MONTHLY_FEE_RANDS", 99),
  trialDays: envNumber("PROVIDER_TRIAL_DAYS", 30),
  commissionPercent: envNumber("PROVIDER_COMMISSION_PERCENT", 10),
};

/** "R99/month — first 30 days free" (signup hero pill, why-list comparison). */
export const MONTHLY_PRICING_SHORT = `R${pricing.monthlyFeeRands}/month — first ${pricing.trialDays} days free`;

/** "R99/month, first 30 days free, plus 10% on online bookings" (for-providers meta + card). */
export const PRICING_ONE_LINER = `R${pricing.monthlyFeeRands}/month, first ${pricing.trialDays} days free, plus ${pricing.commissionPercent}% on online bookings`;

/** "First 30 days free, plus 10% on online bookings" (pricing card sub-line). */
export const PRICING_CARD_LINE = `First ${pricing.trialDays} days free, plus ${pricing.commissionPercent}% on online bookings`;

/** Help-centre "What are the fees?" — one subscription + one commission. */
export const PRICING_EXPLAINER = `R${pricing.monthlyFeeRands}/month (first ${pricing.trialDays} days free) plus a ${pricing.commissionPercent}% commission on online bookings. No setup fees, no hidden costs.`;

/** Terms "service fee" sentence, aligned to the same structure. */
export const TERMS_COMMISSION_SENTENCE = `ILALI charges a ${pricing.commissionPercent}% commission on online bookings, shown before you complete a booking.`;

/** Why-list FAQ answer. */
export const PRICING_FAQ_LONG = `Just R${pricing.monthlyFeeRands} per month, and your first ${pricing.trialDays} days are completely free. No setup fees, no hidden costs.`;

/** Why-list CTA line. */
export const TRIAL_CTA_LINE = `First ${pricing.trialDays} days free — no strings attached.`;
