"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckSquare, Loader2, Square } from "lucide-react";
import { ApplicationCard, type Application } from "./ApplicationCard";
import { BatchApproveModal } from "@/components/admin/BatchApproveModal";
import type { BatchApproveResult } from "@/lib/import/types";

/**
 * WS-4 selection + bulk approve (spec Scenario 3, T020/T021).
 * Renders the application cards with checkboxes on approvable rows, a bulk bar
 * ("Approve selected (N)"), and the shared batch summary modal. The existing
 * single-card Approve/Reject/Regenerate flow stays fully functional — each
 * card still talks to its own route.
 */
export function ApplicationsList({
  applications,
  emailsWithAccount,
}: {
  applications: Application[];
  emailsWithAccount: Set<string>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BatchApproveResult | null>(null);

  const selectableIds = useMemo(
    () =>
      new Set(
        applications
          .filter((a) => a.status === "pending" || a.status === "contacted")
          .map((a) => a.id)
      ),
    [applications]
  );

  const selectedIds = [...selected].filter((id) => selectableIds.has(id));
  const allSelected =
    selectableIds.size > 0 && selectedIds.length === selectableIds.size;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(selectableIds));
  }

  async function approveSelected() {
    if (selectedIds.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/applications/batch-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Batch approve failed. Please try again.");
        return;
      }
      setResult(body as BatchApproveResult);
      setSelected(new Set());
      router.refresh();
    } catch {
      setError("Batch approve failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {applications.length === 0 ? (
        <div className="rounded-xl border border-ink/10 bg-white px-6 py-12 text-center">
          <Building2 className="mx-auto h-12 w-12 text-ink-faint" />
          <p className="mt-3 text-sm text-ink-faint">No applications yet.</p>
        </div>
      ) : (
        <>
          {selectableIds.size > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="mb-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-ink/10 px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-paper-warm hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600"
            >
              {allSelected ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              {allSelected ? "Clear selection" : "Select all pending"}
            </button>
          )}

          <div className="space-y-4">
            {applications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                accountExists={emailsWithAccount.has(
                  (app.email || "").toLowerCase().trim()
                )}
                selected={selected.has(app.id)}
                onToggleSelect={() => toggle(app.id)}
              />
            ))}
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
            >
              {error}
            </p>
          )}

          {/* Bulk bar — appears when rows are selected */}
          {selectedIds.length > 0 && (
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 px-4 py-3 backdrop-blur sm:px-8">
              <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-ink">
                  {selectedIds.length} selected
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelected(new Set())}
                    disabled={busy}
                    className="inline-flex min-h-[44px] items-center rounded-lg border border-ink/10 px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-paper-warm hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={approveSelected}
                    disabled={busy}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600 active:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                    {busy ? "Approving…" : `Approve selected (${selectedIds.length})`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <BatchApproveModal result={result} onClose={() => setResult(null)} />
    </div>
  );
}
