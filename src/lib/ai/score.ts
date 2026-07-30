import type { MatchIntent } from "./match";

/**
 * Score a single provider against the user's intent.
 * Returns 0-100 with reasons explaining the match.
 */
export function scoreProvider(
  provider: {
    id: string;
    ageMin: number;
    ageMax: number;
    tags?: string[] | null;
    location?: string;
    priceValue: number;
    isFree?: boolean | null;
  },
  intent: MatchIntent
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // ── Tag overlap: up to 40 points ──
  if (intent.tags.length > 0 && provider.tags && provider.tags.length > 0) {
    const matchedTags = intent.tags.filter((t) =>
      provider.tags!.includes(t)
    );
    if (matchedTags.length > 0) {
      const tagScore = Math.min(
        40,
        Math.round((matchedTags.length / intent.tags.length) * 40)
      );
      score += tagScore;
      reasons.push(`Tags: ${matchedTags.join(", ")}`);
    }
  }

  // ── Age range match: up to 25 points ──
  if (intent.ageMin !== undefined || intent.ageMax !== undefined) {
    const pMin = provider.ageMin;
    const pMax = provider.ageMax;
    const iMin = intent.ageMin ?? 0;
    const iMax = intent.ageMax ?? 99;

    // Check overlap (inclusive range — partial overlap counts)
    const overlapStart = Math.max(pMin, iMin);
    const overlapEnd = Math.min(pMax, iMax);
    if (overlapStart <= overlapEnd) {
      const overlap = overlapEnd - overlapStart + 1; // +1 so point overlap counts
      const intentRange = (iMax - iMin) + 1; // +1 so single-year query has range 1
      const overlapRatio = Math.min(1, overlap / intentRange);
      const ageScore = Math.round(overlapRatio * 25);
      score += ageScore;
      if (ageScore > 0) {
        reasons.push(`Ages ${provider.ageMin}–${provider.ageMax}`);
      }
    }
  }

  // ── Location match: up to 20 points ──
  if (intent.location && provider.location) {
    const intentLoc = intent.location.toLowerCase().trim();
    const providerLoc = provider.location.toLowerCase().trim();
    if (providerLoc.includes(intentLoc) || intentLoc.includes(providerLoc)) {
      score += 20;
      reasons.push(`Near ${provider.location}`);
    } else {
      // Partial word match
      const intentWords = intentLoc.split(/\s+/);
      const matchCount = intentWords.filter((w) =>
        providerLoc.includes(w)
      ).length;
      if (matchCount > 0) {
        const locScore = Math.round(
          (matchCount / intentWords.length) * 10
        );
        score += locScore;
        if (locScore > 0) reasons.push(`Near ${provider.location}`);
      }
    }
  }

  // ── Price match: up to 15 points ──
  if (intent.priceMax !== undefined) {
    if (provider.isFree || provider.priceValue === 0) {
      score += 15;
      reasons.push("Free");
    } else if (provider.priceValue <= intent.priceMax) {
      score += 15;
      reasons.push(
        `R${Math.round(provider.priceValue / 100)} — within budget`
      );
    } else if (provider.priceValue <= intent.priceMax * 1.5) {
      score += 7;
      reasons.push(
        `R${Math.round(
          provider.priceValue / 100
        )} — slightly over budget`
      );
    }
  }

  return { score: Math.min(100, score), reasons };
}

export interface ScoredResult {
  provider: unknown;
  score: number;
  reasons: string[];
}

/**
 * Score all providers against intent, sort by score descending.
 */
export function scoreAllProviders<T extends { id: string; ageMin: number; ageMax: number; tags?: string[] | null; location?: string; priceValue: number; isFree?: boolean | null }>(
  providers: T[],
  intent: MatchIntent
): ScoredResult[] {
  const scored = providers.map((provider) => {
    const { score, reasons } = scoreProvider(provider, intent);
    return { provider, score, reasons };
  });

  return scored.sort((a, b) => b.score - a.score);
}
