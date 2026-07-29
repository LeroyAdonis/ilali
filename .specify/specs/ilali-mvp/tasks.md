# Tasks: ILALI MVP

**Plan:** [plan.md](plan.md)
**Spec:** [spec.md](spec.md)
**Date:** 2026-07-29
**Status:** Ready

> ⚠️ **George input pending:** Spec and plan are subject to change when George reviews. Tasks are ordered so foundational work (DB, schema, queries) is least likely to change. UI/polish tasks later in the pipeline may shift based on George's feedback. Build accordingly.

## Phase 1: Database Foundation

- [ ] T001 [P] Create `.env.example` in `/root/ilali/.env.example` — all vars: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER`, `NEXT_PUBLIC_APP_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `DEEPSEEK_API_KEY`
- [ ] T002 Install packages in `/root/ilali/` — `npm install drizzle-orm @neondatabase/serverless drizzle-kit better-auth zod resend`
- [ ] T003 Create `src/lib/db/schema.ts` — full Drizzle schema (8 tables). Providers table includes `tags` text array field for AI matching.
- [ ] T004 Create `src/lib/db/index.ts` — lazy-initialized DB client using Proxy pattern
- [ ] T005 Create `drizzle.config.ts` at project root — point to `src/lib/db/schema.ts` and `drizzle/` migrations dir
- [ ] T006 [P] Create `src/lib/db/types.ts` — TypeScript enums: `ProviderStatus`, `UserRole`
- [ ] T007 Provision Neon DB via Vercel CLI: `vercel integration add neon` → `vercel integration resource connect <id> . --environment production --yes`
- [ ] T008 Generate and push migrations: `npx drizzle-kit generate` then `npx drizzle-kit push`
- [ ] T009 Create `src/lib/db/seed.ts` — migrate 4 providers, 4 venues, 11 categories from `constants.ts` to DB. Include sample `tags` arrays on seed providers.
- [ ] T010 Run seed: `npx tsx src/lib/db/seed.ts`. Verify with `npx drizzle-kit studio`
- [ ] T011 Create `src/lib/db/queries.ts` — `getProviders()`, `getProviderBySlug()`, `getVenues()`, `getVenueBySlug()`, `getCategories()`, `searchProviders()`, `getSimilarProviders(providerId, limit)`

## Phase 2: Data Source Migration [US1]

- [ ] T012 [US1] Convert `src/app/activity/[slug]/page.tsx` — replace `providers.find()` with `getProviderBySlug(slug)`. Add phone field to WhatsApp button. Page becomes async.
- [ ] T013 [US1] Convert `src/app/venues/[slug]/page.tsx` — replace `venues.find()` with `getVenueBySlug(slug)`. Async pattern.
- [ ] T014 [US1] Convert `src/app/browse/page.tsx` — replace `import { providers }` with `getProviders()`. Wire filters from searchParams.
- [ ] T015 [US1] [P] Convert `src/app/providers/page.tsx` — same DB query pattern as browse.
- [ ] T016 [US1] [P] Convert `src/app/venues/page.tsx` — replace constants import with `getVenues()`.
- [ ] T017 [US1] [P] Convert `src/app/locations/page.tsx` — replace constants import with DB location query.
- [ ] T018 [US1] Convert `src/components/FilterBar.tsx` — swap `import { categories }` from constants → fetch from server or `getCategories()` passed as prop.
- [ ] T019 [US1] Convert `src/components/SearchBar.tsx` — stub for API search + natural language matching (wired in Phase 5).
- [ ] T020 Remove `providers`, `venues` exports from `src/lib/constants.ts` — keep categories, testimonials, navLinks, stats. Add deprecation comment.
- [ ] T021 Run `npm run build` — verify zero errors after all data source swaps.

## Phase 3: Forms & API Routes [US2, US3]

- [ ] T022 [P] Create `src/lib/validations.ts` — Zod schemas for `providerApplicationSchema`, `referralSchema`. Include +27 phone, CT suburb enum, required fields.
- [ ] T023 [P] Create `src/lib/suburbs.ts` — Cape Town suburb list for location dropdown AND AI matching location extraction.
- [ ] T024 [P] Create `src/lib/utils.ts` — `formatPhone(value: string): string` utility (+27 XX XXX XXXX).
- [ ] T025 [US2] Create `src/app/api/providers/apply/route.ts` — POST handler. Zod validate → insert into `provider_applications` with `status: "pending"`. Rate-limit 5/hr/IP.
- [ ] T026 [US3] Create `src/app/api/referrals/route.ts` — POST handler. Zod validate → insert into `referrals`. Same rate-limit.
- [ ] T027 [US2] Convert `src/app/providers/signup/form.tsx` — replace `alert()` with Server Action → API call. Inline Zod errors. Success state. Preserve form on error.
- [ ] T028 [US3] Convert `src/app/providers/refer/form.tsx` — same pattern as signup form.
- [ ] T029 [US2] Test both forms: valid submit → DB row appears. Invalid submit → inline errors. Mobile (375px) layout.

## Phase 4: Admin Auth & Dashboard [US4, US5]

- [ ] T030 Create `src/lib/auth.ts` — Better Auth config with email/password provider. Admin credentials from env vars.
- [ ] T031 Create `src/app/api/auth/[...all]/route.ts` — Better Auth handler.
- [ ] T032 Create `src/app/(auth)/signin/page.tsx` — email + password form. Redirect to `/admin` on success. Error state.
- [ ] T033 Create `src/middleware.ts` (or `proxy.ts` for Next.js 16) — protect `/admin/*`. Redirect unauthenticated to sign-in.
- [ ] T034 [US4] Create `src/app/admin/layout.tsx` — admin shell with auth check. Nav: Applications | Providers | Sign Out.
- [ ] T035 [US4] Create `src/app/admin/page.tsx` — application review table. Fetch from API. Columns: name, email, activity, location, date, status, actions.
- [ ] T036 [US4] Create `src/app/api/admin/applications/route.ts` — GET (list all) + PATCH on `[id]` for status change. Auth-gated.
- [ ] T037 [US5] Create `src/app/admin/providers/new/page.tsx` — form to create provider from approved application. Pre-fill from application data. Additional fields: slug, description, image URL, trust toggle, tags (critical for AI matching).
- [ ] T038 [US5] Create `src/app/api/admin/providers/route.ts` — POST (create) + PATCH on `[id]` (update). Auth-gated. Auto-generate slug.
- [ ] T039 Seed admin users (Leroy + George) — via seed script or DB insert with hashed passwords.
- [ ] T040 Test admin flow: sign in → review applications → change status → create provider → provider appears on browse.

## Phase 5: Search, AI Matching & Polish [US1, US2, US6]

- [ ] T041 [US1] Create `src/app/api/search/route.ts` — GET with params `q`, `category`, `age`, `location`, `price`. Search across name, category, providerName, location.
- [ ] T042 [US1] Wire `SearchBar.tsx` to `/api/search` — debounced (300ms), loading state, "No results" empty state.
- [ ] T043 [US1] Create `src/components/WhatsAppButton.tsx` — uses `NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER ?? provider.phone`. Pre-filled message template. WhatsApp green + icon.
- [ ] T044 [US1] Add trust badges to `src/components/ProviderCard.tsx` — "Verified" (teal) / "New" (amber) based on `provider.verified`.
- [ ] T045 [US1] Empty states: browse "No activities match" with suggestions. Detail 404 styled with ILALI branding.
- [ ] T046 [US6] Create `src/lib/ai/match.ts` — LLM intent extraction. POST to DeepSeek API with structured system prompt containing full tag vocabulary + CT suburb list. Returns `MatchIntent` JSON. 3s timeout. Fallback to null.
- [ ] T047 [US6] Create `src/lib/ai/score.ts` — scoring algorithm: tag overlap (40pts), age range match (25pts), location match (20pts), price match (15pts). Output 0-100.
- [ ] T048 [US6] Create `src/app/api/match/route.ts` — POST handler. Body: `{ query }`. Calls `extractIntent()` → fetches providers → scores → returns `{ matches: [{ provider, score, reasons }] }`. On LLM failure, falls back to `searchProviders(query)`.
- [ ] T049 [US6] Update `SearchBar.tsx` — natural language mode detection. When input > 20 chars and has spaces, label changes to "Describe what you're looking for..." and POSTs to `/api/match` instead of GET `/api/search`. Placeholder examples: "e.g. 'something creative for my 5 year old in Muizenberg'"
- [ ] T050 [US6] Add match score badges to `ProviderCard.tsx` — show "92% match" badge (teal gradient) when results come from matching API. Show match reason tags: "Matches: outdoors, ages 6-12, Claremont"
- [ ] T051 [US6] Add "You might also like" section to `src/app/activity/[slug]/page.tsx` — 2-3 similar providers via `getSimilarProviders()`. Below main content.
- [ ] T052 [P] Create `src/components/ComingSoon.tsx` — reusable placeholder component. Props: `title`, `description`, `linkHref?`, `linkLabel?`, `icon?`. Teal-tinted card, soft border, "Coming soon" badge. 375px-safe.
- [ ] T053 [US1] Add reviews placeholder to `src/app/activity/[slug]/page.tsx` — "Reviews" section with outlined stars + "Reviews coming soon..."
- [ ] T054 [US1] Add "Online booking coming soon" badge to activity detail page near WhatsApp button
- [ ] T055 [US1] Add parent accounts placeholder to browse page — subtle card "👋 Sign up to save favourites. Coming soon." Links to `/auth/signup`
- [ ] T056 [US2] Add provider dashboard + email messaging to signup success state in `src/app/providers/signup/form.tsx`
- [ ] T057 [P] Add AI onboarding placeholder to `src/app/for-providers/page.tsx`
- [ ] T058 [P] Add AI onboarding placeholder to `src/app/provider-resources/page.tsx`
- [ ] T059 Accessibility pass — all form labels, alt text, keyboard nav, focus indicators, placeholder contrast, match score contrast.
- [ ] T060 Run `npm run build` + `npm run lint` + `npx tsc --noEmit` — zero errors.

## Phase 6: Deploy & Verify

- [ ] T061 Pull Vercel env: `vercel env pull --environment=production`. Fix empty vars. Add `DEEPSEEK_API_KEY`.
- [ ] T062 Run `npm run build` locally to verify production build.
- [ ] T063 Push: `git push origin main` → auto-deploy to preview.ilali.co.
- [ ] T064 Smoke test all flows — including: NL query → ranked matches with scores + reasons. "You might also like" on detail pages.
- [ ] T065 Check off all acceptance criteria from spec.md.

---

## Dependencies

```
T001-T006 (setup) → T007-T011 (DB provision + seed)
T003 (schema) → T008 (migrations), T009 (seed), T011 (queries)
T011 (queries) → T012-T017 (data migration)
T012-T017 → T021 (build check)
T022-T024 (utilities) → T025-T028 (forms)
T023 (suburbs) → T046 (AI match — needs suburb list)
T030 (auth) → T031-T033 (auth routes + middleware)
T033 (middleware) → T034-T038 (admin pages)
T011 (queries) → T041 (search), T048 (match), T051 (similar)
T046 (match.ts) → T048 (match route)
T047 (score.ts) → T048 (match route)
T048 (match route) → T049 (search bar), T050 (match badges)
T012 (detail page) → T043 (WhatsApp button), T051 (similar), T053-T054 (placeholders)
T052 (ComingSoon) → T053-T058 (all placeholder instances)
```

## Parallel Opportunities

| Batch | Tasks | Rationale |
|---|---|---|
| Setup | T001, T006 | Different files, no deps |
| Data migration | T015, T016, T017 | Different files, all use T011 queries |
| Utilities | T022, T023, T024 | Different files, no cross-deps |
| Forms + Auth | Phase 3 + Phase 4 | Completely independent |
| AI engine | T046, T047 | Independent files, converge at T048 |
| Placeholder pages | T057, T058 | Different pages, same component |
| Polish | T043, T044, T045, T050, T051, T053, T054, T055 | Different files |

## MVP Scope

MVP = Phase 1 + Phase 2 + Phase 3 + Phase 4 + Phase 5 → Phase 6 (deploy). 65 tasks total.

**Ships in MVP:**
- AI-powered natural language matching (T046-T051) — the flagship differentiator
- Browse, search, filter, WhatsApp contact
- Provider application + referral forms
- Admin dashboard with auth
- Trust badges
- 5 "Coming soon" roadmap placeholders (reviews, parent accounts, provider dashboard, online booking, AI onboarding)
