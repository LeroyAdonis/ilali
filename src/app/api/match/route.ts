import { NextResponse } from "next/server";
import { extractIntent } from "@/lib/ai/match";
import { scoreAllProviders } from "@/lib/ai/score";
import { getProviders, searchProviders, getCategories } from "@/lib/db/queries";
import { mapProviders } from "@/lib/db/mappers";

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

  // Step 1: Extract intent via DeepSeek LLM
  const intent = await extractIntent(query);

  // Step 2: If intent extraction fails, fallback to keyword search
  if (!intent) {
    const [dbProviders, dbCategories] = await Promise.all([
      searchProviders(query),
      getCategories(),
    ]);
    const providers = mapProviders(dbProviders, dbCategories);
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

  // Step 3: Fetch all providers
  const [dbProviders, dbCategories] = await Promise.all([
    getProviders(),
    getCategories(),
  ]);

  // Step 4: Score all providers
  const scored = scoreAllProviders(dbProviders, intent);

  // Step 5: Filter out low-scoring matches (<30%)
  const MIN_SCORE = 30;
  const goodMatches = scored.filter((s) => s.score >= MIN_SCORE);

  // Map providers for the response
  const mappedGood = goodMatches.map((s) => ({
    provider: mapProviders(
      [s.provider as Parameters<typeof mapProviders>[0][number]],
      dbCategories
    )[0],
    score: s.score,
    reasons: s.reasons,
  }));

  // If we have good matches, return them
  if (mappedGood.length > 0) {
    return NextResponse.json({
      fallback: false,
      mode: "ai",
      intent,
      matches: mappedGood,
      total: mappedGood.length,
      query,
    });
  }

  // Step 6: All <30% — return with fallback flag
  const allMapped = scored.map((s) => ({
    provider: mapProviders(
      [s.provider as Parameters<typeof mapProviders>[0][number]],
      dbCategories
    )[0],
    score: s.score,
    reasons: s.reasons,
  }));

  return NextResponse.json({
    fallback: true,
    mode: "ai",
    intent,
    matches: allMapped.slice(0, 10),
    total: allMapped.length,
    query,
  });
}
