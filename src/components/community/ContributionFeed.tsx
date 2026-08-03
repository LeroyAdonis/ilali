"use client";

import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";

// ── Types matching API response ──

type ContributionType =
  | "venue-help"
  | "event-support"
  | "community-building"
  | "knowledge-sharing"
  | "outreach";

type ContributionStatus = "pending" | "confirmed" | "rejected" | "flagged";

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
  status: ContributionStatus;
  confirmedBy: string | null;
  confirmedByName: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

// ── Contribution emoji map ──

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

const STATUS_STYLE: Record<ContributionStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-teal-50 text-teal-700",
  rejected: "bg-red-50 text-red-700",
  flagged: "bg-orange-50 text-orange-700",
};

// ── Date formatter ──

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

interface ContributionFeedProps {
  clubId: string;
}

export default function ContributionFeed({ clubId }: ContributionFeedProps) {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/community/contributions?clubId=${encodeURIComponent(clubId)}&limit=30`
        );
        if (!res.ok) throw new Error("Failed to load contributions");
        const data = await res.json();
        if (!cancelled) setContributions(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [clubId]);

  // ── Loading ──
  if (loading) {
    return (
      <section
        aria-label="Recent contributions"
        className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm"
      >
        <h3 className="font-display flex items-center gap-2 text-sm font-bold text-ink">
          <Heart className="h-4 w-4 text-ilali-500" aria-hidden="true" />
          Recent contributions
        </h3>
        <div className="mt-4 flex items-center justify-center py-8 text-ink-faint">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      </section>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <section
        aria-label="Recent contributions"
        className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm"
      >
        <h3 className="font-display flex items-center gap-2 text-sm font-bold text-ink">
          <Heart className="h-4 w-4 text-ilali-500" aria-hidden="true" />
          Recent contributions
        </h3>
        <p className="mt-3 text-xs text-red-600">{error}</p>
      </section>
    );
  }

  // ── Empty state ──
  if (contributions.length === 0) {
    return (
      <section
        aria-label="Recent contributions"
        className="rounded-xl border border-dashed border-ink/10 bg-paper-warm p-6 text-center"
      >
        <Heart className="mx-auto h-6 w-6 text-ink-faint" aria-hidden="true" />
        <p className="mt-2 text-sm font-medium text-ink-soft">
          No contributions yet — be the first!
        </p>
        <p className="mt-1 text-xs text-ink-faint">
          Log your help to earn rewards points and build your club&rsquo;s
          reputation.
        </p>
      </section>
    );
  }

  // ── Feed ──
  return (
    <section
      aria-label="Recent contributions"
      className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm"
    >
      <h3 className="font-display flex items-center gap-2 text-sm font-bold text-ink">
        <Heart className="h-4 w-4 text-ilali-500" aria-hidden="true" />
        Recent contributions
      </h3>

      <ul className="mt-3 divide-y divide-ink/10">
        {contributions.map((c) => (
          <li key={c.id} className="flex items-start gap-3 py-3 first:pt-0">
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
              </div>

              {c.description && (
                <p className="mt-0.5 text-xs text-ink-soft line-clamp-2">
                  {c.description}
                </p>
              )}

              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
                {/* Points */}
                <span className="font-mono font-semibold text-ilali-600">
                  +{c.points} pts
                </span>

                {/* Status badge */}
                <span
                  className={`rounded-full px-2 py-px text-[10px] font-semibold ${STATUS_STYLE[c.status] ?? "bg-gray-50 text-gray-600"}`}
                >
                  {c.status}
                </span>

                {/* Confirmed by */}
                {c.confirmedByName && (
                  <span>
                    confirmed by {c.confirmedByName}
                  </span>
                )}

                {/* Time */}
                <span className="tabular-nums">
                  {relativeTime(c.createdAt)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
