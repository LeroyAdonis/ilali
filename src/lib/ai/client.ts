/**
 * Shared AI client — prefers NVIDIA NIM (free), falls back to DeepSeek.
 *
 * To use NVIDIA NIM:
 *   1. Sign up at build.nvidia.com → Developer Program (free)
 *   2. Get your nvapi- key from build.nvidia.com/settings/api-keys
 *   3. Set NVIDIA_API_KEY in .env.local (and Vercel env)
 *
 * NVIDIA NIM: 1,000 free credits, 40 RPM, OpenAI SDK compatible.
 * Default model: nvidia/nemotron-3-super-120b-a12b (Nemotron 3 Super, 120B MoE, 12B active).
 *
 * Resilience: when NVIDIA returns an error (503 overloaded, timeout, etc.)
 * the call transparently retries once with DeepSeek.
 */

const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEEPSEEK_BASE = "https://api.deepseek.com/v1/chat/completions";

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
  provider: "nvidia" | "deepseek";
}

export function getAIConfig(): AIConfig {
  const nvidiaKey = process.env.NVIDIA_API_KEY;
  if (nvidiaKey) {
    return {
      baseUrl: NVIDIA_BASE,
      apiKey: nvidiaKey,
      model: "nvidia/nemotron-3-super-120b-a12b",
      provider: "nvidia",
    };
  }
  return {
    baseUrl: DEEPSEEK_BASE,
    apiKey: process.env.DEEPSEEK_API_KEY,
    model: "deepseek-chat",
    provider: "deepseek",
  };
}

async function attemptChat(
  cfg: AIConfig,
  opts: Omit<ChatOptions, "model"> & { timeoutMs: number }
): Promise<string | null> {
  const {
    systemPrompt,
    userMessage,
    temperature = 0.1,
    maxTokens = 400,
    timeoutMs,
    responseFormat,
  } = opts;

  if (!cfg.apiKey) {
    console.warn(`[ai] No API key for ${cfg.provider} — set NVIDIA_API_KEY (free) or DEEPSEEK_API_KEY`);
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
        model: cfg.model,
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
      console.warn(`[ai] ${cfg.model} returned ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.warn(`[ai] ${cfg.model} timed out`);
    } else {
      console.warn("[ai] Failed:", err);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function chat(opts: ChatOptions): Promise<string | null> {
  const {
    model: _model,
    timeoutMs = 5000,
    ...rest
  } = opts;

  const primary = getAIConfig();
  const fallback: AIConfig | null =
    primary.provider === "nvidia" && process.env.DEEPSEEK_API_KEY
      ? {
          baseUrl: DEEPSEEK_BASE,
          apiKey: process.env.DEEPSEEK_API_KEY,
          model: "deepseek-chat",
          provider: "deepseek",
        }
      : null;

  const result = await attemptChat(primary, { ...rest, timeoutMs });
  if (result !== null || !fallback) return result;

  console.warn(`[ai] ${primary.model} failed — falling back to ${fallback.model}`);
  return attemptChat(fallback, { ...rest, timeoutMs });
}
