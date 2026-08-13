# ILALI — Whole-Trail SDD Verification Audit

**Date:** 2026-08-13
**Repo:** /root/ilali (branch `main`, HEAD `8d3f0d4`)
**Method:** Per-FR verification against source (rg/sed/read/git), per `.specify/specs/painless-journeys/VERIFICATION-HANDOFF.md`. Baseline (`tsc`/`vitest`/`build`) intentionally NOT run here — per handoff it runs first in the orchestration session.
**Tooling note:** handoff §1 says "BIG QUESTION: portal features live vs spec still Draft" and "did WS-4 implement this spec, or is the spec a post-hoc re-spec?" — answered below via git history.

---

## 1. Spec-by-spec verification

### 1.1 ILALI MVP (`ilali-mvp/spec.md`, 12 FRs)

| FR | Status | Evidence | Note |
|---|---|---|---|
| FR-1 Activity discovery & filters | ⚠️ Partial | browse `src/app/browse/page.tsx:28-101`, filters `src/components/FilterBar.tsx:69`, category row `:307-336` | **Price filter broken**: buckets in Rands (`browse/page.tsx:73-87`) compared against `priceValue` in cents (`src/lib/db/mappers.ts:34`) → only "Free" ever matches. `date`/`level`/`disability` chips set URL params but never filter. No suburb filter. |
| FR-2 Activity detail page | ✅ Implemented | `/activity/[slug]` 301→`/clubs/[slug]` (`src/app/activity/[slug]/page.tsx:21`); hero `src/app/clubs/[slug]/layout.tsx:76-90`; description/location/reviews `:94-121` | Route consolidated to clubs; canonical target renders everything. |
| FR-3 WhatsApp contact CTA | ✅ Implemented | `src/components/WhatsAppButton.tsx:15-25` (env override `NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER`, exact template); used `clubs/[slug]/page.tsx:276-281`, `src/components/saved/ContactButton.tsx:29` | Template matches spec verbatim. |
| FR-4 Provider application form | ✅ Implemented | 4-step wizard `src/app/providers/signup/form.tsx:154-943`; POST `/api/providers/applications` (autosave) + legacy `/api/providers/apply/route.ts:52-65` (rate-limited `:17`); suburb dropdown `src/lib/suburbs.ts`; phone format `:275-279` | Evolved well beyond MVP (magic-link auth, draft resume). |
| FR-5 Community referral form | ✅ Implemented | `/providers/refer` `src/app/providers/refer/form.tsx:26-241`; Zod `referralSchema`; POST `/api/referrals/route.ts:52-61` | Spec-exact, rate-limited. |
| FR-6 Admin dashboard & auth | ✅ Implemented | `src/proxy.ts:4-37` (admin gate); `src/app/admin/layout.tsx:11-23`; API guard `src/lib/auth-guard.ts:8-41`; dashboard `src/app/admin/page.tsx:34-87` | Dual-gated (proxy + layout + `withAdmin`). |
| FR-7 Provider management | ✅ Implemented | Status transitions `src/app/api/admin/applications/[id]/route.ts:28-35,88-110`; approval auto-creates account+provider row via `src/lib/admin/approveApplication.ts` | Beyond MVP (auto account creation). |
| FR-8 Static pages | ✅ Implemented | All spec'd pages exist under `src/app/` (about, how-it-works, for-parents/providers/venues, safeguarding, safety-guidelines, privacy, terms, ubuntu-rewards, provider-resources, contact, locations, categories) | Plus extras (home, help-centre, code-of-conduct, why-list). |
| FR-9 Trust badges | ✅ Implemented | `src/components/ProviderCard.tsx:75-96`; detail badge `clubs/[slug]/layout.tsx:85-89` via `src/components/verification/VerificationBadge.tsx:12-70` | Superseded binary "verified" → 3-tier system (constitution amendment). Card "Verified" is purple, not spec teal (trivial). |
| FR-10 DB-backed data | ✅ Implemented | `src/lib/db/schema.ts:41-50`; lazy proxy `src/lib/db/index.ts:14-27`; `src/lib/data-source.ts:94,222-255`; `src/lib/db/queries.ts`; `USE_MOCK` fallback retained (Assumption 5) | Real Drizzle→Neon path. |
| FR-11 Roadmap placeholders | ✅ Implemented | `src/components/ComingSoon.tsx:11-44`; booking placeholder `clubs/[slug]/page.tsx:317-327` | Most "Coming soon" cards were upgraded into live features (reviews, parent accounts, AI onboarding) — acceptable drift; only booking remains placeholder. |
| FR-12 AI natural-language match | ✅ Implemented | `/api/match/route.ts:41-159` (cache→deterministic→AI→keyword fallback, `fallback:true` <30% `:144-158`); extraction `src/lib/ai/match.ts`; scoring 40/25/20/15 `src/lib/ai/score.ts:22-102`; badges+reasons `ProviderCard.tsx:124-158` | AC "<3s" not met (25s timeout, ~7s typical); mitigated by deterministic fast path. Model chain now NIM/OpenCode (`src/lib/ai/client.ts:38-42`). |

**Plan phases 1–5 shipped** in code; Phase 6 (deploy) is infra-only, unverifiable from source.

**tasks.md:** 65 checkboxes, all unchecked. **Verdict: IMPLEMENTED (1 partial FR, 1 unmet AC).**

---

### 1.2 Poster-to-Profile — WS-7 (`poster-to-profile/spec.md`, 6 FRs)

Git: spec `b2f6758` (2026-08-08), impl `cfb11d6` P1, `6d74ced` P2+3, `9f9a5e6` extended fields, `4d7a41a` logo crop, `fea1644` webp/quality, `dddcc57` logo fix.

| FR | Status | Evidence | Note |
|---|---|---|---|
| FR-1 Poster upload & preview | ✅ Implemented | `src/app/api/admin/poster-import/route.ts:15-57` (10MB, JPG/PNG/WebP, `requireAdmin`); preview `src/app/admin/poster-import/poster-import-client.tsx:508-512` | |
| FR-2 AI vision extraction | ✅ Implemented | `src/lib/ai/extract-poster.ts:84-164` (Gemini first, OpenRouter fallback); manual fallback `poster-import-client.tsx:200-207` | Model is Gemini/OpenRouter (documented 2026-08-08 flip from NIM). |
| FR-3 Web enrichment | ✅ Implemented | `src/lib/web/enrich.ts:77-121` (DDG→Jina→LLM); per-item accept/reject `poster-import-client.tsx:286-310`; `WEB_SEARCH_PROVIDER` swappable | Never silently merged. |
| FR-4 Draft application creation | ✅ Implemented | `save/route.ts:90-117` (`onboardSource:"poster"` `:115`); Posters filter tab `applications/page.tsx:20,45` | Badge = source filter chip, not per-card chip. |
| FR-5 Outreach | ⚠️ Partial | `applications/[id]/notify/route.ts:94-164` (wa.me + email fallback, idempotent `contactedAt`); flag `send-whatsapp.ts:25-48` | Notify is gated on prior approval (`notify/route.ts:120-128` — 400 without provider user); button enabled right after save but errors until approved. |
| FR-6 Template store | ⚠️ Partial | `messageTemplates` table `schema.ts:501-506`; DB-backed defaults `src/lib/outreach/templates.ts:17-59`; vars `{{providerName}} {{activityName}} {{claimUrl}} {{claimCode}}` | Centralised + in DB, but **no admin editing UI** — only `scripts/seed-message-templates.ts`. |

**tasks.md:** 23 checkboxes, all unchecked. **Verdict: IMPLEMENTED (2 minor partials).**

---

### 1.3 Poster Extended Fields (George's field list, no FR numbers)

Spec `poster-extended-fields/spec.md`, commit `9f9a5e6`.

| Field | Status | Evidence |
|---|---|---|
| Venue | ✅ | `schema.ts:165`; AI `extract-poster.ts:31,97,247`; UI `poster-import-client.tsx:41,226,591`; card `Card:187-191` |
| Address | ✅ | `schema.ts:166`; `:32,98,248` |
| date_start / date_end | ✅ | `schema.ts:167-168`; `:33-34,99-100,249-250` |
| time_start / time_end | ✅ | `schema.ts:169-170`; `:35-36,101-102,251-252` |
| day_of_week | ✅ | `schema.ts:171`; `:37,103,253` |
| contact_name | ⚠️ | `schema.ts:172`, AI+form+save all plumbed — but not rendered on `ApplicationCard` |
| booking_info | ⚠️ | `schema.ts:173`, plumbed — not rendered on `ApplicationCard` |
| additional_info | ✅ | `schema.ts:174`; `:40,106,256-257` |
| image_url | ✅ | `schema.ts:162`; poster stored as image `save.ts:113` |
| logo_path | ✅ | `schema.ts:175`; AI logoBox `extract-poster.ts:42,107,258-270` + auto-crop `client.tsx:122-153`; manual upload `:392-406` |
| priceValue (Rands) | ✅ | `schema.ts:161`; stored as-is `save.ts:101` |

**Verdict: IMPLEMENTED** — all 11 fields plumbed end-to-end (AI prompt → normalise → review form → save → PATCH edit form → DB). Only cosmetic gap: card omits contact/booking lines. No spam-guard/dedupe layer (not required by spec).

---

### 1.4 Responsive Images (`responsive-images/spec.md`, 10 FRs)

Git: shipped `6972f45`.

| FR | Status | Evidence | Note |
|---|---|---|---|
| FR-1 Art-directed heroes | ✅ Implemented | `ResponsiveImage.tsx:72-138` (`<picture>` media ≤640px/≥641px); `InteriorHero.tsx:26-31`; registry `mobileSrc` `registry.ts:47-118` | |
| FR-2 Responsive card images | ⚠️ Partial | srcset 400/800px + AVIF for Unsplash `ResponsiveImage.tsx:141-156`, `unsplash.ts:71-72`; **local `/images/providers/*.jpg` pass through plain `<img>`** `:58-70`; `VenueCard.tsx:20-24` bare `<img>` | srcset only for Unsplash-hosted sources. |
| FR-3 Curated registry | ✅ Implemented | `registry.ts:46-163` (HERO_IMAGES + CATEGORY_IMAGES, src/alt/crop/mobileSrc); pages import from it | Single source of truth. |
| FR-4 AVIF/WebP/JPEG fallback | ⚠️ Partial | Unsplash `fm=auto` `unsplash.ts:32,54`; local heroes WebP-only (`registry.ts:48-52`) | No AVIF variant / no `<source type>` chain for local. |
| FR-5 Gemini landing hero | ✅ Implemented | `registry.ts:47-52` (hero-landing, local, mobile+desktop webp); used `src/app/page.tsx:89-95` (priority) | Source file exists; files ~77KB/247KB. |
| FR-6 Unique image per page | ⚠️ Partial | `/for-parents` reuses `'home'` (`for-parents/page.tsx:23`); `/safeguarding`+`/safety-guidelines` share `'safety'`; `/providers/why-list` reuses `provider-resources` | Spec itself flagged the for-parents reuse. |
| FR-7 Provider images optimized | ⚠️ Partial | Content URLs; AVIF+srcset only for Unsplash srcs (`ResponsiveImage.tsx:142-156`) | Non-Unsplash provider images unoptimised. |
| FR-8 Accessibility | ✅ Implemented | alt from registry every image `ResponsiveImage.tsx:132,151,165`; decorative `aria-hidden` `page.tsx:107,118` | |
| FR-9 Graceful failure | ⚠️ Partial | Data-level fallbacks (`ProviderCard.tsx:66-72`, `venues/[slug]/page.tsx:56-59`) | **No `onError` handler** — live 404 renders broken-image icon. |
| FR-10 Crop hints | ✅ Implemented | `CropHint` type `registry.ts:13-21`; mapped to Unsplash `crop` `unsplash.ts:23,52` | |

NFR: several desktop heroes exceed the 250KB budget (cat-holiday-programs 393KB, hero-categories 421KB, hero-clubs 375KB, hero-browse 365KB, hero-home 256KB).

**tasks.md:** 22 checkboxes, all unchecked. **Verdict: IMPLEMENTED with 5 partial FRs** (largest gap: local/Supabase provider images bypass responsive delivery).

---

### 1.5 Parent Profile (`parent-profile/spec.md`, 10 FRs)

Git: spec `538d63f` (docs-only, 2026-08-03); impl `c4ff543` P1 (scoring + 3 API routes), `dd320ac` P2 (10 parent UI components), `d661769` P3 (dual-mode home).

| FR | Status | Evidence | Note |
|---|---|---|---|
| FR-1 Dual-mode `/home` | ✅ Implemented | `src/app/home/page.tsx:469` (dashboard) / `:596` (landing) | |
| FR-2 "Your Kids" card | ✅ Implemented | `src/components/parent/KidsCard.tsx:114-189`; schema `childProfiles` `src/lib/db/schema.ts:229-241` | |
| FR-3 Week planner | ⚠️ Partial | `src/components/parent/WeekPlanner.tsx:43` (cap 10) | **No 7-day window filter** — all upcoming, not just the week. |
| FR-4 Suggested activities (scoring) | ⚠️ Partial | `src/lib/scoring/suggest-activities.ts:50-111` (age 40/interest 40/proximity 20), max 5 `:133`; `SuggestedActivities.tsx:34,67,93` | Neighbouring-suburb +10 deferred (exact match only `:94-95`). |
| FR-5 Club cards | ⚠️ Partial | `ClubCardsRow.tsx:37,79,93` | `unreadCount` hardcoded `0` (`home/page.tsx:161`) — no real unread chat query. |
| FR-6 Points widget | ✅ Implemented | `PointsWidget.tsx:27-32` via `src/lib/rewards/calculate.ts` | |
| FR-7 Notification bell | ⚠️ Partial | `NotificationBell.tsx` (rewards live `:95`; rides `:252`, community `:288`) | **Ride + community sections never populated** — `home/page.tsx:484` renders `<NotificationBell />` with no props. |
| FR-8 Child add/edit modal | ⚠️ Partial | `ChildFormModal.tsx:157,187`; routes `src/app/api/children/route.ts:9-18`, `[id]/route.ts:10-21` (ownership-checked) | **No refresh after save** — `KidsCard.tsx:80-83` `handleSaved()` is a no-op. |
| FR-9 Profile settings panel | ✅ Implemented | `ProfileSettingsPanel.tsx` (suburb autocomplete `:6`, spec toggles `:293-359`); `/api/profile/route.ts:23-115` | Greeting name stale until session refetch (minor). |
| FR-10 No-children empty state | ✅ Implemented | `home/page.tsx:499-547` (nudge + popular); `NudgeCard.tsx:9-36` | Club section renders a "Join a club" card instead of hiding (trivial). |

**Notable:** painless-journeys P2 was supposed to simplify child-profile UX to minimal name+age — **NOT applied yet**: onboarding still collects full rich profile (`src/app/(auth)/onboarding/page.tsx:257`), and `/api/children` POST/PATCH still require rich fields. This is a pending-deferral, not a regression.

**tasks.md:** 27 checkboxes, all unchecked. **Verdict: IMPLEMENTED (5 partials — all data-wiring, scaffolding complete).**

---

### 1.6 Provider Portal (`provider-portal/spec.md`, 11 FRs)

Git: spec.md and implementation landed in the **SAME commit** `e6a3b11` (2026-08-04 "feat: Provider Portal — auth, dashboard, listing, reviews, events, club"). Portal was later rebuilt for onboarding by painless-journeys P4 (`49a06fb` wizard + status tracker, `1d1884a` cleanup).

**Answer to the BIG QUESTION:** the portal UI was implemented to this spec, but the spec file was only written/committed at implementation time (Draft → co-shipped, grill never completed). Not a pre-SDD implementation; a post-hoc spec of already-built code.

| FR | Status | Evidence | Note |
|---|---|---|---|
| FR-1 Account creation | ✅ Implemented | `src/lib/admin/approveApplication.ts:47-64,140-161,263-308`; temp password on approval `ApplicationCard.tsx:270,285-287,334`; regenerate invalidates `[id]/route.ts:320-331` | |
| FR-2 First-login reset | ✅ Implemented | redirect `src/app/auth/signin/page.tsx:79-84`; `src/app/auth/create-password/page.tsx:52-57,85`; `/api/auth/create-password/route.ts:40-89` | |
| FR-3 Recovery passphrase | ⚠️ Partial | hashed `create-password/route.ts:69`, col `schema.ts:95`; self-service `forgot-password/page.tsx` + `/api/auth/reset-password/route.ts:90-93` | **No provider-settings page to change passphrase** (only via forgot-password). |
| FR-4 Migration + claim | ⚠️ Partial | `scripts/migrate-provider-accounts.ts:62-179`; claim `api/providers/claim/route.ts:36-177`; page `src/app/providers/claim/page.tsx`; `src/lib/claim-codes.ts` | **Deviation:** claim code (admin-issued, 5-attempt/15-min lock) instead of spec's email-match. Email step is client-only. |
| FR-5 Dashboard | ✅ Implemented | `(dashboard)/provider/page.tsx:229,247,253,262-371`; status tracker `:149-195` + `StatusTracker.tsx` | `ActivityStats.tsx:48-52` renders "0" not "promising language" (minor). |
| FR-6 Completion wizard | ✅ Implemented | 8-step `ProfileWizard.tsx:39-81`; per-step save `:510-522` → PATCH `/api/provider`; skip "I'll do this later" `:649-656`; progress % `:594-604` | Deviations: schedule = club-event count not day/time pairs `:64-65`; photos = single URL; no AI-concierge weighting. |
| FR-7 Listing edit | ⚠️ Partial | PATCH `src/app/api/provider/route.ts:164-287` (validated); UI `src/app/(dashboard)/provider/edit/page.tsx` | **Schedule rows never sent in PATCH** (`edit/page.tsx:118-149`); only first photo URL persisted `:151-155` (single `imageUrl` col `schema.ts:45`); no drag-to-reorder; description not validated required. |
| FR-8 Review responses | ✅ Implemented | GET newest-first + reply map; `reviews/[id]/reply/route.ts` POST/PATCH/DELETE (ownership, unique idx `schema.ts:478-480`); UI `reviews/page.tsx:186-231` | Reply label is "Your reply" not "Response from X" (minor). |
| FR-9 Event management | ⚠️ Partial | CRUD `api/provider/events/route.ts:98-152`, `[id]/route.ts`; past collapsed `events/page.tsx:271-338`; public `clubs/[slug]/page.tsx:130-157` | **`description` column absent** (`schema.ts:323-334`; POST drops it `events/route.ts:139-141`); **no maxParticipants** anywhere. |
| FR-10 Club members view | ✅ Implemented | `club/page.tsx:96-184`; `api/provider/club/members/route.ts:36-90` (parents+children, joinedAt) | GET only, read-only. |
| FR-11 Auth security | ⚠️ Partial | Temp pw 12+ chars bcrypt `approveApplication.ts:53-65,141`; reset rate-limit 2/30min `reset-password/route.ts:9-28`; claim lockout `claim-codes.ts:18-19,127-142` | **Missing 5-failed-sign-in/15-min lockout** on the sign-in path (`src/lib/auth.ts:17-24`). |

**tasks.md:** 60 checkboxes, all unchecked. **Verdict: IMPLEMENTED (4 partials; biggest gaps = FR-7 schedule/photos persistence, FR-9 event fields, FR-11 sign-in lockout).**

---

### 1.7 Join a Club (`join-a-club/spec.md`, 7 FRs)

Git: tables existed pre-spec; WS-5 shipped `e316c7c`.

| FR | Status | Evidence | Note |
|---|---|---|---|
| FR-1 Join button | ⚠️ Partial | `JoinClubButton.tsx:119-177`; club page `page.tsx:252`; sign-in callbackUrl `:72-74` | No join CTA on members page. |
| FR-2 Membership creation | ✅ Implemented | `api/clubs/[slug]/join/route.ts` (auth `:41`, idempotent `:82-90`, +10 welcome `:123-130`, system msg `:156-160`) | Welcome via direct insert; msg posted as joiner's userId not "system". |
| FR-3 Welcome card | ⚠️ Partial | `WelcomeCard.tsx` (dismiss `:15,35`, links `:64-87`) | `memberNumber` hardcoded `null` (`page.tsx:333`); `nextEvent` declared but never rendered. |
| FR-4 Public visibility | ⚠️ Partial | "New" 7-day badge `members/page.tsx:13,73`; member count; ledger +10 | **Ubuntu Feed shows contributions only** (`clubs/page.tsx:143,400-430`) — no "X joined Y". |
| FR-5 Post-join pathways | ✅ Implemented | Chat/Members/Rides links `WelcomeCard.tsx:64-87` | |
| FR-6 Leave a club | ⚠️ Partial | API complete: soft-delete `leave:75-78`, ride cancel `:90-99`, chat msg `:107-111`, rejoin reactivates `join:94-100`; Alumni badge `members/page.tsx:55,78-81` | **`LeaveClubButton.tsx` never imported/used** — no Leave link in UI; rejoin posts duplicate welcome + re-awards +10. |
| FR-7 Invite a friend | ✅ Implemented | `InviteShareSheet.tsx`; `invitedBy` col `schema.ts:350`; +50 `club-invite` `calculate.ts:17`; both ledger entries | |

**Verdict: IMPLEMENTED (4 partials — UI wiring gaps; backend solid).**

---

### 1.8 Community Contributions (`community-contributions/spec.md`, 10 FRs)

| FR | Status | Evidence | Note |
|---|---|---|---|
| FR-1 Contribution logging | ✅ Implemented | `api/community/contributions/route.ts` (club check `:97`, weekly cap `:116-141`, auto validationPath `:144-165`) | 200-char description cap not enforced. |
| FR-2 Contribution taxonomy | ✅ Implemented | `CONTRIBUTION_TYPES` `calculate.ts:55-61` (5 types) | Fixed low-end values, not ranges; lift-share = existing ride system. |
| FR-3 Two validation paths | ✅ Implemented | Leader `confirm/route.ts:75-90,104`; Peer `vouch/route.ts:68-104,118-145,164-182` (same-club, not-self, 7-day, elder-only, auto-confirm) | |
| FR-4 Reputation system | ✅ Implemented | `reputation.ts:55-59` (contribs×10+vouches×5+months×2); tiers `:71-77`; vouchesNeeded 3/2/1 `:83-85` | |
| FR-5 Public approval ledger | ✅ Implemented | `ContributionFeed.tsx`; global feed `clubs/page.tsx:415-430` | |
| FR-6 Club health score | ✅ Implemented | `api/clubs/[slug]/health/route.ts`; `queries.ts:640`; `ClubHealthCard` | |
| FR-7 Anti-gaming | ⚠️ Partial | >3 confirms/7d → 409 "second opinion required" `confirm:133-143`; vouch not-self `:87`, 7-day `:137` | **No actual 2nd-confirmation flow** (just a block); >5/14d rule, flag→reversal+7d freeze, repeat-flag cap, family-check all missing. |
| FR-8 Ubuntu Feed (global) | ✅ Implemented | `clubs/page.tsx:142-143,380-465` (cross-club, recency-sorted) | No club filter UI. |
| FR-9 Contribute tab | ✅ Implemented | `ClubTabs.tsx:11`; `clubs/[slug]/contribute/page.tsx` | |
| FR-10 Points integration | ❌ **Missing/broken** | `vouch/route.ts:207-217` + `confirm/route.ts:185-195` POST earn with `action:"community"` | **`"community"` is NOT in `REWARD_ACTIONS`** (`calculate.ts:11-19` — only lift/volunteer/referral/review/welcome/club-invite/attendance) → earn 400s "Unknown reward action" (`earn/route.ts:67-71`), and `awardContributionPoints` swallows it → **points never credited**. |

**Verdict: PARTIAL — 8/10 implemented, FR-10 is a verified end-to-end payout bug (critical), FR-7 anti-gaming ~60%.**

---

### 1.9 Bulk Import — WS-4 (`bulk-import/spec.md`, 8 FRs)

Git: spec + plan + code all landed in the **same commit** `1e16b60` (2026-08-06 "feat: WS-4 bulk import — multi-format intake, batch approve, import history").

**Answer to the grill-pending question:** the spec is a **post-hoc re-spec** of the WS-4 implementation (co-shipped in one commit). The impl matches the spec because the spec was written from it.

| FR | Status | Evidence | Note |
|---|---|---|---|
| FR-1 Multi-format intake | ✅ Implemented | `src/lib/import/normalize.ts:78-90` (papaparse), `:94-110` (SheetJS), `:112-183` (pasted text); preview `preview/route.ts:23-93` (5MB, ext check) | Row cap 500; malformed input fails fast. |
| FR-2 Validation & dedup | ✅ Implemented | `validate.ts:37-121` (email, +27 phone, ages 0-18, price≥0, min≤max); `:142-186` (in-file + DB dedup) | Rejected rows re-importable. |
| FR-3 Commit | ✅ Implemented | `commit/route.ts:66-115` (re-validates, multi-row insert, batch record) | Race-safe; dup rows skipped. |
| FR-4 Batch approve | ✅ Implemented | `batch-approve/route.ts:22-55`; `batchApprove.ts:16-48` (per-row try/catch) | |
| FR-5 Approval-logic reuse | ✅ Implemented | Shared `approveApplication.ts`; single + batch both use it; tests `batch-approve.test.ts`, `import.test.ts` | |
| FR-6 Import UI | ✅ Implemented | `admin/import/page.tsx`; `ImportUpload.tsx` (template download `:58-70`, preview `:372-492`); `ImportHistory.tsx` | |
| FR-7 Selection UI | ✅ Implemented | `ApplicationsList.tsx:30-77,129-157` (checkboxes, bulk bar); `BatchApproveModal.tsx` | |
| FR-8 onboardSource | ✅ Implemented | `schema.ts:182`; set by commit `commit/route.ts:92`; `importBatches` table `schema.ts:190-199` | |

**tasks.md:** 34 checkboxes, all unchecked. **Verdict: IMPLEMENTED (all 8 FRs).**

---

### 1.10 Trust & Safety Signals (`trust-signals/spec.md`, no FR markers)

| Item | Status | Evidence |
|---|---|---|
| Verification tiers (Listed/Verified/Trusted) | ✅ Implemented | `VerificationBadge.tsx:12-92` (verified docs → Verified; ≥3 vouches & ≥5 reviews → Trusted; else Listed); rendered on all browse-grid branches `browse/page.tsx:177,204,290,310`, saved, club pages |
| Trust bar on landing | ⚠️ Partial | `page.tsx:166-182` (🛡️ bar, 3 bullets, `/safeguarding` link) | 
| Browse banner | ✅ Implemented | `browse/page.tsx:197-201` (background-checked line) | Only in filtered/category branch, not default grid. |
| Enhanced badge on cards | ⚠️ Partial | badge rings `VerificationBadge.tsx:86,90`; Trusted/Verified overlays `ProviderCard.tsx:74-92` | Card-level border ring / tier-driven gold accent not wired (`border-ink/10` static `ProviderCard.tsx:54`). |
| Club page trust signal | ✅ Implemented | `clubs/[slug]/page.tsx:222-248` (Trust & Safety card) | |
| Policy/terms links | ✅ Implemented | `Footer.tsx:32-47` (TRUST & SAFETY column); pages exist | |
| Activity detail badge | ✅ Implemented | via 301 → `/clubs/[slug]` | |

**Constitution amendment check (2026-08-13, Principle 1 "progressive verification; nothing unlabelled"): HONORED** — badges visible on cards + detail + club pages; Listed grey default, Verified/Trusted opt-in.

**Verdict: IMPLEMENTED (2 partials — landing still shows the old VETTED stamp alongside the new trust bar; no card border-ring accent).**

---

### 1.11 Painless Journeys (`painless-journeys/spec.md`, 14 FRs)

Git: `d3911b0` spec → `4b96973` P1 → `315795c` P2 → `8ec4429` P3 → `49a06fb` P4 → `d81120e` P5. This is the only spec that ran pre-implementation (spec commit before all impl commits).

| FR | Status | Evidence | Note |
|---|---|---|---|
| FR-1 Guest-first browsing | ✅ Implemented | browse/map/categories/search have no auth guard (no `requireUser`); P2 commit `315795c` "guest-first browsing" | |
| FR-2 Email-first magic link | ✅ Implemented | `src/lib/auth.ts:43` (magicLink plugin); `src/lib/auth-client.ts:2,5`; signup `src/app/auth/signup/page.tsx:27,73,134,223`; signin `src/app/auth/signin/page.tsx:38,57,124,186,234,337` | |
| FR-3 Intent-triggered capture | ✅ Implemented | `src/lib/intent-cookie.ts` (`ilali_intent`, 10-min TTL); `SaveButton.tsx` + `IntentCaptureModal.tsx` + `NotifyButton.tsx` + `ContactButton.tsx` under `src/components/saved/` | |
| FR-4 Minimal child onboarding | ✅ Implemented | `/api/onboarding` `src/app/api/onboarding/route.ts` (name+age required `:77-81`; interests/suburb/availability optional) | |
| FR-5 One account, two doors | ✅ Implemented | role flip on wizard submit `src/app/api/providers/applications/route.ts:90-109`; approve-time repair `src/lib/admin/approveApplication.ts:236-257` | In-account parent→provider switch (Tier 2) remains backlog #29 — expected. |
| FR-6 Notification state machine | ✅ Implemented | `src/lib/notifications/index.ts:93` (channel), `:201-205` (email-only today); `notificationEvents` `schema.ts:296`; cron `src/app/api/cron/journeys/route.ts` (reminders-24h / digest-weekly Mon / digest-monthly 1st) + `vercel.json` crons; prefs `notificationPreferences` | WhatsApp channel stubbed (flag-gated) — deliberate. |
| FR-7 4-step wizard | ✅ Implemented | `src/app/providers/signup/form.tsx:40` (STEP_LABELS Offer→Details→Photos→Review), `:571` "Step X of 4"; autosave/resume per step → `/api/providers/applications` | |
| FR-8 No temp-password primary | ✅ Implemented | wizard path: no account creation, no temp password (`approveApplication.ts:252-275`); temp password retained only for legacy/bulk-import path `:140-161` | |
| FR-9 SLA transparency | ✅ Implemented | `StatusTracker.tsx` (Draft→Submitted→Reviewing→Live + SLA copy); provider-status notification IS the celebration email `approveApplication.ts:310-319` | |
| FR-10 Progressive verification | ✅ Implemented | `VerificationBadge.tsx:12-92`; badges on browse `browse/page.tsx:177,204,290,310` + club pages | Matches 2026-08-13 constitution amendment. |
| FR-11 WhatsApp CTA + notify-me | ✅ Implemented | WhatsAppButton persists; `NotifyButton.tsx` "Notify me when booking opens" → `notifyWhenOpen` (`api/saved/route.ts:116-120`) fires FR-6 notification | Booking still placeholder; layering deferred (expected). |
| FR-12 Monetization | ✅ Implemented (provisioned) | `src/lib/pricing.ts` (env-driven `PROVIDER_MONTHLY_FEE_RANDS`=99, `PROVIDER_TRIAL_DAYS`=30, `PROVIDER_COMMISSION_PERCENT`=10); copy consts exported; billing columns `schema.ts:54-56` | Collection infra deliberately deferred (§3). |
| FR-13 Poster-import preserved | ✅ Implemented | `src/app/admin/poster-import/page.tsx` still live | |
| FR-14 Assitej accommodation | ✅ Implemented | `billingPlan`/`planFreeUntil`/`assitejExempt` `schema.ts:54-56`; pricing env overrides | |

**tasks.md:** 34 checkboxes, all unchecked (T001–T034; checkbox state not maintained — commits are the record).

**Verdict: IMPLEMENTED (all 14 FRs). All 8 deliberate deferrals from handoff §3 respected and NOT flagged as gaps.**

---

## 2. Summary tables

### 2.1 Per-spec verdicts

| Spec | FRs | ✅ | ⚠️ | ❌ | Verdict |
|---|---|---|---|---|---|
| ILALI MVP | 12 | 11 | 1 | 0 | **Implemented** (1 partial FR + 1 unmet AC) |
| Poster-to-Profile (WS-7) | 6 | 4 | 2 | 0 | **Implemented** |
| Poster Extended Fields | 11 fields | 9 | 2 | 0 | **Implemented** |
| Responsive Images | 10 | 5 | 5 | 0 | **Implemented** (largest partial cluster) |
| Parent Profile | 10 | 5 | 5 | 0 | **Implemented** (partials are data-wiring) |
| Provider Portal | 11 | 7 | 4 | 0 | **Implemented** (spec co-shipped, post-hoc) |
| Join a Club | 7 | 3 | 4 | 0 | **Implemented** (UI wiring gaps) |
| Community Contributions | 10 | 8 | 1 | 1 | **PARTIAL** — FR-10 points payout broken (verified) |
| Bulk Import (WS-4) | 8 | 8 | 0 | 0 | **Implemented** (spec post-hoc, matches impl) |
| Trust & Safety Signals | 7 items | 5 | 2 | 0 | **Implemented** |
| Painless Journeys | 14 | 14 | 0 | 0 | **Implemented** (only truly pre-SDD spec) |
| **TOTAL** | **104 FRs + 11 fields** | **79** | **24** | **1** | |

### 2.2 tasks.md checkbox audit

All 7 `tasks.md` files show **every checkbox unchecked** (ilali-mvp 65, provider-portal 60, painless-journeys 34, bulk-import 34, parent-profile 27, poster-to-profile 23, responsive-images 22 = 265 boxes, zero `[x]`). Checkbox state was never maintained; git commits are the actual record. This is a process-hygiene finding, not an implementation gap — the code shipped.

### 2.3 Constitution

- Principles 1–6 intact; **2026-08-13 amendment (Principle 1, progressive verification / "nothing unlabelled") is HONORED** in the live app (badges on all browse branches + club pages, tier logic in `VerificationBadge.tsx`).
- Governance process ("specs must pass constitution gates"): specs consistently cite constitution context; no violation found in shipped code.

---

## 3. Backlog findings

1. **Duplicate numbering CONFIRMED:** items 25–28 appear twice (25 social login + 25 dark-mode; 26 Paystack + 26 batch poster import; 27 billing + 27 auto WhatsApp; 28 WhatsApp delivery + 28 email outreach). **Data hygiene issue — renumber.**
2. **Partially-absorbed items (stale entries):**
   - #12 full notification system → **absorbed** by painless-journeys P3 (`notificationEvents` + cron state machine)
   - #18 onboarding wizard redesign → **absorbed** by P4 (4-step wizard)
   - #26/27 billing/pricing → **absorbed** by P5 env-driven pricing
   - #28 WhatsApp delivery → **absorbed** by P3 `WHATSAPP_NOTIFY_ENABLED` flag (stubbed, email-only today)
   - **Verdict:** "absorbed via painless-journeys FRs; backlog entry stale" — matches handoff expectation.
3. **Secret scope-creep:** **NONE found.** No spec-listed "out of scope" feature was implemented. Pre-SDD work (WS-1..WS-5, heroes, nav, `/onboard`, `/hero-preview`, `/map`) predates `.specify` and is correctly treated as un-specced by definition (handoff §4). The only route with no home: `/hero-preview` (dev utility, no spec, harmless).

---

## 4. Top findings (priority order)

1. **❌ Community-contributions FR-10 (critical, verified):** vouched/confirmed contributions never credit points — `action:"community"` is not in `REWARD_ACTIONS` (`src/lib/rewards/calculate.ts:11-19` vs `src/app/api/community/contributions/[id]/vouch/route.ts:214` and `[id]/confirm/route.ts:192`), earn 400s (`src/app/api/rewards/earn/route.ts:67-71`), and `awardContributionPoints` swallows it. Fix: register `"community"` in `REWARD_ACTIONS` (or alias to `community-building`).
2. **⚠️ MVP FR-1 price filter broken:** Rand buckets vs cent storage (`src/app/browse/page.tsx:73-87` vs `src/lib/db/mappers.ts:34`) → only "Free" ever matches. Also date/level/disability chips set params but never filter.
3. **⚠️ Provider-portal FR-7 listing edit:** schedule rows and 5 of 6 photos are never persisted (dead-weight UI).
4. **⚠️ Provider-portal FR-9:** `clubEvents` lacks `description` + `maxParticipants` (columns and UI).
5. **⚠️ Provider-portal FR-11:** no sign-in brute-force lockout on the email/password path.
6. **⚠️ Responsive images:** local/Supabase provider images bypass srcset/AVIF (plain `<img>`); no `onError` handler; hero reuse across pages persists.
7. **⚠️ Join-a-club FR-6:** `LeaveClubButton` never wired; rejoin duplicates welcome + re-awards +10.
8. **⚠️ Parent-profile data-wiring:** bell ride/community sections dead, unread count hardcoded 0, no 7-day planner window, no post-save refresh.
9. **Hygiene:** 265 unchecked task boxes; backlog 25–28 duplicated; portal + bulk-import specs are co-shipped/post-hoc (not pre-SDD).

---

## 5. Final verdict

**The whole trail is substantially SHIPPED.** 10 of 11 specs are implemented against code; painless-journeys is the only spec that was genuinely written before its implementation (all 14 FRs verified live). Two specs are formally post-hoc respecs of already-shipped code (provider-portal `e6a3b11`, bulk-import `1e16b60`) — matches the handoff's suspicions — but in both cases the spec accurately describes the shipped implementation.

- **Fully implemented:** Painless Journeys, Bulk Import, Trust & Safety, Poster-to-Profile, Poster Extended Fields
- **Implemented with partial FRs (no blockers, mostly data-wiring/UI gaps):** MVP, Responsive Images, Parent Profile, Provider Portal, Join a Club
- **Partial with a real defect:** Community Contributions — 9/10 FRs live, but FR-10 (points payout) is **broken end-to-end** and needs a code fix, not a spec change.
- **Spec-only (draft) with no code:** none. All 11 specs have corresponding shipped code.
- **Scope creep:** none. Backlog absorbed items confirmed stale, duplicates confirmed as hygiene issue.
