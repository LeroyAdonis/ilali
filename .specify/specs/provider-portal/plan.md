# Implementation Plan: Provider Portal

**Spec:** [spec.md](./spec.md)
**Date:** 2026-08-04

## Technical Context

| Dimension | Decision | Rationale |
|---|---|---|
| Frontend framework | Next.js 16 App Router (existing) | No new framework — same stack as rest of ILALI |
| Styling | Tailwind CSS v4 + ILALI design tokens | Existing `@theme inline` tokens in globals.css |
| Database | Neon PostgreSQL + Drizzle ORM | Same stack. 2 new tables, 3 new columns on existing tables |
| Auth | Better Auth (existing) | `role: 'provider'` already in `additionalFields`. New: `passwordResetRequired`, `needsClaim`, `passphraseHash` |
| Design skills | Hallmark + Premium Design System + Frontend Design | Fresh macrostructure pick (no Hallmark log yet on ILALI) |
| Deploy | Vercel (`ilali.vercel.app`) | Same pipeline |

## Constitution Check

ILALI doesn't have a formal constitution yet — here are the implicit principles and how this plan complies:

| Principle | Compliance |
|---|---|
| Light, off-white theme with color-wheel accents | ✅ Dashboard uses `bg-paper`/`bg-paper-warm`, wizard steps use teal/gold/purple/orange |
| WCAG AA accessibility | ✅ Hallmark gates 40-41, premium-design-system contrast floor |
| Mobile-first | ✅ Single-column dashboard on mobile, responsive wizard |
| Data-source rule (all reads via `@/lib/data-source`) | ✅ All new queries wrapped with USE_MOCK toggle |
| Provider data isolation | ✅ Auth-gated routes check `role === 'provider'` and `userId === provider.userId` |
| No invented metrics | ✅ Hallmark gate 46 — dashboard stats from real DB queries only |

## Data Model

### New Columns on Existing Tables

**`users` table:**
```sql
passwordResetRequired boolean DEFAULT false   -- forced password change on first login
needsClaim           boolean DEFAULT false    -- existing provider hasn't claimed account yet
passphraseHash       text                     -- bcrypt-hashed recovery passphrase
```

**`providers` table:**
```sql
userId text REFERENCES users(id) ON DELETE SET NULL  -- linked user account
```

### New Tables

**`providerInquiries`** — logs AI concierge queries that matched this provider:
```typescript
export const providerInquiries = pgTable("provider_inquiries", {
  id:         uuid("id").defaultRandom().primaryKey(),
  providerId: uuid("provider_id").references(() => providers.id, { onDelete: "cascade" }).notNull(),
  query:      text("query").notNull(),           // what the parent searched for
  parentId:   text("parent_id"),                 // nullable — anonymous searches don't have a parent
  matchedAt:  timestamp("matched_at").defaultNow().notNull(),
});
```

**`reviewReplies`** — provider responses to reviews:
```typescript
export const reviewReplies = pgTable("review_replies", {
  id:         uuid("id").defaultRandom().primaryKey(),
  reviewId:   uuid("review_id").references(() => reviews.id, { onDelete: "cascade" }).notNull(),
  providerId: uuid("provider_id").references(() => providers.id, { onDelete: "cascade" }).notNull(),
  content:    text("content").notNull(),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
  updatedAt:  timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  uniqueIndex("unique_review_reply").on(t.reviewId),  // one reply per review
]);
```

### Migration Script

`scripts/migrate-provider-accounts.ts`:
1. Read all providers WHERE `userId IS NULL`
2. For each, create a user account in `users` table:
   - `email` = provider's email from the providers table
   - `role` = `'provider'`
   - `needsClaim` = `true`
   - `passwordResetRequired` = `false` (they claim, not reset)
   - No password set (they can't sign in until claim)
3. UPDATE provider SET `userId` = new user's id
4. Idempotent — skip providers that already have `userId`

## API Contracts

### Modified: `POST /api/admin/applications/[id]` (approve action)
When `status=approved`:
```typescript
// 1. Update application status
// 2. Look up or create provider record
// 3. Create user account:
//    - email = application.providerEmail
//    - role = 'provider'
//    - tempPassword = generateSecureToken(12)
//    - passwordResetRequired = true
//    - Hash and store password
// 4. Link: UPDATE providers SET userId = newUser.id
// 5. Return { success: true, tempPassword: "<12-char>" }
```

### `POST /api/auth/create-password`
First-login forced password creation:
```
Request:  { password: string, passphrase: string }
Auth:     Session required, must have passwordResetRequired=true
Action:   Hash password + passphrase (bcrypt), clear passwordResetRequired flag
Response: { success: true }
```

### `POST /api/auth/reset-password`
Passphrase-based recovery:
```
Request:  { email: string, passphrase: string, newPassword: string, newPassphrase: string }
Auth:     None (user can't sign in)
Action:   Find user by email, verify passphrase hash, update password + passphrase
Rate:     2 attempts per email per 30 min
Response: { success: true } or { error: "No match" }
```

### `POST /api/providers/claim`
Existing provider claim flow:
```
Request:  { email: string, password: string, passphrase: string }
Auth:     None
Action:   Find provider+user by email where needsClaim=true
          Hash password + passphrase, clear needsClaim, set passwordResetRequired=false
Response: { success: true } or { error: "No matching provider found" }
```

### `GET /api/provider` and `PATCH /api/provider`
Dashboard data and listing edit:
```
GET  → { provider: ProviderWithStats, inquiries: ProviderInquiry[], stats: { memberCount, eventCount, reviewCount } }
PATCH → { name?, description?, ageMin?, ageMax?, priceValue?, tags?, schedule?, photos?, location? }
Auth:  Role must be 'provider', userId must match provider.userId
```

### `POST /api/provider/reviews/[id]/reply`
Reply to a review:
```
Request:  { content: string }
Auth:     Provider role + owns the provider being reviewed
Action:   Upsert into reviewReplies (one reply per review)
Response: { reply: ReviewReply }
```

### `PATCH /api/provider/reviews/[id]/reply` and `DELETE`
Edit/delete own reply. Auth: provider owns the reply.

### `GET /api/provider/events` and `POST /api/provider/events`
```
GET   → Event[] (this provider's events, upcoming first)
POST  → { title, startTime, endTime?, description?, location?, maxParticipants? }
Auth:  Provider role, event.providerId = authenticated provider's id
```

### `PATCH /api/provider/events/[id]` and `DELETE`
Edit/delete own event. Auth: provider owns the event.

### `GET /api/provider/club/members`
```
GET → { members: { parentName, childNames[], joinedAt }[], count: number }
Auth: Provider role, members filtered to own provider's club
```

### `POST /api/ai/chat-match` (MODIFIED)
Add: when concierge returns matches, log each match to `providerInquiries` table (fire-and-forget, non-blocking).

## Implementation Phases

### Phase 1: Foundation — Schema + Auth
**Goal:** Database changes deployed, provider accounts creatable, auth flow works end-to-end.

**Tasks:**
- [ ] T001 Add new columns to `users` table in `src/lib/db/schema.ts` (`passwordResetRequired`, `needsClaim`, `passphraseHash`)
- [ ] T002 Add `userId` column to `providers` table in `src/lib/db/schema.ts`
- [ ] T003 Create `providerInquiries` table in `src/lib/db/schema.ts`
- [ ] T004 Create `reviewReplies` table in `src/lib/db/schema.ts`
- [ ] T005 Update `src/lib/db/types.ts` with new type exports
- [ ] T006 Run `npx drizzle-kit push` to deploy schema changes
- [ ] T007 Modify `POST /api/admin/applications/[id]` — auto-create user on approval, return temp password
- [ ] T008 Create `POST /api/auth/create-password` route
- [ ] T009 Create `POST /api/auth/reset-password` route (passphrase recovery)
- [ ] T010 Create `POST /api/providers/claim` route
- [ ] T011 Create `/auth/create-password/page.tsx` — forced password + passphrase creation UI
- [ ] T012 Create `/auth/forgot-password/page.tsx` — passphrase recovery UI
- [ ] T013 Create `/providers/claim/page.tsx` — existing provider claim UI
- [ ] T014 Update `/auth/signin/page.tsx` — add provider role redirect + claim link
- [ ] T015 Update admin applications page to display temp password on approval
- [ ] T016 Create `PassphraseInput` component in `src/components/provider/`
- [ ] T017 Create migration script `scripts/migrate-provider-accounts.ts`
- [ ] T018 Write unit tests for auth routes (create-password, reset-password, claim)

### Phase 2: Dashboard + Listing Management
**Goal:** Provider logs in, sees dashboard, can edit listing.

**Tasks:**
- [ ] T019 Create `/(dashboard)/provider/layout.tsx` — dashboard shell with provider nav
- [ ] T020 Create `/(dashboard)/provider/page.tsx` — dashboard home with listing card + activity
- [ ] T021 Create `GET /api/provider` route — dashboard data endpoint
- [ ] T022 Create `PATCH /api/provider` route — listing edit endpoint
- [ ] T023 Create `ActivityStats` component — inquiries, members, events, reviews grid
- [ ] T024 Create `ListingCardPreview` component — readonly ProviderCard as parents see it
- [ ] T025 Create `ProfileWizard` component — collapsible 8-step completion wizard
- [ ] T026 Create `/(dashboard)/provider/edit/page.tsx` — full listing edit page
- [ ] T027 Modify `POST /api/ai/chat-match` — log matches to `providerInquiries` (fire-and-forget)
- [ ] T028 Add data-source wrappers for new queries in `src/lib/data-source.ts`
- [ ] T029 Write Playwright smoke tests for dashboard + edit flow

### Phase 3: Reviews + Events + Club
**Goal:** Provider can respond to reviews, manage events, view club members.

**Tasks:**
- [ ] T030 Create `POST|PATCH|DELETE /api/provider/reviews/[id]/reply` routes
- [ ] T031 Create `GET|POST /api/provider/events` routes
- [ ] T032 Create `PATCH|DELETE /api/provider/events/[id]` routes
- [ ] T033 Create `GET /api/provider/club/members` route
- [ ] T034 Create `/(dashboard)/provider/reviews/page.tsx` — review list + reply UI
- [ ] T035 Create `ReviewReplyForm` component — inline reply form
- [ ] T036 Create `/(dashboard)/provider/events/page.tsx` — event list + CRUD UI
- [ ] T037 Create `EventForm` component — create/edit event form
- [ ] T038 Create `/(dashboard)/provider/club/page.tsx` — member list
- [ ] T039 Write Playwright smoke tests for reviews + events + club

### Phase 4: Design Polish (Hallmark Stack)
**Goal:** Pass Hallmark 58-gate slop test, premium-design-system quality gates, frontend-design distinctiveness.

**Tasks:**
- [ ] T040 Load Hallmark, pick macrostructure + theme (fresh pick — no log constraints)
- [ ] T041 Run Hallmark pre-flight on ILALI
- [ ] T042 Apply Hallmark visual ruleset to all provider portal pages
- [ ] T043 Verify all 8 states on interactive components (default/hover/focus/active/disabled/loading/error/success)
- [ ] T044 Run 58-gate slop test — fix all failures
- [ ] T045 Verify mobile at 320/375/414/768 — no horizontal scroll
- [ ] T046 Verify WCAG AA contrast on all text
- [ ] T047 Verify `prefers-reduced-motion` respected
- [ ] T048 Append to `.hallmark/log.json`

### Phase 5: Integration + Ship
**Goal:** Everything works together, deployed to production.

**Tasks:**
- [ ] T049 Run migration script against production DB
- [ ] T050 Full `npx tsc --noEmit` type-check
- [ ] T051 Full `npx playwright test` — all 10 existing + new tests pass
- [ ] T052 `npm run build` — clean production build
- [ ] T053 `vercel deploy --prod` — deploy to ilali.vercel.app
- [ ] T054 Manual smoke test: admin approve → provider login → dashboard → edit listing → respond to review → create event
- [ ] T055 Run migration for 19 existing providers on production

## Parallel Opportunities

Phases 2 and 3 can be partially parallelized across OpenCode agents:
- Agent A: Phase 2 tasks (dashboard + listing)
- Agent B: Phase 3 tasks (reviews + events + club)

Phases 1, 4, and 5 are sequential — each depends on the previous.

## Dependencies

```
Phase 1 (schema + auth) ──→ Phase 2 (dashboard) ──→ Phase 4 (design) ──→ Phase 5 (ship)
                        └─→ Phase 3 (reviews/events) ──┘
                                                      ↑
                                          (2+3 can run in parallel)
```

## File Manifest

### New Files (~25 files)
```
src/
  app/
    auth/
      create-password/page.tsx
      forgot-password/page.tsx
    api/
      auth/create-password/route.ts
      auth/reset-password/route.ts
      providers/claim/route.ts
      provider/route.ts
      provider/reviews/[id]/reply/route.ts
      provider/events/route.ts
      provider/events/[id]/route.ts
      provider/club/members/route.ts
    (dashboard)/provider/
      layout.tsx
      page.tsx
      edit/page.tsx
      reviews/page.tsx
      events/page.tsx
      club/page.tsx
    providers/claim/page.tsx
  components/provider/
    DashboardShell.tsx
    ProfileWizard.tsx
    ListingCardPreview.tsx
    ActivityStats.tsx
    EventForm.tsx
    ReviewReplyForm.tsx
    PassphraseInput.tsx
  scripts/
    migrate-provider-accounts.ts
```

### Modified Files (~5 files)
```
src/
  lib/db/schema.ts           — new columns + tables
  lib/db/types.ts             — new type exports
  lib/db/queries.ts           — new query functions
  lib/data-source.ts          — new USE_MOCK wrappers
  app/auth/signin/page.tsx    — provider redirect + claim link
  app/api/admin/applications/[id]/route.ts  — auto-create user
  app/api/ai/chat-match/route.ts            — log inquiries
  app/admin/applications/page.tsx           — display temp password
```

## MVP Scope

MVP = Phase 1 + Phase 2 + Phase 3 (all user stories). Phase 4 (design polish) and Phase 5 (integration) are mandatory before ship but can be light if the build is clean.

## Quickstart

```bash
# Setup
cd /root/ilali
npx drizzle-kit push                                    # Deploy schema changes
node scripts/migrate-provider-accounts.ts               # Create accounts for 19 existing providers

# Verify
npm run build                                           # Clean build
npx tsc --noEmit                                        # Type-check
npx playwright test                                     # All tests pass

# Dev
npm run dev                                             # localhost:3001

# Deploy
vercel deploy --prod --yes
```
