# Implementation Plan: ILALI MVP

**Spec:** [spec.md](spec.md)
**Constitution:** [../memory/constitution.md](../memory/constitution.md)
**Date:** 2026-07-29
**Status:** Ready for Implementation

> **For Hermes:** Use `subagent-driven-development` to implement phase by phase. Each phase is a `delegate_task` call with the spec, this plan, the constitution, and the assigned task IDs. Two-stage review: spec compliance → code quality.

**Goal:** Replace ILALI's static mock data with a database-backed marketplace — browse → filter → view → WhatsApp contact — with admin auth and provider application management.

**Architecture:** Next.js 16 App Router front-end → Drizzle ORM → Neon PostgreSQL. Admin auth via Better Auth. All on Vercel. Zero new UI — swap data sources in ~8 files, add API routes for forms, add admin dashboard.

**Tech Stack:** Next.js 16.2.7, React 19.2.4, TypeScript 5, Tailwind CSS v4, Neon PostgreSQL, Drizzle ORM, Better Auth, Vercel (hosting), lucide-react (icons).

---

## Global Constraints

- All colors from `@theme inline` tokens in `globals.css` — no raw hex colors in components
- Price stored in cents (INT) — format in presentation layer
- Server Components by default — only `"use client"` when interactivity requires it
- Path alias `@/*` maps to `./src/*`
- DB client MUST be lazy-initialized (Proxy pattern) — module-level DB init breaks Turbopack builds
- Environment variables MUST be documented in `.env.example` and this plan's Technical Context table
- SA-specific: Rands, +27 phone format, Cape Town suburbs, SA school phase age groupings
- Admin auth on ALL provider management routes — not just `/admin` dashboard
- WhatsApp contact number configurable via `NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER` env var

---

## Constitution Check

| Principle | How Plan Complies |
|---|---|
| **1. Trust First** | `verified` boolean on providers. Trust badges on cards + detail pages. Admin auth protects ALL provider management routes. Only approved providers appear in browse. |
| **2. Warm Family Aesthetic** | Zero UI changes needed — existing teal + orange + Inter design stays. Tailwind v4 `@theme inline` tokens used throughout. |
| **3. Mobile-First, Cape Town Local** | Existing 375px-first design unchanged. Location data uses CT suburbs. Pricing in Rands. Age ranges use SA school phases. |
| **4. Community-Powered Growth** | Referral form wired to DB. Provider signup form wired to DB. Architecture accommodates future WhatsApp onboarding pipeline. |
| **5. MVP Simplicity** | Browse → filter → view → WhatsApp contact. No booking/payments/reviews in UI. Provider management is admin-only — no provider self-service dashboard. |
| **6. SA Context & Accessibility** | WCAG 2.1 AA maintained (no UI changes). +27 phone formatting. Cape Town suburb dropdown. English-only for MVP. |
| **7. Build-Then-Ship Cadence** | Phase 1 (DB + seed + migration) ships independently. Phase 2 (forms + admin) ships next. Each phase is a working deploy. |

---

## Technical Context

| Dimension | Decision | Rationale |
|---|---|---|
| Frontend framework | Next.js 16 App Router (already in place) | No migration needed. 26 routes exist, 8 need data source swap. |
| Styling | Tailwind CSS v4 (already in place) | `@theme inline` tokens, zero changes needed. |
| Database | Neon PostgreSQL (serverless) | Free tier, auto-pauses, Vercel-native. Same as NoZar. |
| ORM | Drizzle ORM | Type-safe, migration-first, proven in NoZar. |
| Auth | Better Auth (email/password) | Same setup as NoZar. Admin-only in MVP. `users` table has role field from day one. |
| Forms | Next.js Server Actions for simple forms; API Routes for cross-cutting | Server Actions for provider signup + referral (same page, no CORS). API Routes for search (GET, cacheable). |
| File storage | None in MVP (image URL field only) | Vercel Blob in Phase 2. MVP collects image URLs as text. |
| Email | Resend SDK installed, not wired | Templates created, not triggered. Admin checks dashboard manually. |
| Hosting | Vercel (preview.ilali.co → ilali.co) | Already deployed. Add Neon integration, push env vars, redeploy. |
| WhatsApp | Configurable env var `NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER` | Defaults to provider's phone from DB. Swappable to intermediary number without code change. |

---

## Data Model

### Drizzle Schema (`src/lib/db/schema.ts`)

```typescript
import { pgTable, text, integer, decimal, boolean, timestamp, uuid, uniqueIndex } from "drizzle-orm/pg-core";

// ── Categories (managed, not user-creatable) ──
export const categories = pgTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),       // emoji
  color: text("color").notNull(),     // tailwind classes
});

// ── Providers (activity listings) ──
export const providers = pgTable("providers", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull().references(() => categories.id),
  description: text("description").notNull(),
  providerName: text("provider_name").notNull(),
  location: text("location").notNull(),
  lat: decimal("lat", { precision: 10, scale: 7 }),
  lng: decimal("lng", { precision: 10, scale: 7 }),
  ageMin: integer("age_min").notNull(),
  ageMax: integer("age_max").notNull(),
  rating: decimal("rating", { precision: 2, scale: 1 }).default("0"),
  reviewCount: integer("review_count").default(0),
  priceValue: integer("price_value").notNull(),   // in cents
  priceLabel: text("price_label").default("per session"),
  imageUrl: text("image_url"),
  phone: text("phone"),                            // +27XXXXXXXXX for WhatsApp
  tags: text("tags").array(),                      // ["outdoor","high-energy","creative"] — for AI matching Phase 2
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
  venueId: uuid("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
  amenity: text("amenity").notNull(),
});

// ── Users (auth) ──
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  phone: text("phone"),
  role: text("role").default("parent"),   // 'parent', 'provider', 'admin'
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow(),
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
  status: text("status").default("pending"),  // pending, contacted, approved, rejected
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
  providerId: uuid("provider_id").references(() => providers.id, { onDelete: "cascade" }),
  venueId: uuid("venue_id").references(() => venues.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  rating: integer("rating").notNull(),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Enums / Types

```typescript
// src/lib/db/types.ts
export type ProviderStatus = "pending" | "contacted" | "approved" | "rejected";
export type UserRole = "parent" | "provider" | "admin";
```

---

## API Contracts

### Form Submissions (Server Actions)

| Route | Method | Auth | Input | Output |
|---|---|---|---|---|
| `POST /api/providers/apply` | Server Action | None | ProviderApplication fields | `{ success: true }` or `{ error: string }` |
| `POST /api/referrals` | Server Action | None | Referral fields | `{ success: true }` or `{ error: string }` |

### Admin API Routes

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/admin/applications` | GET | Admin | List all provider applications (sorted newest first) |
| `/api/admin/applications/[id]` | PATCH | Admin | Update application status |
| `/api/admin/providers` | POST | Admin | Create a full provider profile from an approved application |
| `/api/admin/providers/[id]` | PATCH | Admin | Update an existing provider profile |

### Public API Routes

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/search` | GET | None | Search providers by query string. Params: `?q=art&category=arts-culture&age=4-7&location=Muizenberg` |
| `/api/match` | POST | None | AI-powered natural language matching. Body: `{ query: "something creative for my 5 year old" }`. Returns `{ matches: [{ provider, score, reasons }] }`. Calls LLM for intent extraction, then scores providers. |

---

## AI Matching Engine

### Architecture

```
Parent types NL query
       │
       ▼
POST /api/match ──→ LLM (DeepSeek) extracts structured intent
       │                  │
       │         { ageMin, ageMax, tags[], location, priceMax }
       │                  │
       ▼                  ▼
  Fetch all providers from DB
       │
       ▼
  Score each provider against intent (tag overlap + age + location + price)
       │
       ▼
  Return ranked matches with scores + reasons
```

### LLM Integration (`src/lib/ai/match.ts`)

Uses the `llm-from-script` pattern — server-side fetch to DeepSeek API (same provider as current Hermes session). The extraction prompt is strict JSON-only with a predefined tag vocabulary and Cape Town suburb list.

```typescript
// src/lib/ai/match.ts
const MATCH_TAGS = [
  "outdoor", "indoor", "creative", "sport", "music", "academic",
  "high-energy", "calm", "group", "individual", "weekend",
  "after-school", "holiday-program", "free", "beginner", "advanced"
];

const CT_SUBURBS = [/* full list from src/lib/suburbs.ts */];

interface MatchIntent {
  ageMin?: number;
  ageMax?: number;
  tags: string[];
  location?: string;
  priceMax?: number;
}

export async function extractIntent(query: string): Promise<MatchIntent> {
  // POST to DeepSeek API with system prompt containing tag vocab + suburb list
  // Returns structured JSON only
}
```

### Scoring Algorithm (`src/lib/ai/score.ts`)

```typescript
export function scoreProvider(provider: Provider, intent: MatchIntent): number {
  let score = 0;
  // Tag overlap: up to 40%
  // Age range match: up to 25%
  // Location match: up to 20%
  // Price match: up to 15%
  return Math.min(100, score);
}
```

### Fallback

If LLM call fails, times out (> 3s), or returns unparseable JSON → fall back to `searchProviders(query)` (keyword search against name + description).

## Implementation Phases

### Phase 1: Database Foundation

**Goal:** Neon DB provisioned, Drizzle schema created, seed data migrated, DB client wired.

**Tasks:**

- [ ] **T001** Create `.env.example` with all required vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER`, `NEXT_PUBLIC_APP_URL`
- [ ] **T002** Install packages: `drizzle-orm`, `@neondatabase/serverless`, `drizzle-kit`, `better-auth`, `zod`, `resend`
- [ ] **T003** Create `src/lib/db/schema.ts` — full Drizzle schema as above (7 tables)
- [ ] **T004** Create `src/lib/db/index.ts` — lazy-initialized DB client (Proxy pattern, see `references/db-client-lazy-init.md`)
- [ ] **T005** Create `drizzle.config.ts` at project root — point to schema and migrations dir
- [ ] **T006** Provision Neon DB via Vercel integration: `vercel integration add neon` (see `references/vercel-neon-integration.md`)
- [ ] **T007** Generate and run migrations: `npx drizzle-kit generate` then `npx drizzle-kit push`
- [ ] **T008** Create `src/lib/db/seed.ts` — migrate all existing data from `constants.ts` into DB (4 providers, 4 venues, 11 categories)
- [ ] **T009** Run seed: `npx tsx src/lib/db/seed.ts` — verify with `npx drizzle-kit studio`
- [ ] **T010** Create utility queries in `src/lib/db/queries.ts`: `getProviders()`, `getProviderBySlug(slug)`, `getVenues()`, `getVenueBySlug(slug)`, `getCategories()`, `searchProviders(query, filters)`

**Verification:** `npx drizzle-kit studio` shows seeded data. Queries return expected results.

### Phase 2: Data Source Migration

**Goal:** Swap `constants.ts` imports for DB queries in ~8 files. Zero UI changes.

**Tasks:**

- [ ] **T011** Convert `src/app/activity/[slug]/page.tsx` — replace `providers.find()` with `getProviderBySlug(slug)`. Page becomes async. Add `phone` field to the WhatsApp button using `NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER ?? provider.phone`.
- [ ] **T012** Convert `src/app/venues/[slug]/page.tsx` — replace `venues.find()` with `getVenueBySlug(slug)`. Same async pattern.
- [ ] **T013** Convert `src/app/browse/page.tsx` — replace `import { providers }` with `getProviders()`. Wire filters from searchParams to DB query.
- [ ] **T014** Convert `src/app/providers/page.tsx` — same as browse, replace constants import with DB query.
- [ ] **T015** Convert `src/app/venues/page.tsx` — replace constants import with `getVenues()`.
- [ ] **T016** Convert `src/app/locations/page.tsx` — replace constants import with DB location query.
- [ ] **T017** Convert `src/components/FilterBar.tsx` — swap `import { categories }` from constants to a server component that passes categories as props, OR fetch client-side from a lightweight API route `/api/categories`.
- [ ] **T018** Convert `src/components/SearchBar.tsx` — wire to `/api/search?q=...` instead of filtering `constants.providers` in-memory.
- [ ] **T019** Remove `providers`, `venues` exports from `src/lib/constants.ts` — keep categories, testimonials, navLinks, stats as static data. Add deprecation comment.

**Verification:** `npm run build` passes. Browse, activity detail, venue detail pages all show real DB data. Filters and search work. Zero visual regressions.

### Phase 3: Forms & API Routes

**Goal:** Provider signup and referral forms POST to the database instead of `alert()`.

**Tasks:**

- [ ] **T020** Create `src/lib/validations.ts` — Zod schemas for `providerApplicationSchema` and `referralSchema`. Include +27 phone validation, Cape Town suburb enum, required field checks.
- [ ] **T021** Create `src/app/api/providers/apply/route.ts` — POST handler. Validate with Zod, insert into `provider_applications` with status `pending`. Return `{ success: true }` or `{ error: string }`. Rate-limit: 5 per IP per hour.
- [ ] **T022** Create `src/app/api/referrals/route.ts` — POST handler. Validate with Zod, insert into `referrals`. Same rate-limit pattern.
- [ ] **T023** Convert `src/app/providers/signup/form.tsx` — replace `alert("Submitted!")` with Server Action that calls the API route. Add inline validation errors from Zod. Show success state with email confirmation message. Preserve form data on error.
- [ ] **T024** Convert `src/app/providers/refer/form.tsx` — same pattern as signup form.
- [ ] **T025** Add Cape Town suburb list to `src/lib/constants.ts` (or a standalone `src/lib/suburbs.ts`) — used by the location dropdown in the provider signup form.
- [ ] **T026** Add phone auto-formatting utility to `src/lib/utils.ts` — formats input to +27 XX XXX XXXX as user types.

**Verification:** Submit both forms with valid and invalid data. Check DB for new rows. Verify success and error states. Test on mobile (375px). Rate-limit test.

### Phase 4: Admin Auth & Dashboard

**Goal:** Admin authentication via Better Auth. Dashboard for reviewing provider applications.

**Tasks:**

- [ ] **T027** Configure Better Auth — create `src/lib/auth.ts` with email/password provider. Admin credentials seeded via env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`). Create `src/app/api/auth/[...all]/route.ts` handler.
- [ ] **T028** Create `src/app/(auth)/signin/page.tsx` — sign-in form (email + password). Redirect to `/admin` on success. Show error on invalid credentials.
- [ ] **T029** Create `src/middleware.ts` (or `proxy.ts` for Next.js 16) — protect `/admin/*` routes. Redirect unauthenticated users to sign-in.
- [ ] **T030** Create `src/app/admin/layout.tsx` — admin layout with auth check. Minimal nav: "Applications" + "Providers" + "Sign Out".
- [ ] **T031** Create `src/app/admin/page.tsx` — application review table. Fetch from `/api/admin/applications`. Columns: name, email, activity type, location, date, status badge, actions dropdown. Sorted newest first.
- [ ] **T032** Create `src/app/api/admin/applications/route.ts` — GET handler (list all, auth-gated). PATCH on `[id]` for status changes.
- [ ] **T033** Create `src/app/admin/providers/new/page.tsx` — form to create a full provider profile from an approved application. Pre-fills from application data. Additional fields: slug (auto-generated), full description, image URL, trust badge toggle, schedule notes.
- [ ] **T034** Create `src/app/api/admin/providers/route.ts` — POST (create provider) and PATCH on `[id]` (update provider). Auth-gated. Auto-generate slug from name.
- [ ] **T035** Seed two admin users (Leroy + George) — either via seed script or manual DB insert with hashed passwords.

**Verification:** Sign in as admin. Access `/admin` — see application review table. Change application status via dropdown. Create a provider from an approved application. Verify provider appears on browse page. Attempt to access `/admin` without auth — redirected to sign-in.

### Phase 5: Search, Polish, AI Matching & Roadmap Placeholders

**Goal:** Search API, WhatsApp button, trust badges, empty states, AI-powered natural language matching engine, AND "Coming soon" placeholders for remaining Phase 2 features.

**Tasks:**

- [ ] **T041** Create `src/app/api/search/route.ts` — GET handler. Query params: `q`, `category`, `age`, `location`, `price`. Search across provider name, category, providerName, location. Return matching providers as JSON.
- [ ] **T042** Wire `SearchBar.tsx` to `/api/search` with debounced input (300ms). Show loading state while fetching. Show "No results found" empty state.
- [ ] **T043** Create `src/components/WhatsAppButton.tsx` — uses `NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER ?? provider.phone`. Pre-filled message template. WhatsApp green + icon.
- [ ] **T044** Add trust badges to `ProviderCard.tsx` — show "Verified" (teal) if `provider.verified`, "New" (amber) if not. Add to detail page header.
- [ ] **T045** Empty states — browse page "No activities match your filters" with suggestions. Detail page 404 styled with ILALI branding. Form error states tested.
- [ ] **T046** Create `src/lib/ai/match.ts` — LLM intent extraction. POST to DeepSeek API with structured prompt containing tag vocabulary + CT suburb list. Returns `MatchIntent` JSON. Fallback to null on failure/timeout.
- [ ] **T047** Create `src/lib/ai/score.ts` — scoring algorithm. Tag overlap (40pts), age range match (25pts), location match (20pts), price match (15pts). Normalized to 0-100.
- [ ] **T048** Create `src/app/api/match/route.ts` — POST handler. Body: `{ query: string }`. Calls `extractIntent()` → fetches all providers → scores each → returns ranked `{ matches: [{ provider, score, reasons }] }`. Fallback to keyword search on LLM failure.
- [ ] **T049** Update `SearchBar.tsx` — add natural language mode. When input looks like a sentence (contains spaces, > 20 chars), label changes to "Describe what you're looking for..." and submits to `/api/match`. Placeholder text teaches by example.
- [ ] **T050** Add match score badges to `ProviderCard.tsx` — show "92% match" badge when results come from `/api/match`. Show match reasons as subtle tag row.
- [ ] **T051** Add "You might also like" to `src/app/activity/[slug]/page.tsx` — 2-3 similar providers based on tag overlap. Below main content.
- [ ] **T052** [P] Create `src/components/ComingSoon.tsx` — reusable placeholder component. Props: `title`, `description`, `linkHref?`, `linkLabel?`, `icon?`. Teal-tinted card, soft border, "Coming soon" badge. 375px-safe.
- [ ] **T053** [US1] Add reviews placeholder to `src/app/activity/[slug]/page.tsx` — "Reviews" section with outlined stars + "Reviews coming soon..."
- [ ] **T054** [US1] Add "Online booking coming soon" badge to activity detail page near WhatsApp button
- [ ] **T055** [US1] Add parent accounts placeholder to browse page — subtle card "👋 Sign up to save favourites. Coming soon." Links to `/auth/signup`
- [ ] **T056** [US2] Add provider dashboard + email messaging to signup success state in `src/app/providers/signup/form.tsx`
- [ ] **T057** [P] Add AI onboarding placeholder to `src/app/for-providers/page.tsx`
- [ ] **T058** [P] Add AI onboarding placeholder to `src/app/provider-resources/page.tsx`
- [ ] **T059** Accessibility pass — verify all form inputs have labels, all images have alt text, keyboard navigation works on admin dashboard, focus indicators visible, placeholders meet contrast requirements.
- [ ] **T060** Run `npm run build` — fix any TypeScript errors. Run `npm run lint` — fix any warnings. Run `npx tsc --noEmit` — zero type errors.

**Verification:** Search works with debounce. WhatsApp button opens correct number with pre-filled message. Trust badges display correctly. Empty states render. Natural language query returns ranked matches with scores. Match reasons are accurate. "You might also like" shows similar providers. All 5 roadmap placeholders visible at correct locations. Build and lint pass clean.

### Phase 6: Deploy & Verify

**Goal:** Deploy to Vercel production, verify all flows end-to-end.

**Tasks:**

- [ ] **T061** Pull Vercel env vars: `vercel env pull --environment=production`. Verify `DATABASE_URL` is not empty. Add any missing vars (`NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER`, admin seeds, `DEEPSEEK_API_KEY`).
- [ ] **T062** Run `npm run build` locally to verify production build passes.
- [ ] **T063** Push to Vercel: `git push origin main` (triggers auto-deploy).
- [ ] **T064** Smoke test on production:
  - Land on homepage → loads < 2s
  - Browse page → shows DB providers
  - Filter by category → URL updates, results filter
  - Click activity → detail page with WhatsApp button
  - Click WhatsApp → opens wa.me with correct number
  - Submit provider signup form → success message
  - Submit referral form → success message
  - Sign in to `/admin` → dashboard loads
  - Change application status → DB updates
  - Create provider → appears on browse page
  - Sign out → redirected from `/admin`
- [ ] **T065** Quickstart validation — run through all acceptance criteria from spec.md, check off each one.

**Verification:** All smoke test steps pass. All spec acceptance criteria checked off.

---

## Files Manifest

### Files to Create

```
.env.example
drizzle.config.ts
src/lib/db/index.ts              — Lazy DB client (Proxy pattern)
src/lib/db/schema.ts             — Drizzle schema (7 tables)
src/lib/db/seed.ts               — Migrate constants.ts data to DB
src/lib/ai/match.ts              — LLM intent extraction for matching
src/lib/ai/score.ts              — Provider scoring algorithm
src/lib/db/queries.ts            — Reusable DB query functions
src/lib/db/types.ts              — TypeScript types for enums
src/lib/validations.ts           — Zod schemas for forms
src/lib/auth.ts                  — Better Auth config
src/lib/suburbs.ts               — Cape Town suburb list
src/lib/utils.ts                 — Phone formatting utility
src/app/api/auth/[...all]/route.ts
src/app/api/providers/apply/route.ts
src/app/api/referrals/route.ts
src/app/api/search/route.ts
src/app/api/admin/applications/route.ts
src/app/api/admin/applications/[id]/route.ts
src/app/api/admin/providers/route.ts
src/app/api/admin/providers/[id]/route.ts
src/app/(auth)/signin/page.tsx
src/app/admin/layout.tsx
src/app/admin/page.tsx            — Application review table
src/app/admin/providers/new/page.tsx
src/app/admin/providers/[id]/edit/page.tsx
src/components/WhatsAppButton.tsx
src/middleware.ts (or proxy.ts)   — Admin route protection
```

### Files to Modify

```
src/app/activity/[slug]/page.tsx  — DB lookup + WhatsApp button
src/app/venues/[slug]/page.tsx    — DB lookup
src/app/browse/page.tsx           — DB query + search params
src/app/providers/page.tsx        — DB query
src/app/venues/page.tsx           — DB query
src/app/locations/page.tsx        — DB query
src/app/providers/signup/form.tsx — POST to API + Zod errors
src/app/providers/refer/form.tsx  — POST to API + Zod errors
src/components/FilterBar.tsx      — Server-component categories
src/components/SearchBar.tsx      — API search + debounce
src/components/ProviderCard.tsx   — Trust badges
src/lib/constants.ts              — Remove providers/venues exports
package.json                      — May need script additions
```

### Files That Don't Change

All informational pages: `/`, `/about`, `/how-it-works`, `/for-parents`, `/for-providers`, `/for-venues`, `/safeguarding`, `/safety-guidelines`, `/privacy`, `/terms`, `/ubuntu-rewards`, `/provider-resources`, `/contact`, `/categories`, `/auth/signup` (placeholder), Header, Footer, Hero, StatsBar, CTASection, TestimonialCarousel, globals.css, tailwind config.

---

## Quickstart

### Prerequisites

1. Neon PostgreSQL database provisioned (via Vercel integration)
2. Vercel project with preview.ilali.co deployed
3. `vercel env pull --environment=production` succeeds

### Setup

```bash
cd /root/ilali
cp .env.example .env
# Fill in DATABASE_URL, BETTER_AUTH_SECRET, etc.

npm install
npx drizzle-kit push          # Create tables
npx tsx src/lib/db/seed.ts    # Seed data
npm run dev                   # Start dev server
```

### Validate

| Check | Command / Action |
|---|---|
| DB has seed data | `npx drizzle-kit studio` → browse tables |
| Browse page works | Visit `http://localhost:3000/home` — see 4+ providers |
| Activity detail works | Click any activity — see full profile + WhatsApp button |
| Venue detail works | Visit `http://localhost:3000/venues` — click a venue |
| Search works | Type in search bar — results update < 500ms |
| Filters work | Click category/age/location filters — URL updates, results filter |
| Provider signup works | Visit `/providers/signup` — fill form → submit → success |
| Referral form works | Visit `/providers/refer` — fill form → submit → success |
| Admin sign-in works | Visit `/admin` → redirected to sign-in → sign in → dashboard |
| Admin can review | Change application status → DB updates |
| Admin can create provider | Create provider → appears on browse page |
| WhatsApp button works | Click WhatsApp on detail page → opens wa.me with correct number |
| Build passes | `npm run build` — zero errors |
| Lint passes | `npm run lint` — zero warnings |

---

## Dependencies Between Phases

```
Phase 1 (DB) ──────┬──→ Phase 2 (Data Migration) ──→ Phase 5 (Search & Polish)
                    │
                    ├──→ Phase 3 (Forms & API) ──────┐
                    │                                 ├──→ Phase 6 (Deploy)
                    └──→ Phase 4 (Admin Auth) ────────┘
```

Phase 1 must complete first. Phase 3 and Phase 4 are independent of each other and of Phase 2 — they can run in parallel. Phase 5 depends on Phase 2 (search needs DB queries). Phase 6 waits for everything.

---

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| Neon DB free tier limit (256 MB) hit | Builds fail | Monitor usage. Upgrade before limit ($19/mo plan). |
| Vercel env vars empty after pull (`DATABASE_URL=""`) | DB connection fails at runtime | Known issue — `vercel env rm` + `vercel env add` to fix. Documented in `references/vercel-neon-integration.md`. |
| Better Auth `middleware.ts` breaks Next.js 16 | Auth gate non-functional | Next.js 16 uses `proxy.ts` instead. Double-check during setup. |
| `constants.ts` still imported somewhere after migration | Stale data shown | Grep for `from "@/lib/constants"` after Phase 2. Remove all provider/venue imports. |
| Rate limiting not working without Vercel KV | Form spam | Use Vercel KV `@vercel/kv` for rate limiting. Free tier includes KV. |
| George doesn't provide Vercel access in time | Can't deploy | Phase 1-5 can be done locally. Deploy blocked but code is ready. |
