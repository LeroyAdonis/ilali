"use client";

import { useState } from "react";
import { Check, Copy, X } from "lucide-react";
import type { BatchApproveResult } from "@/lib/import/types";

/**
 * Batch-approve summary modal (spec Scenario 3, T021).
 * Per-provider temp passwords with Copy buttons + email status, plus an
 * actionable list of failed rows. Reuses the teal temp-password panel pattern
 * from ApplicationCard. Shared by /admin/import (per-batch approve) and
 * /admin/applications (bulk bar).
 */
export function BatchApproveModal({
  result,
  onClose,
}: {
  result: BatchApproveResult | null;
  onClose: () => void;
}) {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  if (!result) return null;

  const { approved, failed } = result;

  async function copyPassword(email: string, password: string) {
    try {
      await navigator.clipboard.writeText(password);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch {
      // Clipboard unavailable — the password is visible on screen to copy manually.
    }
  }

  const body = (
    <div className="px-5 py-5 sm:px-6">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-sm font-semibold text-ink">
          {approved.length} approved
          {failed.length > 0 && (
            <span className="text-red-600"> · {failed.length} failed</span>
          )}
        </p>
        <p className="text-xs text-ink-faint">
          {approved.length > 0
            ? "Share each temp password securely — providers must change it on first login."
            : "No applications were approved."}
        </p>
      </div>

      {approved.length > 0 && (
        <ul className="space-y-3">
          {approved.map((a) => (
            <li
              key={a.id}
              className="rounded-lg border border-teal-200 bg-teal-50 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="break-all text-xs font-semibold uppercase tracking-wide text-teal-700">
                    {a.email}
                  </p>
                  <p className="mt-1 break-all font-mono text-base font-semibold tracking-wide text-ink">
                    {a.tempPassword}
                  </p>
                  {a.emailSent ? (
                    <p className="mt-1.5 text-xs font-medium text-teal-700">
                      📧 Welcome email sent to {a.email}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-ink-faint">
                      Email sending not configured — copy the password manually.
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => copyPassword(a.email, a.tempPassword)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-ink-soft ring-1 ring-ink/10 transition-colors hover:bg-paper-warm hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600 active:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copiedEmail === a.email ? (
                    <Check className="h-3.5 w-3.5 text-teal-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedEmail === a.email ? "Copied" : "Copy"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {failed.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">
            Failed — status unchanged, fix and re-approve individually
          </p>
          <ul className="space-y-2">
            {failed.map((f) => (
              <li
                key={f.id}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5"
              >
                <p className="break-all text-sm font-medium text-red-700">{f.email}</p>
                <p className="mt-0.5 text-xs text-red-700/80">{f.error}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-ilali-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ilali-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600 active:bg-ilali-800"
        >
          Done
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Batch approve summary"
    >
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />

      {/* Mobile: bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-10 sm:hidden">
        <div className="max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white shadow-xl">
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-ink/10 bg-white px-5 py-4">
            <h2 className="font-display text-lg font-bold text-ink">
              Batch approve summary
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-soft hover:bg-paper-warm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {body}
        </div>
      </div>

      {/* Desktop: centered modal */}
      <div className="fixed inset-0 z-10 hidden items-center justify-center p-4 sm:flex">
        <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl">
          <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b border-ink/10 bg-white px-6 py-4">
            <h2 className="font-display text-lg font-bold text-ink">
              Batch approve summary
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-soft hover:bg-paper-warm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="max-h-[70vh] overflow-y-auto">{body}</div>
        </div>
      </div>
    </div>
  );
}
