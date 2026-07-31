import { NextResponse } from "next/server";
import { chat } from "@/lib/ai/client";
import {
  getProviders,
  searchProviders,
  getCategories,
} from "@/lib/data-source";
import { eq } from "drizzle-orm";
import type { ChildProfile } from "@/lib/db/types";

// ── Types ──

interface ChatExtractedQuery {
  category: string | null;
  activityType: string | null;
  ageMin: number | null;
  ageMax: number | null;
  days: string[];
  timeSlot: string | null;
  location: string | null;
  maxPrice: number | null;
}

interface ChatChildContext {
  age: number;
  interests: string[] | null;
  suburb: string | null;
}

// ── Available Categories from the brief ──

const CATEGORY_IDS = [
  "sports",
  "arts-culture",
  "education",
  "music-lessons",
  "emotional-intelligence",
  "holiday-programs",
] as const;

// ── Child Profile Helpers (lazy-load DB to survive build w/o DATABASE_URL) ──

async function getChildProfile(
  childId: string
): Promise<ChildProfile | null> {
  try {
    const { db } = await import("@/lib/db/index");
    const { childProfiles } = await import("@/lib/db/schema");
    const results = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.id, childId))
      .limit(1);
    if (!results[0]) return null;
    return {
      id: results[0].id,
      parentId: results[0].parentId,
      name: results[0].name,
      age: results[0].age,
      interests: results[0].interests ?? null,
      availability:
        (results[0].availability as ChildProfile["availability"]) ?? null,
      suburb: results[0].suburb ?? null,
      createdAt: results[0].createdAt ?? new Date(),
      updatedAt: results[0].updatedAt ?? new Date(),
    };
  } catch {
    return null;
  }
}

async function getChildrenByParent(
  parentId: string
): Promise<ChildProfile[]> {
  try {
    const { db } = await import("@/lib/db/index");
    const { childProfiles } = await import("@/lib/db/schema");
    const results = await db
      .select()
      .from(childProfiles)
      .where(eq(childProfiles.parentId, parentId));
    return results.map((r) => ({
      id: r.id,
      parentId: r.parentId,
      name: r.name,
      age: r.age,
      interests: r.interests ?? null,
      availability:
        (r.availability as ChildProfile["availability"]) ?? null,
      suburb: r.suburb ?? null,
      createdAt: r.createdAt ?? new Date(),
      updatedAt: r.updatedAt ?? new Date(),
    }));
  } catch {
    return [];
  }
}

// ── Step 1: AI Query Extraction ──

async function extractQuery(
  message: string
): Promise<ChatExtractedQuery | null> {
  const systemPrompt = `You are an activity search assistant for ILALI, a children's activities marketplace in Cape Town, South Africa.

Extract structured search parameters from the parent's message. Return ONLY valid JSON (no markdown, no explanation).

Categories available: "sports", "arts-culture", "education", "music-lessons", "emotional-intelligence", "holiday-programs"

Return:
{
  "category": string | null,
  "activityType": string | null,
  "ageMin": number | null,
  "ageMax": number | null,
  "days": string[],
  "timeSlot": string | null,
  "location": string | null,
  "maxPrice": number | null
}

Rules:
- Extract category from what the parent is looking for ("soccer" → "sports", "piano" → "music-lessons", "tutoring" → "education")
- Extract activityType as the specific activity name (e.g., "soccer", "swimming", "piano")
- Extract age from phrases like "13-year-old", "for my 7 year old", "ages 5-10", "my teenager"
- For "days", extract mentioned days as full names: "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
- For "timeSlot", extract time in 24h format (e.g., "15:00" for 3pm). Return as string.
- For "location", match to a Cape Town suburb if mentioned
- For "maxPrice", extract from phrases like "under R200", "affordable", "R150 or less" — return as number in Rands
- If unsure about any field, set to null`;

  const content = await chat({
    systemPrompt,
    userMessage: message,
    temperature: 0.1,
    maxTokens: 350,
    timeoutMs: 5000,
  });

  if (!content) return null;

  try {
    const cleaned = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const result = JSON.parse(cleaned);

    return {
      category:
        typeof result.category === "string" &&
        (CATEGORY_IDS as readonly string[]).includes(result.category)
          ? result.category
          : null,
      activityType:
        typeof result.activityType === "string"
          ? result.activityType
          : null,
      ageMin: typeof result.ageMin === "number" ? result.ageMin : null,
      ageMax: typeof result.ageMax === "number" ? result.ageMax : null,
      days: Array.isArray(result.days)
        ? result.days.filter((d: unknown) => typeof d === "string")
        : [],
      timeSlot:
        typeof result.timeSlot === "string" ? result.timeSlot : null,
      location:
        typeof result.location === "string" ? result.location : null,
      maxPrice:
        typeof result.maxPrice === "number" ? result.maxPrice : null,
    };
  } catch {
    console.warn("[chat-match] Failed to parse AI response");
    return null;
  }
}

// ── Step 2: Provider Scoring ──

interface ScorableProvider {
  id: string;
  name: string;
  category: string;
  ageMin: number;
  ageMax: number;
  tags: string[] | null;
  location: string;
  priceValue: number;
  isFree: boolean | null;
}

function scoreProviderMatch(
  provider: ScorableProvider,
  extracted: ChatExtractedQuery,
  childContext?: ChatChildContext | null
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // Merge location: child suburb takes priority over extracted location
  const effectiveLocation =
    childContext?.suburb || extracted.location;

  // ── Category match: up to 35 points ──
  if (extracted.category && provider.category === extracted.category) {
    score += 35;
    reasons.push(`Matches ${extracted.category} category`);
  }

  // ── ActivityType match in provider name: up to 15 points ──
  if (extracted.activityType) {
    const nameLower = provider.name.toLowerCase();
    const typeLower = extracted.activityType.toLowerCase();
    if (nameLower.includes(typeLower)) {
      score += 15;
      reasons.push(
        `${extracted.activityType} program available`
      );
    }
  }

  // ── Tag overlap with activityType words: up to 20 points ──
  if (
    extracted.activityType &&
    provider.tags &&
    provider.tags.length > 0
  ) {
    const typeWords = extracted.activityType
      .toLowerCase()
      .split(/\s+/);
    const matchedTags = provider.tags.filter((tag) =>
      typeWords.some(
        (w) =>
          tag.toLowerCase().includes(w) ||
          w.includes(tag.toLowerCase())
      )
    );
    if (matchedTags.length > 0) {
      score += Math.min(20, matchedTags.length * 10);
      reasons.push(`Tags: ${matchedTags.join(", ")}`);
    }
  }

  // ── Age range match: up to 20 points ──
  const ageMin = extracted.ageMin ?? childContext?.age ?? null;
  const ageMax = extracted.ageMax ?? childContext?.age ?? null;
  if (ageMin !== null) {
    const pMin = provider.ageMin;
    const pMax = provider.ageMax;
    const iMin = ageMin;
    const iMax = ageMax ?? ageMin;

    const overlapStart = Math.max(pMin, iMin);
    const overlapEnd = Math.min(pMax, iMax);
    if (overlapStart <= overlapEnd) {
      score += 20;
      if (childContext?.age) {
        reasons.push(
          `Ages ${provider.ageMin}–${provider.ageMax} includes your ${childContext.age}-year-old`
        );
      } else if (ageMin === ageMax) {
        reasons.push(
          `Ages ${provider.ageMin}–${provider.ageMax} includes age ${ageMin}`
        );
      } else {
        reasons.push(
          `Ages ${provider.ageMin}–${provider.ageMax} matches your age range`
        );
      }
    }
  }

  // ── Location match: up to 15 points ──
  if (effectiveLocation) {
    const locLower = effectiveLocation.toLowerCase().trim();
    const provLocLower = provider.location.toLowerCase().trim();
    if (
      provLocLower.includes(locLower) ||
      locLower.includes(provLocLower)
    ) {
      score += 15;
      reasons.push(`Located in ${provider.location}`);
    } else {
      const locWords = locLower.split(/\s+/);
      const matched = locWords.filter((w) =>
        provLocLower.includes(w)
      );
      if (matched.length > 0) {
        score += 8;
        reasons.push(`Located in ${provider.location}`);
      }
    }
  }

  // ── Price: up to 10 bonus points if within budget ──
  if (extracted.maxPrice !== null) {
    const maxPriceCents = extracted.maxPrice * 100;
    if (provider.isFree || provider.priceValue === 0) {
      score += 10;
      reasons.push("Free activity");
    } else if (provider.priceValue <= maxPriceCents) {
      score += 10;
      reasons.push(
        `R${Math.round(provider.priceValue / 100)} — within budget`
      );
    }
  }

  return { score: Math.min(100, score), reasons };
}

// ── POST Handler ──

export async function POST(request: Request) {
  // Validate body
  let body: { message: string; parentId?: string; childId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }

  // Step 1: Extract structured query via AI
  const extracted = await extractQuery(message);

  // Step 2: Load child profile context if available
  let childContext: ChatChildContext | null = null;
  if (body.childId) {
    const profile = await getChildProfile(body.childId);
    if (profile) {
      childContext = {
        age: profile.age,
        interests: profile.interests,
        suburb: profile.suburb,
      };
    }
  } else if (body.parentId) {
    const children = await getChildrenByParent(body.parentId);
    if (children.length > 0) {
      // Use first child as context (parent can switch in UI)
      childContext = {
        age: children[0].age,
        interests: children[0].interests,
        suburb: children[0].suburb,
      };
    }
  }

  // Merge child age into extracted query for filtering
  const queryAgeMin =
    extracted?.ageMin ?? childContext?.age ?? undefined;
  const queryAgeMax =
    extracted?.ageMax ?? childContext?.age ?? undefined;

  // Step 3: Fetch providers
  let providerResults: ScorableProvider[];

  if (extracted) {
    // Targeted fetch using extracted filters
    providerResults = (await getProviders({
      category: extracted.category ?? undefined,
      ageMin: queryAgeMin,
      ageMax: queryAgeMax,
      location:
        extracted.location ?? childContext?.suburb ?? undefined,
      maxPrice:
        extracted.maxPrice !== null
          ? extracted.maxPrice * 100
          : undefined,
    })) as unknown as ScorableProvider[];

    // If no results with filters, broaden: try just category
    if (
      providerResults.length === 0 &&
      extracted.category
    ) {
      providerResults = (await getProviders({
        category: extracted.category,
      })) as unknown as ScorableProvider[];
    }

    // If still nothing, fall back to full text search on the original message
    if (providerResults.length === 0) {
      providerResults =
        (await searchProviders(
          extracted.activityType || message
        )) as unknown as ScorableProvider[];
    }

    // Last resort: get all providers
    if (providerResults.length === 0) {
      providerResults =
        (await getProviders()) as unknown as ScorableProvider[];
    }
  } else {
    // AI extraction failed — fall back to keyword search
    providerResults =
      (await searchProviders(message)) as unknown as ScorableProvider[];

    // If still nothing, get all
    if (providerResults.length === 0) {
      providerResults =
        (await getProviders()) as unknown as ScorableProvider[];
    }
  }

  // Build a fallback extracted query so scoring always runs
  const effectiveExtracted: ChatExtractedQuery = extracted ?? {
    category: null,
    activityType: null,
    ageMin: childContext?.age ?? null,
    ageMax: childContext?.age ?? null,
    days: [],
    timeSlot: null,
    location: childContext?.suburb ?? null,
    maxPrice: null,
  };

  // Step 4: Score all providers
  const scored = providerResults
    .map((provider) => {
      const { score, reasons } = scoreProviderMatch(
        provider,
        effectiveExtracted,
        childContext
      );
      return { provider, score, reasons };
    })
    .sort((a, b) => b.score - a.score);

  // Step 5: Filter to top matches (min score 20)
  const MIN_SCORE = 20;
  const goodMatches = scored
    .filter((s) => s.score >= MIN_SCORE)
    .slice(0, 5);

  // Step 6: Generate alternatives if no good matches
  let alternatives: string[] | null = null;
  if (goodMatches.length === 0) {
    try {
      const cats = await getCategories();
      const searchedCat = extracted?.category;
      const altCatIds = new Set([
        "sports",
        "arts-culture",
        "education",
        "music-lessons",
        "emotional-intelligence",
        "holiday-programs",
      ]);
      alternatives = cats
        .filter(
          (c) =>
            c.id !== searchedCat &&
            altCatIds.has(c.id)
        )
        .slice(0, 4)
        .map((c) => c.name);
    } catch {
      // If categories unavailable, provide static fallback
      alternatives = [
        "Sports programs",
        "Arts & Culture classes",
        "Music Lessons",
        "Holiday Programs",
      ];
    }
  }

  // Step 7: Shape the final response
  return NextResponse.json({
    matches: goodMatches.map((s) => ({
      provider: s.provider,
      score: s.score,
      reasons:
        s.reasons.length > 0
          ? s.reasons
          : ["General match"],
    })),
    alternatives,
    extractedQuery: extracted,
  });
}
