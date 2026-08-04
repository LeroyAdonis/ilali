"use client";

interface ActivityStatsProps {
  inquiries: number;
  members: number;
  events: number;
  reviews: number;
}

const STAT_CARDS = [
  { key: "inquiries", icon: "💬", label: "Inquiries this week" },
  { key: "members", icon: "👥", label: "Club members" },
  { key: "events", icon: "📅", label: "Upcoming events" },
  { key: "reviews", icon: "⭐", label: "Reviews" },
] as const;

const ACCENT_BORDERS = [
  "border-l-teal",
  "border-l-gold",
  "border-l-purple",
  "border-l-orange",
] as const;

export default function ActivityStats({
  inquiries = 0,
  members = 0,
  events = 0,
  reviews = 0,
}: Partial<ActivityStatsProps>) {
  const counts: Record<string, number> = {
    inquiries,
    members,
    events,
    reviews,
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {STAT_CARDS.map((card, i) => (
        <div
          key={card.key}
          className={`rounded-xl border border-ink/10 bg-white p-4 shadow-sm border-l-4 ${ACCENT_BORDERS[i]}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              {card.icon}
            </span>
            <span className="font-display text-2xl font-bold text-ink">
              {counts[card.key]}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-faint">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
