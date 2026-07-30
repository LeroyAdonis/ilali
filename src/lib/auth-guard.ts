import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Require an authenticated admin session.
 * Returns the validated session, or throws a Response (401/403).
 */
export async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as { role?: string };
  if (user.role !== "admin") {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return session;
}

/**
 * Wraps an admin API handler with auth.
 * Handles both simple handlers and route handlers with params.
 */
export function withAdmin<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      await requireAdmin(args[0] as NextRequest);
      return handler(...args);
    } catch (e) {
      if (e instanceof Response) return e;
      throw e;
    }
  };
}
