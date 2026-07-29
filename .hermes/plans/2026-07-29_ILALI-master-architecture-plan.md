# ILALI — Master Architecture & Production Plan

> **For Hermes:** Use spec-driven-development → plan → subagent-driven-development → gold-release-pipeline to execute.
> Each phase builds on the previous. No phase starts until the previous phase's verification gate passes.

**Goal:** Take ILALI from static mock-data website to a production-grade children's extramural marketplace with real data, auth, search, AI-powered provider onboarding, and dual-sided marketplace dynamics.

**Architecture:** Next.js 16 App Router front-end → Next.js API Routes → Drizzle ORM → Neon PostgreSQL. All on Vercel. AI provider onboarding via Hermes Agent patterns.

**Tech Stack:** Next.js 16.2.7, React 19.2.4, TypeScript 5, Tailwind CSS v4, Neon PostgreSQL, Drizzle ORM, Better Auth, Vercel (hosting), Brevo/Resend (email).

---

## Global Constraints

- All colors from `@theme inline` tokens in `globals.css` — no raw hex colors in components
- Price stored in cents (INT) — format in presentation layer
- Server Components by default — only use `"use client"` when interactivity requires it
- Path alias `@/*` maps to `./src/*`
- DB client MUST be lazy-initialized (Proxy pattern) — module-level DB init breaks Turbopack builds
- Environment variables MUST be documented in `.env.example` and plan's Technical Context table
- SA-specific validation: ID numbers (Luhn checksum), mobile prefixes (+27), address formats
- Pricing in Rands

---

## Phase 0: Foundation — Account Access & Infrastructure

**Gate:** Before any code, resolve account situation with George.

### Account Decision (Day 1)

George asked two questions:
1. Keep existing Vercel/Supabase projects or start fresh?
2. Use `tech@ilali.co` or Leroy's own account?

**Recommendation to George:**
- **Keep existing Vercel project** (preview.ilali.co is already deployed — no need to rebuild)
- **Switch infra to Leroy's account** — add `leroyadonis3@gmail.com` as owner on Vercel. Drop `tech@ilali.co` licence.
- **No Supabase** — replace with Neon PostgreSQL (serverless, free tier, auto-pauses)

### VPS Setup (If Needed)
- ILALI's backend is fully Vercel-native (Neon + Next.js API Routes)
- No VPS services needed unless we add a dedicated search index (Meilisearch) later
- Keep everything serverless for now

### Domain & DNS
- `preview.ilali.co` → Vercel DNS
- George manages `ilali.co` domain via Google Workspace
- Need to verify domain ownership in Vercel

---

## Phase 1: Constitution & Spec

**Output:**
- `.specify/memory/constitution.md` — ILALI's core principles
- `.specify/specs/ilali-mvp/spec.md` — full MVP spec

### Constitution Principles (Draft)

1. **Trust First** — Every provider must be background-checked. Trust badges must be visible. No unverified providers on the platform.
2. **Mobile-First** — Cape Town parents browse on phones. Every page must work at 375px. Forms must be thumb-friendly.
3. **Community-Powered Growth** — Referrals, WhatsApp group integration, school partnerships drive supply-side growth. AI reduces onboarding friction.
4. **Simplicity Over Features** — MVP = browse, search, contact provider. No booking/payment until traction proves demand.
5. **SA Context** — Pricing in Rands. Location-aware (Cape Town suburbs). Age-appropriate activity filtering.
6. **Zero Cost Customer Acquisition** — Growth through schools, WhatsApp groups, and word-of-mouth. No paid ads in MVP.

### MVP User Scenarios

**Scenario 1: Parent finding an activity**
- Browse by category → filter by age/location → view provider details → WhatsApp contact
- No booking/payment in MVP — just discovery + contact

**Scenario 2: Provider listing their service**
- Sign up via form → admin reviews → profile goes live
- AI-assisted: WhatsApp group posters can be auto-converted to profiles

**Scenario 3: School/Venue listing their space**
- Similar to provider flow but for venues
- Capacity, amenities, location

**Scenario 4: Admin reviewing applications**
- Approve/reject provider applications
- Manage categories
- View analytics

### Out of Scope (MVP)
- Online booking/payment
- Reviews (Phase 2)
- Provider dashboard
- Mobile app
- Real-time messaging
- Multiple languages
- Advanced search/ML recommendations

---

## Phase 2: Plan — Technical Implementation

**Output:** `.specify/specs/ilali-mvp/plan.md`

### Data Model

Based on existing `docs/backend-plan.md` with additions:

```
providers      → activities/services offered
venues         → spaces where activities happen
categories     → managed list of activity types
users          → parents, providers, admins (auth)
provider_applications → signup form submissions
referrals      → community referral submissions
reviews        → Phase 2
bookings       → Phase 2
```

### Migration Path

Per existing plan: swap `src/lib/constants.ts` imports for Drizzle queries in ~8 files. No UI changes needed.

### Implementation Phases

```
Phase 2.1: Neon DB setup + Drizzle schema + seed data
Phase 2.2: Convert activity/[slug] to DB-backed
Phase 2.3: Convert venues/[slug] to DB-backed
Phase 2.4: Convert browse/providers/venues lists to DB-backed
Phase 2.5: Wire up provider signup + referral forms (API routes)
Phase 2.6: Auth — Better Auth with Google OAuth
Phase 2.7: Search — full-text with Drizzle
Phase 2.8: AI provider onboarding (WhatsApp group → profile)
Phase 2.9: Admin dashboard
Phase 2.10: Production hardening + deploy
```

---

## Phase 3: Implementation — Subagent-Driven Development

**Tool:** Hermes `subagent-driven-development` skill

### Dispatch Pattern

Each phase = one `delegate_task` call with:
- The spec.md (what to build and why)
- The plan.md relevant section (how to build it)
- The constitution (principles to follow)
- Exact file paths and interfaces from previous phases

### Task Granularity

Per `plan` skill: each task = 2-5 minutes of focused work.
- "Create Drizzle schema file" = 1 task
- "Write seed data script" = 1 task  
- "Convert activity/[slug] to DB query" = 1 task
- "Write passing test" = 1 task

### Review Pattern

Per `subagent-driven-development`:
- Spec compliance review after each task
- Code quality review after spec passes
- Max 2 fix rounds per task before escalation
- Final broad review when phase completes

---

## Phase 4: Gold Release Pipeline

**Tool:** `gold-release-pipeline` skill — full pipeline for Bugfix/Feature releases

### Each Phase Release

| Pipeline Step | What It Does |
|---|---|
| **0: Setup & Scope** | SDD gate, design-by-doing, release branch, env check, type/lint/build pre-check |
| **1: Simplify Code** | Dispatch 3 review agents (reuse, quality, efficiency) |
| **2: Test Coverage** | TDD edge cases, expand tests, run full suite |
| **3: E2E Tests** | Playwright on key flows (browse, search, contact) |
| **4: Dogfood QA** | Browser click-through of all changed pages |
| **5: Code Review** | PR with self-review checklist |
| **6: Deploy** | Vercel production deploy + smoke test |
| **7: Release Notes** | Tag + summary |

### Release Cadence

- **Phase 2.1-2.4 (DB + data migration):** One release
- **Phase 2.5 (Forms):** One release  
- **Phase 2.6 (Auth):** One release (independent)
- **Phase 2.7 (Search):** One release
- **Phase 2.8 (AI onboarding):** One release (most complex)

---

## Phase 5: AI Provider Onboarding (The Secret Weapon)

This is George's priority and where your Hermes/KitFix experience pays off most.

### The Problem

George has WhatsApp groups ("Fun with Kids") where parents share activity posters. These posters contain: provider name, contact, activity type, location, age group, pricing.

Manually converting each poster into a provider profile = slow, error-prone, won't scale.

### The Solution

**Hermes-powered pipeline:**
1. Parent/teacher posts activity poster in WhatsApp group
2. Poster is forwarded to a dedicated ILALI WhatsApp number
3. Hermes vision analysis extracts: provider name, contact, activity type, location, age range, pricing
4. AI generates a draft provider profile with all fields filled
5. Admin reviews + approves in dashboard
6. Profile goes live

**Technical architecture:**
- Twilio WhatsApp API for incoming messages
- Hermes Agent (vision model) for poster → structured data extraction
- Admin dashboard for review/approval queue
- Auto-generated provider profile with background check request

### Implementation (Post-MVP)

This is Phase 2.8 and should be spec'd independently after the core platform is live.

---

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| George drags feet on account transfer | Blocked until resolved | Propose clear deadline in email |
| Vercel WAF blocks testing | Can't dogfood QA on deployed site | Test locally, deploy only when confident |
| Activity poster OCR quality low | Bad auto-generated profiles | Human-in-loop review (Factor 7 pattern) |
| Low provider signups | Empty marketplace | Community-driven referral program (George's strategy) |
| Neon free tier limits (256 MB) | Outgrown quickly | Upgrade to $19/m plan when close to limit |
| Parent adoption slow | No liquidity | Start with schools (trusted distribution channel) |

---

## Verification Gates

| Gate | How to Verify |
|---|---|
| Account access sorted | Can push to Vercel, DB connects |
| DB schema done | `drizzle-kit push` succeeds, seed data loads |
| Activity pages work | Visit `/activity/[slug]` — shows real DB data |
| Auth works | Sign up, sign in, session persists |
| Forms work | Submit provider signup, see in DB |
| Search works | Type query, get results |
| Build passes | `npm run build` clean |
| AI onboarding works | Send poster to WhatsApp, get draft profile |

---

## File Manifest

### Files to Create

```
.specify/memory/constitution.md
.specify/specs/ilali-mvp/spec.md
.specify/specs/ilali-mvp/plan.md
.specify/specs/ilali-mvp/tasks.md
src/lib/db/index.ts              — Lazy DB client (Proxy pattern)
src/lib/db/schema.ts              — Drizzle schema
src/lib/db/seed.ts                — Seed script
src/lib/db/queries.ts             — Reusable DB queries
src/lib/ai/provider-onboarding.ts — AI extraction pipeline
src/app/api/providers/apply/route.ts
src/app/api/referrals/route.ts
src/app/api/search/route.ts
.env.example
```

### Files to Modify

```
src/lib/constants.ts              — Keep as seed reference, reduce import usage
src/app/activity/[slug]/page.tsx  — DB lookup instead of constants.find
src/app/venues/[slug]/page.tsx    — DB lookup instead of constants.find
src/app/browse/page.tsx           — DB query instead of constants.providers
src/app/providers/page.tsx        — DB query instead of constants.providers
src/app/venues/page.tsx           — DB query instead of constants.venues
src/app/providers/signup/page.tsx — POST to API instead of alert()
src/app/providers/refer/page.tsx  — POST to API instead of alert()
```

### Files That Don't Change

All informational pages (/, /about, /how-it-works, /for-parents, /for-providers, /for-venues, /safeguarding, /safety-guidelines, /code-of-conduct, /privacy, /terms, /ubuntu-rewards, /provider-resources, /contact, /locations, /categories, /auth/*)

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|---|---|---|
| 0: Account access | 1-2 days | George responds |
| 1: Constitution + Spec | 1 day | None |
| 2.1: DB schema + seed | 2 days | Phase 0 |
| 2.2-2.4: Data migration | 3 days | Phase 2.1 |
| 2.5: Forms | 1 day | Phase 2.1 |
| 2.6: Auth | 2 days | Phase 2.1 |
| 2.7: Search | 1 day | Phase 2.2-2.4 |
| 2.8: AI onboarding | 3-4 days | Phase 2.1, 2.6 |
| 2.9: Admin dashboard | 2 days | Phase 2.1, 2.6 |
| 2.10: Production hardening | 1 day | All above |

**Total MVP:** ~16-19 working days from account access.
