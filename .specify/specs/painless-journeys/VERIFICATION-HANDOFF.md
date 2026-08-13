# Painless Journeys — Verification Handoff (2026-08-13)

Written for the post-implementation verification session. Verify the documents
below against the code **at commit `d81120e`** (and its ancestors on `main`).

## What to verify (documents → code)

| Document | Path | Status at handoff |
|---|---|---|
| Grill-me Q&A | Embedded in spec.md (Q1–Q10, all approved — no overrides) | Check each Q's outcome is implemented |
| Spec | `.specify/specs/painless-journeys/spec.md` | Clarified 2026-08-13, 14 FRs, zero open markers |
| Plan | `.specify/specs/painless-journeys/plan.md` | 5 phases |
| Tasks | `.specify/specs/painless-journeys/tasks.md` | T001–T034 |
| Backlog | `.specify/backlog.md` | +5 items added — verify none were secretly scope-crept in |
| Constitution | `.specify/memory/constitution.md` | progressive-verification amendment ratified |

## Implementation map (git log --oneline main)

```
d81120e feat(pricing): env-driven provider pricing + copy alignment (P5)
1d1884a refactor(provider): simplify round 4 (P4 cleanup)
49a06fb feat(provider): 4-step onboarding wizard + status tracker (P4)
c0b0ddf refactor(notify): simplify round 3 (P3 cleanup)
8ec4429 feat(notify): stage-based notification state machine (P3)
bf0f47c refactor(saved): simplify round 2 (P2 cleanup)
315795c feat(parent): guest-first browsing + intent capture (P2)
4b96973 feat(auth): email-first magic-link sign-in (P1)
```

## Known deliberate deviations / deferred items (do NOT flag as gaps)

These were consciously deferred during simplify rounds, documented here so the
verifier can distinguish "spec gap" from "recorded deferral":

1. **Notification send concurrency** — `sendNotificationBatch` is sequential.
   Fine at launch scale; revisit with bounded concurrency when digest volume
   exceeds ~100 recipients (WS-6 hardening).
2. **Sibling provider pages role gate** — `/provider/edit|reviews|events|club`
   still gate on client session role; the layout gate was removed and the
   dashboard/API handle pre-live. Server APIs are ownership-scoped (no security
   issue). Deeper fix (data gate + session refetch on submit) is a small task.
3. **Wizard submit atomicity** — app update + role flip are not wrapped in a
   DB transaction. Approve-time role flip repairs any partial failure.
4. **`requireUser` helper** — ~20 routes inline the session guard; no shared
   helper yet (only `requireAdmin`/`withAdmin` exist).
5. **StepRail / useWizard refactors** — duplicated step-rail UI and the
   950-line form component; readability refactors, not defects.
6. **Email shell extraction** — legacy mail senders still inline their HTML
   shell (new templates share theirs). Cosmetic drift risk only.
7. **Wizard re-POST on re-navigation** — step saves POST even when unchanged.
   Dirty-tracking is a nice-to-have.
8. **Batch approve concurrency** — sequential; pre-existing, admin-scale.

## Known verification caveats

- **E2E flakes (pre-existing):** 2 AI-match smoke tests + poster AI tests need
  NVIDIA NIM (rate-limits/flaky) — not related to these phases. Non-AI E2E:
  25/25 pass.
- **`PASSWORD_MIN_LENGTH`** — single source of truth; zero `length < 8`
  leftovers (Phase 1 simplify).
- **Role-flip vs session** — server-side `getSession` reads fresh role
  (stateful adapter); the client atom is stale until refetch. Wizard submit
  now calls `refetch()`; the layout gate was removed intentionally.
- **Deploy env:** `CRON_SECRET` must be set in Vercel dashboard for cron jobs
  (401s without). `RESEND_API_KEY` optional — emails skip gracefully.
  `PRICING_*` default to 99/30/10.
- **Schema:** `savedActivities`, `notificationEvents` (+index),
  providers `billingPlan|planFreeUntil|assitejExempt` — all pushed to Neon via
  `drizzle-kit push`. NO migration files were generated (push-only workflow —
  this is a known drift risk on prod deploys if schema changes are re-applied).
