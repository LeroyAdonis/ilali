/**
 * Shared AI client — OpenCode serve (PRIMARY) → OpenRouter free pool (fallback).
 *
 * Tier chain (flip 2026-08-11 — NIM removed entirely):
 *   1. OpenCode serve (big-pickle, free zen model) — self-hosted on zahra at
 *      https://ai.zahra.digitalwavetech.dev. No per-request cost, no daily cap.
 *      Native protocol (session + message), Basic auth.
 *   2. OpenRouter free pool (`:free` models, $0) — key required, 50 req/day cap,
 *      so this is a rescue tier, not a primary. gpt-oss-20b:free benchmarked
 *      4.8s with perfect JSON (2026-08-11).
 *   3. Gemini — final tier, lives in gemini-vision.ts chatWithFallback().
 *
 * Timeout budget: OpenCode is a free shared zen tier — 12-23s typical. Each
 * attempt gets `timeoutMs` from the caller; callers that need speed should pass
 * a budget that leaves room for the OpenRouter/Gemini fallback to still fire.
 */

const OPENCODE_DEFAULT_URL = "http://127.0.0.1:4055";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1/chat/completions";

/** OpenCode zen model — free, no API key needed server-side. */
export const OPENCODE_MODEL = {
  providerID: "opencode",
  modelID: "big-pickle",
} as const;

/**
 * OpenRouter free models, verified live 2026-08-11 (HTTP 200 + $0.00):
 *   - openai/gpt-oss-20b:free — 4.8s, perfect JSON extraction (primary fallback)
 *   - cohere/north-mini-code:free — 256k ctx, code model (good JSON discipline)
 *   - google/gemma-4-31b-it:free — 262k ctx (rate-limited sometimes upstream)
 *   - nvidia/nemotron-3-super-120b-a12b:free — 262k ctx, slow (48.7s) but free
 */
export const OPENROUTER_MODEL_POOL = [
  "openai/gpt-oss-20b:free",
  "cohere/north-mini-code:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
] as const;

/** OpenRouter free vision model — used for poster extraction fallback. */
export const OPENROUTER_VISION_MODEL = "nvidia/nemotron-nano-12b-v2-vl:free";

interface ChatOptions {
  systemPrompt: string;
  userMessage: string;
  /** Optional image URL for vision models (poster extraction). */
  imageUrl?: string;
  /** OpenRouter model override (e.g. "openai/gpt-oss-20b:free"). Tried before the pool. */
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** Enforce a JSON object response (OpenRouter/OpenAI response_format). */
  responseFormat?: "json";
}

interface AIConfig {
  opencodeUrl: string;
  opencodeUsername: string;
  opencodePassword: string;
  openRouterKey: string;
}

export function getAIConfig(): AIConfig {
  return {
    opencodeUrl: process.env.OPENCODE_SERVER_URL?.trim() || OPENCODE_DEFAULT_URL,
    opencodeUsername: process.env.OPENCODE_SERVER_USERNAME?.trim() || "opencode",
    opencodePassword: process.env.OPENCODE_SERVER_PASSWORD?.trim() || "",
    openRouterKey: process.env.OPENROUTER_API_KEY?.trim() || "",
  };
}

function basicAuth(user: string, pass: string): string {
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

/* ── Tier 1: OpenCode serve (native protocol) ── */

async function chatOpenCode(
  cfg: AIConfig,
  opts: Omit<ChatOptions, "model"> & { timeoutMs: number }
): Promise<string | null> {
  if (!cfg.opencodePassword) {
    console.warn("[ai] OPENCODE_SERVER_PASSWORD not set — OpenCode tier disabled");
    return null;
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: basicAuth(cfg.opencodeUsername, cfg.opencodePassword),
  };

  try {
    // 1. Create a session (title optional; keep it labelled for debugging).
    const createRes = await fetch(`${cfg.opencodeUrl}/session`, {
      method: "POST",
      headers,
      body: JSON.stringify({ title: "ilali-ai" }),
      signal: AbortSignal.timeout(10000),
    });
    if (!createRes.ok) {
      console.warn(`[ai] opencode /session HTTP ${createRes.status}`);
      return null;
    }
    const session = (await createRes.json()) as { id: string };
    if (!session.id) return null;

    // 2. Send the message. Disable agent tools — ILALI only needs raw LLM
    // output, not file/bash access (an autonomous agent would be a security
    // hole exposed through a public Vercel endpoint).
    const body = {
      system: opts.systemPrompt,
      parts: [{ type: "text" as const, text: opts.userMessage }],
      model: { providerID: OPENCODE_MODEL.providerID, modelID: OPENCODE_MODEL.modelID },
      // Explicitly disable every agent tool — pure completion only.
      tools: {
        bash: false,
        read: false,
        edit: false,
        write: false,
        patch: false,
        glob: false,
        grep: false,
        list: false,
        webfetch: false,
      },
    };
    const msgRes = await fetch(`${cfg.opencodeUrl}/session/${session.id}/message`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(opts.timeoutMs),
    });
    if (!msgRes.ok) {
      console.warn(`[ai] opencode /message HTTP ${msgRes.status}`);
      return null;
    }
    const data = (await msgRes.json()) as { parts?: Array<{ type?: string; text?: string }> };
    if (!data.parts) return null;

    // Collect all text parts (the final answer; reasoning/step parts are dropped).
    const text = data.parts
      .filter((p) => p.type === "text" && typeof p.text === "string")
      .map((p) => p.text)
      .join("\n")
      .trim();
    return text || null;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.warn("[ai] opencode timed out");
    } else {
      console.warn("[ai] opencode failed:", err instanceof Error ? err.message : err);
    }
    return null;
  }
}

/* ── Tier 2: OpenRouter free pool (OpenAI-compatible) ── */

async function attemptOpenRouter(
  cfg: AIConfig,
  model: string,
  opts: Omit<ChatOptions, "model"> & { timeoutMs: number }
): Promise<string | null> {
  if (!cfg.openRouterKey) return null;

  try {
    const response = await fetch(OPENROUTER_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.openRouterKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: opts.systemPrompt },
          opts.imageUrl
            ? {
                role: "user",
                content: [
                  { type: "text", text: opts.userMessage },
                  { type: "image_url", image_url: { url: opts.imageUrl } },
                ],
              }
            : { role: "user", content: opts.userMessage },
        ],
        temperature: opts.temperature ?? 0.1,
        max_tokens: opts.maxTokens ?? 800,
        ...(opts.responseFormat === "json"
          ? { response_format: { type: "json_object" as const } }
          : {}),
      }),
      signal: AbortSignal.timeout(opts.timeoutMs),
    });

    if (!response.ok) {
      console.warn(`[ai] openrouter ${model} returned ${response.status}`);
      return null;
    }
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.warn(`[ai] openrouter ${model} timed out`);
    } else {
      console.warn("[ai] openrouter failed:", err instanceof Error ? err.message : err);
    }
    return null;
  }
}

/* ── Public entry point ── */

/**
 * chat() — OpenCode first, OpenRouter second.
 *
 * Vision (imageUrl) requests SKIP OpenCode (big-pickle is text-only) and go
 * straight to OpenRouter's free vision model, then the pool.
 */
export async function chat(opts: ChatOptions): Promise<string | null> {
  const { timeoutMs = 15000, model, imageUrl, ...rest } = opts;

  const cfg = getAIConfig();

  // ── Vision path: try ONLY vision-capable models, never the text pool.
  // Text models reject multimodal payloads (400/500) and each failed attempt
  // burns 15-20s. The old code hit this exact trap (75s poster uploads).
  // Gemini is the reliable vision tier (extractPosterWithGemini runs first in
  // extract-poster.ts, ~5.7s); OpenRouter VL free models are flaky (the
  // nemotron-nano-12b-v2-vl:free probe timed out at 120s on 2026-08-11), so
  // vision degrades gracefully to manual form rather than hanging.
  if (imageUrl) {
    if (!cfg.openRouterKey) return null;
    const visionModel = model ?? OPENROUTER_VISION_MODEL;
    const result = await attemptOpenRouter(cfg, visionModel, {
      ...rest,
      imageUrl,
      timeoutMs: Math.min(timeoutMs, 20000),
    });
    return result;
  }

  // ── Text path: OpenCode primary ──
  const opencodeResult = await chatOpenCode(cfg, { ...rest, timeoutMs });
  if (opencodeResult !== null) {
    return opencodeResult;
  }

  // ── OpenRouter fallback: model override first, then pool rotation ──
  const pool = model
    ? [model, ...OPENROUTER_MODEL_POOL.filter((m) => m !== model)]
    : [...OPENROUTER_MODEL_POOL];

  let lastResult: string | null = null;
  for (const m of pool) {
    const result = await attemptOpenRouter(cfg, m, { ...rest, timeoutMs });
    if (result !== null) return result;
    lastResult = result;
    if (m !== pool[pool.length - 1]) {
      console.warn(`[ai] ${m} failed — rotating to next OpenRouter model`);
    }
  }
  return lastResult;
}
