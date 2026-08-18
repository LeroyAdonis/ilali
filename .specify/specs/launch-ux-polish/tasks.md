# Tasks: Launch UX Polish

**Plan:** `.specify/specs/launch-ux-polish/plan.md`
**Spec:** `.specify/specs/launch-ux-polish/spec.md`

## Phase 1: Parent-side fixes
- [ ] T001 [FR-1] Add visible age-group pill selector to `src/components/FilterBar.tsx`
  (0-3, 4-7, 8-12, 13+ inline pills, maps to `?age=` param, aria-pressed, 375px)
- [ ] T002 [FR-2] Save state after intent capture — `src/components/saved/SaveButton.tsx`
  + `src/components/saved/SavedProvider.tsx` (reflect saved state after magic-link
  capture, reuse `ilali_intent` cookie, no new storage)
- [ ] T003 [FR-3] Homepage hero CTA — `src/app/page.tsx` line ~145: "Enter ILALI" →
  "Browse Activities"
- [ ] T004 [FR-7] Signin page copy — `src/app/auth/signin/page.tsx` line ~193:
  "Welcome back" → neutral first-time-friendly copy

## Phase 2: Provider-side fixes
- [ ] T005 [FR-4] "What you'll need" collapsible preview — `src/app/providers/signup/form.tsx`
  (before email gate) + `src/app/for-providers/page.tsx` entry CTA; plain-language
  4-step checklist, same card style as wizard review step
- [ ] T006 [FR-5] Signed-out `/provider` context — `src/app/(dashboard)/provider/page.tsx`
  + guard in `src/app/(dashboard)/provider/layout.tsx` or `src/proxy.ts`: show
  dashboard context + "New here? List your activity" CTA instead of bare sign-in
- [ ] T007 [FR-6] Photo field clarity — `src/app/providers/signup/form.tsx` line ~815
  + `src/app/(dashboard)/provider/edit/page.tsx` line ~492: add "(optional)" +
  subtext for non-tech-savvy providers (no file-upload infra in MVP)

## Phase 3: Bug fix + verification
- [ ] T008 [FR-8] Fix hydration mismatch — `src/components/community/RideRequest.tsx`
  ~line 553: server/client conditional render must match (guard signed-in check)
- [ ] T009 Verify: `npx tsc --noEmit`, `npx vitest run`, `npx eslint src/` all clean
- [ ] T010 Manual smoke: browse age pills, save→Saved state, /provider guest context,
  signup preview visible pre-email

## Dependencies
T002 depends on existing SavedProvider (already built). T005/T006/T007 independent files.
T008 independent. All phases can partially parallelize across files.

## Parallel Opportunities
T003, T004, T008 (one-line-ish, different files) — parallel-safe.
T001 + T002 same component family — do together.
T005 + T006 + T007 different provider files — parallel-safe.

## MVP Scope
All 8 FRs ship (launch quality gate). No post-MVP phases — this IS the polish gate.
