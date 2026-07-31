import type { InferSelectModel } from "drizzle-orm";
import type { providers, venues, categories } from "@/lib/db/schema";
import {
  mockProviders,
  mockProviderById,
  mockProviderBySlug,
} from "./mock/providers";

// ── Real DB query imports ──
import {
  getProviders as dbGetProviders,
  getProviderBySlug as dbGetProviderBySlug,
  getVenues as dbGetVenues,
  getVenueBySlug as dbGetVenueBySlug,
  getCategories as dbGetCategories,
  searchProviders as dbSearchProviders,
  getSimilarProviders as dbGetSimilarProviders,
} from "./db/queries";

// Re-export filter types so consumers don't need dual imports
export type { ProviderFilters, SearchFilters } from "./db/queries";

// ── Types ──
type Provider = InferSelectModel<typeof providers>;
type Venue = InferSelectModel<typeof venues>;
type Category = InferSelectModel<typeof categories>;
type VenueWithAmenities = Venue & { amenities: string[] };

// ── USE_MOCK Toggle ──
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// ── Mock Categories (matching categories table schema) ──
const mockCategories: Category[] = [
  { id: "arts-culture", name: "Arts & Culture", slug: "arts-culture", description: "Painting, drawing, pottery, and creative expression", icon: "🎨", color: "bg-pink-100 text-pink-600" },
  { id: "sports", name: "Sports", slug: "sports", description: "Football, cricket, swimming, and team sports", icon: "⚽", color: "bg-blue-100 text-blue-600" },
  { id: "emotional-intelligence", name: "Emotional Intel.", slug: "emotional-intelligence", description: "Mindfulness, resilience, and emotional growth", icon: "🧠", color: "bg-purple-100 text-purple-600" },
  { id: "holiday-programs", name: "Holiday Programs", slug: "holiday-programs", description: "School holiday camps and workshops", icon: "🏕️", color: "bg-green-100 text-green-600" },
  { id: "music-lessons", name: "Music Lessons", slug: "music-lessons", description: "Piano, guitar, voice, and instrumental training", icon: "🎵", color: "bg-amber-100 text-amber-600" },
  { id: "venues", name: "Venues", slug: "venues", description: "Studios, halls, and outdoor spaces for activities", icon: "🏛️", color: "bg-indigo-100 text-indigo-600" },
  { id: "education", name: "Education", slug: "education", description: "STEM, coding, tutoring, and academic support", icon: "📚", color: "bg-cyan-100 text-cyan-600" },
  { id: "new-used-equipment", name: "New & Used Equipment", slug: "equipment", description: "Buy and sell activity gear and equipment", icon: "🛒", color: "bg-orange-100 text-orange-600" },
  { id: "educational-support", name: "Educational Support", slug: "educational-support", description: "Extra lessons, remedial support, and coaching", icon: "✏️", color: "bg-teal-100 text-teal-600" },
  { id: "volunteering", name: "Volunteering", slug: "volunteering", description: "Community service and volunteer opportunities", icon: "🤝", color: "bg-rose-100 text-rose-600" },
  { id: "school-open-days", name: "School Open Days", slug: "school-open-days", description: "School tours, open days, and enrollment events", icon: "🏫", color: "bg-violet-100 text-violet-600" },
];

// ── Mock Provider Filter Functions ──

import type { ProviderFilters, SearchFilters } from "./db/queries";

function mockGetProviders(filters?: ProviderFilters): Provider[] {
  let results = [...mockProviders];

  if (filters?.category) {
    results = results.filter((p) => p.category === filters.category);
  }
  if (filters?.ageMin !== undefined) {
    results = results.filter((p) => p.ageMin >= filters.ageMin!);
  }
  if (filters?.ageMax !== undefined) {
    results = results.filter((p) => p.ageMax <= filters.ageMax!);
  }
  if (filters?.location) {
    const loc = filters.location.toLowerCase();
    results = results.filter((p) => p.location.toLowerCase().includes(loc));
  }
  if (filters?.maxPrice !== undefined) {
    results = results.filter((p) => p.priceValue <= filters.maxPrice!);
  }

  // Sort by name (same as DB query)
  results.sort((a, b) => a.name.localeCompare(b.name));
  return results;
}

function mockGetProviderBySlug(slug: string): Provider | null {
  return mockProviderBySlug[slug] ?? null;
}

function mockGetVenues(): Venue[] {
  // No mock venue data defined yet — return empty
  return [];
}

function mockGetVenueBySlug(_slug: string): VenueWithAmenities | null {
  return null;
}

function mockGetCategories(): Category[] {
  return mockCategories;
}

function mockSearchProviders(query: string, filters?: SearchFilters): Provider[] {
  let results = [...mockProviders];

  if (query.trim()) {
    const q = query.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.providerName.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q)
    );
  }

  if (filters?.category) {
    results = results.filter((p) => p.category === filters.category);
  }
  if (filters?.ageMin !== undefined) {
    results = results.filter((p) => p.ageMin >= filters.ageMin!);
  }
  if (filters?.ageMax !== undefined) {
    results = results.filter((p) => p.ageMax <= filters.ageMax!);
  }
  if (filters?.location) {
    const loc = filters.location.toLowerCase();
    results = results.filter((p) => p.location.toLowerCase().includes(loc));
  }

  results.sort((a, b) => a.name.localeCompare(b.name));
  return results;
}

function mockGetSimilarProviders(providerId: string, limit = 3): Provider[] {
  const target = mockProviderById[providerId];
  if (!target || !target.tags || target.tags.length === 0) {
    return [];
  }

  const targetTags = new Set(target.tags);

  return mockProviders
    .filter((p) => {
      if (p.id === providerId) return false;
      if (!p.tags) return false;
      return p.tags.some((tag) => targetTags.has(tag));
    })
    .sort((a, b) => {
      // Sort by tag overlap count (most similar first), then by rating
      const aOverlap = a.tags?.filter((t) => targetTags.has(t)).length ?? 0;
      const bOverlap = b.tags?.filter((t) => targetTags.has(t)).length ?? 0;
      if (bOverlap !== aOverlap) return bOverlap - aOverlap;
      return (parseFloat(b.rating ?? "0") - parseFloat(a.rating ?? "0"));
    })
    .slice(0, limit);
}

// ── Unified Public API ──
// Each function switches between mock and real DB based on USE_MOCK toggle.
// All return Promises to match the async DB interface.

export async function getProviders(filters?: ProviderFilters): Promise<Provider[]> {
  if (USE_MOCK) return mockGetProviders(filters);
  return dbGetProviders(filters);
}

export async function getProviderBySlug(slug: string): Promise<Provider | null> {
  if (USE_MOCK) return mockGetProviderBySlug(slug);
  return dbGetProviderBySlug(slug);
}

export async function getVenues(): Promise<Venue[]> {
  if (USE_MOCK) return mockGetVenues();
  return dbGetVenues();
}

export async function getVenueBySlug(slug: string): Promise<VenueWithAmenities | null> {
  if (USE_MOCK) return mockGetVenueBySlug(slug);
  return dbGetVenueBySlug(slug);
}

export async function getCategories(): Promise<Category[]> {
  if (USE_MOCK) return mockGetCategories();
  return dbGetCategories();
}

export async function searchProviders(query: string, filters?: SearchFilters): Promise<Provider[]> {
  if (USE_MOCK) return mockSearchProviders(query, filters);
  return dbSearchProviders(query, filters);
}

export async function getSimilarProviders(providerId: string, limit?: number): Promise<Provider[]> {
  if (USE_MOCK) return mockGetSimilarProviders(providerId, limit);
  return dbGetSimilarProviders(providerId, limit);
}
