import Link from "next/link";

type AccentColor = "teal" | "gold" | "purple" | "orange";

const ACCENT_GRADIENTS: Record<AccentColor, string> = {
  teal: "bg-gradient-to-br from-teal to-teal/60",
  gold: "bg-gradient-to-br from-gold to-gold/50",
  purple: "bg-gradient-to-br from-purple to-purple/50",
  orange: "bg-gradient-to-br from-orange to-orange/50",
};

const ACCENT_TEXT: Record<AccentColor, string> = {
  teal: "text-teal-deep-2",
  gold: "text-gold-deep-2",
  purple: "text-purple-deep",
  orange: "text-orange",
};

interface CategoryCardProps {
  name: string;
  icon: string;
  colorClasses: string;
  description?: string;
  href: string;
  /** Accent color for gradient icon area and count text */
  accentColor?: AccentColor;
  /** Number of providers in this category */
  providerCount?: number;
}

export default function CategoryCard({
  name,
  icon,
  colorClasses,
  description,
  href,
  accentColor = "teal",
  providerCount,
}: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-[clamp(12px,1.5vw,16px)] border border-ink/10 bg-white overflow-hidden hover:shadow-lg hover:-translate-y-[3px] transition-all duration-200"
    >
      {/* Gradient icon area with white dot */}
      <div
        className={`relative h-[100px] flex items-center justify-center text-[42px] overflow-hidden ${ACCENT_GRADIENTS[accentColor]}`}
      >
        {icon}
        {/* White accent dot */}
        <span className="absolute top-[10px] right-[10px] h-[8px] w-[8px] rounded-full bg-white opacity-80" />
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-[14px_16px_16px]">
        <h3 className="font-display text-[14px] font-bold text-ink leading-[1.3]">
          {name}
        </h3>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-ink-faint line-clamp-2">
            {description}
          </p>
        )}

        {/* Provider count */}
        {providerCount !== undefined && (
          <span
            className={`mt-auto pt-[10px] text-[11px] font-semibold flex items-center gap-[6px] ${ACCENT_TEXT[accentColor]}`}
          >
            ★ {providerCount} provider{providerCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </Link>
  );
}
