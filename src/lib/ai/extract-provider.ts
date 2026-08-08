import { chatWithFallback } from "./gemini-vision";
import { CT_SUBURBS } from "@/lib/suburbs";

export interface ProviderExtract {
  name?: string;
  category?: string;
  description?: string;
  location?: string;
  ageMin?: number;
  ageMax?: number;
  priceValue?: number;
  tags?: string[];
}

const ACTIVITY_CATEGORIES = [
  "Arts & Culture",
  "Sports",
  "Music Lessons",
  "Education & Tutoring",
  "Holiday Programs",
  "Dance & Movement",
  "Emotional Intelligence",
  "Other",
];

const MATCH_TAGS = [
  "outdoor", "indoor", "creative", "sport", "music", "academic",
  "high-energy", "calm", "group", "individual", "weekend",
  "after-school", "holiday-program", "free", "beginner", "advanced",
];

const TIMEOUT_MS = 4000;

export async function extractProviderDetails(
  description: string
): Promise<ProviderExtract | null> {
  const systemPrompt = `You extract structured provider details from free-text descriptions of children's activities.
Return ONLY valid JSON, no other text. No markdown, no explanation.

Available categories (pick the closest match):
${ACTIVITY_CATEGORIES.join(", ")}

Available tags (pick up to 5 from this list):
${MATCH_TAGS.join(", ")}

Cape Town suburbs:
${CT_SUBURBS.join(", ")}

Output format:
{
  "name": "string | null",
  "category": "string | null (one of the available categories)",
  "description": "string | null (a polished 1-2 sentence description)",
  "location": "string | null (Cape Town suburb from the list)",
  "ageMin": "number | null",
  "ageMax": "number | null",
  "priceValue": "number | null (in Rands, whole number)",
  "tags": ["string"] (up to 5 from the available list)
}

Rules:
- If the provider mentions a specific activity name, use it as "name"
- Match the category to the closest from the available list
- Write a warm, family-friendly description if none is given
- Extract age range from phrases like "ages 5-10", "for 8 year olds", "teens"
- Extract price if mentioned (in Rands)
- Infer tags from context (e.g., "football" → sport, outdoor; "drawing" → creative, indoor)`;

  const content = await chatWithFallback({
    systemPrompt,
    userMessage: description,
    temperature: 0.1,
    maxTokens: 400,
    timeoutMs: TIMEOUT_MS,
    json: true,
  });

  if (!content) return null;

  try {
    const cleaned = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    const result = JSON.parse(cleaned) as ProviderExtract;

    return {
      name: result.name ?? undefined,
      category: result.category ?? undefined,
      description: result.description ?? undefined,
      location: result.location ?? undefined,
      ageMin: result.ageMin ?? undefined,
      ageMax: result.ageMax ?? undefined,
      priceValue: result.priceValue ?? undefined,
      tags: Array.isArray(result.tags)
        ? result.tags.filter((t) => (MATCH_TAGS as readonly string[]).includes(t)).slice(0, 5)
        : undefined,
    };
  } catch {
    console.warn("[extract-provider] Failed to parse AI response");
    return null;
  }
}
