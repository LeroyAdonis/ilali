// ILALI Concierge Model Bake-Off — speed, accuracy, reasoning
// Tests each NVIDIA model with the real concierge prompt shape.
import dotenv from "dotenv";
dotenv.config({ path: new URL("../../.env.local", import.meta.url).pathname });

const BASE = "https://integrate.api.nvidia.com/v1/chat/completions";
const KEY = process.env.NVIDIA_API_KEY;
const TIMEOUT_MS = 90_000;
const DELAY_MS = 1500;

// ── Fixed catalog (deterministic across models) ──
const CATALOG = [
  { name: "Little Kickers Cape Town", category: "Sports", location: "Claremont", ages: "3–6", price: "R180", tags: "soccer, beginner, saturday", blurb: "Soccer coaching for little ones" },
  { name: "Claremont Tennis Club Juniors", category: "Sports", location: "Claremont", ages: "6–14", price: "R220", tags: "tennis, coaching, weekend", blurb: "Junior tennis coaching sessions" },
  { name: "SwimLab Sea Point", category: "Sports", location: "Sea Point", ages: "5–12", price: "R160", tags: "swimming, lessons, weekday", blurb: "Learn-to-swim classes" },
  { name: "QA Academy Holiday Camp", category: "Holiday Programs", location: "Muizenberg", ages: "8–14", price: "R2500", tags: "outdoor, sport, high-energy", blurb: "School holiday camp with sports and outdoor adventures" },
  { name: "QA Academy Term Programme", category: "Arts & Culture", location: "Muizenberg", ages: "6–12", price: "R1500", tags: "creative, indoor, group", blurb: "Term-time arts and crafts programme" },
  { name: "Cape Town Music School", category: "Music Lessons", location: "Rondebosch", ages: "4–16", price: "R250", tags: "piano, guitar, singing", blurb: "Individual and group music lessons" },
  { name: "Bright Minds Tutoring", category: "Education", location: "Durbanville", ages: "6–16", price: "R300", tags: "maths, english, coding", blurb: "After-school tutoring and homework help" },
  { name: "Mindful Kids Club", category: "Emotional Intelligence", location: "Observatory", ages: "5–12", price: "Free", tags: "mindfulness, confidence", blurb: "Mindfulness and confidence classes" },
];
const catalogLines = CATALOG.map((c, i) => `${i}. ${c.name} | ${c.category} | ${c.location} | ages ${c.ages} | ${c.price} | ${c.tags} | ${c.blurb}`).join("\n");

function buildPrompt(message, childLine = "Child context: 8 years old.") {
  return `You are the ILALI Concierge — a warm, practical helper for parents finding children's extramural activities in Cape Town, South Africa.

The parent asked: "${message}"
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
- chosen: the 1-3 catalog NUMBERS that best fit the parent's needs (age range, activity, location, price). Prefer exact activity matches. Empty [] ONLY when nothing in the catalog is a reasonable fit.
- message: warm, plain South African English, 2-4 sentences, max 90 words. No emojis, no bullet lists, no headers. GOOD matches → name 1-3 providers with ONE specific reason each (age, location, price, or the activity itself); use the child's name naturally if known. NO matches → be honest and gentle ("there isn't much {activity} for {age}-year-olds in {area} yet"), suggest 1-2 alternative directions with a reason each, and set followUp. VAGUE request (no activity, age, or area) → friendly one-liner asking for the child's age, what they enjoy, and their area; set followUp to that question.
- When mentioning a price, copy it EXACTLY as printed in the catalog (e.g. "R2500 per session") — never round, convert, or interpret it. Never invent a price, day-of-week, age, or location not shown.
- alternatives: when chosen is empty, suggest 2-4 category directions that exist in the catalog (e.g. "Sports programs", "Music Lessons", "Holiday Programs"). Otherwise null.
- followUp: one short question (max 12 words) to continue the conversation, or null when results are clear.
- Never invent providers, prices, locations, or ages not in the catalog. Only reference catalog numbers in chosen.`;
}

// ── Test battery ──
const QUERIES = [
  {
    id: "match",
    message: "tennis for my 9 year old in Claremont",
    child: "Child context: 9 years old, lives in Claremont.",
    expect: { category: "sports", activityType: "tennis", ageMin: 9, ageMax: 9, location: "Claremont" },
    expectChosenNonEmpty: true,
    expectFollowUp: false,
  },
  {
    id: "nomatch",
    message: "horse riding for my 3 year old in Bloubergstrand",
    child: "Child context: 3 years old, lives in Bloubergstrand.",
    expect: { category: "sports", activityType: "horse riding", ageMin: 3, ageMax: 3, location: "Bloubergstrand" },
    expectChosenNonEmpty: false,
    expectFollowUp: true,
  },
  {
    id: "vague",
    message: "something fun for my kid",
    child: "No child profile attached.",
    expect: { category: null, activityType: null, ageMin: null, ageMax: null, location: null },
    expectChosenNonEmpty: false,
    expectFollowUp: true,
  },
];

const CATEGORY_LABELS = { sports: "Sports", "arts-culture": "Arts & Culture", education: "Education", "music-lessons": "Music Lessons", "emotional-intelligence": "Emotional Intelligence", "holiday-programs": "Holiday Programs" };

function scoreQuery(modelId, q, parsed, ms) {
  const out = { ms, parsed: 0, extraction: 0, chosenValid: 0, chosenSensible: 0, reply: 0, mentionsProvider: 0, noHallucination: 1, followUpRight: 0, replyText: "" };
  if (!parsed) return out;

  out.parsed = 1;
  const ex = parsed.extracted ?? {};
  // Extraction accuracy (5 fields, 0.2 each)
  let exScore = 0;
  const fields = [
    ["category", q.expect.category, ex.category],
    ["activityType", q.expect.activityType, ex.activityType],
    ["ageMin", q.expect.ageMin, ex.ageMin],
    ["ageMax", q.expect.ageMax, ex.ageMax],
    ["location", q.expect.location, ex.location],
  ];
  for (const [name, exp, got] of fields) {
    if (name === "activityType" && exp) {
      // loose: got contains exp or vice versa (models vary "horse riding"/"horse-riding")
      if (got && (String(got).toLowerCase().includes(String(exp).toLowerCase()) || String(exp).toLowerCase().includes(String(got).toLowerCase()))) exScore += 0.2;
    } else if (exp === null) {
      if (got === null || got === undefined) exScore += 0.2;
    } else if (typeof exp === "number") {
      if (got === exp) exScore += 0.2;
    } else if (got === exp) {
      exScore += 0.2;
    }
  }
  out.extraction = exScore;

  const chosen = Array.isArray(parsed.chosen) ? parsed.chosen : [];
  out.chosenValid = chosen.length > 0 ? chosen.every((n) => Number.isInteger(n) && n >= 0 && n < CATALOG.length) : 1;

  // Sensible choice for the match query: chosen includes Claremont Tennis (index 1) or at least a Sports provider (0,1,2) with age fit
  if (q.id === "match") {
    const cats = chosen.map((n) => CATALOG[n]).filter(Boolean);
    out.chosenSensible = cats.some((c) => c.name.includes("Tennis")) ? 1 : 0;
  } else if (q.id === "nomatch" || q.id === "vague") {
    out.chosenSensible = chosen.length === 0 ? 1 : 0; // should NOT pick anything
  }

  const msg = typeof parsed.message === "string" ? parsed.message.trim() : "";
  out.replyText = msg.slice(0, 220);
  out.reply = msg.length >= 30 && msg.length <= 400 ? 1 : 0;

  // Mentions a real provider name from chosen (or catalog) without hallucinating
  const realNames = CATALOG.map((c) => c.name.toLowerCase().split(" ")[0]);
  const lowered = msg.toLowerCase();
  const catWords = CATALOG.map((c) => c.name.toLowerCase());
  if (chosen.length > 0) {
    out.mentionsProvider = chosen.some((n) => CATALOG[n] && lowered.includes(CATALOG[n].name.toLowerCase().split(" ")[0].toLowerCase()));
  } else {
    out.mentionsProvider = 1; // N/A — nothing chosen
  }
  // Hallucination check: any capitalized proper-noun-ish name not in catalog
  const nameTokens = msg.match(/[A-Z][a-zA-Z]{3,}(?:\s[A-Z][a-zA-Z]{3,}){0,2}/g) ?? [];
  for (const tok of nameTokens) {
    const t = tok.toLowerCase();
    if (!catWords.some((cw) => cw.includes(t) || t.includes(cw)) && !["ilali", "cape town", "south african", "claremont", "muizenberg", "sea point", "rondebosch", "durbanville", "observatory", "bloubergstrand"].includes(t)) {
      out.noHallucination = 0;
    }
  }

  // Follow-up correctness
  const fu = typeof parsed.followUp === "string" ? parsed.followUp.trim() : null;
  if (q.expectFollowUp) out.followUpRight = fu && fu.length > 5 ? 1 : 0;
  else out.followUpRight = fu === null || fu === "" ? 1 : 0;

  return out;
}

async function callModel(model, prompt, userMessage) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const res = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: prompt }, { role: "user", content: userMessage }],
        temperature: 0.3,
        max_tokens: 1200,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });
    const ms = Date.now() - t0;
    if (res.status === 429) return { error: `429 (rate limited) after ${ms}ms` };
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { error: `HTTP ${res.status}: ${body.slice(0, 160)} (${ms}ms)` };
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    return { ms, content };
  } catch (e) {
    return { error: `ERR ${e.message} (${Date.now() - t0}ms)` };
  } finally {
    clearTimeout(timer);
  }
}

function cleanAndParse(content) {
  const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // try to find the last balanced {...} block
    const start = cleaned.indexOf("{");
    if (start === -1) return null;
    let depth = 0, end = -1;
    for (let i = start; i < cleaned.length; i++) {
      if (cleaned[i] === "{") depth++;
      else if (cleaned[i] === "}") {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end === -1) return null;
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
  }
}

const MODELS = [
  // Completed in run 1: minimaxai/minimax-m3, nvidia/nemotron-3-ultra-550b-a55b,
  // moonshotai/kimi-k2.6 (404), deepseek-ai/deepseek-v4-flash, deepseek-ai/deepseek-v4-pro
  "google/gemma-4-31b-it",
  "nvidia/nemotron-3-nano-30b-a3b",
  "nvidia/nemotron-nano-12b-v2-vl",
  "nvidia/nvidia-nemotron-nano-9b-v2",
  "openai/gpt-oss-20b",
  "nvidia/llama-3.3-nemotron-super-49b-v1.5",
  "openai/gpt-oss-120b",
  "mistralai/mistral-nemotron",
  "nvidia/llama-3.1-nemotron-nano-vl-8b-v1",
];

const results = [];
for (const model of MODELS) {
  const rec = { model, queries: {}, errors: [] };
  console.log(`\n▶ ${model}`);
  for (const q of QUERIES) {
    const prompt = buildPrompt(q.message, q.child);
    const r = await callModel(model, prompt, q.message);
    if (r.error) {
      rec.errors.push(`${q.id}: ${r.error}`);
      rec.queries[q.id] = { error: r.error };
      console.log(`  ${q.id}: ✗ ${r.error}`);
      continue;
    }
    const parsed = cleanAndParse(r.content);
    const scored = scoreQuery(model, q, parsed, r.ms);
    scored.rawContent = r.content.slice(0, 80);
    rec.queries[q.id] = scored;
    console.log(`  ${q.id}: ${r.ms}ms parsed=${scored.parsed ? "✓" : "✗"} extract=${(scored.extraction * 100).toFixed(0)}% chosen=${scored.chosenSensible ? "✓" : "✗"} reply=${scored.reply ? "✓" : "✗"} fu=${scored.followUpRight ? "✓" : "✗"} hall=${scored.noHallucination ? "✓" : "✗"}`);
    if (scored.replyText) console.log(`     "${scored.replyText}"`);
    await new Promise((r2) => setTimeout(r2, DELAY_MS));
  }
  results.push(rec);
  await new Promise((r2) => setTimeout(r2, DELAY_MS));
}

// ── Summary ──
console.log("\n\n════════════════════════ SUMMARY ════════════════════════");
console.log("model | avgMs | parse% | extract% | chosen% | reply% | fu% | hall% | errors");
for (const rec of results) {
  const qs = Object.values(rec.queries).filter((x) => !x.error);
  if (qs.length === 0) {
    console.log(`${rec.model} | ALL FAILED | ${rec.errors.join("; ")}`);
    continue;
  }
  const avg = Math.round(qs.reduce((a, q) => a + q.ms, 0) / qs.length);
  const pct = (k) => Math.round((qs.reduce((a, q) => a + (q[k] || 0), 0) / qs.length) * 100);
  console.log(`${rec.model} | ${avg}ms | ${pct("parsed")}% | ${pct("extraction")}% | ${pct("chosenSensible")}% | ${pct("reply")}% | ${pct("followUpRight")}% | ${pct("noHallucination")}% | ${rec.errors.length}`);
}
