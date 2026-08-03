import Link from "next/link";

// ── Types ──
export interface ClubMembershipWithProvider {
  id: string;
  providerId: string;
  providerName: string;
  providerSlug: string;
  nextEventDate?: string; // e.g. "Wed 16:00"
  unreadCount: number;
}

// ── Accent colour map ──
const ACCENT_BG: Record<string, string> = {
  teal: "bg-teal",
  gold: "bg-gold",
  purple: "bg-purple",
  orange: "bg-orange",
};

const ACCENT_ROTATION = ["teal", "gold", "purple", "orange"] as const;

interface ClubCardsRowProps {
  memberships: ClubMembershipWithProvider[];
}

/**
 * ClubCardsRow — joined clubs with unread indicators.
 *
 * Responsive grid: 1 col mobile, 2 col sm, 4 col lg.
 * Each card: provider name, next event, unread badge, accent bar.
 * Max 4 cards shown.
 */
export default async function ClubCardsRow({
  memberships,
}: ClubCardsRowProps) {
  const displayMemberships = memberships.slice(0, 4);

  if (memberships.length === 0) {
    return (
      <div className="rounded-xl border border-ink/10 bg-white px-5 py-10 text-center shadow-sm">
        <p className="text-sm font-medium text-ink-soft">
          Join a club to see it here
        </p>
        <Link
          href="/clubs"
          className="mt-3 inline-block text-sm font-semibold text-teal hover:text-teal-deep transition-colors"
        >
          Browse clubs →
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {displayMemberships.map((m, idx) => {
        const color =
          ACCENT_ROTATION[idx % ACCENT_ROTATION.length];

        return (
          <Link
            key={m.id}
            href={`/clubs/${m.providerSlug}`}
            className="group flex flex-col rounded-xl border border-ink/10 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
          >
            {/* Accent bar at top */}
            <div
              className={`h-[5px] w-full shrink-0 ${ACCENT_BG[color]}`}
            />

            <div className="flex flex-1 flex-col p-4">
              {/* Provider name */}
              <h3 className="font-display text-sm font-bold text-ink group-hover:text-teal transition-colors line-clamp-2">
                {m.providerName}
              </h3>

              {/* Next event */}
              {m.nextEventDate ? (
                <p className="mt-1.5 text-xs text-ink-faint">
                  Next: {m.nextEventDate}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-ink-faint">
                  No upcoming events
                </p>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Unread badge */}
              {m.unreadCount > 0 && (
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-xs font-semibold text-red-600">
                    {m.unreadCount} new message{m.unreadCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
