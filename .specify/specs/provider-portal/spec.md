# Feature Spec: Provider Portal

**Date:** 2026-08-04
**Status:** Draft — Ready for Review
**Spec Driven By:** Grill Me session with Leroy

## Vision Statement

Providers should feel like ILALI is their platform, not just a directory they were added to. When they log in, they see a dashboard that's genuinely useful — their listing as parents see it, real activity from families (inquiries, club members, reviews), and a gentle nudge to complete their profile so they show up in AI concierge results. The experience should feel warm, professional, and immediately valuable — even for a brand-new provider with no members yet.

## Grill Me Synthesis

| What's Clear | Key Decisions |
|---|---|
| Phase 1+2 combined — auth, dashboard, listing mgmt, club overview, review responses, event CRUD | Phase 3 (analytics, staff, financials) deferred to separate spec |
| Admin approval auto-creates provider user account with temp password | Temp password displayed inline after approval; persist fallback in admin panel |
| Forced password creation on first login + passphrase recovery | Passphrase = 3+ words, hashed, self-service reset |
| Dashboard: listing card on top, activity feed below | Inline collapsible wizard, not a gate, persistent nudge |
| Existing 19 providers: migration + claim flow | Claim flow lets existing providers set password by email match |
| Email: architected for but not dependent on — Resend call added later | |

| Still Uncertain | Resolution |
|---|---|
| ilali.co email hosting | Design for it, don't depend on it. Add email trigger when confirmed with George. |

## User Scenarios

### Scenario 1: New Provider — First Login
**As a** newly approved provider
**I want to** sign in and create my password
**So that** I can access my provider dashboard

**Acceptance criteria:**
- [ ] Admin clicks "Approve" on application → provider user account created automatically with `role: 'provider'`, temp password, and `passwordResetRequired: true`
- [ ] Admin sees temp password displayed once with copy buttons
- [ ] Provider visits `/auth/signin` → enters email + temp password → redirected to `/auth/create-password`
- [ ] `/auth/create-password`: forced to set new password + recovery passphrase (3+ words) before proceeding
- [ ] After password creation → `passwordResetRequired` cleared, redirected to `/provider`
- [ ] Passphrase is hashed (same bcrypt as password) and stored; never plaintext
- [ ] Wrong temp password shows error, 5 attempts then 15-min lockout

### Scenario 2: Existing Provider — Claim Account
**As a** provider who was seeded before the portal existed
**I want to** claim my account and set my password
**So that** I can access my dashboard like new providers

**Acceptance criteria:**
- [ ] Migration script creates user accounts for all 19 providers (email from `providers` table, `role: 'provider'`, `needsClaim: true`)
- [ ] Provider visits `/providers/claim` → enters email → if email matches a provider record with `needsClaim: true`, shows "Set your password" form
- [ ] Password + passphrase set → `needsClaim` cleared, redirected to `/provider`
- [ ] Email doesn't match → "We couldn't find a provider with that email. Contact us if you think this is an error."
- [ ] Claim link available from sign-in page: "Already have a listing? Claim your account →"

### Scenario 3: Provider Dashboard — First Visit
**As a** newly logged-in provider with an incomplete listing
**I want to** understand what I need to do and what value the dashboard provides
**So that** I'm motivated to complete my profile

**Acceptance criteria:**
- [ ] Dashboard at `/provider` shows: profile completion wizard (collapsible) + listing card preview + activity stats (zeros or real data)
- [ ] Wizard shows 8 steps: activity name, category, age range, pricing, schedule, photos, description, tags
- [ ] Each step saves independently — progress persists on page refresh
- [ ] "I'll do this later" skips current step without losing previous progress
- [ ] At 8/8, wizard disappears entirely, replaced by "✅ Listing complete" in the listing card
- [ ] Listing card preview matches what parents see on `/activity/[slug]`
- [ ] Activity stats section: inquiries count, member count, upcoming events count
- [ ] Empty state for new providers: "Your activity will appear here as families discover your listing" (warm, not empty zeros)

### Scenario 4: Provider Edits Listing
**As a** provider
**I want to** update my activity details, photos, schedule, and pricing
**So that** my listing accurately reflects what I offer

**Acceptance criteria:**
- [ ] `/provider/edit` — single-page form with all provider fields: name, description, category (read-only), pricing (Rands), age range (min/max), tags (multi-select), location/suburb, schedule (days + times), photos (upload/reorder/delete)
- [ ] Photos: upload via file input, preview thumbnails, drag-to-reorder, max 6 photos
- [ ] Schedule: add/remove day-time pairs, e.g. "Mon 14:00–15:00"
- [ ] Save → `PATCH /api/provider` returns updated provider
- [ ] Success toast: "Listing updated — changes are live"
- [ ] Validation: name required, description required, price ≥ R0, age min ≤ age max
- [ ] Category is NOT editable (set during application, only admin can change)

### Scenario 5: Provider Responds to Reviews
**As a** provider
**I want to** reply to parent reviews
**So that** I can thank families and address concerns

**Acceptance criteria:**
- [ ] `/provider/reviews` — list of all reviews for this provider, newest first
- [ ] Each review card shows: star rating, reviewer name, date, content
- [ ] "Reply" button opens inline text area → submit → `POST /api/provider/reviews/[id]/reply`
- [ ] Provider reply appears below the review, indented, with "Response from [provider name]" label
- [ ] Provider can edit/delete their own reply (not the parent's review)
- [ ] Empty state: "No reviews yet. Reviews appear here once parents share their experience."

### Scenario 6: Provider Manages Events
**As a** provider
**I want to** create and manage club events
**So that** parents know when sessions, matches, and activities happen

**Acceptance criteria:**
- [ ] `/provider/events` — list of upcoming events for this provider, chronologically
- [ ] "Add event" button → modal or inline form: title, date/time, description, location, max participants (optional)
- [ ] `POST /api/provider/events` — creates event linked to provider's club
- [ ] Edit event: click event → inline edit form → `PATCH /api/provider/events/[id]`
- [ ] Delete event: confirmation dialog → `DELETE /api/provider/events/[id]`
- [ ] Events appear on the club page that parents see (`/clubs/[slug]`)
- [ ] Past events shown in a "Past events" section, collapsed by default

### Scenario 7: Provider Views Club Overview
**As a** provider
**I want to** see who's in my club
**So that** I know my community

**Acceptance criteria:**
- [ ] `/provider/club` — member list with parent names, child names, join date
- [ ] Member count prominently displayed
- [ ] Member list is read-only (no add/remove — that's parent self-service)
- [ ] Empty state: "No members yet. Parents join your club when they book your activities or attend your events."

### Scenario 8: Provider Recovers Password
**As a** provider who forgot their password
**I want to** reset it using my recovery passphrase
**So that** I don't need to contact admin

**Acceptance criteria:**
- [ ] Sign-in page: "Forgot password?" link
- [ ] `/auth/forgot-password`: enter email + recovery passphrase
- [ ] Match → set new password + new passphrase
- [ ] No match → "That doesn't match our records. Try again." (2 attempts, then 30-min lockout per email)
- [ ] Passphrase is case-sensitive, trimmed of leading/trailing whitespace

### Scenario 9: Admin Approves with New Flow
**As an** admin
**I want to** approve applications and create provider accounts in one step
**So that** providers can log in immediately after approval

**Acceptance criteria:**
- [ ] Approve button on application → calls modified `POST /api/admin/applications/[id]` (status=approved)
- [ ] Server-side: creates user in `users` table (email from application, temp password, `role: 'provider'`, `passwordResetRequired: true`)
- [ ] Links user to the `providers` record (new `userId` column or lookup table)
- [ ] Returns temp password in response — admin sees it inline on success
- [ ] Admin panel: approved applications show "Account created: [email]" with "Reveal / Regenerate temp password" button
- [ ] Regenerating invalidates old temp password
- [ ] Rejecting an application does NOT create a user account
- [ ] If user with that email already exists → error "A user with this email already exists"

## Functional Requirements

### FR-1: Provider User Account Creation
When an admin approves a provider application, the system MUST automatically create a user account with `role: 'provider'`, a randomly generated temporary password (12 chars, mixed case + digits), and `passwordResetRequired: true`. The provider's email from the application becomes their login email.

### FR-2: First-Login Password Reset
When a user with `passwordResetRequired: true` signs in, the system MUST redirect them to `/auth/create-password` where they MUST set a new password (min 8 chars) and a recovery passphrase (min 3 words) before accessing any other page.

### FR-3: Recovery Passphrase
The recovery passphrase MUST be hashed before storage (same bcrypt as password). The passphrase reset flow MUST support self-service password reset without admin intervention. The passphrase MUST be set during first login and can be changed from provider settings.

### FR-4: Existing Provider Migration
A one-time migration script MUST create user accounts for all existing providers in the `providers` table that don't have linked user accounts. These accounts MUST have `needsClaim: true` and no valid password. The claim flow at `/providers/claim` MUST allow these providers to set their password by verifying their email matches a provider record.

### FR-5: Provider Dashboard
The dashboard at `/provider` MUST show, in order: (1) profile completion wizard (collapsible), (2) listing card preview as parents see it, (3) activity stats (inquiries, members, events), (4) upcoming events, (5) recent reviews. All sections MUST handle empty states gracefully (promising language, not zeros).

### FR-6: Profile Completion Wizard
The wizard MUST track 8 completion steps: activity name, category, age range, pricing, schedule, photos, description, tags. Each step MUST save independently. The wizard MUST be collapsible, skippable, and persistent across page refreshes. At 8/8 it disappears. Progress percentage MUST be visible when collapsed. Completeness affects AI concierge recommendation weighting but NOT listing visibility.

### FR-7: Listing Edit
Providers MUST be able to edit all listing fields except category. Edits MUST be saved via `PATCH /api/provider` and take effect immediately. Photo upload MUST support up to 6 images. Schedule MUST support multiple day-time entries.

### FR-8: Review Responses
Providers MUST be able to reply to parent reviews on their listing. Each review supports exactly one provider reply. Provider replies MUST be editable and deletable by the provider. Replies appear indented below the review.

### FR-9: Event Management
Providers MUST be able to create, edit, and delete events for their club. Events MUST include title, date/time, description, location, and optional max participants. Events MUST appear on the club's public page.

### FR-10: Club Members View
Providers MUST be able to see a read-only list of their club members, including parent name, child name(s), and join date.

### FR-11: Auth Security
Temporary passwords MUST be 12+ random characters. Password reset attempts MUST be rate-limited (5 failed sign-in attempts = 15-min lockout; 2 failed passphrase attempts = 30-min lockout per email). Temp passwords MUST be hashed in the database.

## Non-Functional Requirements

### NFR-1: Performance
Dashboard page MUST load in under 2s on a warm connection. Listing edits MUST save in under 1s with optimistic UI feedback.

### NFR-2: Accessibility
All provider pages MUST be keyboard-navigable. Wizard steps MUST be screen-reader friendly. WCAG 2.1 AA compliant.

### NFR-3: Security
Passwords and passphrases MUST be bcrypt-hashed. Provider routes MUST be auth-gated with role check (`role === 'provider'`). A provider MUST NOT be able to edit another provider's listing. Temp passwords MUST be displayed once in admin panel and never logged.

### NFR-4: Mobile
All provider pages MUST be fully responsive and usable on mobile (375px+). The wizard MUST be single-column on mobile.

## Key Entities

- **User** — already exists (`users` table). New: `passwordResetRequired` boolean, `needsClaim` boolean, `passphraseHash` text. Providers have `role: 'provider'`.
- **Provider** — already exists (`providers` table). New: `userId` column linking to the user who manages this provider.
- **ProviderInquiry** — NEW table. Logs AI concierge searches that matched this provider. Fields: `providerId`, `query`, `parentId?`, `matchedAt`.
- **ReviewReply** — NEW table or extends `reviews`. Fields: `reviewId`, `providerId`, `content`, `createdAt`, `updatedAt`.
- **Event** — already exists (`clubEvents` table). Provider-facing CRUD operations.

## Visual/UX Direction

### Design Skill Stack (mandatory for implementation)
This feature MUST be built using the same three-design-skill stack that produced the KitFix redesign:

1. **Hallmark** — load first. Picks a macrostructure for the dashboard page (NOT Bento Grid — rotate away from previous ILALI macrostructures). Runs the 58-gate slop test before shipping. Enforces nav/footer archetype diversification, italic-headers ban, no re-drawn chrome, no invented metrics.
2. **Premium Design System** — enforces token discipline (no raw hex values, no `text-gray-500` slop), typography hierarchy (max 5 styles), mobile-first (320/375/414/768 verified), 8-state coverage on every interactive component, WCAG AA contrast floor.
3. **Frontend Design** — grounds every choice in the provider's world. The provider portal should feel like *their* space, not a generic admin panel. One aesthetic risk you can justify. Distinctive typography pairing (Bricolage Grotesque display + Inter body is the ILALI default — the dashboard can follow it or make a quiet variation).

### Platform Style
- **Light, off-white theme** consistent with ILALI's existing design system (`bg-paper`, `bg-paper-warm`, `text-ink`, `text-ink-soft`)
- Color-wheel accents (teal/gold/purple/orange) woven through wizard steps, stat cards, and section markers — same pattern as landing page feature cards
- ILALI logo on auth screens, sign-in consistent with existing `/auth/signin` style

### Dashboard Layout
- **Listing card first** — uses the same `ProviderCard` component parents see, so the provider sees exactly what families see
- **Activity feed below** — inquiries, members, events, recent reviews
- Single-column on mobile, two-column (listing card + activity) on desktop ≥1024px

### Profile Completion Wizard
- Inline in dashboard, above the listing card, collapsible
- Each step uses one of the 4 color-wheel accents
- At <50%: teal-bordered (gentle nudge). At 50-87%: gold-bordered (encouraging). At 88%+: just the progress bar
- At 8/8: disappears entirely, replaced by a subtle "✅ Listing complete" in the listing card
- Saves per-step — no all-or-nothing

### Empty States
- Warm constructive language — never "0 members" or "No data"
- "Your community is growing 🌱" not "No members yet"
- Use `frontend-design`'s "direction, not mood" principle for failure states

### Component Quality Gates (from Hallmark + Premium Design System)
- [ ] Every interactive element ships all 8 states (default, hover, focus-visible, active, disabled, loading, error, success)
- [ ] No italic headers (Hallmark gate 38a)
- [ ] No re-drawn browser/phone chrome (Hallmark gate 47)
- [ ] No invented metrics — real DB numbers only (Hallmark gate 46)
- [ ] No mid-render token improvisation — every color is a named token (Hallmark gate 48)
- [ ] Mobile verified at 320/375/414/768 — no horizontal scroll (Hallmark gates 34, 49-53)
- [ ] `prefers-reduced-motion` respected

## Assumptions

- The `role` column on `users` table already exists and supports `'provider'`
- Better Auth `additionalFields` already maps `role` to the session object
- Admin approval workflow already exists at `/admin/applications`
- The existing `providers` table has 19 records with real email addresses
- Category field is set during application and providers should not change it (only admin)
- Photos are stored as URLs (Vercel Blob or external URLs) — not local file storage

## Out of Scope (→ Backlog)

| # | Feature | Trigger to Revisit |
|---|---|---|
| 1 | Analytics dashboard (view tracking, conversion, unique visitors) | When 10+ providers are actively using the portal |
| 2 | Staff/team accounts (multi-user per provider) | When a provider requests it |
| 3 | Financial reporting (revenue, payouts, invoices) | When ILALI has a payment/monetization model |
| 4 | Email notification for account creation, password reset, new inquiries | When ilali.co email hosting is confirmed by George |
| 5 | Provider-to-parent direct messaging | When inquiry volume > 50/week |
| 6 | Provider onboarding wizard redesign (video, tooltips, examples) | After 5+ providers complete onboarding and give feedback |
| 7 | Provider settings page (notification prefs, email change, account deletion) | Post-MVP |
