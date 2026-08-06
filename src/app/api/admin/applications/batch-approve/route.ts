import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db/index";
import { providerApplications } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { approveBatch } from "@/lib/admin/batchApprove";

export const runtime = "nodejs";

/**
 * POST /api/admin/applications/batch-approve (spec FR-4, T019)
 * Accepts `{ ids: string[] }` OR `{ importBatchId: string }` (approves all
 * pending/contacted rows from one import batch). Every eligible row runs
 * through the SHARED WS-1 approveApplication() helper in its own try/catch:
 *  - a failed row reports { id, email, error } and keeps its status — it is
 *    never half-approved and never blocks other rows;
 *  - email failures never fail an approval (WS-2 contract).
 * Response: { approved: [{ id, email, tempPassword, emailSent }],
 *             failed: [{ id, email, error }] }
 * Admin-gated only — the signup rate limiter does NOT apply.
 */
export const POST = withAdmin(async (request: NextRequest) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const ids = (body as { ids?: unknown }).ids;
  const importBatchId = (body as { importBatchId?: unknown }).importBatchId;

  if (Array.isArray(ids) && ids.length > 0) {
    // Explicit selection — keep the given order.
    if (ids.some((id) => typeof id !== "string")) {
      return NextResponse.json({ error: "Invalid ids." }, { status: 400 });
    }
    const applications = await db
      .select()
      .from(providerApplications)
      .where(inArray(providerApplications.id, ids as string[]));
    return NextResponse.json(await approveBatch(applications));
  }

  if (typeof importBatchId === "string" && importBatchId !== "") {
    const applications = await db
      .select()
      .from(providerApplications)
      .where(eq(providerApplications.importBatchId, importBatchId));
    return NextResponse.json(await approveBatch(applications));
  }

  return NextResponse.json(
    { error: "Provide either ids (string[]) or importBatchId (string)." },
    { status: 400 }
  );
});
