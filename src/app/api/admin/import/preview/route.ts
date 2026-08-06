import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth-guard";
import {
  IntakeError,
  MAX_FILE_BYTES,
  normalizeIntake,
  type IntakeInput,
} from "@/lib/import/normalize";
import { validateRows } from "@/lib/import/validate";
import { buildDedupContext, buildKnownActivityTypes } from "@/lib/import/db";
import type { ImportPreview, PreviewRow } from "@/lib/import/types";

export const runtime = "nodejs"; // xlsx (SheetJS) + Buffer parsing

/**
 * POST /api/admin/import/preview (spec FR-1/FR-2/FR-3, T009)
 * Accepts EITHER a multipart file upload (.csv/.xlsx/.xls) OR a { text } body
 * of pasted tab/comma-separated rows. Normalizes → validates → dedups
 * (read-only DB queries) → returns a per-row report. NO database writes.
 *
 * Admin-gated only (withAdmin) — the signup rate limiter does NOT apply.
 */
export const POST = withAdmin(async (request: NextRequest) => {
  const contentType = request.headers.get("content-type") || "";
  let intake: IntakeInput;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File too large — the limit is 5MB." },
        { status: 400 }
      );
    }
    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith(".csv")) {
      intake = { kind: "csv", content: await file.text() };
    } else if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
      intake = { kind: "xlsx", content: Buffer.from(await file.arrayBuffer()) };
    } else {
      return NextResponse.json(
        { error: "Unsupported file type — upload a .csv, .xlsx or .xls file." },
        { status: 400 }
      );
    }
  } else {
    const body = await request.json().catch(() => null);
    const text = typeof body === "object" && body !== null ? body.text : undefined;
    if (typeof text !== "string" || text.trim() === "") {
      return NextResponse.json({ error: "No text provided." }, { status: 400 });
    }
    intake = { kind: "text", content: text };
  }

  try {
    const { rows } = normalizeIntake(intake);
    const [{ userEmails, applicationEmails }, knownActivityTypes] = await Promise.all([
      buildDedupContext(rows.map((r) => r.email)),
      buildKnownActivityTypes(),
    ]);
    const validated = validateRows(rows, { userEmails, applicationEmails, knownActivityTypes });

    const previewRows: PreviewRow[] = validated.map((v, i) => ({
      row: v.row,
      name: v.application?.name ?? v.email,
      email: v.email,
      activityType: v.application?.activityType ?? null,
      status: v.status,
      errors: v.errors,
      warnings: v.warnings,
      data: rows[i],
    }));

    const response: ImportPreview = {
      totalRows: validated.length,
      validRows: validated.filter((v) => v.status === "valid").length,
      warningRows: validated.filter((v) => v.status === "warning").length,
      errorRows: validated.filter((v) => v.status === "error").length,
      rows: previewRows,
    };

    return NextResponse.json(response);
  } catch (e) {
    if (e instanceof IntakeError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
});
