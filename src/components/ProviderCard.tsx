import Link from "next/link";
import { MapPin, Star, CheckCircle, Sparkles } from "lucide-react";
import type { Provider } from "@/lib/types";

const ACCENT_COLORS = {
  teal: "bg-teal",
  gold: "bg-gold",
  purple: "bg-purple",
  orange: "bg-orange",
} as const;

interface ProviderCardProps {
  provider: Provider;
  matchScore?: number;
  matchReasons?: string[];
  /** Optional verification badge rendered by a parent server component */
  verificationBadge?: React.ReactNode;
  /** Accent bar color — rotates through teal/gold/purple/orange */
  accentColor?: keyof typeof ACCENT_COLORS;
}

export default function ProviderCard({
  provider,
  matchScore,
  matchReasons,
  verificationBadge,
  accentColor = "teal",
}: ProviderCardProps) {
  const {
    name,
    category,
    providerName,
    location,
    distance,
    ageRange,
    rating,
    reviewCount,
    price,
    priceLabel,
    image,
    isFree,
    slug,
  } = provider;

  // Determine trust badge
  const isVerified =
    (provider as Provider & { verified?: boolean }).verified ?? false;
  const isTrusted =
    (provider as Provider & { trusted?: boolean }).trusted ?? false;

  return (
    <Link
      href={`/activity/${slug}`}
      className="group flex flex-col rounded-xl border border-ink/10 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden"
    >
      {/* Accent bar — 5px color-wheel strip */}
      <div className={`h-[5px] w-full flex-shrink-0 ${ACCENT_COLORS[accentColor]}`} />

      {/* Image / Placeholder */}
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-ilali-200 to-sunset-200">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-16 w-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-2xl" aria-hidden="true">
              {name.charAt(0)}
            </div>
          </div>
        )}

        {/* Trust badge — top left */}
        {isTrusted ? (
          <span className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm bg-gold/90 text-[#3A2402]">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-[#3A2402] text-[#3A2402]" aria-hidden="true" />
              Trusted
            </span>
          </span>
        ) : isVerified ? (
          <span className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm bg-purple/90 text-white">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" aria-hidden="true" />
              Verified
            </span>
          </span>
        ) : (
          <span className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm bg-orange/90 text-white">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              New
            </span>
          </span>
        )}

        {/* Category badge */}
        <span className="absolute top-3 left-[100px] rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ink-soft shadow-sm backdrop-blur-sm">
          {category}
        </span>

        {/* Age range badge */}
        <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-ink-soft shadow-sm backdrop-blur-sm">
          {ageRange}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-[15px] font-bold text-ink group-hover:text-ilali-600 transition-colors line-clamp-1">
            {name}
          </h3>

          {/* Match score badge */}
          {matchScore !== undefined && (
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                matchScore >= 80
                  ? "bg-gradient-to-r from-ilali-500 to-ilali-600 text-white"
                  : matchScore >= 60
                    ? "bg-ilali-100 text-ilali-700"
                    : "bg-paper-warm text-ink-soft"
              }`}
            >
              {matchScore}% match
            </span>
          )}
        </div>

        <p className="mt-0.5 text-xs text-ink-faint">{providerName}</p>

        {/* Verification badge — injected by server parent */}
        {verificationBadge && (
          <div className="mt-1.5">{verificationBadge}</div>
        )}

        {/* Match reason tags */}
        {matchReasons && matchReasons.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {matchReasons.slice(0, 3).map((reason) => (
              <span
                key={reason}
                className="inline-block rounded-full bg-ilali-50 px-2 py-0.5 text-[10px] font-medium text-ilali-700"
              >
                {reason}
              </span>
            ))}
          </div>
        )}

        {/* Location */}
        <div className="mt-2 flex items-center gap-1 text-xs text-ink-faint">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
          <span>
            {location} &middot; {distance}
          </span>
        </div>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
          <span className="text-sm font-semibold text-ink">{rating}</span>
          <span className="text-xs text-ink-faint">
            ({reviewCount} review{reviewCount !== 1 ? "s" : ""})
          </span>
        </div>

        {/* Price / Free */}
        <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
          {isFree ? (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
              Free
            </span>
          ) : (
            <div>
              <span className="text-sm font-bold text-ink">{price}</span>
              <span className="ml-1 text-xs text-ink-faint">{priceLabel}</span>
            </div>
          )}
          <span className="text-xs font-medium text-ilali-600 group-hover:underline">
            View details
          </span>
        </div>
      </div>
    </Link>
  );
}
