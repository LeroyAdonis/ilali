const store = new Map<string, { count: number; resetAt: number }>();

// Auto-cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Simple in-memory rate limiter.
 *
 * @param key — unique identifier (e.g. IP address)
 * @param maxRequests — maximum allowed requests in the window
 * @param windowMs — time window in milliseconds
 * @returns true if the request is allowed, false if rate-limited
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

/**
 * Returns the number of seconds remaining until the rate limit resets for a given key.
 */
export function getRateLimitReset(key: string, windowMs: number): number {
  const entry = store.get(key);
  if (!entry) return 0;
  const remaining = Math.max(0, Math.ceil((entry.resetAt - Date.now()) / 1000));
  return remaining;
}
