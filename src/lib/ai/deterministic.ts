/**
 * Deterministic intent extraction — the FAST path for /api/match.
 *
 * Why: AI intent extraction (OpenCode big-pickle, OpenRouter free) takes
 * 12-77s on free shared tiers. But ~60-80% of real parent queries are
 * trivially parseable ("football for my 7 year old near Sea Point"). This
 * rule-based parser handles those in <1ms with ZERO AI cost.
 *
 * Contract: returns a MatchIntent ONLY when confident (age + at least one of
 * activity/location/price resolved, or a price signal alone — "free",
 * "under R150"). Returns null for vague/fuzzy queries — the route then
 * falls back to the AI chain.
 *
 * Created 2026-08-11 as part of the "fast path + cache" latency fix.
 */
import type { MatchIntent } from "./match";
import { MATCH_TAGS } from "./match";
import { CT_SUBURBS } from "@/lib/suburbs";

/* ── Age patterns ── */

const AGE_PATTERNS: Array<{ re: RegExp; min: number; max: number }> = [
  // "ages 5-10", "ages 5 to 10", "5-10 years old"
  { re: /ages?\s+(\d{1,2})\s*(?:-|to|–)\s*(\d{1,2})/i, min: 0, max: 0 }, // handled below
  // "my 7 year old", "7-year-old", "a 13 year old", "7yo"
  { re: /(\d{1,2})\s*-?\s*years?\s*-?\s*old/i, min: 0, max: 0 },
  { re: /(\d{1,2})\s*yo\b/i, min: 0, max: 0 },
  // age-group words
  { re: /\btoddler\b/i, min: 2, max: 4 },
  { re: /\bpreschool\b|\bpre-school\b|\bnursery\b/i, min: 3, max: 5 },
  { re: /\bkindergarten\b|\bkindy\b/i, min: 4, max: 6 },
  { re: /\bteenager\b|\bteens\b/i, min: 13, max: 17 },
  { re: /\bprimary school\b/i, min: 6, max: 12 },
  { re: /\bhigh school\b/i, min: 13, max: 18 },
];

function extractAge(query: string): { min: number; max: number } | null {
  const lower = query.toLowerCase();

  // Explicit range first: "ages 5-10" / "5-10 years"
  const range = lower.match(
    /(?:ages?|aged|from)\s+(\d{1,2})\s*(?:-|to|–)\s*(\d{1,2})/
  );
  if (range) {
    const a = parseInt(range[1], 10);
    const b = parseInt(range[2], 10);
    return { min: Math.min(a, b), max: Math.max(a, b) };
  }
  const range2 = lower.match(
    /(\d{1,2})\s*(?:-|to|–)\s*(\d{1,2})\s*years?/
  );
  if (range2) {
    const a = parseInt(range2[1], 10);
    const b = parseInt(range2[2], 10);
    return { min: Math.min(a, b), max: Math.max(a, b) };
  }

  // Single age: "my 7 year old", "7yo", "for 8 year olds"
  const single = lower.match(
    /(\d{1,2})\s*-?\s*(?:year|yo)s?\b/
  );
  if (single) {
    const a = parseInt(single[1], 10);
    if (a >= 1 && a <= 18) return { min: a, max: a };
  }

  // Age-group words
  for (const p of AGE_PATTERNS) {
    if (p.min > 0 && p.re.test(lower)) return { min: p.min, max: p.max };
  }

  return null;
}

/* ── Activity → tags keyword map ──
 * Each entry: [regex-pattern, tags[]]. First match wins (longest/most specific
 * patterns are listed first so "tennis" doesn't get eaten by "sport"). */
const ACTIVITY_TAG_MAP: Array<{ re: RegExp; tags: string[] }> = [
  { re: /\b(swimming|swim)\b/i, tags: ["sport", "high-energy", "individual"] },
  { re: /\b(soccer|football|rugby|cricket|hockey|netball)\b/i, tags: ["sport", "outdoor", "high-energy", "group"] },
  { re: /\b(tennis|golf|athletics|gymnastics|gym|martial arts|karate|judo|taekwondo|boxing)\b/i, tags: ["sport", "high-energy"] },
  { re: /\b(ballet|dance|dancing|hip hop|contemporary|ballroom)\b/i, tags: ["sport", "creative", "group", "high-energy"] },
  { re: /\b(piano|guitar|violin|drums|singing|choir|music|musical)\b/i, tags: ["music", "creative", "individual"] },
  { re: /\b(drawing|painting|art|craft|pottery|clay|sculpture)\b/i, tags: ["creative", "indoor", "calm"] },
  { re: /\b(drama|theatre|acting|improv|stage)\b/i, tags: ["creative", "group"] },
  { re: /\b(coding|programming|robotics|stem|science|chess|maths|math|tutoring|tutor|reading|homework)\b/i, tags: ["academic", "indoor", "calm"] },
  { re: /\b(mindfulness|yoga|meditation|emotional|confidence|mindful)\b/i, tags: ["calm", "indoor"] },
  { re: /\b(holiday camp|camp|holiday program)\b/i, tags: ["holiday-program", "group", "outdoor"] },
  { re: /\b(weekend)\b/i, tags: ["weekend"] },
  { re: /\b(after school|afterschool)\b/i, tags: ["after-school"] },
  { re: /\b(outdoor|outside|nature)\b/i, tags: ["outdoor"] },
  { re: /\b(indoor|inside)\b/i, tags: ["indoor"] },
  { re: /\b(horse|pony|equestrian)\b/i, tags: ["sport", "outdoor"] },
];

function extractTags(query: string): string[] {
  const tags = new Set<string>();
  for (const { re, tags: mapped } of ACTIVITY_TAG_MAP) {
    if (re.test(query)) {
      for (const t of mapped) tags.add(t);
    }
  }
  return [...tags].filter((t) => (MATCH_TAGS as readonly string[]).includes(t)).slice(0, 5);
}

/* ── Location ── */

function extractLocation(query: string): string | null {
  const lower = query.toLowerCase();
  for (const suburb of CT_SUBURBS) {
    if (lower.includes(suburb.toLowerCase())) return suburb;
  }
  return null;
}

/* ── Price ── */

function extractPrice(query: string): number | null {
  const lower = query.toLowerCase();
  if (/\bfree\b/.test(lower)) return 0;
  // Note: input is lowercased, so the optional "r" must be lowercase too —
  // an uppercase R in the pattern would never match.
  const m = lower.match(/under\s*r?\s*(\d{2,4})/);
  if (m) return parseInt(m[1], 10);
  const m2 = lower.match(/r\s*(\d{2,4})\s*(?:or\s*less)?\b/);
  if (m2) return parseInt(m2[1], 10);
  return null;
}

/* ── Confidence + entry point ── */

/**
 * Deterministic extraction. Returns a MatchIntent ONLY when confident:
 * - age resolved AND (tags OR location OR price resolved)
 * - OR (no age, but tags + location both resolved — e.g. "swimming in Claremont")
 * - OR (price resolved — "free art classes", "under R150" — concrete even
 *   without age/location)
 *
 * Returns null otherwise (vague query → AI needed).
 */
export function extractIntentDeterministic(query: string): MatchIntent | null {
  const q = query.trim();
  if (q.length < 3) return null;

  const age = extractAge(q);
  const tags = extractTags(q);
  const location = extractLocation(q);
  const priceMax = extractPrice(q);

  const hasAge = age !== null;
  const hasDetail = tags.length > 0 || location !== null || priceMax !== null;

  if (!hasDetail) return null;

  // Confident: age + something concrete. No age but activity+location is
  // still useful ("swimming in Claremont"), and a resolved price is concrete
  // on its own ("free art classes", "under R150") — matches will be
  // age-unfiltered but location/tag/price relevant.
  if (hasAge || (tags.length > 0 && location !== null) || priceMax !== null) {
    return {
      ageMin: age?.min ?? undefined,
      ageMax: age?.max ?? undefined,
      tags,
      location: location ?? undefined,
      priceMax: priceMax ?? undefined,
    };
  }

  return null;
}
