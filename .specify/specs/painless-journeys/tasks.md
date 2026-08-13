# Tasks: Painless Journeys (Parent & Provider UX Simplify)

**Plan:** [plan.md](./plan.md)
**Spec:** [spec.md](./spec.md)
**Date:** 2026-08-13

## Phase 1: Auth foundation — magic link, email-first
- [ ] T001 [P] Add `magicLink` plugin to `src/lib/auth.ts` (sendMagicLinkEmail → `src/lib/mail/index.ts`; enableOnLinkSignup)
- [ ] T002 [P] Add matching client config to `src/lib/auth-client.ts`
- [ ] T003 [US1] Rework `/auth/signup/page.tsx`: email-first form (email + optional name → magic link), remove mandatory password/terms-gate (terms shown as consent line)
- [ ] T004 [US1] Rework `/auth/signin/page.tsx`: magic-link primary, password link secondary
- [ ] T005 Add "set a password" path in account area (new small route or reuse existing)
- [ ] T006 Fire `welcome` notification on first sign-in
- [ ] T007 Update `src/lib/mail/index.ts` with `sendMagicLinkEmail` + welcome template helpers

## Phase 2: Guest-first + intent capture
- [ ] T008 [P] Audit `src/lib/auth-guard.ts` usage across browse/search/map/category routes — remove account gates from discovery surfaces
- [ ] T009 [P] Drizzle: add `savedActivities` table to `src/lib/db/schema.ts` + push
- [ ] T010 [US1] Save button on `src/components/ProviderCard` + activity detail page: guest → email modal (benefit copy) → magic link → resume via `ilali_intent` cookie → POST `/api/saved`
- [ ] T011 Create `/api/saved/route.ts` (GET list / POST save / DELETE unsave, session auth)
- [ ] T012 Create "Saved" list page for signed-in parents (e.g. `/saved/page.tsx` + nav link)
- [ ] T013 Contact/Enquire capture — same email-modal pattern on detail page contact CTA
- [ ] T014 "Notify me when booking opens" on full/closed listings → savedActivity + `notify-when-open` trigger
- [ ] T015 [US2] Extend `/api/onboarding/route.ts`: accept minimal child (name + age), relax optional fields; add "Who is this for?" step in save/book modal (reuse `ChildForm`-lite)
- [ ] T016 Tests: unit for `/api/saved` + onboarding minimal child; E2E guest-save journey

## Phase 3: Notification state machine
- [ ] T017 [P] Drizzle: add `notificationEvents` table to `src/lib/db/schema.ts` + push
- [ ] T018 Create `src/lib/notifications/index.ts`: `sendNotification(userId, type, payload)` — dedupe (one event per trigger), channel abstraction (email now / whatsapp flag), graceful skip, event row audit
- [ ] T019 Create `src/lib/mail/templates.ts`: welcome, saved, booking-confirmed, reminder-24h, review-nudge, provider-status, first-booking, digest-weekly, digest-monthly — warm human copy, context placeholders
- [ ] T020 Create `/api/cron/journeys/route.ts`: job switch (reminders-24h, digest-weekly, digest-monthly) + CRON_SECRET guard + `vercel.json` crons entry
- [ ] T021 Wire app-event triggers: booking confirmed (WhatsApp path hook), provider status change (admin approval route), first-booking
- [ ] T022 Extend `notificationPreferences` schema/UI: per-trigger toggles in account settings
- [ ] T023 Tests: trigger fires once; template renders with context; cron route auth

## Phase 4: Provider wizard + status tracker + magic-link approval
- [ ] T024 [P] Build 4-step wizard UI at `/providers/signup` (offer → details → photos/desc → live preview) with progress indicator; save/resume via application draft
- [ ] T025 Persist wizard steps to `providerApplications` (extend route `POST /api/providers/applications`; draft JSON column if needed)
- [ ] T026 Live preview step mirrors the real listing card (image, age range, price in Rands, badge)
- [ ] T027 Approval flow: replace temp-password welcome email with magic-link activation email (keep temp password as bulk-import fallback — WS-1 regression)
- [ ] T028 Status tracker pills on provider dashboard `src/app/(dashboard)/provider/page.tsx`: Draft → Submitted → Reviewing → Live + SLA copy
- [ ] T029 Status-change notifications (provider-status trigger) + first-booking trigger hook
- [ ] T030 Tests: wizard complete + resume; approved provider signs in via magic link; E2E

## Phase 5: Assitej/pricing config + copy alignment
- [ ] T031 [P] Drizzle: providers billing columns (`billingPlan`, `planFreeUntil`, `assitejExempt`) — Tier 2 push
- [ ] T032 Add `PRICING_*` env vars (provider monthly fee, trial days, commission %) — read in copy components; no hardcoded numbers
- [ ] T033 Copy alignment: `src/app/providers/signup/page.tsx`, `src/app/for-providers/page.tsx`, `src/app/help-centre/page.tsx`, `src/app/terms/page.tsx`, `src/app/providers/why-list/page.tsx` — one consistent structure (R99/mo, first 30 days free, 10% on online bookings)
- [ ] T034 Regression check: poster-import flow (`/admin/poster-import`) untouched

## Dependencies
T003, T004 depend on T001, T002. T010 depends on T009, T011. T015 depends on T011. T018 depends on T017. T021 depends on T018. T027 depends on T001. T028 depends on T024. T032/33 independent of earlier phases.

## Parallel Opportunities
T001/T002 (auth) parallel with T008/T009 (guest-first audit + schema). T017/T018 (notifications) parallel with T024 (wizard). T031/T032 (config) parallel with anything.

## MVP Scope
MVP = Phase 1 + 2 + 3 + 4 (launch-critical for Sept 1 Assitej: magic-link activation + wizard + status tracker + guest-first parent experience). Phase 5 ships the config/env + copy alignment (billing columns are Tier 2 provision — push them but collection infra stays deferred to WS-6).
