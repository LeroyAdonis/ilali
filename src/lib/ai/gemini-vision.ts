/**
 * WS-7: Gemini vision fallback — used when NVIDIA NIM vision is overloaded/unavailable.
 *
 * Why: NIM's free tier is a shared pool (observed 429s/timeouts 2026-08-08). Gemini's
 * free tier is per-key and far more reliable. Strategy: NIM first (free, no key),
 * Gemini second (only when NIM fails), so ILALI costs nothing until NIM lets us down.
 *
 * Uses the OpenAI-compatible endpoint (gemini-flash-latest supports vision):
 *   https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
 *
 * IMPORTANT (verified 2026-08-08): this Google account can ONLY use the
 * `gemini-flash-latest` model alias. Newer names (gemini-2.5-flash,
 * gemini-2.0-flash, gemini-2.0-flash-001) return 429 quota `limit: 0`, and
 * gemini-3.5-flash does not exist. Always use `gemini-flash-latest`.
 */
import type { PosterExtract } from "./extract-poster";

const GEMINI_MODEL = "gemini-flash-latest";
const TIMEOUT_MS = 25000;

/**
 * Extract poster fields via Gemini vision. Returns null when no key is configured
 * or the API fails — the caller falls back to the manual form.
 */
export async function extractPosterWithGemini(
  imageUrl: string,
  systemPrompt: string,
  userMessage: string
): Promise<PosterExtract | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  // The image is a base64 data URL (our upload route stores it that way) or a remote URL.
  let imageContent: { image_url: { url: string } };
  if (imageUrl.startsWith("data:")) {
    // data:image/png;base64,XXXX → pass the data URL directly (OpenAI-compatible API accepts it)
    imageContent = { image_url: { url: imageUrl } };
  } else {
    imageContent = { image_url: { url: imageUrl } };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GEMINI_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: userMessage },
                { type: "image_url", ...imageContent },
              ],
            },
          ],
          temperature: 0.1,
          max_tokens: 800,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );

    if (!res.ok) {
      console.warn(`[extract-poster:gemini] HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    const content: string | null = data?.choices?.[0]?.message?.content ?? null;
    if (!content) return null;

    const cleaned = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    return JSON.parse(cleaned) as PosterExtract;
  } catch (err) {
    console.warn("[extract-poster:gemini] failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
