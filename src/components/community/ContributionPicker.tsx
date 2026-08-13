"use client";

import { useCallback, useState } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { Loader2, Sparkles, X } from "lucide-react";

// ── Contribution definitions ──

const CONTRIBUTION_OPTIONS = [
  {
    type: "venue-help" as const,
    emoji: "🧹",
    label: "Venue help",
    desc: "Set up, clean up, fix something",
    points: 25,
    accent: "bg-teal-500/10",
  },
  {
    type: "event-support" as const,
    emoji: "🎪",
    label: "Event support",
    desc: "Help at tournament, assist coach, bring snacks",
    points: 30,
    accent: "bg-gold/10",
  },
  {
    type: "community-building" as const,
    emoji: "🤝",
    label: "Community",
    desc: "Welcome new member, organise social",
    points: 20,
    accent: "bg-purple/10",
  },
  {
    type: "knowledge-sharing" as const,
    emoji: "📚",
    label: "Knowledge",
    desc: "Share a skill, mentor, help with admin",
    points: 50,
    accent: "bg-orange/10",
  },
  {
    type: "outreach" as const,
    emoji: "📣",
    label: "Outreach",
    desc: "Get sponsor, bring in provider, distribute flyers",
    points: 50,
    accent: "bg-rose-400/10",
  },
] as const;

type ContributionType = (typeof CONTRIBUTION_OPTIONS)[number]["type"];

interface ContributionPickerProps {
  clubId: string;
  clubName: string;
}

export default function ContributionPicker({
  clubId,
  clubName,
}: ContributionPickerProps) {
  const { data: session, isPending: sessionPending } = useSession();
  const signedIn = !!session?.user;

  const [selected, setSelected] = useState<ContributionType | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setSelected(null);
    setDescription("");
    setError(null);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selected) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/community/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId,
          type: selected,
          description: description.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to submit contribution.");
      } else {
        setSuccess(
          `🎉 Logged: ${CONTRIBUTION_OPTIONS.find((o) => o.type === selected)?.label} at ${clubName}! +${CONTRIBUTION_OPTIONS.find((o) => o.type === selected)?.points} pts`
        );
        setSelected(null);
        setDescription("");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }, [selected, description, clubId, clubName]);

  // ── Not signed in ──
  if (!sessionPending && !signedIn) {
    return (
      <section
        aria-labelledby="contribute-heading"
        className="rounded-xl border border-ink/10 bg-paper-warm p-5"
      >
        <h2
          id="contribute-heading"
          className="font-display flex items-center gap-2 text-sm font-bold text-ink"
        >
          <Sparkles className="h-4 w-4 text-sunset-500" aria-hidden="true" />
          Contribute
        </h2>
        <p className="mt-2 text-xs text-ink-soft">
          Sign in to log your contributions and earn rewards points.
        </p>
        <Link
          href="/sign-in"
          className="mt-3 inline-block rounded-full bg-ilali-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-ilali-700"
        >
          Sign in
        </Link>
      </section>
    );
  }

  // ── Signed in ──
  return (
    <section
      aria-labelledby="contribute-heading"
      className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm"
    >
      <h2
        id="contribute-heading"
        className="font-display flex items-center gap-2 text-sm font-bold text-ink"
      >
        <Sparkles className="h-4 w-4 text-sunset-500" aria-hidden="true" />
        Contribute to {clubName}
      </h2>

      {/* Success message */}
      {success && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-teal/10 p-3 text-xs font-medium text-text-teal-deep">
          <span className="mt-px shrink-0">✅</span>
          <span className="flex-1">{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="shrink-0 text-ink-faint hover:text-ink"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      {/* Selection grid */}
      {!selected ? (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CONTRIBUTION_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => {
                setSelected(opt.type);
                setError(null);
              }}
              disabled={submitting}
              className="flex items-start gap-3 rounded-xl border border-ink/10 bg-paper-warm p-3 text-left transition-colors hover:bg-white hover:shadow-sm disabled:opacity-50"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl ${opt.accent}`}
                aria-hidden="true"
              >
                {opt.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {opt.label}
                  </span>
                  <span className="shrink-0 rounded-full bg-ilali-50 px-2 py-px text-[10px] font-bold text-ilali-700">
                    +{opt.points} pts
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ink-faint">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        /* ── Confirmation step ── */
        <div className="mt-3 rounded-xl border border-ink/10 bg-paper-warm p-4">
          <p className="text-sm font-semibold text-ink">
            Log: <span className="text-ilali-600">{CONTRIBUTION_OPTIONS.find((o) => o.type === selected)?.label}</span>{" "}
            at {clubName}?
          </p>
          <textarea
            className="mt-2 w-full rounded-lg border border-ink/10 bg-white p-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-400 focus:outline-none focus:ring-1 focus:ring-ilali-400"
            placeholder="Optional: add a note (e.g. 'Helped set up the netball court')"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 rounded-full bg-ilali-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-ilali-700 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                "✅ Confirm"
              )}
            </button>
            <button
              onClick={resetForm}
              disabled={submitting}
              className="rounded-full px-4 py-2 text-xs font-semibold text-ink-soft transition-colors hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
