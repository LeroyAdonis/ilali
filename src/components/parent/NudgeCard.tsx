"use client";

export interface NudgeCardProps {
  onAddChild: () => void;
}

export default function NudgeCard({ onAddChild }: NudgeCardProps) {
  return (
    <div className="rounded-xl border border-gold/20 bg-amber-50 shadow-sm p-6">
      <h3 className="font-display text-lg font-bold text-ink">
        👶 Add your kids to unlock:
      </h3>

      <ul className="mt-4 space-y-2">
        {[
          "Personalised activity matches",
          "Join clubs and chat",
          "Ride sharing with parents",
        ].map((benefit) => (
          <li
            key={benefit}
            className="flex items-start gap-2 text-sm text-ink-soft"
          >
            <span className="mt-0.5 shrink-0 text-gold">✦</span>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onAddChild}
        className="mt-5 inline-flex items-center gap-2 rounded-[10px] bg-gold px-6 py-3 text-[15px] font-semibold text-[#3A2402] shadow-sm transition-colors hover:bg-gold-deep"
      >
        Add Your Children →
      </button>
    </div>
  );
}
