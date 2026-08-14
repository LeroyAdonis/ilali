/**
 * AI call audit log — "model-visible means logged" (borrowed from DeepSeek
 * Harness, 2026-08-14). Every AI call through the shared client records which
 * tier served, the model, latency, and outcome so incidents (e.g. poster
 * extraction failing) are one SQL query instead of guesswork.
 *
 * Fire-and-forget by design: the AI latency must NEVER block on a DB write,
 * and a logging failure must never fail the AI call itself. Callers should
 * invoke this without awaiting (or await — it swallows its own errors).
 */
import { db } from "@/lib/db/index";
import { aiCallLogs } from "@/lib/db/schema";

export interface AiCallLogEntry {
  purpose: string;
  provider: "opencode" | "openrouter" | "gemini" | "none";
  model?: string | null;
  status: "success" | "failed";
  latencyMs?: number;
  tokensIn?: number | null;
  tokensOut?: number | null;
  error?: string | null;
}

export async function logAiCall(entry: AiCallLogEntry): Promise<void> {
  try {
    await db.insert(aiCallLogs).values({
      purpose: entry.purpose,
      provider: entry.provider,
      model: entry.model ?? null,
      status: entry.status,
      latencyMs: entry.latencyMs ?? null,
      tokensIn: entry.tokensIn ?? null,
      tokensOut: entry.tokensOut ?? null,
      error: entry.error ?? null,
    });
  } catch (e) {
    // Logging must never break the AI call. Best-effort only.
    console.warn("[ai-audit] failed to write call log:", e instanceof Error ? e.message : e);
  }
}

/** fire-and-forget wrapper — returns immediately, writes in background. */
export function logAiCallAsync(entry: AiCallLogEntry): void {
  void logAiCall(entry);
}
