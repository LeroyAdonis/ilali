import Link from "next/link";

// ── Types ──
export interface ScheduledEvent {
  id: string;
  dayOfWeek: string; // "MON", "TUE", etc.
  time: string; // "15:00"
  activityName: string;
  providerName: string;
  childName: string;
  clubColor?: "teal" | "gold" | "purple" | "orange";
}

// ── Accent colour map ──
const ACCENT_BG: Record<string, string> = {
  teal: "bg-teal",
  gold: "bg-gold",
  purple: "bg-purple",
  orange: "bg-orange",
};

const ACCENT_BORDER: Record<string, string> = {
  teal: "border-l-teal",
  gold: "border-l-gold",
  purple: "border-l-purple",
  orange: "border-l-orange",
};

const ACCENT_ROTATION = ["teal", "gold", "purple", "orange"] as const;

interface WeekPlannerProps {
  events: ScheduledEvent[];
}

/**
 * WeekPlanner — scheduled club events in a calendar-style list.
 *
 * Mobile: stacked cards with coloured left border.
 * Desktop: table-like rows with consistent spacing.
 * Max 10 events shown; "View all →" link if more exist.
 */
export default async function WeekPlanner({ events }: WeekPlannerProps) {
  const displayEvents = events.slice(0, 10);
  const hasMore = events.length > 10;

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-ink/10 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm font-medium text-ink-soft">
          No upcoming activities this week
        </p>
        <Link
          href="/browse"
          className="mt-3 inline-block text-sm font-semibold text-teal hover:text-teal-deep transition-colors"
        >
          Browse activities →
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-ink">This Week</h2>
        {hasMore && (
          <Link
            href="/browse"
            className="text-sm font-semibold text-teal hover:text-teal-deep transition-colors"
          >
            View all →
          </Link>
        )}
      </div>

      {/* ── Event rows ── */}
      <div className="rounded-xl border border-ink/10 bg-white shadow-sm overflow-hidden">
        {displayEvents.map((event, idx) => {
          const color =
            event.clubColor ?? ACCENT_ROTATION[idx % ACCENT_ROTATION.length];

          return (
            <div
              key={event.id}
              className={`border-l-[5px] ${ACCENT_BORDER[color] ?? "border-l-teal"} ${
                idx > 0 ? "border-t border-ink/10" : ""
              }`}
            >
              {/* Mobile: stacked card */}
              <div className="block sm:hidden p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-sm font-bold text-ink">
                    {event.dayOfWeek}
                  </span>
                  <span className="font-mono text-sm text-ink-soft">
                    {event.time}
                  </span>
                </div>
                <p className="text-sm font-medium text-ink">
                  {event.activityName}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-ink-faint">
                    {event.providerName}
                  </span>
                  <span className="rounded-full bg-paper-warm px-2 py-0.5 text-xs font-medium text-ink-soft">
                    {event.childName}
                  </span>
                </div>
              </div>

              {/* Desktop: table-like row */}
              <div className="hidden sm:flex items-center gap-4 px-5 py-3.5">
                {/* Day + Time */}
                <div className="flex items-center gap-2 w-[130px] shrink-0">
                  <span className="font-mono text-sm font-bold text-ink">
                    {event.dayOfWeek}
                  </span>
                  <span className="font-mono text-sm text-ink-soft">
                    {event.time}
                  </span>
                </div>

                {/* Separator */}
                <span className="text-xs text-ink-faint select-none">·</span>

                {/* Activity name */}
                <span className="text-sm font-medium text-ink min-w-0 truncate">
                  {event.activityName}
                </span>

                {/* Separator */}
                <span className="text-xs text-ink-faint select-none">·</span>

                {/* Provider */}
                <span className="text-xs text-ink-faint min-w-0 truncate">
                  {event.providerName}
                </span>

                {/* Child badge */}
                <span className="ml-auto shrink-0 rounded-full bg-paper-warm px-2 py-0.5 text-xs font-medium text-ink-soft">
                  {event.childName}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
