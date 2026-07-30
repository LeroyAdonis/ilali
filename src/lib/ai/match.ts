import { chat } from "./client";
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

const TIMEOUT_MS = 3000;

export async function extractIntent(
  query: string
): Promise<MatchIntent | null> {
  const systemPrompt = `You extract structured search parameters from parent queries about children's activities.
Return ONLY valid JSON, no other text. No markdown, no explanation.

Available tags (you may ONLY use these exact strings):
${(MATCH_TAGS as readonly string[]).join(", ")}

Cape Town suburbs:
${CT_SUBURBS.join(", ")}

Output format:
{
  "ageMin": "number | null",
  "ageMax": "number | null",
  "tags": ["string"] (up to 5, from the available list only),
  "location": "string | null (Cape Town suburb from the list)",
  "priceMax": "number | null (in Rands, whole number)"
}

Rules:
- Extract age from phrases like "for my 7 year old", "my teenager", "under 10"
- Choose tags ONLY from the available list above
- Match location to the closest suburb from the list
- Extract price from phrases like "under R200", "free", "affordable"
- If you're unsure about any field, set it to null`;

  const content = await chat({
    systemPrompt,
    userMessage: query,
    temperature: 0.1,
    maxTokens: 300,
    timeoutMs: TIMEOUT_MS,
  });

  if (!content) return null;

  try {
    const cleaned = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const result = JSON.parse(cleaned) as MatchIntent;

    return {
      ageMin: result.ageMin ?? undefined,
      ageMax: result.ageMax ?? undefined,
      tags: Array.isArray(result.tags)
        ? result.tags.filter((t) => (MATCH_TAGS as readonly string[]).includes(t)).slice(0, 5)
        : [],
      location: result.location ?? undefined,
      priceMax: result.priceMax ?? undefined,
    };
  } catch {
    console.warn("[match] Failed to parse AI response");
    return null;
  }
}
