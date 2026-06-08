import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import type { Provider } from "@/lib/types";

interface ProviderCardProps {
  provider: Provider;
}

export default function ProviderCard({ provider }: ProviderCardProps) {
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

  return (
    <Link
      href={`/activity/${slug}`}
      className="group block rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden"
    >
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
            <div className="h-16 w-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-2xl">
              {name.charAt(0)}
            </div>
          </div>
        )}
        {/* Category badge */}
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm">
          {category}
        </span>
        {/* Age range badge */}
        <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur-sm">
          {ageRange}
        </span>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-ilali-600 transition-colors line-clamp-1">
          {name}
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">{providerName}</p>

        {/* Location */}
        <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <span>
            {location} &middot; {distance}
          </span>
        </div>

        {/* Rating */}
        <div className="mt-2 flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-sm font-semibold text-slate-800">{rating}</span>
          <span className="text-xs text-slate-500">({reviewCount} reviews)</span>
        </div>

        {/* Price / Free */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          {isFree ? (
            <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
              Free
            </span>
          ) : (
            <div>
              <span className="text-sm font-bold text-slate-900">{price}</span>
              <span className="ml-1 text-xs text-slate-500">{priceLabel}</span>
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
