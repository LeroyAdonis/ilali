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
}

export function getAIConfig(): {
  baseUrl: string;
  apiKey: string | undefined;
  model: string;
  provider: "nvidia" | "deepseek";
} {
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

export async function chat(opts: ChatOptions): Promise<string | null> {
  const {
    systemPrompt,
    userMessage,
    temperature = 0.1,
    maxTokens = 400,
    timeoutMs = 5000,
  } = opts;

  const { baseUrl, apiKey, model } = getAIConfig();

  if (!apiKey) {
    console.warn("[ai] No AI API key set — set NVIDIA_API_KEY (free) or DEEPSEEK_API_KEY");
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature,
        max_tokens: maxTokens,
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
