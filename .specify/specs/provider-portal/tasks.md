# Tasks: Provider Portal

**Plan:** [plan.md](./plan.md)
**Spec:** [spec.md](./spec.md)

## Phase 1: Foundation — Schema + Auth

- [ ] T001 Add `passwordResetRequired`, `needsClaim`, `passphraseHash` columns to `users` table in `src/lib/db/schema.ts`
- [ ] T002 Add `userId` column to `providers` table in `src/lib/db/schema.ts`
- [ ] T003 Create `providerInquiries` table in `src/lib/db/schema.ts`
- [ ] T004 Create `reviewReplies` table with `uniqueIndex` on `reviewId` in `src/lib/db/schema.ts`
- [ ] T005 Update `src/lib/db/types.ts` with new type exports for all new tables/columns
- [ ] T006 Run `npx drizzle-kit push` to deploy schema changes to Neon
- [ ] T007 [P] Add new query functions to `src/lib/db/queries.ts` (getProviderByUserId, getProviderInquiries, getReviewReplies, getProviderEvents, getClubMembersForProvider, createProviderUser, verifyPassphrase)
- [ ] T008 [P] Add USE_MOCK wrappers for new query functions in `src/lib/data-source.ts`
- [ ] T009 Modify `POST /api/admin/applications/[id]/route.ts` — on status=approved: create user account with temp password, link to provider, return tempPassword in response
- [ ] T010 Create `POST /api/auth/create-password/route.ts` — accepts { password, passphrase }, validates session has passwordResetRequired, hashes both, clears flag
- [ ] T011 Create `POST /api/auth/reset-password/route.ts` — accepts { email, passphrase, newPassword, newPassphrase }, rate-limited: 2 attempts/30min per email
- [ ] T012 Create `POST /api/providers/claim/route.ts` — accepts { email, password, passphrase }, finds provider+user where needsClaim=true, sets password
- [ ] T013 Create `PassphraseInput` component in `src/components/provider/PassphraseInput.tsx` — validates 3+ words, shows strength indicator
- [ ] T014 Create `/auth/create-password/page.tsx` — forced password creation UI with PassphraseInput, redirects to /provider on success
- [ ] T015 Create `/auth/forgot-password/page.tsx` — email + passphrase entry, new password + new passphrase form
- [ ] T016 Create `/providers/claim/page.tsx` — existing provider claim UI: email → password + passphrase → redirect to /provider
- [ ] T017 Update `/auth/signin/page.tsx` — after sign-in, check role: 'provider' → /provider, 'admin' → /admin, default → /home. Add "Already have a listing? Claim your account →" link
- [ ] T018 Update admin applications page to display temp password on successful approval with copy buttons
- [ ] T019 Create migration script `scripts/migrate-provider-accounts.ts` — idempotent: reads providers without userId, creates user accounts with needsClaim=true, links via userId
- [ ] T020 Run migration script against dev DB, verify 19 provider accounts created

## Phase 2: Dashboard + Listing Management

- [ ] T021 Create `/(dashboard)/provider/layout.tsx` — provider dashboard shell: ILALI logo, provider nav (Dashboard, Edit Listing, Reviews, Events, Club), sign-out. Auth-gated (role='provider').
- [ ] T022 Create `GET /api/provider/route.ts` — returns { provider, inquiries, stats: { memberCount, eventCount, reviewCount } }. Auth: provider role + owns provider.
- [ ] T023 Create `PATCH /api/provider/route.ts` — accepts listing fields, validates, updates providers table. Auth: provider role + owns provider.
- [ ] T024 Create `ActivityStats` component in `src/components/provider/ActivityStats.tsx` — 3-4 stat cards (inquiries, members, events, reviews) with color-wheel accent borders
- [ ] T025 Create `ListingCardPreview` component in `src/components/provider/ListingCardPreview.tsx` — renders ProviderCard exactly as parents see it, with "This is how parents see your listing" label
- [ ] T026 Create `ProfileWizard` component in `src/components/provider/ProfileWizard.tsx` — collapsible 8-step wizard: activity name, category (read-only display), age range, pricing, schedule, photos, description, tags. Each step saves independently. Progress bar with color transitions (<50% teal, 50-87% gold, 88%+ just bar). At 8/8 disappears.
- [ ] T027 Create `/(dashboard)/provider/page.tsx` — dashboard home: ProfileWizard (collapsible) → ListingCardPreview → ActivityStats → upcoming events (max 3) → recent reviews (max 3). Handles empty states gracefully.
- [ ] T028 Create `/(dashboard)/provider/edit/page.tsx` — full listing edit form: name, description, age range, pricing (Rands), tags (multi-select), location (suburb lookup), schedule (day-time pairs, add/remove), photos (upload 1-6, reorder, delete). Save calls PATCH /api/provider.
- [ ] T029 Modify `POST /api/ai/chat-match/route.ts` — after returning matches, fire-and-forget log each matched provider to `providerInquiries` table (try/catch, non-blocking)
- [ ] T030 Write Playwright smoke test: provider sign-in → dashboard loads → wizard visible → edit listing saves → listing card updates

## Phase 3: Reviews + Events + Club

- [ ] T031 Create `POST|PATCH|DELETE /api/provider/reviews/[id]/reply/route.ts` — POST creates reply, PATCH edits own reply, DELETE removes own reply. Auth: provider owns the provider being reviewed. Unique constraint: one reply per review.
- [ ] T032 Create `GET /api/provider/events/route.ts` — returns events for this provider, upcoming first, with attendee counts
- [ ] T033 Create `POST /api/provider/events/route.ts` — creates event linked to provider's club (providerId FK)
- [ ] T034 Create `PATCH|DELETE /api/provider/events/[id]/route.ts` — edit/delete own event. Auth: provider owns the event.
- [ ] T035 Create `GET /api/provider/club/members/route.ts` — returns { members: { parentName, childNames[], joinedAt }[], count }
- [ ] T036 Create `ReviewReplyForm` component in `src/components/provider/ReviewReplyForm.tsx` — inline textarea with submit, auto-expanding. Shows existing reply with edit/delete buttons.
- [ ] T037 Create `/(dashboard)/provider/reviews/page.tsx` — review list (newest first), each with star rating, reviewer, date, content. Inline ReplyForm. Provider's own replies show indented below review.
- [ ] T038 Create `EventForm` component in `src/components/provider/EventForm.tsx` — modal or inline form: title, date/time, description, location, max participants. Handles create and edit modes.
- [ ] T039 Create `/(dashboard)/provider/events/page.tsx` — upcoming events list with edit/delete per event. "Add event" button opens EventForm in create mode. Past events collapsible section.
- [ ] T040 Create `/(dashboard)/provider/club/page.tsx` — member list: parent name, child name(s), join date. Member count header. Empty state: "Your community is growing 🌱"
- [ ] T041 Write Playwright smoke tests: reply to review → edit reply → delete reply; create event → edit event → delete event; view club members

## Phase 4: Hallmark Design Polish

- [ ] T042 Load Hallmark + Premium Design System + Frontend Design skills
- [ ] T043 Run Hallmark pre-flight on ILALI (globals.css, package.json, font stack, palette)
- [ ] T044 Pick macrostructure for provider dashboard (fresh pick — no Hallmark log yet). Pick theme from catalog.
- [ ] T045 Pick nav archetype (N1b canonical SaaS or N5 floating pill, not N1a minimal)
- [ ] T046 Apply Hallmark visual ruleset: OKLCH tokens, type pairing, spacing scale, hero enrichment decision
- [ ] T047 Apply to all 6 provider pages: dashboard, edit, reviews, events, club, claim
- [ ] T048 Verify 8-state coverage on all interactive components (wizard steps, form fields, buttons, reply textareas, event form)
- [ ] T049 Run 58-gate slop test — document and fix all failures
- [ ] T050 Verify mobile at 320/375/414/768px — no horizontal scroll, no two-line CTAs
- [ ] T051 Verify WCAG AA contrast on all text, headers, labels — no `text-gray-500` on light backgrounds
- [ ] T052 Verify `prefers-reduced-motion` respected — all animations collapse to ≤150ms opacity crossfade
- [ ] T053 No italic headers, no re-drawn chrome, no invented metrics
- [ ] T054 Append entry to `.hallmark/log.json`

## Phase 5: Integration + Ship

- [ ] T055 Full `npx tsc --noEmit` — zero errors
- [ ] T056 Full `npx playwright test` — all existing + new tests pass
- [ ] T057 `npm run build` — clean production build
- [ ] T058 Run migration script against production Neon DB
- [ ] T059 `vercel deploy --prod --yes`
- [ ] T060 Manual smoke test: admin approve → provider login → dashboard → edit → reply to review → create event → view club → sign out

## Dependencies

```
T001-006 (schema) → T007-008 (queries/data-source)
T001-006 → T009-012 (auth routes)
T007-008 + T009-012 → T013-020 (auth UI + migration)
T013-020 → T021-030 (dashboard + listing)
T013-020 → T031-041 (reviews + events + club)
T021-030 + T031-041 → T042-054 (design polish)
T042-054 → T055-060 (integration + ship)
```

## Parallel Opportunities

**Within Phase 1:**
- T007 (queries) || T009-012 (auth routes) — different files, T007 only needs schema (T001-006 done)

**Across Phases 2+3 (OpenCode dispatch):**
- Agent A: T021-030 (dashboard + listing) — `/(dashboard)/provider/`, `/api/provider/`
- Agent B: T031-041 (reviews + events + club) — `/api/provider/reviews/`, `/api/provider/events/`, `/api/provider/club/`

**Within Phase 4:**
- T048-053 (verification gates) can all run in parallel after T047

## OpenCode Dispatch Strategy

**Batch 1 — Foundation (Phase 1, dispatched to Ricky):**
Phase 1 has tight coupling (schema → routes → UI). Better to run this sequentially myself — schema changes need `drizzle-kit push` verification between steps.

**Batch 2 — Dashboard + Reviews/Events (Phases 2+3, 2 parallel OpenCode agents):**

Agent A worktree: `provider-dashboard`
```
Implement the Provider Portal dashboard and listing management for ILALI.
Read .specify/specs/provider-portal/spec.md and plan.md first.
Read src/lib/db/schema.ts for table structures.
Build:
- src/app/(dashboard)/provider/layout.tsx — auth-gated provider shell with nav
- src/app/(dashboard)/provider/page.tsx — dashboard home
- src/app/(dashboard)/provider/edit/page.tsx — full listing edit form
- src/app/api/provider/route.ts — GET (dashboard data) + PATCH (edit listing)
- src/components/provider/ActivityStats.tsx
- src/components/provider/ListingCardPreview.tsx
- src/components/provider/ProfileWizard.tsx
- Modify src/app/api/ai/chat-match/route.ts — fire-and-forget log to providerInquiries
Run npm run build after implementation.
```

Agent B worktree: `provider-reviews-events`
```
Implement the Provider Portal reviews, events, and club views for ILALI.
Read .specify/specs/provider-portal/spec.md and plan.md first.
Read src/lib/db/schema.ts for table structures.
Build:
- src/app/api/provider/reviews/[id]/reply/route.ts — POST/PATCH/DELETE
- src/app/api/provider/events/route.ts — GET (list) + POST (create)
- src/app/api/provider/events/[id]/route.ts — PATCH/DELETE
- src/app/api/provider/club/members/route.ts — GET
- src/app/(dashboard)/provider/reviews/page.tsx
- src/app/(dashboard)/provider/events/page.tsx
- src/app/(dashboard)/provider/club/page.tsx
- src/components/provider/ReviewReplyForm.tsx
- src/components/provider/EventForm.tsx
Run npm run build after implementation.
```

**Batch 3 — Design Polish (Phase 4, dispatched to Ricky or OpenCode):**
Hallmark application across all provider pages. Sequential — needs Phase 2+3 merged first.

**Batch 4 — Integration (Phase 5, Ricky):**
Type-check, tests, deploy, smoke test.

## MVP Scope

MVP = Phase 1 + Phase 2 + Phase 3. Phase 4 (design polish) and Phase 5 (integration) are mandatory before PRODUCTION ship but the portal is full-featured after Phase 3.
