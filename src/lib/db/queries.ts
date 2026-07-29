import { db } from "./index";
import {
  providers,
  venues,
  categories,
  venueAmenities,
} from "./schema";
import { eq, ilike, and, or, sql, inArray } from "drizzle-orm";

// ── Categories ──

export async function getCategories() {
  return db.select().from(categories).orderBy(categories.name);
}

// ── Providers ──

export interface ProviderFilters {
  category?: string;
  ageMin?: number;
  ageMax?: number;
  location?: string;
  maxPrice?: number;
}

export async function getProviders(filters?: ProviderFilters) {
  const conditions = [];

  if (filters?.category) {
    conditions.push(eq(providers.category, filters.category));
  }
  if (filters?.ageMin !== undefined) {
    conditions.push(sql`${providers.ageMin} >= ${filters.ageMin}`);
  }
  if (filters?.ageMax !== undefined) {
    conditions.push(sql`${providers.ageMax} <= ${filters.ageMax}`);
  }
  if (filters?.location) {
    conditions.push(ilike(providers.location, `%${filters.location}%`));
  }
  if (filters?.maxPrice !== undefined) {
    conditions.push(sql`${providers.priceValue} <= ${filters.maxPrice}`);
  }

  if (conditions.length === 0) {
    return db.select().from(providers).orderBy(providers.name);
  }

  return db
    .select()
    .from(providers)
    .where(and(...conditions))
    .orderBy(providers.name);
}

export async function getProviderBySlug(slug: string) {
  const results = await db
    .select()
    .from(providers)
    .where(eq(providers.slug, slug))
    .limit(1);
  return results[0] ?? null;
}

// ── Venues ──

export async function getVenues() {
  return db.select().from(venues).orderBy(venues.name);
}

export async function getVenueBySlug(slug: string) {
  const results = await db
    .select()
    .from(venues)
    .where(eq(venues.slug, slug))
    .limit(1);

  if (!results[0]) return null;

  const venue = results[0];
  const amenities = await db
    .select({ amenity: venueAmenities.amenity })
    .from(venueAmenities)
    .where(eq(venueAmenities.venueId, venue.id));

  return {
    ...venue,
    amenities: amenities.map((a) => a.amenity),
  };
}

// ── Search ──

export interface SearchFilters {
  category?: string;
  ageMin?: number;
  ageMax?: number;
  location?: string;
}

export async function searchProviders(query: string, filters?: SearchFilters) {
  const conditions = [];

  // Full-text search across name, category, providerName, location
  const searchCondition = or(
    ilike(providers.name, `%${query}%`),
    ilike(providers.category, `%${query}%`),
    ilike(providers.providerName, `%${query}%`),
    ilike(providers.location, `%${query}%`)
  );

  if (query.trim()) {
    conditions.push(searchCondition);
  }

  if (filters?.category) {
    conditions.push(eq(providers.category, filters.category));
  }
  if (filters?.ageMin !== undefined) {
    conditions.push(sql`${providers.ageMin} >= ${filters.ageMin}`);
  }
  if (filters?.ageMax !== undefined) {
    conditions.push(sql`${providers.ageMax} <= ${filters.ageMax}`);
  }
  if (filters?.location) {
    conditions.push(ilike(providers.location, `%${filters.location}%`));
  }

  return db
    .select()
    .from(providers)
    .where(and(...conditions))
    .orderBy(providers.name);
}

// ── Similar Providers ──

export async function getSimilarProviders(
  providerId: string,
  limit = 3
) {
  // First, get the tags for the given provider
  const [target] = await db
    .select({ tags: providers.tags, category: providers.category })
    .from(providers)
    .where(eq(providers.id, providerId))
    .limit(1);

  if (!target || !target.tags || target.tags.length === 0) {
    return [];
  }

  // Build a PostgreSQL array literal from the tags
  const tagList = target.tags.map((t) => `'${t}'`).join(", ");
  const tagArray = sql.raw(`ARRAY[${tagList}]::text[]`);

  // Find providers with overlapping tags, excluding the target itself
  return db
    .select()
    .from(providers)
    .where(
      and(
        sql`${providers.tags} && ${tagArray}`,
        sql`${providers.id} != ${providerId}`
      )
    )
    .limit(limit);
}
