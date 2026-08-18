"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { ClipboardCheck, X } from "lucide-react";
import { IlaliSpinner } from "@/components/IlaliSpinner";

// ── Types matching API response ──

type ContributionType =
  | "venue-help"
  | "event-support"
  | "community-building"
  | "knowledge-sharing"
  | "outreach";

interface Contribution {
  id: string;
  userId: string;
  userName: string | null;
  clubId: string;
  clubName: string;
  type: ContributionType;
  description: string | null;
  points: number;
  validationPath: "leader" | "peer";
  status: string;
  confirmedBy: string | null;
  confirmedByName: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

// ── Emoji & label maps ──

const TYPE_EMOJI: Record<ContributionType, string> = {
  "venue-help": "🧹",
  "event-support": "🎪",
  "community-building": "🤝",
  "knowledge-sharing": "📚",
  "outreach": "📣",
};

const TYPE_LABEL: Record<ContributionType, string> = {
  "venue-help": "Venue help",
  "event-support": "Event support",
  "community-building": "Community",
  "knowledge-sharing": "Knowledge",
  "outreach": "Outreach",
};

// ── Relative time ──

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
  });
}

// ── Props ──

interface PendingConfirmationsProps {
  clubId: string;
  providerName: string;
}

export default function PendingConfirmations({
  clubId,
  providerName,
}: PendingConfirmationsProps) {
  const { data: session, isPending: sessionPending } = useSession();

  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Per-item action state: { [id]: "confirming" | "confirmed" | "denying" | "denied" | "error" | null }
  const [actionState, setActionState] = useState<
    Record<string, { status: string; message?: string }>
  >({});

  // ── Is the current user the club leader? ──
  const user = session?.user as { role?: string; name?: string } | undefined;
  const isLeader =
    !sessionPending &&
    !!user &&
    user.role === "provider" &&
    user.name?.toLowerCase() === providerName.toLowerCase();

  // ── Fetch pending contributions ──

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/community/contributions?clubId=${encodeURIComponent(clubId)}&status=pending`
      );
      if (!res.ok) throw new Error("Failed to load pending contributions");
      const data = await res.json();
      setContributions(
        Array.isArray(data)
          ? data.filter((c: Contribution) => c.validationPath === "leader")
          : []
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    if (isLeader) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: fetch-on-mount sets loading synchronously, data arrives async
      load();
    }
  }, [isLeader, load]);

  // ── Confirm action ──

  const handleConfirm = useCallback(async (contributionId: string) => {
    setActionState((prev) => ({
      ...prev,
      [contributionId]: { status: "confirming" },
    }));

    try {
      const res = await fetch(
        `/api/community/contributions/${contributionId}/confirm`,
        { method: "POST" }
      );
      const data = await res.json();

      if (!res.ok) {
        if (data.collusionFlag) {
          setActionState((prev) => ({
            ...prev,
            [contributionId]: {
              status: "error",
              message:
                "This is your 4th confirmation for this member in 7 days. A second opinion from another club leader is needed.",
            },
          }));
        } else {
          setActionState((prev) => ({
            ...prev,
            [contributionId]: {
              status: "error",
              message: data.error ?? "Failed to confirm",
            },
          }));
        }
        return;
      }

      setActionState((prev) => ({
        ...prev,
        [contributionId]: { status: "confirmed" },
      }));

      // Remove from list after a brief delay
      setTimeout(() => {
        setContributions((prev) =>
          prev.filter((c) => c.id !== contributionId)
        );
      }, 1500);
    } catch {
      setActionState((prev) => ({
        ...prev,
        [contributionId]: { status: "error", message: "Network error" },
      }));
    }
  }, []);

  // ── Deny action ──

  const handleDeny = useCallback(async (contributionId: string) => {
    setActionState((prev) => ({
      ...prev,
      [contributionId]: { status: "denying" },
    }));

    try {
      const res = await fetch(
        `/api/community/contributions/${contributionId}/confirm`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "deny" }),
        }
      );
      const data = await res.json();

      if (!res.ok) {
        setActionState((prev) => ({
          ...prev,
          [contributionId]: {
            status: "error",
            message: data.error ?? "Failed to deny",
          },
        }));
        return;
      }

      setActionState((prev) => ({
        ...prev,
        [contributionId]: { status: "denied" },
      }));

      // Remove from list after a brief delay
      setTimeout(() => {
        setContributions((prev) =>
          prev.filter((c) => c.id !== contributionId)
        );
      }, 1500);
    } catch {
      setActionState((prev) => ({
        ...prev,
        [contributionId]: { status: "error", message: "Network error" },
      }));
    }
  }, []);

  // ── Don't render anything if not a leader ──
  if (sessionPending) return null;
  if (!isLeader) return null;

  // ── Loading ──
  if (loading) {
    return (
      <section
        aria-labelledby="pending-confirmations-heading"
        className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm"
      >
        <h2
          id="pending-confirmations-heading"
          className="font-display flex items-center gap-2 text-sm font-bold text-ink"
        >
          <ClipboardCheck
            className="h-4 w-4 text-teal-600"
            aria-hidden="true"
          />
          Pending confirmations
        </h2>
        <div className="mt-4 flex items-center justify-center py-8 text-ink-faint">
          <IlaliSpinner size="xs" />
        </div>
      </section>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <section
        aria-labelledby="pending-confirmations-heading"
        className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm"
      >
        <h2
          id="pending-confirmations-heading"
          className="font-display flex items-center gap-2 text-sm font-bold text-ink"
        >
          <ClipboardCheck
            className="h-4 w-4 text-teal-600"
            aria-hidden="true"
          />
          Pending confirmations
        </h2>
        <p className="mt-3 text-xs text-red-600">{error}</p>
      </section>
    );
  }

  // ── Empty (no pending) ──
  if (contributions.length === 0) return null;

  // ── Pending list ──

  return (
    <section
      aria-labelledby="pending-confirmations-heading"
      className="rounded-xl border border-teal-500/30 bg-white p-5 shadow-sm"
    >
      <h2
        id="pending-confirmations-heading"
        className="font-display flex items-center gap-2 text-sm font-bold text-ink"
      >
        <ClipboardCheck
          className="h-4 w-4 text-teal-600"
          aria-hidden="true"
        />
        Pending confirmations
        <span className="font-mono text-xs font-normal text-ink-soft">
          ({contributions.length})
        </span>
      </h2>

      <ul className="mt-3 divide-y divide-ink/10">
        {contributions.map((c) => {
          const state = actionState[c.id];
          const isDone =
            state?.status === "confirmed" ||
            state?.status === "denied";
          const isBusy =
            state?.status === "confirming" ||
            state?.status === "denying";

          return (
            <li
              key={c.id}
              className={`flex items-start gap-3 py-3 first:pt-0 last:pb-0 transition-opacity duration-300 ${
                isDone ? "opacity-50" : ""
              }`}
            >
              {/* Emoji */}
              <span
                className="mt-0.5 text-lg shrink-0"
                aria-hidden="true"
              >
                {TYPE_EMOJI[c.type] ?? "✨"}
              </span>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {c.userName ?? "Club member"}
                  </span>
                  <span className="text-xs text-ink-faint">
                    {TYPE_LABEL[c.type] ?? c.type}
                  </span>
                  <span className="font-mono text-xs font-semibold text-teal-700">
                    +{c.points} pts
                  </span>
                </div>

                {c.description && (
                  <p className="mt-0.5 text-xs text-ink-soft line-clamp-2">
                    {c.description}
                  </p>
                )}

                <p className="mt-1 text-xs tabular-nums text-ink-faint">
                  {relativeTime(c.createdAt)}
                </p>

                {/* Action feedback */}
                {state?.status === "error" && state.message && (
                  <p
                    className={`mt-2 rounded-lg p-2 text-xs font-medium ${
                      state.message.includes("collusion") ||
                      state.message.includes("second opinion")
                        ? "bg-amber-50 text-amber-600"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {state.message}
                  </p>
                )}

                {state?.status === "confirmed" && (
                  <p className="mt-2 text-xs font-medium text-emerald-600">
                    ✅ Confirmed!
                  </p>
                )}

                {state?.status === "denied" && (
                  <p className="mt-2 text-xs font-medium text-rose-500">
                    ✕ Denied
                  </p>
                )}
              </div>

              {/* Action buttons */}
              {!state && (
                <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
                  <button
                    onClick={() => handleConfirm(c.id)}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:bg-emerald-100 disabled:opacity-50"
                    title="Confirm this contribution"
                  >
                    ✅ Confirm
                  </button>
                  <button
                    onClick={() => handleDeny(c.id)}
                    disabled={isBusy}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-200 disabled:opacity-50"
                    title="Deny this contribution"
                  >
                    <X className="h-3.5 w-3.5" />
                    Deny
                  </button>
                </div>
              )}

              {/* Busy indicator */}
              {isBusy && (
                <div className="flex shrink-0 items-center pt-0.5">
                  <IlaliSpinner size="xs" />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
