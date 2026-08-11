import { NextResponse } from "next/server";
import { extractIntent } from "@/lib/ai/match";
import type { MatchIntent } from "@/lib/ai/match";
import { extractIntentDeterministic } from "@/lib/ai/deterministic";
import {
  getCachedIntent,
  normalizeQueryKey,
  setCachedIntent,
} from "@/lib/ai/intent-cache";
import { scoreAllProviders } from "@/lib/ai/score";
import { getProviders, searchProviders, getCategories } from "@/lib/data-source";
import { mapProvider } from "@/lib/db/mappers";

// AI route — OpenCode primary is slow (12-23s); allow up to 60s.
// The fast path (cache + deterministic) usually returns in well under 1s.
export const maxDuration = 60;

/** An intent is usable only if it carries at least one concrete filter. */
function isUsableIntent(intent: MatchIntent | null | undefined): intent is MatchIntent {
  if (!intent) return false;
  return (
    intent.ageMin !== undefined ||
    intent.ageMax !== undefined ||
    (Array.isArray(intent.tags) && intent.tags.length > 0) ||
    intent.location !== undefined ||
    intent.priceMax !== undefined
  );
}

/** Normalize a possibly-stale cached intent into a well-formed MatchIntent. */
function normalizeCachedIntent(intent: MatchIntent): MatchIntent {
  return {
    ageMin: intent.ageMin,
    ageMax: intent.ageMax,
    tags: Array.isArray(intent.tags) ? intent.tags : [],
    location: intent.location,
    priceMax: intent.priceMax,
  };
}

export async function POST(request: Request) {
  let body: { query: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json(
      { error: "Missing `query` field" },
      { status: 400 }
    );
  }

  const queryKey = normalizeQueryKey(query);

  // Step 1: Fast path — cached intent (repeat searches skip the AI tier
  // entirely). Cache errors degrade to the normal flow (never throws).
  let intent: MatchIntent | null = null;
  let mode: "cache" | "deterministic" | "ai" | "keyword" | null = null;

  const cached = await getCachedIntent(queryKey);
  if (cached && isUsableIntent(cached.intent)) {
    intent = normalizeCachedIntent(cached.intent);
    mode = "cache";
  }

  // Step 2: Deterministic rule-based extraction (<1ms, zero AI cost).
  if (!intent) {
    intent = extractIntentDeterministic(query);
    if (intent) {
      mode = "deterministic";
      // Persist for next time — fire-and-forget, never block the response.
      void setCachedIntent(queryKey, intent, "deterministic");
    }
  }

  // Step 3: AI extraction (slow — 12-77s on free tiers; only reached when
  // the deterministic parser is not confident).
  if (!intent) {
    intent = await extractIntent(query);
    if (intent) {
      mode = "ai";
      void setCachedIntent(queryKey, intent, "ai");
    }
  }

  // Step 4: Fallback to keyword search on total extraction failure
  if (!intent) {
    const [dbProviders, dbCategories] = await Promise.all([
      searchProviders(query),
      getCategories(),
    ]);
    const providers = dbProviders.map(p => mapProvider(p, dbCategories));
    return NextResponse.json({
      fallback: true,
      mode: "keyword",
      matches: providers.map((provider) => ({
        provider,
        score: 50,
        reasons: ["Keyword match"],
      })),
      total: providers.length,
    });
  }

  // Step 5: Fetch all providers
  const [dbProviders, dbCategories] = await Promise.all([
    getProviders(),
    getCategories(),
  ]);

  // Step 6: Score all providers
  const scored = scoreAllProviders(dbProviders, intent);

  // Step 7: Filter out low-scoring matches (<30%)
  const MIN_SCORE = 30;
  const goodMatches = scored.filter((s) => s.score >= MIN_SCORE);

  // Map providers for the response
  const mappedGood = goodMatches.map((s) => ({
    provider: mapProvider(s.provider, dbCategories),
    score: s.score,
    reasons: s.reasons,
  }));

  // If we have good matches, return them
  if (mappedGood.length > 0) {
    return NextResponse.json({
      fallback: false,
      mode,
      intent,
      matches: mappedGood,
      total: mappedGood.length,
      query,
    });
  }

  // Step 8: All <30% — return with fallback flag
  const allMapped = scored.map((s) => ({
    provider: mapProvider(s.provider, dbCategories),
    score: s.score,
    reasons: s.reasons,
  }));

  return NextResponse.json({
    fallback: true,
    mode,
    intent,
    matches: allMapped.slice(0, 10),
    total: allMapped.length,
    query,
  });
}
