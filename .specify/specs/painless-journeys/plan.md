# Implementation Plan: Painless Journeys (Parent & Provider UX Simplify)

**Spec:** [spec.md](./spec.md)
**Constitution:** [../../memory/constitution.md](../../memory/constitution.md)
**Date:** 2026-08-13
**Status:** Ready — waiting on build kickoff

## Technical Context

| Dimension | Decision | Rationale |
|---|---|---|
| Frontend | Next.js 16 App Router + React 19 + Tailwind v4 (existing) | No new framework |
| Auth | Better Auth 1.6.25 — add `magicLink` plugin next to `emailAndPassword` | Email-first, password deferred; existing accounts unaffected; `sendMagicLinkEmail` wired to the existing Resend wrapper |
| Email | Existing `src/lib/mail/index.ts` (lazy, non-blocking Resend) — extend with journey templates | Never blocks the flow; degrades to log when keys/domain pending |
| DB | Neon Postgres + Drizzle (existing) — 2 new tables + providers billing columns (Tier 2) | savedActivities + notificationEvents; billing fields nullable |
| Scheduled sends | Vercel Cron → `/api/cron/journeys` (CRON_SECRET protected) | Digests + 24h reminders without new infra |
| Saved list | `savedActivities` table (persistent, cross-device) | localStorage rejected: doesn't feed the notification loop (FR-3) |
| WhatsApp | `sendNotification()` abstraction + existing flag pattern | Email now; WhatsApp when infra lands (backlog #28) |
| Deploy | Vercel, env vars in dashboard | Existing flow |

## Constitution Check

| Principle | Compliance |
|---|---|
| 1. Trust First (amended 2026-08-13) | Progressive verification — Listed grey instantly, badges visible. ✅ |
| 2. Warm Family Aesthetic | All new screens follow ilali teal/rounded/warm language; Hallmark+PDS+FD stack. ✅ |
| 3. Mobile-First CT Local | 375px-first; Rands; suburb-aware. ✅ |
| 4. Community-Powered Growth | Poster-import preserved (FR-13); magic links make WhatsApp outreach convert. ✅ |
| 5. MVP Simplicity | Journey work is mostly auth/UX, no new feature sprawl; Paystack explicitly deferred. ✅ |
| 6. SA Context & Accessibility | +27, Rands, WCAG AA; isiXhosa/Afrikaans Phase 2 (unchanged). ✅ |
| 7. Build-Then-Ship | Phased — each phase independently shippable before Sept 1 launch. ✅ |

## Research Summary

- **Magic link (better-auth 1.6.25):** `magicLink` plugin from `better-auth/plugins`. Requires a `sendMagicLinkEmail({ email, token, url }, request)` callback (we supply Resend). Uses the existing `authVerifications` table. `enableOnLinkSignup: true` auto-creates the user on first link click. Works alongside `emailAndPassword` — existing parents/providers with passwords are unaffected; a "set a password" path stays for those who want it. Fallback if the plugin misbehaves: `emailOTP` plugin (same UX shape).
- **Notifications:** No infra exists beyond the WS-2 Resend wrapper and `notificationPreferences` toggles. New `notificationEvents` table gives dedupe/audit ("sent once"), and triggers are fired by app events (booking confirmed, provider status change) + cron (reminder-24h, digests). The send layer is `sendNotification(userId, type, payload)` → resolves channel (email now) → inserts event row → non-blocking.
- **Save/intent capture:** Guest taps Save → modal asks email (+ optional name) → `authClient.signIn.magicLink({ email })` → after click, saved intent resumes via a `pendingIntent` cookie (e.g. `ilali_intent` = providerId) → POST `/api/saved`. Existing users: direct POST, no modal.
- **Child-at-intent:** `/api/onboarding` already accepts child profiles; extend to accept a single minimal child (name + age) and relax required fields (interests/suburb/availability optional — verify current validation, some may already be optional).
- **Provider wizard:** `providerApplications` table already holds application fields (WS-1/WS-4). Wizard = staged form persisting to the application row (or a draft JSON column if fields are incomplete), resume via token/magic link. Status tracker reads existing application status column; SLA copy is static text ("usually 24-48h") + status-change notifications.
- **Digests:** `vercel.json` (or next.config) `crons` config → `/api/cron/journeys?secret=CRON_SECRET` → daily job computes reminder-24h; weekly/monthly digests by schedule. Keep single route with job switch.

## Data Model

### New tables (Tier 1)
```
savedActivities
  id            serial PK
  parentId      int FK users.id (NOT NULL — account exists by save completion)
  providerId    int FK providers.id
  createdAt     timestamptz default now()
  UNIQUE(parentId, providerId)

notificationEvents
  id            serial PK
  userId        int FK users.id
  type          text        -- welcome|saved|booking-confirmed|reminder-24h|review-nudge|digest-monthly|provider-status|first-booking|digest-weekly
  channel       text        -- email|whatsapp (reserved)
  payload       jsonb       -- context: activity name, child name, date, link...
  status        text        -- pending|sent|failed|skipped
  scheduledFor  timestamptz null
  sentAt        timestamptz null
  createdAt     timestamptz default now()
```

### providers columns (Tier 2 provision — pushed with billing infra)
```
billingPlan    text default 'standard'      -- standard|assitej|custom
planFreeUntil  timestamptz null             -- 30-day trial end
assitejExempt  boolean default false
```

### Existing tables touched
```
notificationPreferences — extend toggle keys for new trigger types
users               — name nullable-ish for email-only capture (verify Better Auth allows)
```

## API Contracts

| Route | Method | Purpose | Auth |
|---|---|---|---|
| `/api/auth/magic-link/*` | POST | Better Auth magic-link send/verify (plugin) | — |
| `/api/saved` | GET/POST/DELETE | List / save / unsave activity | session (after link click) |
| `/api/onboarding` | POST | Accept minimal child (name+age) at intent; existing multi-child flow unchanged | session |
| `/api/cron/journeys` | GET | Job switch: reminders, digests | CRON_SECRET header/query |
| `/api/notifications/prefs` | PUT | Toggle per-trigger prefs | session |
| `/api/providers/applications` | POST | Wizard step persistence (extend existing) | session (magic link) |
| Admin approval route | (existing) | Fires provider-status + welcome/magic-link email on approve | admin |

## Implementation Phases

### Phase 1: Auth foundation (magic link, email-first)
- Add magicLink plugin to `src/lib/auth.ts` + `src/lib/auth-client.ts`; `sendMagicLinkEmail` via Resend wrapper
- Rework `/auth/signup` and `/auth/signin`: email-first (magic link), password optional/deferred ("set a password later" in account area)
- Welcome notification fires on first sign-in
- **Verify:** magic link round-trip on dev; existing password login still works; 145+ unit tests pass

### Phase 2: Guest-first + intent capture
- Remove account requirements from browse/search/map/AI surfaces (audit `auth-guard` usage)
- Save button on cards + detail: guest → email modal (benefit copy) → magic link → resume via `ilali_intent` cookie → POST `/api/saved`; "Saved" list page for signed-in parents
- Contact/Enquire capture (same pattern); "Notify me when booking opens" → savedActivity + trigger
- Child-at-intent: extend `/api/onboarding` minimal child (name + age); wire "Who is this for?" at save/book moment
- **Verify:** guest completes save with 2 fields; saved list persists cross-device; unit + E2E

### Phase 3: Notification state machine
- `notificationEvents` table + drizzle schema + push
- `sendNotification(userId, type, payload)` service with dedupe + graceful skip
- Templates (welcome, saved, booking-confirmed, reminder-24h, review-nudge, provider-status, first-booking, digests) — warm human copy, configurable in `src/lib/mail/templates.ts`
- Cron route `/api/cron/journeys` (reminders + weekly/monthly digests)
- Prefs UI in account settings (toggle per trigger)
- **Verify:** trigger fires once; template renders with context; cron job runs locally; tests

### Phase 4: Provider wizard + status tracker + magic-link approval
- 4-step wizard at `/providers/signup` (offer → details → photos/desc → live preview), progress bar, save/resume
- Approval flow: replace temp-password email with magic-link activation (temp password remains as bulk-import fallback, WS-1)
- Status tracker pills on provider dashboard (Draft → Submitted → Reviewing → Live) + SLA copy + status-change notifications
- **Verify:** wizard complete in one session AND resume path; approved provider signs in via magic link; E2E

### Phase 5: Assitej/pricing config + copy alignment
- providers billing columns (Tier 2 push) + `PRICING_*` env vars (R99 figure, trial days, commission %) — no hardcoded numbers
- Copy alignment: signup, for-providers, help-centre, terms, why-list — one consistent structure; free-trial framing
- Poster-import unchanged (FR-13 regression check)
- **Verify:** env change flips pricing copy; docs drift check passes

## Quickstart

```bash
cd /root/ilali
npm run dev              # :3001
npx drizzle-kit push     # after schema changes
npx vitest run           # unit (145+)
npx playwright test      # E2E
npm run build            # prod build
```

End-to-end validation:
1. Guest browses /browse without login → taps Save → email modal → magic link → saved item persists
2. Parent books (WhatsApp path) → booking-confirmed email → 24h reminder → review nudge
3. Provider signs up via magic link → wizard → submit → admin approves → magic-link activation email → live status → first-booking notification
4. Poster-import flow unchanged
