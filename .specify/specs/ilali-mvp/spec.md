# Feature Spec: ILALI MVP

**Date:** 2026-07-29
**Constitution:** [.specify/memory/constitution.md](../memory/constitution.md)
**Status:** Clarified ✓

## Vision Statement

ILALI should feel like a trusted village noticeboard brought online — warm, welcoming, and instantly useful. A Cape Town parent opens the site on their phone, taps a few filters, and within 30 seconds finds a vetted activity for their child within driving distance. They see a provider's name, location, age range, price in Rands, trust badges, and a WhatsApp button. One tap connects them directly. No forms, no payments, no friction — just discovery and connection.

For providers, listing an activity should feel effortless. They fill a simple form, submit it, and hear back within 48 hours. They don't need to understand databases or design — ILALI handles everything.

The MVP is deliberately small. It does one thing exceptionally well: connect parents to trusted providers. Everything else — bookings, payments, reviews — is Phase 2, and only if Phase 1 proves demand.

## User Scenarios

### Scenario 1: Parent finding an activity for their child

**As a** Cape Town parent
**I want to** browse, filter, and find a suitable extramural activity for my child
**So that** I can connect with a trusted provider and enroll my child

**Acceptance criteria:**
- [ ] Landing page loads within 2s on mobile 3G, with hero, trust signals, and a prominent "Browse Activities" CTA
- [ ] Browse page shows all available activities as cards with: image, category icon, name, provider, location, age range, price in Rands, and trust badge (if verified)
- [ ] Filters work by: category (multi-select), age group, location/suburb, price range, and date — all update the URL and results instantly via client-side navigation
- [ ] Category icons row at the top of browse for quick visual filtering
- [ ] Tapping an activity card opens a detail page showing: full description, provider info, exact location with suburb, age range, price breakdown, trust badges, available schedule (if any), and a prominent WhatsApp contact button
- [ ] WhatsApp button uses a configurable phone number (defaults to provider's phone from DB, swappable to ILALI intermediary number via env var `NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER`) with a pre-filled message template: "Hi! I found your [activity name] listing on ILALI and I'm interested in learning more."
- [ ] Search bar accepts text queries and filters activities by name, category, provider, or location — results update within 500ms
- [ ] Empty state: if no activities match filters, show a friendly message with suggestions ("Try broadening your filters" or "Browse all activities")
- [ ] Every activity card and detail page shows a trust badge: "Verified" (teal badge) for background-checked providers, "New" (amber) for pending verification
- [ ] The entire browse → filter → view → contact flow works at 375px width without horizontal scrolling or broken layouts
- [ ] Activity detail page shows a "Reviews" section below the description with outlined stars and "Reviews coming soon — we're building a trusted review system for Cape Town families."
- [ ] Browse page shows a subtle "👋 Sign up to save favourites. Coming soon." card linking to `/auth/signup`
- [ ] Activity detail page shows "Online booking coming soon" badge near the WhatsApp button

### Scenario 2: Provider listing their activity

**As a** children's activity provider in Cape Town
**I want to** submit my activity for listing on ILALI
**So that** Cape Town parents can discover my services

**Acceptance criteria:**
- [ ] Provider signup form at `/providers/signup` collects: provider's full name, email, phone (+27), activity name, category (dropdown from existing categories), description, location/suburb, age range (min-max), price (in Rands, with "Free" checkbox), and optional image upload
- [ ] Form validates required fields client-side before submission — shows inline errors, not alerts
- [ ] On submit, data is POSTed to `/api/providers/apply` and stored in the `provider_applications` table with status `pending`
- [ ] Success state: a thank-you page confirming submission with "We'll review your application within 48 hours. You'll hear from us at [email]"
- [ ] Error state: if the API fails, show a "Something went wrong. Please try again or email us at hello@ilali.co" message — the form data is preserved, not lost
- [ ] Phone field auto-formats to +27 XX XXX XXXX
- [ ] Location field is a Cape Town suburb dropdown (not free text) — sourced from a predefined list of CT suburbs
- [ ] The form works at 375px width — all fields are thumb-friendly (min 44px tap targets)
- [ ] Signup success page includes: "When approved, you'll get access to your own provider dashboard to manage listings, track enquiries, and update your profile."
- [ ] Signup success page includes: "You'll receive email updates about your application status."

### Scenario 3: Community member referring a provider

**As a** community member (parent, teacher, friend)
**I want to** refer a provider I know to ILALI
**So that** great local activities get discovered by more families

**Acceptance criteria:**
- [ ] Referral form at `/providers/refer` collects: referrer's name, referrer's email, provider's name, provider's email, provider's phone (optional)
- [ ] On submit, data is POSTed to `/api/referrals` and stored with status `pending`
- [ ] Success state: a thank-you message with "We'll reach out to [provider name] and invite them to list on ILALI"
- [ ] Form validation and error handling mirror the provider signup form

### Scenario 4: Admin reviewing provider applications

**As an** ILALI admin (Leroy/George)
**I want to** review, approve, or reject provider applications
**So that** only legitimate, quality providers appear on the platform

**Acceptance criteria:**
- [ ] Admin dashboard at `/admin` (gated by auth) shows a table of all `provider_applications` sorted by newest first
- [ ] Each row shows: name, email, activity type, location, submission date, and status badge (pending/contacted/approved/rejected)
- [ ] Admin can change status via a dropdown: pending → contacted → approved OR rejected
- [ ] When a provider is approved, their data is used to create a draft provider profile (not auto-published — requires admin to complete the profile)
- [ ] Dashboard is functional but deliberately minimal — no analytics, no charts, no bulk operations in MVP
- [ ] Admin auth uses email/password (Better Auth) — Google OAuth optional for MVP
- [ ] Unauthorized access to `/admin` redirects to sign-in
- [ ] All provider management routes (`/admin/*`, provider creation, provider editing) are behind the same auth gate — no unauthenticated access to any admin function

### Scenario 5: Provider profile goes live

**As an** ILALI admin
**I want to** publish approved providers to the live site
**So that** parents can discover them

**Acceptance criteria:**
- [ ] Admin can create a full provider profile from an approved application — filling in: slug (auto-generated from name), full description, image URL, exact location, age range, price in cents, trust badge status, and schedule notes
- [ ] Published providers appear immediately on the browse page and in search results
- [ ] Provider data is stored in the `providers` table and served via DB queries (not static constants)
- [ ] The existing `constants.ts` data is migrated to the database as seed data

### Scenario 6: AI-Powered Natural Language Matching

**As a** Cape Town parent
**I want to** describe what my child needs in plain language and get matched to the right provider
**So that** I don't have to figure out filters and categories — ILALI understands what I mean

**Acceptance criteria:**
- [ ] Browse page search bar accepts natural language input — a parent can type "my 7 year old needs to burn energy after school, something outdoors near Claremont"
- [ ] On submit, the query is sent to `/api/match` — an AI model extracts structured intent: age range, activity tags, location, budget preference
- [ ] System returns a ranked list of matching providers, each showing a match score (e.g. "92% match")
- [ ] Results are displayed as provider cards sorted by match score — highest match first
- [ ] Each card shows WHY it matched (e.g. "Matches: outdoors, ages 6-12, Claremont") in a subtle tag row
- [ ] If no providers match well (all scores < 30%), show a friendly message: "We couldn't find a perfect match, but here are some nearby activities you might like" with the closest available providers
- [ ] The natural language input has placeholder text that teaches by example: "e.g. 'something creative for my 5 year old in Muizenberg' or 'high-energy sport for a 10 year old under R200'"
- [ ] Traditional filters (category, age, location, price) still work — they coexist with natural language search. Applying a filter refines AI-matched results.
- [ ] Response time from submit to results < 3 seconds (LLM extraction + DB query)
- [ ] Match scores feel intuitive — a provider that matches age, location, and activity type scores 85%+. A provider that only matches location scores 30-40%.
- [ ] Activity detail pages show "You might also like" — 2-3 similar providers based on tag overlap, below the main content

## Functional Requirements

### FR-1: Activity Discovery (Browse + Search + Filter + Match)
The browse page is the core of the MVP. It supports three discovery modes: (1) browsing all providers with traditional filters (category, age, location, price), (2) keyword search, and (3) AI-powered natural language matching. All filters are reflected in the URL query string so results are shareable. The natural language input accepts plain-English descriptions of what a parent is looking for and returns AI-ranked matches with scores.

### FR-2: Activity Detail Page
Each activity has a dedicated page at `/activity/[slug]` showing the complete provider profile. The page includes: hero image, activity name and category, full description, provider/organization name, location with suburb, age range (formatted as "Ages X–Y"), price in Rands, trust badges, and a WhatsApp contact button with a pre-filled message. The WhatsApp number is configurable (see FR-3).

### FR-3: WhatsApp Contact
The primary contact method is WhatsApp. Every activity detail page has a prominent WhatsApp button that opens `wa.me` with a phone number and a pre-filled message template: "Hi! I found your [activity name] listing on ILALI and I'm interested in learning more." The phone number is configurable via environment variable `NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER` — defaults to the provider's phone from the database, but can be swapped to an ILALI intermediary number at any time without code changes. Phone number format is +27XXXXXXXXX (no spaces, no leading zero after +27).

### FR-4: Provider Application Form
A multi-field form at `/providers/signup` that collects all information needed to evaluate and eventually list a provider. Form submissions are stored in the database with pending status for admin review. The form must validate all fields, show inline errors, preserve data on failure, and work on mobile.

### FR-5: Community Referral Form
A lightweight form at `/providers/refer` for community members to refer providers they know. Lower friction than the full signup form — only collects contact information for both parties. Stored in the referrals table.

### FR-6: Admin Dashboard & Auth
A simple, functional admin interface for reviewing and managing provider applications. The `/admin` dashboard AND all provider management routes (creation, editing, status changes) are protected by admin authentication. Unauthenticated requests are redirected to sign-in. No admin functions are accessible without auth — this is where Trust First is enforced operationally. Dashboard is deliberately minimal — no analytics, no bulk operations, no charts.

### FR-7: Provider Management (Admin, Auth-Protected)
Admins can convert approved applications into live provider profiles. This includes setting the full profile fields (description, images, pricing, trust badges) that weren't captured in the initial application form. Published providers immediately appear on the site. All provider creation and editing routes are behind the admin auth gate — no unauthenticated access.

### FR-8: Static Informational Pages
All existing informational pages (`/`, `/about`, `/how-it-works`, `/for-parents`, `/for-providers`, `/for-venues`, `/safeguarding`, `/safety-guidelines`, `/privacy`, `/terms`, `/ubuntu-rewards`, `/provider-resources`, `/contact`, `/locations`, `/categories`) remain as they are — no backend changes needed.

### FR-9: Trust Badges
Every provider card and detail page displays a trust indicator. Verified providers (background-check passed) show a teal "Verified" badge. New/unverified providers show an amber "New" badge. The badge is determined by the `verified` boolean on the provider record.

### FR-10: Database-Backed Data
All activity, provider, venue, and category data is served from Neon PostgreSQL via Drizzle ORM. The existing `constants.ts` mock data is migrated to the database as seed data. The front-end swaps `constants.ts` imports for DB queries with no UI changes needed.

### FR-11: Roadmap Placeholders
Every feature provisioned for in the architecture but not yet built MUST have a visible placeholder in the UI. The community and stakeholders should see where ILALI is heading — not just what's live today. Placeholders must feel intentional and on-brand, not like broken or unfinished pages.

**Placeholder locations and messaging:**

| Feature | Where | What the user sees |
|---|---|---|
| **Reviews & ratings** | Activity detail page, below description | Section header "Reviews" with outlined stars and "Reviews coming soon — we're building a trusted review system for Cape Town families." |
| **Parent accounts** | Browse page, below filters | Subtle banner or card: "👋 Sign up to save your favourite activities. Coming soon." Links to `/auth/signup` placeholder. |
| **Provider dashboard** | Provider signup success page + `/for-providers` page | "When approved, you'll get access to your own provider dashboard to manage listings, track enquiries, and update your profile." |
| **Online booking** | Activity detail page, next to WhatsApp button | Small badge or text: "Online booking coming soon" — positioned near the CTA so users see the future upgrade path. |
| **Email notifications** | Provider signup success page | "You'll receive email updates about your application status." (sets expectation even if not wired yet) |
| **AI provider onboarding** | `/for-providers` page and `/provider-resources` page | "Coming soon: upload a photo of your activity poster on WhatsApp and we'll auto-create your profile. No typing needed." |

**Placeholder design rules:**
- Use ILALI's warm teal + soft gray, not harsh "under construction" yellow
- Include the phrase "Coming soon" consistently
- Never block the current user flow — placeholders are adjacent, not in the way
- Every placeholder links somewhere (signup page, provider page, etc.) — no dead ends
- Mobile-friendly: placeholders must not break the 375px layout

### FR-12: AI-Powered Natural Language Matching
The flagship discovery feature. Parents type plain-English descriptions of what they want ("my 7 year old needs to burn energy after school, something outdoors near Claremont") and ILALI returns ranked provider matches with match scores.

**How it works:**
1. Parent submits natural language query via the browse page search bar
2. Query is sent to `POST /api/match` 
3. An LLM (DeepSeek, same provider as the rest of the stack) extracts structured search parameters: `{ ageMin, ageMax, tags: string[], location, priceMax }`
4. System queries the database for all providers, then scores each one against the extracted intent
5. Results are returned ranked by match score with a "why this matched" explanation

**Scoring algorithm:**
- Tag overlap (provider.tags ∩ extracted tags): up to 40 points
- Age range match (provider age range overlaps with requested age): up to 25 points
- Location match (same suburb = full, adjacent = partial): up to 20 points
- Price match (within budget): up to 15 points
- Normalized to 0-100%. Scores below 30% trigger the fallback message.

**LLM prompt design:**
The extraction prompt is strict and structured — it returns JSON only, no conversation. The prompt includes the full list of known Cape Town suburbs and a predefined tag vocabulary (outdoor, indoor, creative, sport, music, academic, high-energy, calm, group, individual, weekend, after-school, holiday-program, free, beginner, advanced). This constrains the LLM to extract only matchable parameters.

**Fallback behavior:**
- If the LLM call fails or times out (> 3s), fall back to keyword search against provider name + description
- If no providers score above 30%, show the closest available with a friendly explanation
- The traditional filters still work — they're always available as a refinement tool

**"You might also like":**
On activity detail pages, show 2-3 similar providers based on tag overlap with the current provider. This keeps parents browsing and discovering even after they've found one match.

## Non-Functional Requirements

### NFR-1: Performance
- Landing page Largest Contentful Paint < 2.5s on mobile 3G
- Browse page renders initial results within 1.5s
- Search/filter response < 500ms for the MVP dataset (< 100 providers)
- AI matching response (query → results) < 3 seconds (LLM extraction + DB query + scoring)
- No render-blocking JavaScript above the fold
- Images use Next.js `<Image>` component with lazy loading and WebP format

### NFR-2: Mobile-First Design
- Every page and form works at 375px width without horizontal scrolling
- All interactive elements have minimum 44×44px tap targets
- Forms use appropriate input types (tel, email, number) for mobile keyboards
- Touch-friendly spacing between filter chips and category icons
- No hover-dependent UI (all interactions work with tap)

### NFR-3: Accessibility
- WCAG 2.1 AA minimum compliance
- All images have alt text
- Form inputs have associated labels
- Color contrast ratios meet AA standards (4.5:1 for normal text, 3:1 for large text)
- Keyboard navigation works for all interactive elements
- Focus indicators are visible

### NFR-4: Security
- All API routes validate input server-side (Zod schemas)
- Form submissions are rate-limited (5 per IP per hour via Vercel KV or similar)
- Admin routes (`/admin/*`) AND all provider management API routes are protected by auth middleware — no unauthenticated access to any admin function
- Database credentials never exposed to the client
- SA ID numbers (if collected in future) use Luhn checksum validation
- Phone numbers are sanitized to +27 format

### NFR-5: SA Context
- All pricing displayed in Rands (R)
- Location data uses Cape Town suburbs (not generic cities)
- Phone numbers use +27 format
- Age ranges use South African school phase groupings: Toddlers (0–3), Early Childhood (4–7), Middle Childhood (8–12), Teens (13–17)
- Content in English (isiXhosa and Afrikaans in Phase 2)

### NFR-6: Reliability
- Database connection uses lazy initialization (Proxy pattern) to prevent Turbopack build failures
- API routes return appropriate HTTP status codes (200, 400, 401, 404, 500)
- Empty states and error states are handled gracefully — never a blank page or uncaught error
- Vercel deployment with automatic preview deployments on push

## Key Entities

- **Provider** — an activity listing (name, slug, category, description, provider org name, location, age range, price in cents, trust status, contact phone, images)
- **Venue** — a physical space where activities happen (name, type, location, capacity, amenities)
- **Category** — a managed activity type (Arts & Culture, Sports, Music, etc.)
- **User** — an authenticated person (parent, provider, or admin role)
- **ProviderApplication** — a pending signup form submission awaiting admin review
- **Referral** — a community-submitted provider recommendation
- **Review** — Phase 2 only (schema exists but not surfaced in MVP UI)

## Visual/UX Direction

ILALI's visual identity is the deliberate opposite of KitFix. Where KitFix is dark, edgy, and sport-driven, ILALI is light, warm, and family-focused.

**Color palette:**
- Primary: Teal (`ilali-*` scale — from soft 50 to deep 900)
- Accent: Sunset orange (`sunset-*` scale — used sparingly for CTAs and highlights)
- Secondary: Warm yellow (`warm-*` — subtle backgrounds, badges)
- Base: White backgrounds with slate text. Generous whitespace. Light theme is default.

**Typography:** Inter, friendly and readable. Weights: regular (400) for body, semibold (600) for UI labels, extrabold (800) for headlines. No thin or light weights — they feel cold.

**Shape language:** Rounded corners everywhere (rounded-xl, rounded-2xl, rounded-full for buttons). Soft shadows, not hard. Cards have subtle borders and hover states that lift slightly.

**Imagery:** Full-width hero images of happy kids doing activities — real Cape Town settings, diverse children, natural light. No stock-photo feel. Provider images are actual photos of their activities.

**Trust signals:** Badges are prominent but not aggressive. "Verified" in teal, "New" in amber. The landing page hero includes a trust bar with ASSITEJ SA and BASA logos. Stats bar shows "100% Background Checked" prominently.

**Mobile feel:** The experience should feel app-like on mobile — fast transitions, sticky header, filter chips that scroll horizontally, cards that stack vertically. No desktop-only layouts.

**The WhatsApp button:** A floating or prominent green button with the WhatsApp icon — instantly recognizable. It should be the most visually distinct element on the detail page after the hero image.

## Assumptions

1. **Seed data is sufficient for MVP launch.** The existing 4 providers + 4 venues + 11 categories in `constants.ts` are migrated to the database. New providers come through the application form. We don't need 50+ providers to launch.
2. **WhatsApp contact number is configurable.** The WhatsApp button can use either the provider's direct number or an ILALI intermediary number — configured via `NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER` env var. Default behavior uses the provider's phone from the database. The decision on which number to use will be finalized with George.
3. **Admin is Leroy + George only.** No multi-admin roles, no permission levels, no team management in MVP. Two user accounts with `role = 'admin'`.
4. **No image uploads in MVP forms.** Provider applications collect an optional image URL field, not a file upload. Vercel Blob for actual uploads comes in Phase 2.
5. **Client-side filtering is acceptable for MVP.** With < 100 providers, fetching all and filtering client-side is faster than server round-trips. The `constants.ts` → DB migration preserves this pattern temporarily.
6. **Better Auth with email/password is sufficient.** Google OAuth is a nice-to-have for MVP but not required. Admin auth is email/password. Provider/parent auth comes in Phase 2.
7. **Neon PostgreSQL free tier (256 MB) is sufficient for MVP.** We'll monitor usage and upgrade before hitting the limit.
8. **The existing Vercel project (preview.ilali.co) is the deployment target.** No new Vercel project needed. Domain ilali.co is managed by George.

## MVP Scope Boundary

The MVP is deliberately the smallest thing that proves the marketplace works: browse → filter → view → WhatsApp contact. But ILALI is a marketplace business, and these features ARE the business — they're just not in the first release. The architecture must accommodate them from day one so we're not rebuilding later.

### Ships in MVP

| Feature | What MVP delivers |
|---|---|
| Activity discovery | Browse, search, filter by category/age/location/price |
| Provider detail pages | Full profile with WhatsApp contact button |
| Provider application form | Submit → admin review → approve → publish |
| Community referrals | Lightweight referral form |
| Admin dashboard | Review queue + provider management (auth-gated) |
| Trust badges | Verified / New indicators on all provider cards |
| Static informational pages | 15 existing pages, no changes needed |
| Roadmap placeholders | "Coming soon" UI elements for reviews, parent accounts, provider dashboard, online booking, email, AI onboarding — visible throughout the app |
| AI-powered matching | Natural language search → LLM extraction → ranked provider matches with scores. "You might also like" on detail pages. |

### Architecture Must Accommodate (Not in MVP UI)

These are core to the business and the data model, API design, and component architecture must make provision for them — even though they won't ship in the first release.

| Feature | Provision Required |
|---|---|
| **Reviews & ratings** | `reviews` table in schema. Provider type includes `rating` and `reviewCount` fields. Detail page layout leaves space for a reviews section. Rating stars component exists (already in codebase). Not surfaced in MVP UI. |
| **Parent accounts** | `users` table includes `role = 'parent'`. Auth system (Better Auth) supports multiple roles from day one. Sign-up/sign-in pages exist as placeholders. No parent-specific features (favorites, history) in MVP UI. |
| **Provider dashboard** | `users` table includes `role = 'provider'`. Provider profiles are stored in the `providers` table with full CRUD-ready fields. The admin provider management UI is built on the same data model providers will eventually self-manage. No provider login or self-service in MVP. |
| **Online booking & payment** | Provider records include `price_value` (in cents) and `price_label` — ready for booking calculations. Activity detail page has a clear CTA position (currently the WhatsApp button) that can become a "Book Now" button. No booking/payment logic in MVP. |
| **Email notifications** | Resend or Brevo SDK installed and configured (same as NoZar). Email templates for "application received" and "application approved" can be created but not wired to triggers. Admin checks dashboard manually in MVP. |
| **AI provider onboarding** | `provider_applications` table has fields matching what a vision model would extract (name, category, location, age range, price). The WhatsApp → profile pipeline is spec'd separately in the master plan (Phase 2.8). No AI integration in MVP. |

### Truly Deferred (Phase 2+)

These require significant new infrastructure or third-party integrations and are not provisioned for in MVP architecture beyond basic awareness.

| Feature | Why deferred |
|---|---|
| **Advanced search** (full-text, geospatial) | Requires PostgreSQL full-text search setup, PostGIS for location queries. MVP dataset (< 100 providers) doesn't need it. Client-side filtering is sufficient. |
| **Multi-language support** (isiXhosa, Afrikaans) | Requires i18n framework, translation pipeline, content audit of all 15+ pages. English-only is a deliberate MVP constraint. |
| **Mobile app** (React Native / PWA) | Responsive web is the MVP. PWA wrapper can be added later without backend changes. Native app requires a separate codebase. |
| **Analytics dashboard** | Requires event tracking, data pipeline, dashboard UI. Admin dashboard in MVP is purely operational (review queue). |

## Spec Quality Checklist

- [x] No implementation details (languages, frameworks, APIs, code structure) — kept at the "what and why" level
- [x] Focused on user value and business needs
- [x] All mandatory sections completed
- [x] No [NEEDS CLARIFICATION] markers remain — all 2 resolved ✓
- [x] Requirements are testable and unambiguous
- [x] Success/acceptance criteria are measurable and technology-agnostic
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified (empty states, error states, mobile widths, form validation)
- [x] Scope is clearly bounded (Out of Scope section has 10 items)
- [x] Dependencies and assumptions identified (8 assumptions)
- [x] Visual/UX direction is concrete — a designer could build from this
