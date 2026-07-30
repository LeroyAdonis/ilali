const store = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter.
 * NOTE: Resets on cold starts in serverless. Acceptable for MVP.
 * Production upgrade: Vercel KV or Upstash Redis.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

export function getRateLimitReset(key: string, windowMs: number): number {
  const entry = store.get(key);
  if (!entry) return 0;
  return Math.max(0, Math.ceil((entry.resetAt - Date.now()) / 1000));
}
