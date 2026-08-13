import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PASSWORD_MIN_LENGTH } from "@/lib/constants";

/**
 * POST /api/auth/set-password
 *
 * Lets a signed-in user add a password to an account that was created via
 * magic link (email-first auth). Optional — never required. Requires an active
 * session (setPassword re-validates it internally via sensitiveSessionMiddleware);
 * fails if the account already has a credential password. Accepts { newPassword }.
 */
export async function POST(request: NextRequest) {
  let newPassword: unknown;
  try {
    newPassword = (await request.json()).newPassword;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof newPassword !== "string" || newPassword.length < PASSWORD_MIN_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` },
      { status: 400 }
    );
  }

  try {
    const result = await auth.api.setPassword({
      headers: request.headers,
      body: { newPassword },
    });

    if (result.status) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Could not set password" }, { status: 400 });
  } catch (e) {
    // Better Auth throws APIError with a structured `code` — check it instead
    // of string-matching error messages (breaks on upgrades, false-positives).
    const code = (e as { code?: string }).code;
    if (code === "PASSWORD_ALREADY_SET") {
      return NextResponse.json(
        { error: "You already have a password. Use 'forgot password' to reset it." },
        { status: 400 }
      );
    }
    if (code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("set-password error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
