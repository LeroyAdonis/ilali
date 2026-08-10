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
  // George's extended fields (2026-08-10) — capture everything on the poster.
  venue?: string;
  address?: string;
  dateStart?: string;
  dateEnd?: string;
  timeStart?: string;
  timeEnd?: string;
  dayOfWeek?: string;
  contactName?: string;
  bookingInfo?: string;
  additionalInfo?: string;
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
  "tags": ["string"] (up to 5 from the available list),
  "venue": "string | null (venue name where the activity happens)",
  "address": "string | null (full street address if visible)",
  "dateStart": "string | null (start date, keep poster wording e.g. '12 July' or '2026-08-12')",
  "dateEnd": "string | null (end date if a range is given)",
  "timeStart": "string | null (start time e.g. '14:00' or '2pm')",
  "timeEnd": "string | null (end time if visible)",
  "dayOfWeek": "string | null (days the activity runs, e.g. 'Mon, Wed' or 'Saturdays')",
  "contactName": "string | null (named contact person if visible)",
  "bookingInfo": "string | null (booking instructions, e.g. 'WhatsApp to book', 'limited spaces')",
  "additionalInfo": "string | null (ALL remaining text on the poster not captured above — capture it verbatim)"
}

Rules:
- If the poster mentions a specific activity name, use it as "name"
- Match the category to the closest from the available list
- Write a warm, family-friendly description based on what the poster advertises
- Extract age range from phrases like "ages 5-10", "for 8 year olds", "teens"
- Extract price if mentioned (in Rands, whole number)
- Normalise phone numbers to international +27 format (e.g. "082 XXX XXXX" → "+27 82 XXX XXXX": strip the leading 0, prepend +27)
- Infer tags from context (e.g., "football" → sport, outdoor; "drawing" → creative, indoor)
- For venue/address/dates/times/dayOfWeek/contactName/bookingInfo: copy what the poster shows — keep original wording, don't reformat or invent
- For additionalInfo: include EVERY piece of text on the poster that didn't fit another field (phone/email/website excluded — those have their own fields), verbatim where possible
- If a field is not visible on the poster, return null — never invent it`;

  const userMessage =
    "Extract the provider details from this activity poster as JSON.";

  // Gemini FIRST (2026-08-08 flip): poster extraction is admin-facing + low
  // volume (~tens/day), and Gemini's per-key free tier is far more reliable
  // than NIM's shared pool (which 429s/times out regularly). NIM stays as the
  // fallback so we don't pay Gemini quota when NIM happens to be healthy.
  const geminiResult = await extractPosterWithGemini(imageUrl, systemPrompt, userMessage);
  if (geminiResult) {
    return normaliseExtract(geminiResult);
  }

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
    // George's extended poster fields — pass through as strings.
    venue: typeof result.venue === "string" ? result.venue : undefined,
    address: typeof result.address === "string" ? result.address : undefined,
    dateStart: typeof result.dateStart === "string" ? result.dateStart : undefined,
    dateEnd: typeof result.dateEnd === "string" ? result.dateEnd : undefined,
    timeStart: typeof result.timeStart === "string" ? result.timeStart : undefined,
    timeEnd: typeof result.timeEnd === "string" ? result.timeEnd : undefined,
    dayOfWeek: typeof result.dayOfWeek === "string" ? result.dayOfWeek : undefined,
    contactName: typeof result.contactName === "string" ? result.contactName : undefined,
    bookingInfo: typeof result.bookingInfo === "string" ? result.bookingInfo : undefined,
    additionalInfo:
      typeof result.additionalInfo === "string" ? result.additionalInfo : undefined,
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
