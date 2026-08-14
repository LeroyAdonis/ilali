import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db/index";
import { providerApplications } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

export const runtime = "nodejs";

/**
 * POST /api/admin/applications/batch-delete
 * Permanently removes the given application rows (test data cleanup).
 * Accepts `{ ids: string[] }`. Same scoping contract as the single DELETE:
 * only the application rows are removed — any approved-linked user accounts
 * or providers rows are left untouched.
 */
export const POST = withAdmin(async (request: NextRequest) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const ids = (body as { ids?: unknown }).ids;
  if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => typeof id !== "string")) {
    return NextResponse.json(
      { error: "Provide a non-empty array of ids (string[])." },
      { status: 400 }
    );
  }

  const deleted = await db
    .delete(providerApplications)
    .where(inArray(providerApplications.id, ids as string[]))
    .returning({ id: providerApplications.id });

  return NextResponse.json({ ok: true, deleted: deleted.length, ids: deleted.map((d) => d.id) });
});
