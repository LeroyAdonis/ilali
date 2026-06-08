import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import type { Venue } from "@/lib/types";

interface VenueCardProps {
  venue: Venue;
}

export default function VenueCard({ venue }: VenueCardProps) {
  const { name, type, location, rating, image, slug } = venue;

  return (
    <Link
      href={`/venues/${slug}`}
      className="group block rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Image / Placeholder */}
      <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-xl">
              {name.charAt(0)}
            </div>
          </div>
        )}
        {/* Type badge */}
        <span className="absolute top-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-700 shadow-sm backdrop-blur-sm">
          {type}
        </span>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-ilali-600 transition-colors line-clamp-1">
          {name}
        </h3>

        <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
          <span className="line-clamp-1">{location}</span>
        </div>

        <div className="mt-1.5 flex items-center gap-1">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
          <span className="text-xs font-semibold text-slate-800">{rating}</span>
        </div>
      </div>
    </Link>
  );
}
