import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db/index";
import { providerApplications, importBatches } from "@/lib/db/schema";
import { desc, inArray, sql } from "drizzle-orm";
import type { ImportBatchSummary, RowError } from "@/lib/import/types";

export const runtime = "nodejs";

/**
 * GET /api/admin/import/batches (spec Scenario 4, T024)
 * Lists importBatches newest-first with DERIVED counts (no stored counters):
 *  - approvedCount: COUNT(provider_applications WHERE import_batch_id = X
 *    AND status = 'approved')
 *  - pendingCount:  COUNT(... WHERE status IN ('pending','contacted'))
 */
export const GET = withAdmin(async () => {
  const batches = await db
    .select()
    .from(importBatches)
    .orderBy(desc(importBatches.createdAt));

  if (batches.length === 0) {
    return NextResponse.json([]);
  }

  const batchIds = batches.map((b) => b.id);
  const counts = await db
    .select({
      importBatchId: providerApplications.importBatchId,
      approvedCount: sql<number>`count(*) filter (where ${providerApplications.status} = 'approved')`,
      pendingCount: sql<number>`count(*) filter (where ${providerApplications.status} in ('pending', 'contacted'))`,
    })
    .from(providerApplications)
    .where(inArray(providerApplications.importBatchId, batchIds))
    .groupBy(providerApplications.importBatchId);

  const countByBatch = new Map(
    counts.map((c) => [c.importBatchId, c] as const)
  );

  const response: ImportBatchSummary[] = batches.map((b) => {
    const c = countByBatch.get(b.id);
    return {
      id: b.id,
      filename: b.filename,
      totalRows: b.totalRows,
      importedRows: b.importedRows,
      skippedRows: b.skippedRows,
      approvedCount: Number(c?.approvedCount ?? 0),
      pendingCount: Number(c?.pendingCount ?? 0),
      rowErrors: (b.rowErrors as RowError[] | null) ?? null,
      createdAt: b.createdAt,
    };
  });

  return NextResponse.json(response);
});
