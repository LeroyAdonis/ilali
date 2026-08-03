# Implementation Plan: Parent Profile & Personalised Home Page

**Spec:** [spec.md](spec.md)
**Constitution:** [ILALI Constitution](../../memory/constitution.md)
**Date:** 2026-08-03

## Technical Context

| Dimension | Decision | Rationale |
|---|---|---|
| Frontend framework | Next.js 16 App Router + React 19 | Existing stack |
| Styling | Tailwind CSS v4 + ILALI design tokens | Existing — `@theme inline` tokens, Bricolage + Inter fonts |
| Database | Neon PostgreSQL + Drizzle ORM (21 tables) | No new tables needed — reads from existing schema |
| Auth | Better Auth — `auth.api.getSession()` | Existing pattern from all API routes |
| Child scoring | Simplified `scoreProviderMatch` (deterministic, no AI) | Reuses chat-match logic without NVIDIA API call — 50ms budget |
| Notifications | Read-only aggregation from existing tables | No new table, no polling, no read/unread |
| Deploy | Vercel (`ilali.vercel.app`) | Existing |

## Constitution Check

| Principle | Compliance |
|---|---|
| **1. Trust First** | ✅ No change to verification system. Profile shows existing badges unchanged. |
| **2. Warm Family Aesthetic** | ✅ Uses existing ILALI design tokens (off-white, teal primary, colour-wheel accents). Bricolage Grotesque headings, Inter body. No new colours. |
| **3. Mobile-First, Cape Town Local** | ✅ Dashboard stacks vertically on mobile. Week planner becomes cards. Modal is bottom sheet on mobile. Pricing in Rands. |
| **4. Community-Powered Growth** | ✅ Community feed is visible even without children. Nudge card encourages profile completion but doesn't gate community access. |
| **5. MVP Simplicity** | ✅ No new tables, no new infrastructure. Three lightweight API routes. No online booking/payments. |
| **6. SA Context & Accessibility** | ✅ WCAG 2.1 AA. Suburb input with existing suburb list. ZAR pricing. |
| **7. Build-Then-Ship Cadence** | ✅ Single release. All features ship together. No phased rollout. |

## Research Summary

### Week Planner Scoring Algorithm

**Decision:** Deterministic scoring, no AI call.

The chat-match concierge already has a `scoreProviderMatch` function scoring providers against a query. We repurpose the age and interest dimensions, add a proximity bonus, and run it server-side at page load. No NVIDIA API call — the budget is 50ms for 5 children × 19 providers = 95 evaluations.

**Alternatives considered:**
- AI-powered suggestions via chat-match endpoint → rejected: adds 7+ second latency, costs API calls, overkill for a "suggested" tier
- Pre-computed match table → rejected: over-engineering for 19 providers

### Notification Dropdown Data Sources

**Decision:** Aggregate from three existing tables with no new infrastructure.

- Rewards: `getRewardPoints()` filtered to `userId`, last 5, sorted by `createdAt`
- Rides: `getRideRequests()` filtered to `requesterId OR claimerId`, last 3, sorted by `createdAt`
- Community: `getCommunityContributions()` or club messages, last 3 relevant to user

No new table, no polling, no WebSocket. Read-only, stateless, zero writes.

### ChildForm Component Extraction

**Decision:** Extract from `src/app/(auth)/onboarding/page.tsx` (660 lines) into a shared `src/components/parent/ChildForm.tsx`.

The onboarding page imports and wraps this component. The home page modal imports it. One source of truth for child form fields and validation.

**Pitfall:** The onboarding form is a `"use client"` component with useState. Extraction must preserve the existing flow — don't break onboarding while adding the modal use case.

### Why No New Tables

All data lives in existing tables:
- `childProfiles` → kids display + edit
- `users` → display name edit (add `suburb` column if not present)
- `clubMemberships` + `clubEvents` → week planner (scheduled)
- `providers` + `childProfiles` → week planner (suggested, scored in-memory)
- `rewardPoints` → points widget + notification dropdown
- `rideRequests` → notification dropdown
- `notificationPreferences` → settings panel (already exists)

One new column: `users.suburb` (text, nullable) — optional, can be inferred from children's suburbs as fallback.

## Data Model

No new tables. One optional column:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS suburb text;
```

Drizzle schema update in `src/lib/db/schema.ts`:
```typescript
// users table — add:
suburb: text("suburb"),
```

## API Contracts

### `POST /api/children`
Create a new child profile.

```
POST /api/children
Auth: Required (session cookie)
Body: {
  name: string,
  age: number (1-18),
  interests: string[],
  suburb: string,
  availability: { days: string[], timeSlots: string[] }
}
Response 201: { id: string, ...childProfile }
Response 401: { error: "Unauthorized" }
Response 400: { error: "Validation failed", details: [...] }
```

### `PATCH /api/children/[id]`
Update an existing child profile. Validates that the authenticated user owns this child.

```
PATCH /api/children/[id]
Auth: Required
Body: Partial<ChildInput> — any subset of name, age, interests, suburb, availability
Response 200: { ...updatedChildProfile }
Response 401: { error: "Unauthorized" }
Response 403: { error: "Not your child" }
Response 404: { error: "Child not found" }
```

### `PATCH /api/profile`
Update the authenticated user's profile fields.

```
PATCH /api/profile
Auth: Required
Body: {
  name?: string,
  suburb?: string,
  notifyNewProviders?: boolean,
  notifyCommunity?: boolean,
  notifyRewards?: boolean
}
Response 200: { name: string, suburb: string | null, preferences: {...} }
Response 401: { error: "Unauthorized" }
```

### `GET /api/children/[id]`
Fetch a single child profile (for edit pre-fill).

```
GET /api/children/[id]
Auth: Required
Response 200: { ...childProfile }
Response 401/403/404: as above
```

### Existing routes used (no changes)
- `GET /api/onboarding` — existing, no changes
- All club/membership/event reads via `data-source.ts`
- All reward reads via `data-source.ts`

## Implementation Phases

### Phase 1: Foundation — API Routes + Scoring
**Goal:** Build the three new API routes and the scoring engine.

**Tasks:**
- [ ] Add `users.suburb` column to Drizzle schema, push migration
- [ ] Create `src/lib/scoring/suggest-activities.ts` — deterministic scoring function
- [ ] Create `POST /api/children` route
- [ ] Create `PATCH /api/children/[id]` route
- [ ] Create `GET /api/children/[id]` route
- [ ] Create `PATCH /api/profile` route
- [ ] Update `src/lib/data-source.ts` with new read functions if needed

**Verification:** `curl` test each route with valid/invalid auth. Unit test scoring function with known inputs.

### Phase 2: Shared Components
**Goal:** Extract and build the reusable UI components.

**Tasks:**
- [ ] Extract `ChildForm` from onboarding into `src/components/parent/ChildForm.tsx`
- [ ] Update onboarding page to import `ChildForm` (verify no regressions)
- [ ] Build `ChildFormModal` — wraps `ChildForm` in modal/sheet
- [ ] Build `ProfileSettingsPanel` — gear icon → slide-out panel
- [ ] Build `NotificationBell` — dropdown with 3 sections
- [ ] Build `WeekPlanner` — scheduled events list
- [ ] Build `SuggestedActivities` — scored suggestions with dotted border visual
- [ ] Build `KidsCard` — children display with edit buttons
- [ ] Build `ClubCardsRow` — joined clubs with unread badges
- [ ] Build `PointsWidget` — balance display
- [ ] Build `NudgeCard` — amber "add your children" CTA

**Verification:** `npm run build` passes. Components render in isolation.

### Phase 3: Home Page Rewrite
**Goal:** Replace `/home` with the dual-mode dashboard.

**Tasks:**
- [ ] Rewrite `src/app/home/page.tsx` — auth check → signed-in vs signed-out layout
- [ ] Integrate all Phase 2 components into the signed-in layout
- [ ] Implement mobile responsive stacking
- [ ] Wire empty states (no children, no events, no clubs, no points)
- [ ] Ensure signed-out path renders the current landing page unchanged

**Verification:** Manual test both paths. `npm run build` passes.

### Phase 4: Polish & Verify
**Goal:** Edge cases, accessibility, type safety.

**Tasks:**
- [ ] Verify all 5 user scenarios manually
- [ ] Test no-children path end-to-end
- [ ] Test child add → edit → delete flow
- [ ] Test profile edit → name updates in greeting
- [ ] Keyboard navigation on modal, dropdown, settings panel
- [ ] `npx tsc --noEmit` clean
- [ ] `npm run build` clean
- [ ] Playwright smoke tests still pass

**Verification:** All acceptance criteria from spec checked.

## Dependencies

```
Phase 1 (API routes) ──→ Phase 2 (components) ──→ Phase 3 (page rewrite) ──→ Phase 4 (polish)
                              │
                              └── Can build components in parallel once API routes exist
```

## Parallel Opportunities

Within Phase 2, all components are independent (different files, no shared state):
- `ChildForm` + `ChildFormModal`
- `ProfileSettingsPanel`
- `NotificationBell`
- `WeekPlanner` + `SuggestedActivities`
- `KidsCard` + `ClubCardsRow` + `PointsWidget` + `NudgeCard`

These can be delegated as parallel batches.

## MVP Scope

MVP = All 4 phases. This is a single feature release. Nothing is deferred within the parent profile — what's out of scope is explicitly documented in the spec and backlog.

## Quickstart

```bash
# 1. Push schema change
cd /root/ilali
npx drizzle-kit push

# 2. Verify build
npm run build

# 3. Dev server
npm run dev
# Visit http://localhost:3001/home
# Sign in as demo parent (or create one)
# Verify personalised dashboard renders

# 4. Test API routes
# Create child
curl -X POST http://localhost:3001/api/children \
  -H "Content-Type: application/json" \
  -H "Cookie: <session-cookie>" \
  -d '{"name":"Test Kid","age":8,"interests":["Art","Music"],"suburb":"Rondebosch","availability":{"days":["Monday","Wednesday"],"timeSlots":["Afternoon"]}}'

# 5. Run type check
npx tsc --noEmit

# 6. Run existing Playwright suite
npx playwright test --reporter=list
```
