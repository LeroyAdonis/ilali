"use client";

import { useEffect, useState } from "react";
import { Activity, Users } from "lucide-react";
import { IlaliSpinner } from "@/components/IlaliSpinner";

// ── Types ──

type Health = "green" | "yellow" | "red";

interface ClubHealthData {
  health: Health;
  totalContributors: number;
  uniqueContributors: number;
  concentrationRatio: number;
}

const HEALTH_MAP: Record<
  Health,
  { dot: string; label: string; style: string }
> = {
  green: {
    dot: "bg-green-500",
    label: "Healthy",
    style: "text-green-700",
  },
  yellow: {
    dot: "bg-yellow-500",
    label: "Growing",
    style: "text-yellow-700",
  },
  red: {
    dot: "bg-red-500",
    label: "Needs help",
    style: "text-red-700",
  },
};

interface ClubHealthCardProps {
  slug: string;
}

export default function ClubHealthCard({ slug }: ClubHealthCardProps) {
  const [data, setData] = useState<ClubHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `/api/clubs/${encodeURIComponent(slug)}/health`
        );
        if (!res.ok) throw new Error("Failed to load club health");
        const json = await res.json();
        if (!cancelled) setData(json);
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
  }, [slug]);

  // ── Loading skeleton ──
  if (loading) {
    return (
      <div className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-center py-4 text-ink-faint">
          <IlaliSpinner size="xs" />
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <div className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
        <p className="text-xs text-ink-faint">
          {error ?? "Club health data unavailable"}
        </p>
      </div>
    );
  }

  const info = HEALTH_MAP[data.health] ?? HEALTH_MAP.red;

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
      {/* Header row */}
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-ink-faint" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Club Health
        </span>
      </div>

      {/* Status dot + label */}
      <div className="mt-2 flex items-center gap-2">
        <span
          className={`inline-block h-3 w-3 rounded-full ${info.dot}`}
          aria-hidden="true"
        />
        <span
          className={`text-sm font-bold ${info.style}`}
        >
          {info.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="mt-3 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg bg-paper-warm p-2">
          <p className="text-lg font-extrabold text-ink tabular-nums">
            {data.totalContributors}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
            <Users className="mr-0.5 inline h-3 w-3" aria-hidden="true" />
            Contributors
          </p>
        </div>
        <div className="rounded-lg bg-paper-warm p-2">
          <p className="text-lg font-extrabold text-ink tabular-nums">
            {data.uniqueContributors}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
            Unique
          </p>
        </div>
      </div>

      {/* Spread indicator */}
      <div className="mt-2 flex items-center justify-between text-xs text-ink-faint">
        <span>Spread</span>
        <span className="font-mono font-semibold text-ink-soft">
          {Math.round(data.concentrationRatio * 100)}%
        </span>
      </div>
    </div>
  );
}
