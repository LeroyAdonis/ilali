import { NextResponse } from "next/server";
import { chat } from "@/lib/ai/client";
import { getProviders, getCategories } from "@/lib/data-source";
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
  name: string | null;
  age: number;
  interests: string[] | null;
  suburb: string | null;
}

interface ScorableProvider {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  ageMin: number;
  ageMax: number;
  tags: string[] | null;
  location: string;
  priceValue: number;
  isFree: boolean | null;
  featured?: boolean | null;
}

interface ConciergeReply {
  message: string;
  followUp: string | null;
}

interface ConciergeResult {
  extracted: ChatExtractedQuery | null;
  chosenIndexes: number[];
  message: string;
  followUp: string | null;
  alternatives: string[] | null;
}

// ── Available Categories ──

const CATEGORY_IDS = [
  "sports",
  "arts-culture",
  "education",
  "music-lessons",
  "emotional-intelligence",
  "holiday-programs",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  sports: "Sports",
  "arts-culture": "Arts & Culture",
  education: "Education",
  "music-lessons": "Music Lessons",
  "emotional-intelligence": "Emotional Intelligence",
  "holiday-programs": "Holiday Programs",
};

// Default concierge model: NVIDIA bake-off winner (Jul 2026) —
// nemotron-nano-12b-v2-vl: 4.8s avg latency, 100% parse/extract/chosen/reply.
// Override anytime with CONCIERGE_MODEL env var (e.g. "openai/gpt-oss-120b").
const CONCIERGE_MODEL =
  process.env.CONCIERGE_MODEL ?? "nvidia/nemotron-nano-12b-v2-vl";

const CATALOG_LIMIT = 60;

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

// ── Extraction sanitizer (shared with concierge result) ──

function sanitizeExtracted(raw: unknown): ChatExtractedQuery | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    category:
      typeof r.category === "string" &&
      (CATEGORY_IDS as readonly string[]).includes(r.category)
        ? r.category
        : null,
    activityType:
      typeof r.activityType === "string" ? r.activityType : null,
    ageMin: typeof r.ageMin === "number" ? r.ageMin : null,
    ageMax: typeof r.ageMax === "number" ? r.ageMax : null,
    days: Array.isArray(r.days)
      ? r.days.filter((d: unknown) => typeof d === "string")
      : [],
    timeSlot: typeof r.timeSlot === "string" ? r.timeSlot : null,
    location: typeof r.location === "string" ? r.location : null,
    maxPrice: typeof r.maxPrice === "number" ? r.maxPrice : null,
  };
}

// ── Alternative direction normalisation ──

function normalizeAlternatives(
  raw: string[] | null,
  categoryNames: string[],
  searchedCat: string | null
): string[] {
  if (!raw || raw.length === 0) return [];
  const out: string[] = [];
  for (const alt of raw) {
    const a = alt.toLowerCase().trim();
    const match = categoryNames.find((name) => {
      const n = name.toLowerCase();
      return n.includes(a) || a.includes(n);
    });
    if (
      match &&
      !out.includes(match) &&
      match.toLowerCase() !== searchedCat?.toLowerCase()
    ) {
      out.push(match);
    }
    if (out.length >= 4) break;
  }
  return out;
}

// ── Step 1: Concierge — single LLM call: extract + pick + reply ──

async function conciergeQuery(input: {
  message: string;
  child: ChatChildContext | null;
  providers: ScorableProvider[];
}): Promise<ConciergeResult | null> {
  const childLine = input.child
    ? `Child context: ${input.child.name ? input.child.name + ", " : ""}${input.child.age} years old${input.child.suburb ? `, lives in ${input.child.suburb}` : ""}${input.child.interests?.length ? `, interested in ${input.child.interests.join(", ")}` : ""}. Use these as defaults when the message is vague.`
    : "No child profile attached.";

  // Compact numbered catalog for reliable id-referencing
  const catalog = input.providers
    .slice(0, CATALOG_LIMIT)
    .map((p, i) => ({
      i,
      name: p.name,
      category: CATEGORY_LABELS[p.category] ?? p.category,
      location: p.location,
      ages: `${p.ageMin}–${p.ageMax}`,
      price:
        p.isFree || p.priceValue === 0
          ? "Free"
          : `R${Math.round(p.priceValue / 100)}`,
      tags: (p.tags ?? []).slice(0, 4).join(", "),
      blurb: (p.description ?? "").slice(0, 90),
    }));

  const catalogLines = catalog
    .map(
      (c) =>
        `${c.i}. ${c.name} | ${c.category} | ${c.location} | ages ${c.ages} | ${c.price}${c.tags ? ` | ${c.tags}` : ""}${c.blurb ? ` | ${c.blurb}` : ""}`
    )
    .join("\n");

  const systemPrompt = `You are the ILALI Concierge — a warm, practical helper for parents finding children's extramural activities in Cape Town, South Africa.

The parent asked: "${input.message}"
${childLine}

Here is the full catalog of activities available right now (numbered):
${catalogLines}

Respond with ONLY valid JSON (no markdown, no commentary):
{
  "extracted": {
    "category": string|null,
    "activityType": string|null,
    "ageMin": number|null,
    "ageMax": number|null,
    "days": string[],
    "timeSlot": string|null,
    "location": string|null,
    "maxPrice": number|null
  },
  "chosen": number[],
  "message": string,
  "followUp": string|null,
  "alternatives": string[]|null
}

Rules:
- extracted: map the parent's request to fields. Categories: "sports", "arts-culture", "education", "music-lessons", "emotional-intelligence", "holiday-programs" ("soccer"→"sports", "piano"→"music-lessons", "tutoring"/"coding"→"education", "painting"/"drama"→"arts-culture", "mindfulness"/"confidence"→"emotional-intelligence", "holiday camp"→"holiday-programs"). activityType is the specific activity in lowercase ("soccer", "swimming", "piano"). Ages: "my 7 year old" → 7/7; "ages 5-10" → 5/10; "my teenager" → 13/17; "toddler" → 2/4. days: full weekday names ("Monday"...). timeSlot: 24h ("15:00" for 3pm, "after school" → "14:00"). location: Cape Town suburb (Sea Point, Claremont, Rondebosch, Durbanville, Muizenberg, etc). maxPrice in Rands ("under R200" → 200, "free" → 0). When the child context gives age/suburb and the message doesn't, use those. Null when unsure — never invent.
- chosen: the 1-3 catalog NUMBERS that best fit the parent's needs (age range, activity, location, price). Prefer exact activity matches. STRICT AGE RULE: never pick a provider whose age range does not include the child's age — if the parent said an age (or the child context has one), every pick MUST cover that age. When no catalog entry covers the child's age for their activity, set chosen to [] and offer alternatives instead. Empty [] ONLY when nothing in the catalog is a reasonable fit.
- message: warm, plain South African English, 2-4 sentences, max 90 words. No emojis, no bullet lists, no headers. GOOD matches → name 1-3 providers with ONE specific reason each (age, location, price, or the activity itself); use the child's name naturally if known. NO matches → be honest and gentle ("there isn't much {activity} for {age}-year-olds in {area} yet"), suggest 1-2 alternative directions with a reason each, and set followUp. 
- VAGUE request (the parent did NOT name a specific activity, age, or area): DO NOT recommend any provider and set chosen to []. Instead reply with a friendly one-liner asking for the child's age, what they enjoy, and their area, and set followUp to that question. Never guess an activity for a vague request.
- When mentioning a price, copy it EXACTLY as printed in the catalog (e.g. "R2500 per session") — never round, convert, or interpret it. Never invent a price, day-of-week, age, or location not shown. Do NOT mention schedules, times, or session details unless they are shown in the catalog.
- alternatives: when chosen is empty, suggest 2-4 category directions that exist in the catalog (e.g. "Sports programs", "Music Lessons", "Holiday Programs"). Otherwise null.
- followUp: one short question (max 12 words) to continue the conversation, or null when results are clear.
- Never invent providers, prices, locations, or ages not in the catalog. Only reference catalog numbers in chosen.`;

  const content = await chat({
    systemPrompt,
    userMessage: input.message,
    model: CONCIERGE_MODEL,
    temperature: 0.3,
    maxTokens: 1200,
    timeoutMs: 20000,
    responseFormat: "json",
  });

  if (!content) return null;

  try {
    const cleaned = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const result = JSON.parse(cleaned) as Record<string, unknown>;

    const chosenRaw = Array.isArray(result.chosen)
      ? result.chosen
      : [];
    const chosenIndexes = chosenRaw.filter(
      (n): n is number =>
        typeof n === "number" &&
        Number.isInteger(n) &&
        n >= 0 &&
        n < catalog.length
    );

    return {
      extracted: sanitizeExtracted(result.extracted),
      chosenIndexes: Array.from(new Set(chosenIndexes)).slice(0, 5),
      message: typeof result.message === "string" ? result.message : "",
      followUp:
        typeof result.followUp === "string" ? result.followUp : null,
      alternatives: Array.isArray(result.alternatives)
        ? result.alternatives
            .filter((a): a is string => typeof a === "string")
            .slice(0, 4)
        : null,
    };
  } catch {
    console.warn("[chat-match] Failed to parse concierge response");
    return null;
  }
}

// ── Step 2: Deterministic scoring (validation + fill) ──

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

// ── Vague-request detection (server-side safety net) ──

const CPT_SUBURBS = [
  "sea point", "green point", "claremont", "rondebosch", "newlands",
  "observatory", "woodstock", "wynberg", "constantia", "hout bay",
  "durbanville", "bellville", "century city", "table view", "milnerton",
  "blouberg", "muizenberg", "fish hoek", "somerset west", "stellenbosch",
  "paarl", "cape town", "cpt", "northern suburbs", "southern suburbs",
];

const ACTIVITY_WORDS = [
  "soccer", "football", "rugby", "cricket", "swim", "tennis", "golf",
  "gymnastic", "dance", "ballet", "martial", "karate", "piano", "guitar",
  "violin", "singing", "choir", "music", "art", "painting", "drawing",
  "drama", "theatre", "tutor", "maths", "math", "english", "coding",
  "programming", "reading", "homework", "class", "lesson", "coach",
  "training", "camp", "holiday", "mindful", "confidence", "emotional",
  "yoga", "chess", "cooking", "craft", "robot", "stem", "circus",
];

function isVagueMessage(message: string): boolean {
  const lower = message.toLowerCase();
  const hasAge =
    /\b\d+\b/.test(message) ||
    /toddler|preschool|teenager|infant|baby|year old|years old/i.test(lower);
  const hasArea = CPT_SUBURBS.some((s) => lower.includes(s));
  const hasActivity = ACTIVITY_WORDS.some((a) => lower.includes(a));
  return !hasAge && !hasArea && !hasActivity;
}

// ── Server-side age extraction (used to pre-filter the model's catalog) ──

function extractAgeFromMessage(message: string): { min: number; max: number } | null {
  const lower = message.toLowerCase();

  // "ages 5-10", "ages 5 to 10", "5-10 years"
  const rangeMatch = lower.match(/(?:ages?|aged|from)\s+(\d{1,2})\s*(?:-|to|–)\s*(\d{1,2})/);
  if (rangeMatch) {
    const a = parseInt(rangeMatch[1], 10);
    const b = parseInt(rangeMatch[2], 10);
    return { min: Math.min(a, b), max: Math.max(a, b) };
  }

  // "my 7 year old", "7-year-old", "a 13 year old"
  const singleMatch = lower.match(/(\d{1,2})\s*-?\s*year[s]?\s*-?\s*old/);
  if (singleMatch) {
    const a = parseInt(singleMatch[1], 10);
    return { min: a, max: a };
  }

  // Age-group words
  const words: [RegExp, number, number][] = [
    [/toddler/, 2, 4],
    [/preschool|pre-school|nursery/, 3, 5],
    [/kindergart/, 4, 6],
    [/teenager|teens\b/, 13, 17],
    [/infant|baby/, 0, 2],
    [/primary school/, 6, 12],
    [/high school/, 13, 18],
  ];
  for (const [re, min, max] of words) {
    if (re.test(lower)) return { min, max };
  }

  return null;
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

  // Step 1: Load child profile context if available
  let childContext: ChatChildContext | null = null;
  if (body.childId) {
    const profile = await getChildProfile(body.childId);
    if (profile) {
      childContext = {
        name: profile.name,
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
        name: children[0].name,
        age: children[0].age,
        interests: children[0].interests,
        suburb: children[0].suburb,
      };
    }
  }

  // Step 2: Load the provider catalog (featured first)
  const allProviders = (await getProviders()) as unknown as ScorableProvider[];
  allProviders.sort((a, b) => {
    if (!!a.featured !== !!b.featured) return a.featured ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  // Step 2b: Age-aware catalog — when we know the child's age (from the
  // message text or the child profile), exclude providers whose age range
  // misses it BEFORE the model sees the catalog. This prevents the model
  // picking or mentioning age-inappropriate providers (e.g. a 12–15
  // programme for a 7-year-old). Server-side age filter in Step 5 remains
  // as a backup.
  const messageAge = extractAgeFromMessage(message);
  const preAgeMin = messageAge?.min ?? childContext?.age ?? null;
  const preAgeMax = messageAge?.max ?? preAgeMin;
  const catalogProviders =
    preAgeMin == null
      ? allProviders
      : allProviders.filter(
          (p) => p.ageMin <= (preAgeMax ?? preAgeMin) && p.ageMax >= preAgeMin
        );

  // Step 3: One concierge call — extract intent, pick matches, write the reply
  const concierge = await conciergeQuery({
    message,
    child: childContext,
    providers: catalogProviders,
  });

  // Fallback extracted query so scoring always runs
  const extracted = concierge?.extracted ?? null;
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

  // Step 3b: Vague-request safety net. Detection uses the raw message
  // (server-side), so even if the model wrongly recommends something for a
  // vague query we force clarification: no provider picks + a follow-up.
  const vague =
    isVagueMessage(message) ||
    (!extracted?.category &&
      !extracted?.activityType &&
      extracted?.ageMin == null &&
      extracted?.ageMax == null &&
      !extracted?.location);

  if (vague && concierge) {
    concierge.chosenIndexes = [];
    if (!concierge.followUp) {
      concierge.followUp =
        "What age is your child, what do they enjoy, and which area are you in?";
    }
  }

  // Step 4: Score every provider deterministically (validation layer)
  const scored = allProviders
    .map((provider) => {
      const { score, reasons } = scoreProviderMatch(
        provider,
        effectiveExtracted,
        childContext
      );
      return { provider, score, reasons };
    })
    .sort((a, b) => b.score - a.score);

  // Step 5: Select matches — concierge's picks first, then best scorers.
  // Server-side age filter: a pick whose age range excludes the known child
  // age is dropped (the model sometimes ignores the STRICT AGE RULE).
  const CLOSE_SCORE = 10;
  const knownAgeMin =
    extracted?.ageMin ?? messageAge?.min ?? childContext?.age ?? null;
  const knownAgeMax =
    extracted?.ageMax ?? messageAge?.max ?? knownAgeMin;
  const ageOverlap = (p: ScorableProvider) =>
    knownAgeMin == null ||
    (p.ageMin <= (knownAgeMax ?? knownAgeMin) && p.ageMax >= knownAgeMin);
  let matches: { provider: ScorableProvider; score: number; reasons: string[] }[];

  if (concierge && concierge.chosenIndexes.length > 0) {
    const chosen = concierge.chosenIndexes
      .map((idx) => {
        const p = allProviders[idx];
        if (!p) return null;
        if (!ageOverlap(p)) return null; // age mismatch → drop the pick
        const existing = scored.find((s) => s.provider.id === p.id);
        if (existing) return existing;
        return {
          provider: p,
          ...scoreProviderMatch(p, effectiveExtracted, childContext),
        };
      })
      .filter((s): s is { provider: ScorableProvider; score: number; reasons: string[] } => s !== null);

    // Fill up to 5 with the highest-scoring others (age-filtered too)
    const chosenIds = new Set(chosen.map((c) => c.provider.id));
    const fillers = scored
      .filter(
        (s) =>
          !chosenIds.has(s.provider.id) &&
          ageOverlap(s.provider) &&
          s.score >= CLOSE_SCORE
      )
      .slice(0, 5 - chosen.length);
    matches = [...chosen, ...fillers].slice(0, 5);
  } else {
    matches = scored
      .filter((s) => ageOverlap(s.provider) && s.score >= CLOSE_SCORE)
      .slice(0, 5);
  }

  // Step 6: Alternatives — concierge's directions (normalised to real
  // category names so pills link correctly), else deterministic fallback
  let alternatives: string[] | null = null;

  const categoryNames = (await getCategories().catch(() => [] as { name: string; id: string }[])).map((c) => c.name);
  const modelAlts = normalizeAlternatives(
    concierge?.alternatives ?? null,
    categoryNames,
    extracted?.category ?? null
  );

  if (modelAlts.length > 0) {
    alternatives = modelAlts;
    // Pad to 4 with other categories
    const altCatIds = new Set<string>(CATEGORY_IDS);
    const fallbackCats = (await getCategories().catch(() => [] as { name: string; id: string }[]))
      .filter((c) => c.id !== extracted?.category && altCatIds.has(c.id))
      .map((c) => c.name);
    for (const f of fallbackCats) {
      if (!alternatives.includes(f) && alternatives.length < 4) {
        alternatives.push(f);
      }
    }
  } else if (matches.length === 0) {
    // No picks, no model directions — fall back to deterministic categories
    try {
      const cats = await getCategories();
      const searchedCat = extracted?.category;
      const altCatIds = new Set<string>(CATEGORY_IDS);
      const fallback = cats
        .filter((c) => c.id !== searchedCat && altCatIds.has(c.id))
        .slice(0, 4)
        .map((c) => c.name);
      if (fallback.length > 0) alternatives = fallback;
    } catch {
      // keep null
    }
    if (!alternatives) {
      alternatives = [
        "Sports programs",
        "Arts & Culture classes",
        "Music Lessons",
        "Holiday Programs",
      ];
    }
  }

  // Step 7: Shape the final response
  const reply: ConciergeReply | null = concierge
    ? { message: concierge.message, followUp: concierge.followUp }
    : null;

  return NextResponse.json({
    matches: matches.map((s) => ({
      provider: s.provider,
      score: s.score,
      reasons:
        s.reasons.length > 0 ? s.reasons : ["General match"],
    })),
    alternatives,
    extractedQuery: extracted,
    reply,
  });
}
