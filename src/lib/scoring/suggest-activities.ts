/**
 * Deterministic activity scoring engine for the parent home page.
 *
 * Scores providers against each child profile based on:
 * - Age match (0-40): child's age falls within provider's ageMin-ageMax range
 * - Interest overlap (0-40): shared interests between child and provider tags
 * - Proximity bonus (0-20): same suburb as child
 *
 * Runs server-side at page load — budget 50ms, no AI call.
 */

export interface ScoredProvider {
  providerId: string;
  providerName: string;
  score: number;
  breakdown: {
    age: number;
    interests: number;
    proximity: number;
  };
  matchedInterests: string[];
}

export interface ChildProfileInput {
  id: string;
  age: number;
  interests: string[];
  suburb: string | null;
}

export interface ProviderInput {
  id: string;
  name: string;
  ageMin: number;
  ageMax: number;
  tags: string[] | null;
  location: string | null;
}

export interface SuggestActivitiesInput {
  childProfile: ChildProfileInput;
  providers: ProviderInput[];
  existingScheduledProviderIds: string[];
}

/**
 * Score a provider against a single child profile.
 * Returns null if the provider is already scheduled for this child.
 */
function scoreProvider(
  child: ChildProfileInput,
  provider: ProviderInput,
  existingIds: Set<string>,
): ScoredProvider | null {
  // Dedupe: skip providers with scheduled events
  if (existingIds.has(provider.id)) {
    return null;
  }

  // ── Age Match (0-40) ──
  let ageScore = 0;
  if (child.age >= provider.ageMin && child.age <= provider.ageMax) {
    ageScore = 40;
  } else if (
    child.age === provider.ageMin - 1 ||
    child.age === provider.ageMax + 1
  ) {
    ageScore = 20;
  }

  // ── Interest Overlap (0-40, max 40) ──
  const childInterests = new Set(
    child.interests.map((i) => i.toLowerCase().trim()),
  );
  const providerTags = provider.tags || [];
  const matchedInterests: string[] = [];

  for (const tag of providerTags) {
    if (childInterests.has(tag.toLowerCase().trim())) {
      matchedInterests.push(tag);
      if (matchedInterests.length >= 4) break; // cap at 4 for max 40 pts
    }
  }
  const interestScore = Math.min(matchedInterests.length * 10, 40);

  // ── Proximity Bonus (0-20) ──
  let proximityScore = 0;
  if (child.suburb && provider.location) {
    const childSuburb = child.suburb.toLowerCase().trim();
    const providerSuburb = provider.location.toLowerCase().trim();
    if (childSuburb === providerSuburb) {
      proximityScore = 20;
    }
    // Neighbouring suburb detection is deferred — would require a suburb adjacency map.
    // For now, "compare suburb strings" means exact match only.
  }

  const total = ageScore + interestScore + proximityScore;

  return {
    providerId: provider.id,
    providerName: provider.name,
    score: total,
    breakdown: {
      age: ageScore,
      interests: interestScore,
      proximity: proximityScore,
    },
    matchedInterests,
  };
}

/**
 * Score all providers against a single child profile and return
 * the top 5 suggestions (sorted by score descending, deduped against
 * existingScheduledProviderIds).
 */
export function suggestActivitiesForChild(
  input: SuggestActivitiesInput,
): ScoredProvider[] {
  const existingIds = new Set(input.existingScheduledProviderIds);

  const scored = input.providers
    .map((p) => scoreProvider(input.childProfile, p, existingIds))
    .filter((s): s is ScoredProvider => s !== null);

  // Sort by score descending, then by provider name for determinism
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.providerName.localeCompare(b.providerName);
  });

  return scored.slice(0, 5);
}

/**
 * Score providers against multiple children. Returns top 5 per child.
 */
export function suggestActivities(
  children: ChildProfileInput[],
  providers: ProviderInput[],
  existingScheduledProviderIds: string[],
): Map<string, ScoredProvider[]> {
  const results = new Map<string, ScoredProvider[]>();

  for (const child of children) {
    const suggestions = suggestActivitiesForChild({
      childProfile: child,
      providers,
      existingScheduledProviderIds,
    });
    results.set(child.id, suggestions);
  }

  return results;
}
