/**
 * Match intent cache — the second half of the /api/match fast path.
 *
 * Why: AI intent extraction (OpenCode big-pickle, OpenRouter free) takes
 * 12-77s on free shared tiers. Deterministic extraction handles ~60-80% of
 * parent queries in <1ms, and this cache makes even the AI-parsed remainder
 * instant on repeat searches ("soccer", "swimming", "art classes").
 *
 * Design: the cache is a pure optimization — every function swallows DB
 * errors and degrades to a miss/no-op, so a broken cache can never fail or
 * slow down /api/match beyond the normal AI path.
 *
 * Created 2026-08-11 as part of the "fast path + cache" latency fix.
 */
import { eq, lt } from "drizzle-orm";
import type { MatchIntent } from "./match";
import { db } from "@/lib/db/index";
import { matchIntentCache } from "@/lib/db/schema";

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // cached intents expire after 7 days
const PRUNE_AFTER_MS = 14 * 24 * 60 * 60 * 1000; // rows older than 14 days are garbage

/**
 * Normalized cache key: trimmed, lowercased, whitespace-collapsed.
 * "  Football   For My 7 Year Old " → "football for my 7 year old".
 */
export function normalizeQueryKey(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Read a cached intent for a query key. Returns null on miss, on an expired
 * row (createdAt older than 7 days), or on ANY DB error — the cache must
 * never break or slow down the match route.
 */
export async function getCachedIntent(
  queryKey: string
): Promise<{ intent: MatchIntent; mode: string } | null> {
  try {
    const rows = await db
      .select()
      .from(matchIntentCache)
      .where(eq(matchIntentCache.queryKey, queryKey))
      .limit(1);
    const row = rows[0];
    if (!row) return null;

    // TTL — treat missing/parse-failure timestamps as expired.
    if (!row.createdAt) return null;
    const createdAt = new Date(row.createdAt).getTime();
    if (Number.isNaN(createdAt) || Date.now() - createdAt > TTL_MS) {
      return null;
    }

    return { intent: row.intentJson as MatchIntent, mode: row.mode };
  } catch {
    return null;
  }
}

/**
 * Upsert a cached intent (keyed on queryKey), refreshing createdAt so
 * actively-searched queries stay warm, and opportunistically prune rows
 * older than 14 days (fire-and-forget). Never throws — safe to call
 * without awaiting.
 */
export async function setCachedIntent(
  queryKey: string,
  intent: MatchIntent,
  mode: string
): Promise<void> {
  try {
    await db
      .insert(matchIntentCache)
      .values({ queryKey, intentJson: intent, mode })
      .onConflictDoUpdate({
        target: matchIntentCache.queryKey,
        set: {
          intentJson: intent,
          mode,
          createdAt: new Date(),
        },
      });

    // Opportunistic prune — fire-and-forget, never block the caller.
    void db
      .delete(matchIntentCache)
      .where(lt(matchIntentCache.createdAt, new Date(Date.now() - PRUNE_AFTER_MS)))
      .catch(() => {});
  } catch {
    // Cache is an optimization — a write failure must never surface.
  }
}

/**
 * Remove a cached intent for a query key. Future use: invalidation when the
 * catalog changes. Never throws.
 */
export async function deleteCachedIntent(queryKey: string): Promise<void> {
  try {
    await db
      .delete(matchIntentCache)
      .where(eq(matchIntentCache.queryKey, queryKey));
  } catch {
    // Never surface cache errors.
  }
}
