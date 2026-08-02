import type { Provider, Venue } from "@/lib/types";
import type { providers, venues } from "./schema";

type DbProvider = typeof providers.$inferSelect;
type DbVenue = typeof venues.$inferSelect & { amenities?: string[] };

/**
 * Maps a DB provider row to the UI Provider type.
 * Requires categories array for slug→name lookup.
 */
export function mapProvider(
  dbRow: DbProvider,
  categories: { id: string; name: string }[]
): Provider {
  const cat = categories.find((c) => c.id === dbRow.category);
  return {
    id: dbRow.id,
    name: dbRow.name,
    slug: dbRow.slug,
    category: cat?.name ?? dbRow.category,
    categorySlug: dbRow.category,
    description: dbRow.description,
    providerName: dbRow.providerName,
    location: dbRow.location,
    distance: "—",
    ageRange: `${dbRow.ageMin}–${dbRow.ageMax} years`,
    ageMin: dbRow.ageMin,
    ageMax: dbRow.ageMax,
    rating: Number(dbRow.rating ?? 0),
    reviewCount: dbRow.reviewCount ?? 0,
    price: dbRow.isFree ? "Free" : `R${dbRow.priceValue.toLocaleString()}`,
    priceValue: dbRow.priceValue,
    priceLabel: dbRow.priceLabel ?? "per session",
    image: dbRow.imageUrl ?? `/images/providers/${dbRow.category}.jpg`,
    isFree: dbRow.isFree ?? false,
    featured: dbRow.featured ?? false,
    verified: dbRow.verified ?? false,
    tags: dbRow.tags ?? [],
    phone: dbRow.phone ?? undefined,
  };
}

/**
 * Maps a DB venue row (with optional amenities array) to the UI Venue type.
 */
export function mapVenue(dbRow: DbVenue): Venue {
  return {
    id: dbRow.id,
    name: dbRow.name,
    slug: dbRow.slug,
    type: dbRow.type,
    location: dbRow.location,
    rating: Number(dbRow.rating ?? 0),
    reviewCount: dbRow.reviewCount ?? 0,
    image: dbRow.imageUrl ?? "",
    capacity: dbRow.capacity != null ? `${dbRow.capacity} people` : undefined,
    amenities: (dbRow as DbVenue).amenities ?? [],
  };
}
