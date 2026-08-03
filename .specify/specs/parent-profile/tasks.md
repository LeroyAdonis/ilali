# Tasks: Parent Profile & Personalised Home Page

**Plan:** [plan.md](plan.md)
**Spec:** [spec.md](spec.md)

## Phase 1: Foundation — API Routes + Scoring

- [ ] T001 [P] Add `users.suburb` column to `src/lib/db/schema.ts`, run `npx drizzle-kit push`
- [ ] T002 [P] Create `src/lib/scoring/suggest-activities.ts` — deterministic scoring function (age match + interest overlap + proximity bonus, max 5 per child, dedupe scheduled)
- [ ] T003 Create `POST /api/children` route in `src/app/api/children/route.ts`
- [ ] T004 Create `GET /api/children/[id]` route in `src/app/api/children/[id]/route.ts`
- [ ] T005 Create `PATCH /api/children/[id]` — same file as T004, different method
- [ ] T006 Create `PATCH /api/profile` route in `src/app/api/profile/route.ts`

## Phase 2: Shared Components

- [ ] T007 [P] Extract `ChildForm` from `src/app/(auth)/onboarding/page.tsx` into `src/components/parent/ChildForm.tsx`. Update onboarding page to import it. Verify onboarding still works.
- [ ] T008 [P] Build `ChildFormModal` at `src/components/parent/ChildFormModal.tsx` — wraps ChildForm, bottom sheet on mobile, centered modal on desktop, escape-to-close
- [ ] T009 [P] Build `ProfileSettingsPanel` at `src/components/parent/ProfileSettingsPanel.tsx` — gear icon trigger, slide-out panel with name/suburb/toggles, calls PATCH /api/profile
- [ ] T010 [P] Build `NotificationBell` at `src/components/parent/NotificationBell.tsx` — bell icon, dropdown with 3 sections (rewards/rides/community), outside-click close
- [ ] T011 [P] Build `KidsCard` at `src/components/parent/KidsCard.tsx` — per-child display (name, age, interest chips, availability, edit button), "+ Add another child" footer
- [ ] T012 [P] Build `WeekPlanner` at `src/components/parent/WeekPlanner.tsx` — scheduled events list (day+time, activity, child badge, club colour accent bar)
- [ ] T013 [P] Build `SuggestedActivities` at `src/components/parent/SuggestedActivities.tsx` — scored suggestions with dotted border, amber tint, "Suggested for X" tag
- [ ] T014 [P] Build `ClubCardsRow` at `src/components/parent/ClubCardsRow.tsx` — joined clubs with unread chat badge, next event date
- [ ] T015 [P] Build `PointsWidget` at `src/components/parent/PointsWidget.tsx` — current balance display with link to /rewards
- [ ] T016 [P] Build `NudgeCard` at `src/components/parent/NudgeCard.tsx` — amber card for no-children parents, benefit list, CTA button

## Phase 3: Home Page Rewrite

- [ ] T017 Rewrite `src/app/home/page.tsx` — auth check → dual layout (signed-in dashboard vs signed-out landing page)
- [ ] T018 Integrate all Phase 2 components into signed-in layout (3-column widget row, full-width week planner, discovery sections below)
- [ ] T019 Implement no-children path: NudgeCard replaces KidsCard, empty-state WeekPlanner with popular suggestions, hidden club section
- [ ] T020 Wire all state changes: child add/edit refreshes KidsCard + WeekPlanner + suggestions; profile edit updates greeting

## Phase 4: Polish & Verify

- [ ] T021 Mobile responsive pass — verify 375px layout, bottom sheet modals, stacked week planner
- [ ] T022 [P] Accessibility pass — focus traps in modals, keyboard nav on bell dropdown, contrast check on nudge card
- [ ] T023 [P] Edge cases — parent with 5+ children, zero club events, zero reward points, very long child names
- [ ] T024 Verify all 5 spec scenarios manually
- [ ] T025 Run `npx tsc --noEmit` — must pass clean
- [ ] T026 Run `npm run build` — must pass clean
- [ ] T027 Run `npx playwright test --reporter=list` — existing suite must still pass

## Dependencies

```
T001, T002 (no deps)
    ↓
T003 → T004 → T005 → T006 (API routes, can be sequential or batched)
    ↓
T007–T016 (all Phase 2, INDEPENDENT — build in any order)
    ↓
T017 → T018 → T019 → T020 (page rewrite, sequential)
    ↓
T021–T027 (polish, many independent)
```

## Parallel Opportunities

**Phase 1:** T001 and T002 are independent. T003–T006 can be built as a batch (they share auth pattern but touch different files).

**Phase 2:** ALL 10 components (T007–T016) are independent. Different files, no shared state. Perfect for parallel delegation — 3 batches of 3-4 components each.

**Phase 4:** T022 and T023 are independent.

## MVP Scope

MVP = All 4 phases (40 tasks). Single release. Nothing deferred within parent profile scope.

## Delegation Strategy

### Batch 1: API Routes + Scoring (Phase 1)
Dispatch 1 subagent for T001–T006. Context: spec.md + plan.md + Drizzle schema path.

### Batch 2: Components (Phase 2)
Dispatch 3 parallel subagents:
- **Agent A:** T007 (ChildForm extraction), T008 (ChildFormModal), T011 (KidsCard), T016 (NudgeCard) — all child-related
- **Agent B:** T012 (WeekPlanner), T013 (SuggestedActivities), T014 (ClubCardsRow), T015 (PointsWidget) — all display widgets
- **Agent C:** T009 (ProfileSettingsPanel), T010 (NotificationBell) — settings + notifications

### Batch 3: Home Page + Polish (Phases 3-4)
Dispatch 1 subagent for T017–T020, then manual verification T021–T027.
