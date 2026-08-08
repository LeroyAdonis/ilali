/**
 * WS-7: Poster extraction — reads a Fun with Kids poster image and returns
 * structured provider fields via the NVIDIA NIM vision model (free).
 *
 * Same pattern as extract-provider.ts but multimodal (image + prompt).
 */
import { chat } from "./client";
import { extractPosterWithGemini } from "./gemini-vision";
import { CT_SUBURBS } from "@/lib/suburbs";

export interface PosterExtract {
  name?: string;
  category?: string;
  description?: string;
  location?: string;
  ageMin?: number;
  ageMax?: number;
  priceValue?: number;
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
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

// Vision models are slower than chat; bake-off showed 90b-vision ~5-15s.
const TIMEOUT_MS = 20000;

const VISION_MODEL = "meta/llama-3.2-90b-vision-instruct";

export async function extractPoster(
  imageUrl: string
): Promise<PosterExtract | null> {
  const systemPrompt = `You are an OCR + data extraction engine for posters advertising children's activities in Cape Town.
Read the poster image carefully and extract structured details.
Return ONLY valid JSON, no other text. No markdown, no explanation.

Available categories (pick the closest match):
${ACTIVITY_CATEGORIES.join(", ")}

Available tags (pick up to 5 from this list):
${MATCH_TAGS.join(", ")}

Cape Town suburbs:
${CT_SUBURBS.join(", ")}

Output format:
{
  "name": "string | null (business or activity name)",
  "category": "string | null (one of the available categories)",
  "description": "string | null (a polished 1-2 sentence description)",
  "location": "string | null (Cape Town suburb from the list)",
  "ageMin": "number | null",
  "ageMax": "number | null",
  "priceValue": "number | null (in Rands, whole number)",
  "phone": "string | null (the contact/WhatsApp number as +27XXXXXXXXX if visible)",
  "website": "string | null (website URL if visible)",
  "instagram": "string | null (Instagram handle if visible)",
  "facebook": "string | null (Facebook page/handle if visible)",
  "tags": ["string"] (up to 5 from the available list)
}

Rules:
- If the poster mentions a specific activity name, use it as "name"
- Match the category to the closest from the available list
- Write a warm, family-friendly description based on what the poster advertises
- Extract age range from phrases like "ages 5-10", "for 8 year olds", "teens"
- Extract price if mentioned (in Rands, whole number)
- Normalise phone numbers to international +27 format (e.g. 082 123 4567 → +27821234567)
- Infer tags from context (e.g., "football" → sport, outdoor; "drawing" → creative, indoor)
- If a field is not visible on the poster, return null — never invent it`;

  const userMessage =
    "Extract the provider details from this activity poster as JSON.";

  // Try NVIDIA NIM first (free, no key needed). If it fails or times out
  // (shared free tier overload — observed 2026-08-08), fall back to Gemini
  // vision (per-key free tier, far more reliable) so the pipeline still works.
  let content = await chat({
    systemPrompt,
    userMessage,
    imageUrl,
    model: VISION_MODEL,
    temperature: 0.1,
    maxTokens: 800,
    timeoutMs: TIMEOUT_MS,
    responseFormat: "json",
  });

  if (!content) {
    const geminiResult = await extractPosterWithGemini(imageUrl, systemPrompt, userMessage);
    if (geminiResult) {
      console.log("[extract-poster] NIM unavailable — Gemini vision succeeded");
      return normaliseExtract(geminiResult);
    }
  }

  if (!content) return null;

  try {
    const cleaned = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    return normaliseExtract(JSON.parse(cleaned) as PosterExtract);
  } catch {
    console.warn("[extract-poster] Failed to parse AI response");
    return null;
  }
}

/** Shared post-processing for any extraction source (NIM or Gemini). */
export function normaliseExtract(result: PosterExtract): PosterExtract {
  const phone = typeof result.phone === "string" ? cleanPhone(result.phone) : undefined;

  return {
    name: result.name ?? undefined,
    category: result.category ?? undefined,
    description: result.description ?? undefined,
    location: result.location ?? undefined,
    ageMin: result.ageMin ?? undefined,
    ageMax: result.ageMax ?? undefined,
    priceValue: result.priceValue ?? undefined,
    phone,
    website: typeof result.website === "string" ? result.website : undefined,
    instagram: typeof result.instagram === "string" ? result.instagram : undefined,
    facebook: typeof result.facebook === "string" ? result.facebook : undefined,
    tags: Array.isArray(result.tags)
      ? result.tags.filter((t) => (MATCH_TAGS as readonly string[]).includes(t)).slice(0, 5)
      : undefined,
  };
}

/** Normalise SA phone numbers to international +27 format. */
export function cleanPhone(input: string): string {
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  if (digits.startsWith("0")) return "+27" + digits.slice(1);
  return "+27" + digits;
}
