import {
  pgTable,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ── Categories (managed, not user-creatable) ──
export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // emoji
  color: text("color").notNull(), // tailwind classes
});

// ── Providers (activity listings) ──
export const providers = pgTable("providers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category")
    .notNull()
    .references(() => categories.id),
  description: text("description").notNull(),
  providerName: text("provider_name").notNull(),
  location: text("location").notNull(),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  ageMin: integer("age_min").notNull(),
  ageMax: integer("age_max").notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: integer("review_count").default(0),
  priceValue: integer("price_value").notNull(), // in cents
  priceLabel: text("price_label").default("per session"),
  imageUrl: text("image_url"),
  phone: text("phone"), // +27XXXXXXXXX for WhatsApp
  tags: text("tags").array(), // ["outdoor","high-energy","creative"] — for AI matching Phase 2
  featured: boolean("featured").default(false),
  isFree: boolean("is_free").default(false),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Venues ──
export const venues = pgTable("venues", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  type: text("type").notNull(),
  location: text("location").notNull(),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: integer("review_count").default(0),
  capacity: integer("capacity"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const venueAmenities = pgTable("venue_amenities", {
  id: uuid("id").defaultRandom().primaryKey(),
  venueId: uuid("venue_id")
    .notNull()
    .references(() => venues.id, { onDelete: "cascade" }),
  amenity: text("amenity").notNull(),
});

// ── Users (auth) ──
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  role: text("role").default("parent"), // 'parent', 'provider', 'admin'
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Auth Sessions (better-auth) ──
export const authSessions = pgTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Auth Accounts (better-auth, stores password hashes) ──
export const authAccounts = pgTable("auth_accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  providerId: text("provider_id").notNull(),
  accountId: text("account_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Auth Verifications (better-auth) ──
export const authVerifications = pgTable("auth_verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Provider Applications ──
export const providerApplications = pgTable("provider_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  activityType: text("activity_type").notNull(),
  description: text("description"),
  location: text("location"),
  ageMin: integer("age_min"),
  ageMax: integer("age_max"),
  priceValue: integer("price_value"),
  imageUrl: text("image_url"),
  status: text("status").default("pending"), // pending, contacted, approved, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Referrals ──
export const referrals = pgTable("referrals", {
  id: uuid("id").defaultRandom().primaryKey(),
  referrerName: text("referrer_name").notNull(),
  referrerEmail: text("referrer_email").notNull(),
  providerName: text("provider_name").notNull(),
  providerEmail: text("provider_email").notNull(),
  providerPhone: text("provider_phone"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Reviews (Phase 2 UI, schema exists now) ──
export const reviews = pgTable("reviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  providerId: uuid("provider_id").references(() => providers.id, {
    onDelete: "cascade",
  }),
  venueId: uuid("venue_id").references(() => venues.id, {
    onDelete: "cascade",
  }),
  userId: text("user_id"),
  rating: integer("rating").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
});
