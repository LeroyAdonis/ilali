/**
 * Shared AI client — NVIDIA NIM only (free), with model rotation on failure.
 *
 * To use NVIDIA NIM:
 *   1. Sign up at build.nvidia.com → Developer Program (free)
 *   2. Get your nvapi- key from build.nvidia.com/settings/api-keys
 *   3. Set NVIDIA_API_KEY in .env.local (and Vercel env)
 *
 * NVIDIA NIM: free, 40 RPM per model, OpenAI SDK compatible.
 *
 * Rotation (added 2026-08-07 — DeepSeek fallback REMOVED after DeepSeek's
 * billing-adjustment announcement; NIM is free, DeepSeek is not):
 *   When the primary model fails (429 rate limit, 503 overload, timeout,
 *   5xx), the call transparently retries with the next model in
 *   NIM_MODEL_POOL. Each model has its own 40 RPM bucket on NIM, so rotating
 *   effectively multiplies the rate ceiling. All models verified live.
 */

const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1/chat/completions";

/** Free NIM chat models, verified 2026-08-07 (HTTP 200 on test call).
 *  Primary first (bake-off winner 2026-07-31: openai/gpt-oss-120b — 7.2s avg,
 *  100% parse/extract/chosen/reply/followUp), then rotation backups. */
export const NIM_MODEL_POOL = [
  "openai/gpt-oss-120b",
  "nvidia/nemotron-3-super-120b-a12b",
  "meta/llama-3.3-70b-instruct",
  "mistralai/mistral-nemotron",
] as const;

interface ChatOptions {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  /** Enforce a JSON object response (NVIDIA/OpenAI response_format). Use for
   *  extraction endpoints — separates the model's reasoning from clean JSON. */
  responseFormat?: "json";
}

interface AIConfig {
  baseUrl: string;
  apiKey: string | undefined;
  model: string;
  provider: "nvidia";
}

export function getAIConfig(): AIConfig {
  return {
    baseUrl: NVIDIA_BASE,
    apiKey: process.env.NVIDIA_API_KEY,
    model: "openai/gpt-oss-120b",
    provider: "nvidia",
  };
}

async function attemptChat(
  cfg: AIConfig,
  opts: Omit<ChatOptions, "model"> & { timeoutMs: number; modelOverride?: string }
): Promise<string | null> {
  const {
    systemPrompt,
    userMessage,
    temperature = 0.1,
    maxTokens = 400,
    timeoutMs,
    responseFormat,
    modelOverride,
  } = opts;

  const model = modelOverride ?? cfg.model;

  if (!cfg.apiKey) {
    console.warn("[ai] No NVIDIA_API_KEY set — set it in .env.local and Vercel env");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(cfg.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature,
        max_tokens: maxTokens,
        ...(responseFormat === "json"
          ? { response_format: { type: "json_object" as const } }
          : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(`[ai] ${model} returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.warn(`[ai] ${model} timed out`);
    } else {
      console.warn("[ai] Failed:", err);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function chat(opts: ChatOptions): Promise<string | null> {
  const { timeoutMs = 5000, model, ...rest } = opts;

  const cfg = getAIConfig();
  if (!cfg.apiKey) return null;

  // Build the rotation pool: per-call override first (if given and known),
  // otherwise the full NIM pool. The override model is tried once; on failure
  // we rotate through the rest of the pool. Unknown override models are
  // still attempted (caller's choice) but excluded from rotation.
  let pool: string[];
  if (model) {
    pool = [model, ...NIM_MODEL_POOL.filter((m) => m !== model)];
  } else {
    pool = [...NIM_MODEL_POOL];
  }

  let lastResult: string | null = null;
  for (const m of pool) {
    const result = await attemptChat(cfg, {
      ...rest,
      timeoutMs,
      modelOverride: m,
    });
    if (result !== null) return result;
    lastResult = result;
    if (m !== pool[pool.length - 1]) {
      console.warn(`[ai] ${m} failed — rotating to next NIM model`);
    }
  }
  return lastResult;
}
