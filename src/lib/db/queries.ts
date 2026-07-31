import { db } from "./index";
import {
  providers,
  venues,
  categories,
  venueAmenities,
  clubEvents,
  clubMemberships,
  rideRequests,
  clubMessages,
  rewardPoints,
  rewardRedemptions,
  users,
  childProfiles,
} from "./schema";
import {
  eq,
  ilike,
  and,
  or,
  sql,
  inArray,
  asc,
  desc,
  ne,
  isNotNull,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

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

  // Build parameterized tag array for safe SQL overlap query
  const tagValues = target.tags.map((t) => sql`${t}`);
  const tagArray = sql`ARRAY[${sql.join(tagValues, sql`, `)}]::text[]`;

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

// ── Community Layer: Club Events ──

export async function getClubEvents(providerId: string) {
  try {
    return await db
      .select()
      .from(clubEvents)
      .where(eq(clubEvents.providerId, providerId))
      .orderBy(
        // Upcoming events first, then past events — each chronological
        sql`CASE WHEN ${clubEvents.startTime} >= NOW() THEN 0 ELSE 1 END`,
        asc(clubEvents.startTime)
      );
  } catch {
    return [];
  }
}

// ── Community Layer: Club Memberships (with parent names) ──

export async function getClubMemberships(providerId: string) {
  try {
    const rows = await db
      .select({
        id: clubMemberships.id,
        providerId: clubMemberships.providerId,
        parentId: clubMemberships.parentId,
        parentName: users.name,
        childIds: clubMemberships.childIds,
        role: clubMemberships.role,
        joinedAt: clubMemberships.joinedAt,
      })
      .from(clubMemberships)
      .innerJoin(users, eq(clubMemberships.parentId, users.id))
      .where(eq(clubMemberships.providerId, providerId))
      .orderBy(asc(clubMemberships.joinedAt));

    // Enrich with child names + suburb (best-effort, additive)
    const parentIds = [...new Set(rows.map((r) => r.parentId))];
    let childRows: {
      id: string;
      parentId: string;
      name: string;
      suburb: string | null;
    }[] = [];
    if (parentIds.length > 0) {
      childRows = await db
        .select({
          id: childProfiles.id,
          parentId: childProfiles.parentId,
          name: childProfiles.name,
          suburb: childProfiles.suburb,
        })
        .from(childProfiles)
        .where(inArray(childProfiles.parentId, parentIds));
    }

    return rows.map((r) => {
      const kids = childRows.filter((c) => c.parentId === r.parentId);
      return {
        ...r,
        suburb: kids[0]?.suburb ?? null,
        childNames: kids.map((c) => c.name),
      };
    });
  } catch {
    return [];
  }
}

// ── Community Layer: Club Messages (with sender names) ──

export async function getClubMessages(clubId: string, limit = 50) {
  try {
    return await db
      .select({
        id: clubMessages.id,
        clubId: clubMessages.clubId,
        senderId: clubMessages.senderId,
        senderName: users.name,
        content: clubMessages.content,
        createdAt: clubMessages.createdAt,
      })
      .from(clubMessages)
      .innerJoin(users, eq(clubMessages.senderId, users.id))
      .where(eq(clubMessages.clubId, clubId))
      .orderBy(desc(clubMessages.createdAt))
      .limit(limit);
  } catch {
    return [];
  }
}

// ── Community Layer: Ride Requests (with requester/claimer names) ──

export interface RideRequestFilters {
  providerId?: string;
  eventId?: string;
}

const claimedByUser = alias(users, "claimed_by_user");

export async function getRideRequests(filters: RideRequestFilters = {}) {
  try {
    const conditions = [];

    if (filters.eventId) {
      conditions.push(eq(rideRequests.eventId, filters.eventId));
    }
    if (filters.providerId) {
      conditions.push(eq(clubEvents.providerId, filters.providerId));
    }

    const query = db
      .select({
        id: rideRequests.id,
        eventId: rideRequests.eventId,
        eventTitle: clubEvents.title,
        parentId: rideRequests.parentId,
        parentName: users.name,
        childId: rideRequests.childId,
        childName: childProfiles.name,
        direction: rideRequests.direction,
        status: rideRequests.status,
        claimedBy: rideRequests.claimedBy,
        claimedByName: claimedByUser.name,
        requesterConfirmed: rideRequests.requesterConfirmed,
        claimerConfirmed: rideRequests.claimerConfirmed,
        createdAt: rideRequests.createdAt,
      })
      .from(rideRequests)
      .innerJoin(clubEvents, eq(rideRequests.eventId, clubEvents.id))
      .innerJoin(users, eq(rideRequests.parentId, users.id))
      .innerJoin(childProfiles, eq(rideRequests.childId, childProfiles.id))
      .leftJoin(claimedByUser, eq(rideRequests.claimedBy, claimedByUser.id))
      .orderBy(desc(rideRequests.createdAt));

    if (conditions.length === 0) {
      return await query;
    }

    return await query.where(and(...conditions));
  } catch {
    return [];
  }
}

// ── Rewards: Points Ledger ──

export async function getRewardPoints(userId: string) {
  try {
    return await db
      .select()
      .from(rewardPoints)
      .where(eq(rewardPoints.userId, userId))
      .orderBy(desc(rewardPoints.createdAt));
  } catch {
    return [];
  }
}

export async function getRewardBalance(userId: string): Promise<number> {
  try {
    const [row] = await db
      .select({
        total: sql<number>`coalesce(sum(${rewardPoints.amount}), 0)`,
      })
      .from(rewardPoints)
      .where(eq(rewardPoints.userId, userId));

    return row?.total ?? 0;
  } catch {
    return 0;
  }
}

// ── Rewards: Redemptions ──

export async function getRewardRedemptions(userId: string) {
  try {
    return await db
      .select()
      .from(rewardRedemptions)
      .where(eq(rewardRedemptions.userId, userId))
      .orderBy(desc(rewardRedemptions.createdAt));
  } catch {
    return [];
  }
}

// ── Community Layer: Club Stats ──

export interface ClubStats {
  memberFamilies: number;
  familiesBySuburb: { suburb: string; count: number }[];
  topVolunteers: {
    parentId: string;
    parentName: string;
    role: string;
    joinedAt: Date;
  }[];
}

export async function getClubStats(providerId: string): Promise<ClubStats> {
  try {
    const [memberCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(clubMemberships)
      .where(eq(clubMemberships.providerId, providerId));

    const familiesBySuburbRows = await db
      .select({
        suburb: childProfiles.suburb,
        count: sql<number>`count(distinct ${clubMemberships.parentId})`,
      })
      .from(clubMemberships)
      .innerJoin(
        childProfiles,
        eq(clubMemberships.parentId, childProfiles.parentId)
      )
      .where(
        and(
          eq(clubMemberships.providerId, providerId),
          isNotNull(childProfiles.suburb)
        )
      )
      .groupBy(childProfiles.suburb)
      .orderBy(
        desc(sql`count(distinct ${clubMemberships.parentId})`)
      );

    const familiesBySuburb = familiesBySuburbRows.map((row) => ({
      suburb: row.suburb ?? "Unknown",
      count: row.count,
    }));

    const topVolunteerRows = await db
      .select({
        parentId: clubMemberships.parentId,
        parentName: users.name,
        role: clubMemberships.role,
        joinedAt: clubMemberships.joinedAt,
      })
      .from(clubMemberships)
      .innerJoin(users, eq(clubMemberships.parentId, users.id))
      .where(
        and(
          eq(clubMemberships.providerId, providerId),
          ne(clubMemberships.role, "parent")
        )
      )
      .orderBy(asc(clubMemberships.joinedAt))
      .limit(5);

    const topVolunteers = topVolunteerRows.map((volunteer) => ({
      parentId: volunteer.parentId,
      parentName: volunteer.parentName,
      role: volunteer.role ?? "parent",
      joinedAt: volunteer.joinedAt ?? new Date(),
    }));

    return {
      memberFamilies: memberCount?.count ?? 0,
      familiesBySuburb,
      topVolunteers,
    };
  } catch {
    return { memberFamilies: 0, familiesBySuburb: [], topVolunteers: [] };
  }
}
