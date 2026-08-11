/**
 * WS-7: Gemini vision fallback — used when the OpenRouter/OpenCode vision
 * path is overloaded/unavailable.
 *
 * Why: Gemini's per-key free tier is far more reliable than shared pools
 * (observed 429s/timeouts on shared tiers 2026-08-08). Strategy: callers try
 * their primary tier first, Gemini second, so ILALI costs nothing until the
 * primary tiers let us down.
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
import { chat } from "./client";

const GEMINI_MODEL = "gemini-flash-latest";
const TIMEOUT_MS = 25000;

/** True when a Gemini API key is configured (enables fallbacks). */
export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/**
 * Generic text completion via Gemini (OpenAI-compatible endpoint).
 * Returns raw text or null on failure — never throws.
 * Used as the reliable fallback for match + extract-provider.
 */
export async function chatGeminiText(opts: {
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** When true, unparseable JSON output triggers one retry (free-tier truncation). */
  json?: boolean;
}): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const call = async (): Promise<string | null> => {
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
            { role: "system", content: opts.systemPrompt },
            { role: "user", content: opts.userMessage },
          ],
          temperature: opts.temperature ?? 0.1,
          max_tokens: opts.maxTokens ?? 800,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(opts.timeoutMs ?? TIMEOUT_MS),
      }
    );
    if (!res.ok) {
      console.warn(`[gemini:chat] HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    const content: string | null = data?.choices?.[0]?.message?.content ?? null;
    return content || null;
  };

  try {
    let content = await call();
    if (!content) return null;

    // Free-tier Gemini occasionally truncates JSON mid-object. Retry once.
    if (opts.json) {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      try {
        JSON.parse(cleaned);
        return content;
      } catch {
        console.warn("[gemini:chat] truncated JSON — retrying once");
        content = await call();
        if (!content) return null;
      }
    }
    return content;
  } catch (err) {
    console.warn("[gemini:chat] failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Shared AI call with fallback: try chat() first (OpenCode → OpenRouter free
 * pool — see client.ts), then Gemini (per-key free tier) when those
 * fail/timeout. Returns raw text or null.
 * Used by match (parent search) + extract-provider (provider add) so those
 * flows keep working even when the free tiers are overloaded.
 */
export async function chatWithFallback(opts: {
  systemPrompt: string;
  userMessage: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** When true, chat() output that fails JSON.parse also triggers Gemini fallback. */
  json?: boolean;
}): Promise<string | null> {
  const primaryResult = await chat({
    systemPrompt: opts.systemPrompt,
    userMessage: opts.userMessage,
    temperature: opts.temperature ?? 0.1,
    maxTokens: opts.maxTokens ?? 800,
    timeoutMs: opts.timeoutMs ?? 15000,
  });

  // chat() succeeded: either plain text, or valid JSON (when json mode requested).
  if (primaryResult) {
    if (!opts.json) return primaryResult;
    try {
      const cleaned = primaryResult
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      JSON.parse(cleaned);
      return primaryResult;
    } catch {
      // chat() returned unparseable junk — fall through to Gemini.
      console.warn("[chatWithFallback] chat() returned unparseable JSON — trying Gemini");
    }
  }

  if (!isGeminiConfigured()) return null;
  const geminiResult = await chatGeminiText({ ...opts });
  if (geminiResult) {
    console.log("[chatWithFallback] OpenCode/OpenRouter unavailable — Gemini succeeded");
  }
  return geminiResult;
}

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
          max_tokens: 1500,
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

    // Free-tier Gemini occasionally truncates its JSON mid-object (observed
    // 2026-08-08: "Unterminated string in JSON at position 114"). Retry once;
    // a second attempt with the same prompt almost always completes.
    try {
      return JSON.parse(cleaned) as PosterExtract;
    } catch (parseErr) {
      console.warn(
        "[extract-poster:gemini] parse failed (retrying once):",
        parseErr instanceof Error ? parseErr.message : parseErr
      );
      try {
        const retry = await fetch(
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
                { role: "user", content: userMessage },
              ],
              temperature: 0.1,
              max_tokens: 1500,
              response_format: { type: "json_object" },
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
          }
        );
        if (!retry.ok) return null;
        const retryData = await retry.json();
        const retryContent: string | null =
          retryData?.choices?.[0]?.message?.content ?? null;
        if (!retryContent) return null;
        const retryCleaned = retryContent
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "")
          .trim();
        return JSON.parse(retryCleaned) as PosterExtract;
      } catch (retryErr) {
        console.warn(
          "[extract-poster:gemini] retry failed:",
          retryErr instanceof Error ? retryErr.message : retryErr
        );
        return null;
      }
    }
  } catch (err) {
    console.warn("[extract-poster:gemini] failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
