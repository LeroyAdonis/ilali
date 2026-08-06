import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db/index";
import { providerApplications, importBatches } from "@/lib/db/schema";
import { validateRows } from "@/lib/import/validate";
import { buildDedupContext, buildKnownActivityTypes } from "@/lib/import/db";
import { MAX_DATA_ROWS } from "@/lib/import/normalize";
import type { ImportCommitResult, ParsedRow, RowError } from "@/lib/import/types";

export const runtime = "nodejs";

/**
 * POST /api/admin/import/commit (spec FR-3, T010)
 * Re-validates + re-runs dedup (race-safe — state may have changed since the
 * preview), inserts every still-valid row into providerApplications in ONE
 * multi-row insert (status='pending', onboardSource='bulk-import',
 * importBatchId set), and creates one importBatches audit record.
 *
 * Rows that became duplicates between preview and commit are skipped and
 * reported, never inserted. Admin-gated only (withAdmin).
 */
export const POST = withAdmin(async (request: NextRequest) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const rawRows = (body as { rows?: unknown }).rows;
  const filename =
    typeof (body as { filename?: unknown }).filename === "string" &&
    (body as { filename?: string }).filename !== ""
      ? (body as { filename?: string }).filename!
      : "pasted text";

  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return NextResponse.json({ error: "No rows to import." }, { status: 400 });
  }
  if (rawRows.length > MAX_DATA_ROWS) {
    return NextResponse.json(
      { error: `Too many rows — the limit is ${MAX_DATA_ROWS} per import.` },
      { status: 400 }
    );
  }

  // Coerce the client-echoed parsed rows (defensive — commit re-validates
  // everything, so tampered payloads just produce per-row errors).
  const rows: ParsedRow[] = rawRows.map((r, i) => {
    const o = (r ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" ? v : "");
    return {
      row: typeof o.row === "number" ? o.row : i + 1,
      name: str(o.name),
      email: str(o.email),
      phone: str(o.phone),
      activityType: str(o.activityType),
      location: str(o.location),
      ageMin: str(o.ageMin),
      ageMax: str(o.ageMax),
      priceValue: str(o.priceValue),
      description: str(o.description),
      imageUrl: str(o.imageUrl),
    };
  });

  // Re-validate + re-dedup against CURRENT db state.
  const [{ userEmails, applicationEmails }, knownActivityTypes] = await Promise.all([
    buildDedupContext(rows.map((r) => r.email)),
    buildKnownActivityTypes(),
  ]);
  const validated = validateRows(rows, { userEmails, applicationEmails, knownActivityTypes });

  const importable = validated.filter((v) => v.application !== null);
  const skipped = validated.filter((v) => v.application === null);

  const batchId = crypto.randomUUID();

  if (importable.length > 0) {
    await db.insert(providerApplications).values(
      importable.map((v) => ({
        id: crypto.randomUUID(),
        name: v.application!.name,
        email: v.application!.email,
        phone: v.application!.phone,
        activityType: v.application!.activityType,
        description: v.application!.description,
        location: v.application!.location,
        ageMin: v.application!.ageMin,
        ageMax: v.application!.ageMax,
        priceValue: v.application!.priceValue,
        imageUrl: v.application!.imageUrl,
        status: "pending",
        onboardSource: "bulk-import",
        importBatchId: batchId,
      }))
    );
  }

  const rowErrors: RowError[] = skipped.map((v) => ({
    row: v.row,
    email: v.email,
    errors: v.errors,
  }));

  // Always record the batch — even a 0-import commit is an audit event.
  await db.insert(importBatches).values({
    id: batchId,
    filename,
    totalRows: rows.length,
    importedRows: importable.length,
    skippedRows: skipped.length,
    rowErrors,
    createdBy: (await requireAdminUserId(request)) ?? null,
  });

  const response: ImportCommitResult = {
    batchId,
    imported: importable.length,
    skipped: skipped.length,
    rowErrors,
  };

  return NextResponse.json(response);
});

/** Reuse the admin session check to capture who ran the import. */
async function requireAdminUserId(request: NextRequest): Promise<string | null> {
  try {
    const { auth } = await import("@/lib/auth");
    const session = await auth.api.getSession({ headers: request.headers });
    return (session?.user?.id as string | undefined) ?? null;
  } catch {
    return null;
  }
}
