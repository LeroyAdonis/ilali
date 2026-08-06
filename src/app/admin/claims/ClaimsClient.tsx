"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  RotateCcw,
  Copy,
  Check,
  Trash2,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";

export interface ClaimRow {
  id: string;
  name: string;
  email: string;
  slug: string | null;
  providerName: string | null;
  needsClaim: boolean;
  hasCode: boolean;
  expiresAt: Date | null;
  attempts: number;
  lockedUntil: Date | null;
}

interface RevealedCode {
  claimCode: string;
  expiresAt: string;
}

/**
 * Admin claim-code table (WS-3). Per-row Generate/Regenerate → POST
 * /api/admin/claims/[id]/code; the plaintext code comes back in that response
 * and is shown inline ONCE (never re-fetchable, never stored in plaintext).
 */
export default function ClaimsClient({ rows }: { rows: ClaimRow[] }) {
  const router = useRouter();
  const [revealed, setRevealed] = useState<Record<string, RevealedCode>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function isLocked(row: ClaimRow): boolean {
    return row.lockedUntil != null && new Date(row.lockedUntil) > new Date();
  }

  function formatDate(d: Date | string | null): string {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-ZA", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleGenerate(row: ClaimRow) {
    setBusyId(row.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/claims/${row.id}/code`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate a claim code");
        return;
      }
      // Plaintext is only available in this response — surface it now.
      setRevealed((prev) => ({
        ...prev,
        [row.id]: { claimCode: data.claimCode, expiresAt: data.expiresAt },
      }));
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleClear(row: ClaimRow) {
    setBusyId(row.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/claims/${row.id}/code`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to clear the claim code");
        return;
      }
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleCopy(rowId: string, code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(rowId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setError("Could not copy — select the code and copy manually.");
    }
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-ink/10 bg-white px-6 py-12 text-center">
          <p className="text-sm text-ink-faint">
            No providers waiting to claim a listing.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-paper-warm/80 border-b border-ink/10">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-faint">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-faint">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-faint">
                    Code status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-faint">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-ink-faint">
                    Attempts
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-ink-faint">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {rows.map((row) => {
                  const locked = isLocked(row);
                  const revealedCode = revealed[row.id];
                  return (
                    <tr key={row.id} className="align-top hover:bg-paper-warm/50">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-ink">{row.name}</p>
                        {row.slug ? (
                          <a
                            href={`/providers/${row.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 text-xs text-ilali-600 hover:text-ilali-700"
                          >
                            {row.providerName || row.slug}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <p className="mt-0.5 text-xs text-ink-faint">
                            {row.providerName || "No listing linked"}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-soft">{row.email}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {row.hasCode ? (
                            <span className="inline-flex items-center gap-1 rounded bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
                              <KeyRound className="h-3 w-3" />
                              Code issued
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                              No code
                            </span>
                          )}
                          {locked && (
                            <span className="inline-flex items-center gap-1 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              <ShieldAlert className="h-3 w-3" />
                              Locked until{" "}
                              {formatDate(row.lockedUntil)}
                            </span>
                          )}
                          {!row.needsClaim && !row.hasCode && (
                            <span className="rounded bg-paper-warm px-2 py-0.5 text-xs font-medium text-ink-faint">
                              Claimed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-soft">
                        {formatDate(row.expiresAt)}
                      </td>
                      <td className="px-6 py-4 text-sm text-ink-soft">
                        {row.attempts > 0 ? (
                          <span
                            className={
                              row.attempts >= 4
                                ? "font-medium text-red-600"
                                : "text-ink-soft"
                            }
                          >
                            {row.attempts}/5
                          </span>
                        ) : (
                          "0/5"
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleGenerate(row)}
                              disabled={busyId === row.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-ilali-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-ilali-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {row.hasCode ? (
                                <>
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  Regenerate
                                </>
                              ) : (
                                <>
                                  <KeyRound className="h-3.5 w-3.5" />
                                  Generate code
                                </>
                              )}
                            </button>
                            {row.hasCode && (
                              <button
                                onClick={() => handleClear(row)}
                                disabled={busyId === row.id}
                                aria-label="Clear claim code"
                                className="inline-flex items-center gap-1 rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:border-red-200 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Clear
                              </button>
                            )}
                          </div>

                          {revealedCode && (
                            <div className="w-full rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5">
                              <p className="text-[11px] font-medium text-teal-700 uppercase tracking-wide">
                                Claim code — shown once, copy it now
                              </p>
                              <div className="mt-1.5 flex items-center justify-between gap-3">
                                <code className="font-mono text-base font-bold tracking-widest text-ink">
                                  {revealedCode.claimCode}
                                </code>
                                <button
                                  onClick={() =>
                                    handleCopy(row.id, revealedCode.claimCode)
                                  }
                                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-teal-700"
                                >
                                  {copiedId === row.id ? (
                                    <>
                                      <Check className="h-3.5 w-3.5" />
                                      Copied
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" />
                                      Copy
                                    </>
                                  )}
                                </button>
                              </div>
                              <p className="mt-1.5 text-[11px] text-teal-700">
                                Expires {formatDate(revealedCode.expiresAt)}.
                                Send it to the provider out-of-band (WhatsApp).
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
