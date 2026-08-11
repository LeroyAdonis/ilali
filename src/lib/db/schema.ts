import {
  pgTable,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  uuid,
  jsonb,
  unique,
  uniqueIndex,
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
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
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
  suburb: text("suburb"),
  role: text("role").default("parent"), // 'parent', 'provider', 'admin'
  passwordResetRequired: boolean("password_reset_required").default(false),
  needsClaim: boolean("needs_claim").default(false),
  passphraseHash: text("passphrase_hash"),
  // WS-3 claim-code security — admin-issued codes verify listing ownership.
  // Plaintext codes are NEVER stored; only the bcrypt hash. Codes are
  // single-use (cleared on successful claim), expire after 7 days, and the
  // account locks for 15 minutes after 5 failed attempts.
  claimCodeHash: text("claim_code_hash"),
  claimCodeExpiresAt: timestamp("claim_code_expires_at"),
  claimAttempts: integer("claim_attempts").default(0),
  claimLockedUntil: timestamp("claim_locked_until"),
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
  // George's extended poster fields (2026-08-10) — captured from poster / AI
  // extraction into the draft profile, editable in the review desk + edit form.
  venue: text("venue"),
  address: text("address"),
  dateStart: text("date_start"), // free text (posters are messy): "12 July" or ISO
  dateEnd: text("date_end"),
  timeStart: text("time_start"),
  timeEnd: text("time_end"),
  dayOfWeek: text("day_of_week"),
  contactName: text("contact_name"),
  bookingInfo: text("booking_info"),
  additionalInfo: text("additional_info"), // capture ALL text on the poster
  logoPath: text("logo_path"), // base64 data URL (same pattern as poster image)
  status: text("status").default("pending"), // pending, contacted, approved, rejected
  onboardSource: text("onboard_source"), // 'email' | 'form' | 'whatsapp' | 'bulk-import' | 'poster' | null
  importBatchId: uuid("import_batch_id").references(() => importBatches.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Import Batches (WS-4 bulk import audit trail) ──
// One row per committed import. Approved counts are NOT stored — derived by
// counting provider_applications WHERE import_batch_id = X AND status = 'approved'.
export const importBatches = pgTable("import_batches", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: text("filename").notNull(),
  totalRows: integer("total_rows").notNull(), // data rows in the file (excl. header)
  importedRows: integer("imported_rows").notNull(), // inserted as applications
  skippedRows: integer("skipped_rows").notNull(), // rows rejected at commit
  rowErrors: jsonb("row_errors"), // [{ row, email, errors: string[] }] audit trail
  createdBy: text("created_by").references(() => users.id),
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

// ── Child Profiles ──
export const childProfiles = pgTable("child_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  parentId: text("parent_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  interests: text("interests").array(),
  availability: jsonb("availability"),
  suburb: text("suburb"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Provider Verifications (document upload + AI review) ──
export const providerVerifications = pgTable("provider_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  documentUrls: jsonb("document_urls"), // { businessReg?: string, safeguarding?: string, idDoc?: string }
  status: text("status").default("pending"), // pending, approved, rejected
  aiReview: jsonb("ai_review"), // { documentType: string, nameMatch: boolean, expiryValid: boolean, flags: string[] }
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Provider Vouches (community vouching) ──
export const providerVouches = pgTable("provider_vouches", {
  id: uuid("id").defaultRandom().primaryKey(),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  parentId: text("parent_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Notification Preferences ──
export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  notifyNewProviders: boolean("notify_new_providers").default(true),
  notifyCommunity: boolean("notify_community").default(true),
  notifyRewards: boolean("notify_rewards").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Community Layer: Club Events ──
export const clubEvents = pgTable("club_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  eventType: text("event_type").notNull(), // 'practice' | 'game' | 'event' | 'other'
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  location: text("location"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Community Layer: Club Memberships ──
export const clubMemberships = pgTable(
  "club_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    parentId: text("parent_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    childIds: uuid("child_ids").array().notNull(),
    role: text("role").default("parent"), // 'parent' | 'volunteer' | 'organizer'
    status: text("status").notNull().default("active"), // "active" | "inactive"
    invitedBy: text("invited_by"), // nullable, references users.id
    joinedAt: timestamp("joined_at").defaultNow(),
  },
  (t) => [unique().on(t.providerId, t.parentId)],
);

// ── Community Layer: Ride Requests ──
export const rideRequests = pgTable("ride_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => clubEvents.id, { onDelete: "cascade" }),
  parentId: text("parent_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  childId: uuid("child_id")
    .notNull()
    .references(() => childProfiles.id, { onDelete: "cascade" }),
  direction: text("direction").notNull(), // 'to' | 'from'
  status: text("status").default("open"), // 'open' | 'claimed' | 'completed'
  claimedBy: text("claimed_by").references(() => users.id),
  // Two-sided confirmation — both parents must confirm the ride happened
  // before the request completes. Set by POST /api/rides/[id]/confirm.
  requesterConfirmed: boolean("requester_confirmed").default(false).notNull(),
  claimerConfirmed: boolean("claimer_confirmed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Community Layer: Club Messages ──
export const clubMessages = pgTable("club_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  clubId: uuid("club_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  senderId: text("sender_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Rewards: Points Ledger ──
export const rewardPoints = pgTable("reward_points", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  action: text("action").notNull(),
  referenceId: text("reference_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Rewards: Redemptions ──
export const rewardRedemptions = pgTable("reward_redemptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  pointsSpent: integer("points_spent").notNull(),
  rewardType: text("reward_type").notNull(),
  providerId: uuid("provider_id").references(() => providers.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Community Contributions ──
export const communityContributions = pgTable("community_contributions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clubId: uuid("club_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "venue-help"|"event-support"|"community-building"|"knowledge-sharing"|"outreach"
  description: text("description"),
  points: integer("points").notNull(),
  validationPath: text("validation_path").notNull(), // "leader"|"peer"
  status: text("status").notNull().default("pending"), // "pending"|"confirmed"|"rejected"|"flagged"
  confirmedBy: text("confirmed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
});

// ── Contribution Vouches ──
export const contributionVouches = pgTable(
  "contribution_vouches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    contributionId: uuid("contribution_id")
      .notNull()
      .references(() => communityContributions.id, { onDelete: "cascade" }),
    voucherId: text("voucher_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    uniqueVouch: uniqueIndex("unique_vouch").on(t.contributionId, t.voucherId),
  }),
);

// ── Provider Inquiries (AI concierge match log) ──
export const providerInquiries = pgTable("provider_inquiries", {
  id: uuid("id").defaultRandom().primaryKey(),
  providerId: uuid("provider_id")
    .notNull()
    .references(() => providers.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  parentId: text("parent_id"),
  matchedAt: timestamp("matched_at").defaultNow().notNull(),
});

// ── Review Replies (provider responses to reviews) ──
export const reviewReplies = pgTable(
  "review_replies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => reviews.id, { onDelete: "cascade" }),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => providers.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    uniqueReviewReply: uniqueIndex("unique_review_reply").on(t.reviewId),
  }),
);

// ── Poster Imports (WS-7: Fun with Kids poster → profile intake) ──
// One row per poster uploaded by an admin. Holds the vision extraction
// snapshot + web-enrichment suggestions + the human-approved final fields.
export const posterImports = pgTable("poster_imports", {
  id: uuid("id").defaultRandom().primaryKey(),
  imagePath: text("image_path").notNull(),
  extractedJson: jsonb("extracted_json"), // raw vision extraction snapshot
  enrichmentJson: jsonb("enrichment_json"), // [{ field, value, sourceUrl }]
  finalJson: jsonb("final_json"), // human-approved fields at save time
  status: text("status").notNull().default("extracting"), // extracting → needs_review → saved → contacted
  contactedAt: timestamp("contacted_at"),
  outreachMethod: text("outreach_method"), // wa-me | email-draft | whatsapp-api | null
  applicationId: uuid("application_id").references(() => providerApplications.id),
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Message Templates (WS-7: centralised outreach copy) ──
export const messageTemplates = pgTable("message_templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  templateKey: text("template_key").notNull().unique(), // whatsapp-outreach | email-subject | email-body
  body: text("body").notNull(), // supports {{providerName}} {{activityName}} {{claimUrl}} {{claimCode}}
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Match Intent Cache (2026-08-11 — fast path latency fix) ──
// Caches extracted search intents by normalized query so repeat searches
// skip the slow AI tier entirely (parents repeat searches a lot: "soccer",
// "swimming", "art classes"). TTL enforced in code (createdAt + 7 days);
// rows are cheap and the table is pruned opportunistically on write.
export const matchIntentCache = pgTable("match_intent_cache", {
  id: uuid("id").defaultRandom().primaryKey(),
  queryKey: text("query_key").notNull().unique(), // normalized lowercase query
  intentJson: jsonb("intent_json").notNull(), // MatchIntent
  mode: text("mode").notNull(), // deterministic | ai
  createdAt: timestamp("created_at").defaultNow(),
});
