import { CT_SUBURBS } from "@/lib/suburbs";

export interface MatchIntent {
  ageMin?: number;
  ageMax?: number;
  tags: string[];
  location?: string;
  priceMax?: number; // in cents
}

export const MATCH_TAGS = [
  "outdoor",
  "indoor",
  "creative",
  "sport",
  "music",
  "academic",
  "high-energy",
  "calm",
  "group",
  "individual",
  "weekend",
  "after-school",
  "holiday-program",
  "free",
  "beginner",
  "advanced",
] as const;

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";
const TIMEOUT_MS = 3000;

export async function extractIntent(
  query: string
): Promise<MatchIntent | null> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn("[match] DEEPSEEK_API_KEY not set — skipping AI intent extraction");
    return null;
  }

  const systemPrompt = `You extract structured search parameters from parent queries about children's activities.
Return ONLY valid JSON, no other text. No markdown, no explanation.

Available tags (you may ONLY use these exact strings):
${MATCH_TAGS.join(", ")}

Cape Town suburbs (if the parent mentions a location, pick the closest suburb):
${CT_SUBURBS.join(", ")}

Output format:
{
  "ageMin": number | null,
  "ageMax": number | null,
  "tags": string[],
  "location": string | null,
  "priceMax": number | null
}

Rules:
- If the parent says "my 7 year old" or "age 7", set ageMin and ageMax to 7.
- If they say "ages 5-10", set ageMin=5 and ageMax=10.
- If they say "under 12", set ageMax=12.
- Extract tags ONLY from the available list above. Infer them from context (e.g., "football" → "sport", "drawing" → "creative", "outdoors" → "outdoor").
- If they mention a Cape Town suburb by name, put it in location.
- If they say "affordable", "cheap", "under R200", set priceMax accordingly (in rand, we'll convert to cents later).
- If they say "free", add "free" to tags.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(
        `[match] DeepSeek API returned ${response.status}: ${response.statusText}`
      );
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    // Parse JSON — strip any markdown fences if present
    const cleaned = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const intent = JSON.parse(cleaned) as MatchIntent;

    // Normalize
    return {
      ageMin: intent.ageMin ?? undefined,
      ageMax: intent.ageMax ?? undefined,
      tags: Array.isArray(intent.tags)
        ? intent.tags.filter((t) =>
            (MATCH_TAGS as readonly string[]).includes(t)
          )
        : [],
      location: intent.location ?? undefined,
      priceMax: intent.priceMax != null ? intent.priceMax * 100 : undefined,
    };
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.warn("[match] DeepSeek API timed out after 3s");
    } else {
      console.warn("[match] Failed to extract intent:", err);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
