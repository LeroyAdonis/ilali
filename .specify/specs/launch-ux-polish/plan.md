# Implementation Plan: Launch UX Polish

**Spec:** `.specify/specs/launch-ux-polish/spec.md`
**Constitution:** `.specify/memory/constitution.md`
**Date:** 2026-08-18

## Technical Context

| Dimension | Decision | Rationale |
|---|---|---|
| Frontend | Next.js 16 App Router, client components | All FRs are UI + copy |
| Styling | Tailwind v4 + existing `ilali-*` tokens | Constitution P2 |
| DB | None (no schema changes) | Audit evidence: filtering already works |
| API | Possibly one tiny upload endpoint for FR-6 | Only if file upload chosen |
| Deploy | Vercel auto-deploy on push | Standard ILALI flow |

## Constitution Check

- P2 (Warm Family Aesthetic): ✅ all new UI uses existing teal/sunset tokens
- P3 (Mobile-First): ✅ 375px required in acceptance criteria
- P5 (MVP Simplicity): ✅ no new features — fixes existing UX gaps
- P6 (Accessibility): ✅ aria-pressed on pills, keyboard nav required

## Implementation Phases

### Phase 1: Parent-side fixes (FR-1, FR-2, FR-3, FR-7)
- FR-1: age pills in `src/components/FilterBar.tsx` (visible inline, maps to `?age=`)
- FR-2: save-state in `src/components/saved/SaveButton.tsx` + `SavedProvider.tsx`
  (set intent-based saved state after magic-link capture; reuse `ilali_intent` cookie)
- FR-3: homepage CTA in `src/app/page.tsx` line ~145 "Enter ILALI" → "Browse Activities"
- FR-7: signin copy in `src/app/auth/signin/page.tsx` "Welcome back" → neutral

### Phase 2: Provider-side fixes (FR-4, FR-5, FR-6)
- FR-4: "What you'll need" collapsible preview in `src/app/providers/signup/form.tsx`
  + `src/app/for-providers/page.tsx` entry (before the email gate)
- FR-5: signed-out `/provider` context in `src/app/(dashboard)/provider/page.tsx`
  + layout guard (`src/app/(dashboard)/provider/layout.tsx` or proxy route)
- FR-6: photo field subtext/optional in `src/app/providers/signup/form.tsx` line ~815
  + `src/app/(dashboard)/provider/edit/page.tsx` line ~492

### Phase 3: Bug fix + verification (FR-8)
- FR-8: hydration mismatch in `src/components/community/RideRequest.tsx` (~line 553)
  — fix server/client conditional render (signed-in guard)
- Run full test suite + tsc + eslint

## Quickstart

```bash
cd /root/ilali
npx tsc --noEmit          # clean
npx vitest run            # all pass
npx eslint src/           # clean
# Manual: browse page shows age pills; save modal → button turns Saved;
# /provider signed-out shows context; signup shows preview before email
```
