/**
 * WS-7: Poster extraction — reads a Fun with Kids poster image and returns
 * structured provider fields via the AI vision tier (Gemini first, then
 * OpenRouter free vision model).
 *
 * Logo reliability (2026-08-11): the combined extraction asks for logoBox
 * among ~25 fields, and free-tier vision models frequently skip it on small/
 * simple images. When the main extraction misses the logo, a dedicated
 * focused logo-detection pass runs so George's logo requirement is reliable.
 *
 * Same pattern as extract-provider.ts but multimodal (image + prompt).
 */
import { chat, OPENROUTER_VISION_MODEL } from "./client";
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
  /** Logo location on the poster as percentages (0-100) of poster dims. */
  logoBox?: { x: number; y: number; width: number; height: number } | null;
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
// SWITCH 2026-08-14: NIM 11b vision (meta/llama-3.2-11b-vision-instruct) is
// 7-8s, returns clean JSON (no markdown fences), and extracts ALL fields
// correctly. NIM nemotron-3-nano-omni-30b-a3b-reasoning is 17s+ and returns
// all nulls on real posters. 90b-vision times out on shared pool.
const TIMEOUT_MS = 20000;

const VISION_MODEL = "meta/llama-3.2-11b-vision-instruct";

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
  "additionalInfo": "string | null (ALL remaining text on the poster not captured above — capture it verbatim)",
  "logoBox": "object | null (the LOGO's location on the poster, as percentages of poster width/height: { x, y, width, height } where x,y is the top-left corner of the logo and width,height its size, all 0-100. A logo is a small distinct graphic mark/emblem/brand icon — often in a corner. If there is NO clear logo, return null. Do NOT include the main poster photo or artwork as a logo.)"
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
- For logoBox: locate the logo mark precisely. If the poster has a clear logo (brand emblem/icon, usually in a corner), give its bounding box as percentages. If uncertain, prefer a slightly LARGER box over a too-small one (we crop it).
- If a field is not visible on the poster, return null — never invent it`;

  const userMessage =
    "Extract the provider details from this activity poster as JSON.";

  // Gemini FIRST (2026-08-08 flip): poster extraction is admin-facing + low
  // volume (~tens/day), and Gemini's per-key free tier is far more reliable
  // than NIM's shared pool (which 429s/times out regularly). NIM stays as the
  // fallback so we don't pay Gemini quota when NIM happens to be healthy.
  const geminiResult = await extractPosterWithGemini(imageUrl, systemPrompt, userMessage, "extract-poster");
  if (geminiResult) {
    // Normalise FIRST (phone +27, tag filter, logoBox clamp), then run the
    // dedicated logo pass if the main extraction missed the logo.
    return await ensureLogo(normaliseExtract(geminiResult), imageUrl);
  }

  const content = await chat({
    systemPrompt,
    userMessage,
    imageUrl,
    model: VISION_MODEL,
    temperature: 0.1,
    maxTokens: 800,
    timeoutMs: TIMEOUT_MS,
    responseFormat: "json",
    purpose: "extract-poster",
  });

  if (!content) return null;

  try {
    const cleaned = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    return await ensureLogo(
      normaliseExtract(JSON.parse(cleaned) as PosterExtract),
      imageUrl
    );
  } catch {
    console.warn("[extract-poster] Failed to parse AI response");
    return null;
  }
}

/**
 * Logo reliability pass (2026-08-11): when the main extraction returned other
 * fields but MISSED the logo, run a focused logo-only detection. A dedicated
 * prompt ("return ONLY the logo bounding box") is far more reliable than the
 * ~25-field combined extraction, and it's cheap (admin-facing, low volume).
 */
async function ensureLogo(
  result: PosterExtract,
  imageUrl: string
): Promise<PosterExtract> {
  if (result.logoBox) return result; // already located — no extra call

  const logoSystemPrompt = `You locate the LOGO on a children's activity poster.
A logo is a small distinct graphic mark / emblem / brand icon — often in a corner.
Do NOT include the main poster photo, artwork, or decorative shapes.

Return ONLY valid JSON, no other text, no markdown:
{
  "logoBox": { "x": number, "y": number, "width": number, "height": number } | null
}
All values are PERCENTAGES (0-100) of the poster's width/height, where x,y is the top-left corner of the logo and width,height its size. If there is NO clear logo, return {"logoBox": null}. If uncertain, prefer a slightly LARGER box over a too-small one (we crop it).`;

  // Try Gemini first (reliable + free), then the OpenRouter vision fallback.
  // IMPORTANT: merge only the logoBox into the existing result — do NOT
  // re-normalise (normaliseExtract drops fields not in its output shape).
  const geminiLogo = await extractPosterWithGemini(
    imageUrl,
    logoSystemPrompt,
    "Locate the logo on this poster. Return ONLY JSON.",
    "extract-poster-logo"
  );
  if (geminiLogo?.logoBox) {
    return { ...result, logoBox: geminiLogo.logoBox };
  }

  const logoContent = await chat({
    systemPrompt: logoSystemPrompt,
    userMessage: "Locate the logo on this poster. Return ONLY JSON.",
    imageUrl,
    model: VISION_MODEL,
    temperature: 0.1,
    maxTokens: 200,
    timeoutMs: TIMEOUT_MS,
    responseFormat: "json",
    purpose: "extract-poster-logo",
  });
  if (!logoContent) return result;

  try {
    const cleaned = logoContent
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const logoParse = JSON.parse(cleaned) as { logoBox?: PosterExtract["logoBox"] };
    if (logoParse.logoBox) {
      return { ...result, logoBox: logoParse.logoBox };
    }
  } catch {
    console.warn("[extract-poster] Failed to parse logo pass");
  }
  return result;
}

/** Shared post-processing for any extraction source (Gemini or OpenRouter). */
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
    logoBox:
      result.logoBox &&
      typeof result.logoBox.x === "number" &&
      typeof result.logoBox.y === "number" &&
      typeof result.logoBox.width === "number" &&
      typeof result.logoBox.height === "number"
        ? {
            x: Math.max(0, Math.min(100, result.logoBox.x)),
            y: Math.max(0, Math.min(100, result.logoBox.y)),
            width: Math.max(1, Math.min(100, result.logoBox.width)),
            height: Math.max(1, Math.min(100, result.logoBox.height)),
          }
        : undefined,
  };
}

/** Normalise SA phone numbers to international +27 format. */
export function cleanPhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  if (digits.startsWith("0")) return "+27" + digits.slice(1);
  return "+27" + digits;
}
