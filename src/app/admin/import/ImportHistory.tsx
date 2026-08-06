"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ChevronDown,
  History,
  Loader2,
} from "lucide-react";
import type { BatchApproveResult, ImportBatchSummary } from "@/lib/import/types";
import { BatchApproveModal } from "@/components/admin/BatchApproveModal";

/**
 * Import history (spec Scenario 4, T025).
 * Batch list with derived approved/pending counts, expandable per-row error
 * audit (recorded at commit time), and a per-batch "Approve all pending" that
 * calls the shared batch-approve route.
 */
export default function ImportHistory() {
  const router = useRouter();
  const [batches, setBatches] = useState<ImportBatchSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busyBatch, setBusyBatch] = useState<string | null>(null);
  const [batchResult, setBatchResult] = useState<BatchApproveResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/import/batches", { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) setError(body.error || "Could not load import history.");
          return;
        }
        if (!cancelled) setBatches(body as ImportBatchSummary[]);
      } catch {
        if (!cancelled) setError("Could not load import history.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function approveBatch(importBatchId: string) {
    setBusyBatch(importBatchId);
    setError(null);
    try {
      const res = await fetch("/api/admin/applications/batch-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importBatchId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Batch approve failed. Please try again.");
        return;
      }
      setBatchResult(body as BatchApproveResult);
      router.refresh();
    } catch {
      setError("Batch approve failed. Please try again.");
    } finally {
      setBusyBatch(null);
    }
  }

  if (error) {
    return (
      <p
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
      >
        {error}
      </p>
    );
  }

  if (batches === null) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-ink/10 bg-white py-16">
        <Loader2 className="h-6 w-6 animate-spin text-ilali-600" />
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="rounded-xl border border-ink/10 bg-white px-6 py-12 text-center">
        <History className="mx-auto h-12 w-12 text-ink-faint" />
        <p className="mt-3 text-sm text-ink-faint">
          No imports yet — upload a file or paste rows on the Upload tab.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {batches.map((batch) => {
          const isExpanded = expanded === batch.id;
          const errorCount = batch.rowErrors?.length ?? 0;
          return (
            <div
              key={batch.id}
              className="rounded-xl border border-ink/10 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="break-all font-display text-base font-semibold text-ink">
                    {batch.filename}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {batch.createdAt
                      ? new Date(batch.createdAt).toLocaleString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span className="text-ink-soft">
                      <strong className="tabular-nums text-ink">
                        {batch.importedRows}
                      </strong>{" "}
                      imported
                    </span>
                    <span className="text-ink-soft">
                      <strong className="tabular-nums text-ink">
                        {batch.skippedRows}
                      </strong>{" "}
                      skipped
                    </span>
                    <span className="text-ink-soft">
                      <strong className="tabular-nums text-teal-700">
                        {batch.approvedCount}
                      </strong>{" "}
                      approved
                    </span>
                    <span className="text-ink-soft">
                      <strong className="tabular-nums text-amber-700">
                        {batch.pendingCount}
                      </strong>{" "}
                      pending
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {batch.pendingCount > 0 && (
                    <button
                      type="button"
                      onClick={() => approveBatch(batch.id)}
                      disabled={busyBatch !== null}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600 active:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {busyBatch === batch.id && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      {busyBatch === batch.id
                        ? "Approving…"
                        : `Approve all pending (${batch.pendingCount})`}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : batch.id)}
                    aria-expanded={isExpanded}
                    disabled={errorCount === 0}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-ink/10 px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-paper-warm hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                    {errorCount > 0
                      ? `Row errors (${errorCount})`
                      : "No row errors"}
                  </button>
                </div>
              </div>

              {isExpanded && batch.rowErrors && batch.rowErrors.length > 0 && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50/60 p-4">
                  <ul className="space-y-2">
                    {batch.rowErrors.map((re, i) => (
                      <li key={`${re.row}-${i}`} className="text-sm">
                        <p className="font-medium text-red-700">
                          Row {re.row}
                          {re.email ? ` · ${re.email}` : ""}
                        </p>
                        <ul className="mt-0.5 list-disc space-y-0.5 pl-5 text-xs text-red-700/80">
                          {re.errors.map((e) => (
                            <li key={e}>{e}</li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-faint">
        <CheckCircle className="h-3.5 w-3.5" />
        Approved counts are derived live from the application queue — no stored
        counters.
      </p>

      <BatchApproveModal
        result={batchResult}
        onClose={() => setBatchResult(null)}
      />
    </div>
  );
}
