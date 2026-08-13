# ILALI — Full SDD Verification Handoff (2026-08-13)

Written for the post-implementation verification session. Verify **every spec,
plan, and tasks file in `.specify/`** against the code on `main`
(at `af98e4e` or newer). This is a whole-trail audit, not just
painless-journeys.

## Baseline (run first, must be clean)

```
npx tsc --noEmit
npx vitest run
npm run build
```

## 1. Spec inventory — verify every row

| Spec | File status | FRs | Git evidence | Verify focus |
|---|---|---|---|---|
| ILALI MVP | `spec.md` Clarified ✓; `plan.md` Ready for Implementation | 12 (FR-1..12) | The entire app is the implementation | Every FR vs current app. Plan phases vs what shipped. `tasks.md` checkboxes |
| Poster-to-Profile (WS-7) | Clarified 2026-08-07 | 6 (FR-1..6) | SHIPPED: `cfb11d6` P1, `6d74ced` P2+3, `9f9a5e6` extended fields, `4d7a41a` logo crop, `fea1644` webp/quality, `dddcc57` logo reliability | All 6 FRs + poster-import E2E |
| Poster Extended Fields | APPROVED 2026-08-10; "schema pushed; implementation in flight" | field list (not FR-numbered) | `9f9a5e6` | George's verbatim field list vs schema + poster form |
| Responsive Images | Clarified — Ready for Planning | 10 (FR-1..10) | SHIPPED: `6972f45` | 10 FRs; AVIF/WebP; curated Unsplash; heroes |
| Painless Journeys | Clarified 2026-08-13 | 14 (FR-1..14) | `d3911b0` spec → `4b96973` P1 → `315795c` P2 → `8ec4429` P3 → `49a06fb` P4 → `d81120e` P5 (see §3) | 14 FRs, per-phase; grill Q1–Q10 |
| Parent Profile | Clarified | 10 (FR-1..10) | `childProfiles`, onboarding API, `ProfileSettingsPanel`; painless-journeys DEFERRED child-profile UX | PARTIAL RISK: what's implemented vs spec; what painless-journeys deferred |
| Provider Portal | Draft — Ready for Review (grill pending) | 11 (FR-1..11) | Portal UI exists in app; `providerVerifications` tables; painless-journeys P4 wizard covers onboarding | BIG QUESTION: portal features live vs spec still Draft — was it implemented to this spec or older? |
| Join a Club | Draft | 7 (FR-1..7) | `clubEvents`, `clubMemberships`, `clubMessages` tables exist; WS-5 shipped `e316c7c` | Partial: which FRs live, which are still draft |
| Community Contributions | Draft | 10 (FR-1..10) | `providerVouches`, `rewardPoints`, `rewardRedemptions` tables | Partial: vouching + rewards vs spec |
| Bulk Import | Draft — Ready for Review; **grill PENDING** | 8 (FR-1..8) | WS-4 shipped `1e16b60` (multi-format intake, batch approve) | NEWER spec vs WS-4 impl — did WS-4 implement this spec, or is the spec a post-hoc re-spec? |
| Trust & Safety Signals | Draft | (no FR markers) | Verification tiers (Listed/Verified/Trusted) per AGENTS.md; `providerVerifications` | Draft-level check: what's live vs spec ideas |

Also verify:
- `.specify/specs/painless-journeys/tasks.md` — T001–T034 statuses vs commits
- `.specify/specs/ilali-mvp/tasks.md`, `poster-to-profile/tasks.md`,
  `parent-profile/tasks.md`, `bulk-import/tasks.md` — checkbox state
- `.specify/memory/constitution.md` — amendments ratified vs honored in builds

## 2. Backlog findings (flag these)

- **Duplicate numbering:** items 25–28 appear TWICE (25 social login + 25
  dark-mode; 26 Paystack + 26 batch poster import; 27 billing + 27 auto
  WhatsApp; 28 WhatsApp delivery + 28 email outreach). Data hygiene issue.
- **Partially absorbed by painless-journeys** (were NOT formally struck off):
  #12 full notification system → P3 built the state machine + `notificationEvents`
  #18 provider onboarding wizard redesign → P4 built the 4-step wizard
  #26/27 billing/pricing → P5 env-driven pricing
  #28 WhatsApp delivery → P3 `WHATSAPP_NOTIFY_ENABLED` flag (stubbed, email-only today)
  Verdict expected: "absorbed via painless-journeys FRs, backlog entry stale".

## 3. Painless-journeys implementation map

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

### Known deliberate deferrals (do NOT flag as gaps)
1. Notification send concurrency — sequential; revisit at scale (WS-6)
2. Sibling provider pages (`/provider/edit|reviews|events|club`) role gate —
   APIs ownership-scoped, no security issue; layout gate removed by design
3. Wizard submit atomicity — app update + role flip not in one DB transaction;
   approve-time role flip repairs partial failures
4. `requireUser` helper — ~20 routes inline the session guard (only
   `requireAdmin`/`withAdmin` shared)
5. StepRail / useWizard refactors — duplicated step-rail UI, 950-line form
6. Email shell extraction — legacy mail senders inline their HTML shell
7. Wizard re-POST on re-navigation — no dirty tracking yet
8. Batch approve concurrency — sequential; pre-existing

## 4. Known caveats

- **E2E flakes (pre-existing):** AI-match + poster AI tests need NVIDIA NIM
  (rate-limits). Non-AI E2E: 25/25. Use `PORT=3001 npx playwright test`.
- **Schema push-only:** P2–P5 columns/tables pushed via `drizzle-kit push`,
  NO committed migration files — drift risk on prod if schema re-applied.
- **Role-flip vs session:** server `getSession` reads fresh role; client atom
  stale until refetch (wizard calls `refetch()`; layout gate removed by design).
- **Deploy env (Vercel):** `CRON_SECRET` required for cron (401s without);
  `RESEND_API_KEY` optional (emails skip gracefully); `PRICING_*` default 99/30/10.
- **AGENTS.md:** Next.js 16.2.7 breaking changes — read
  `node_modules/next/dist/docs/` before code; `src/proxy.ts` not middleware;
  `NEXT_PUBLIC_USE_MOCK=true` for mock mode. Credentials inside AGENTS.md —
  do not reproduce.
- **Older history:** earlier workstreams (WS-1..WS-5, heroes, nav) predate
  `.specify` — verify those only where a spec exists; don't expect specs for
  pre-SDD work (git history is the record).

## 5. Output format requested

Per FR: ✅ implemented (file:line) / ⚠️ partial (what's missing) / ❌ missing.
Plus a summary table per spec, and a final verdict on the whole trail:
which specs are fully implemented, which are partial, which are still
spec-only (draft) — and whether any backlog items were secretly scope-crept.
