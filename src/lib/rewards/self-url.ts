/**
 * Base URL for server-to-self fetches (rewards earn hooks etc.).
 *
 * Prefers the incoming request's own origin — this works on any local
 * dev port (the repo dev server runs on 3001 while .env points at 3000)
 * and on preview deploys, where the Host header is always correct.
 * Falls back to NEXT_PUBLIC_APP_URL for serverless contexts that don't
 * carry a Host header.
 */
export function selfBaseUrl(request: Request): string {
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const host = request.headers.get("host");
  if (host) return `${proto}://${host}`;

  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    "http://localhost:3001"
  );
}
