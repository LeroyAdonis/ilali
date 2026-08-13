# Feature Spec: Painless Journeys — Parent & Provider UX Simplification

**Date:** 2026-08-13
**Constitution:** [.specify/memory/constitution.md](../memory/constitution.md)
**Status:** Clarified (2026-08-13 — monetization decided: providers R99/mo + 10% commission, parents free; Assitej accommodation configurable — FR-12/FR-14)
**Grill session:** 10 questions, all recommendations approved by Leroy 2026-08-13
**Competitor reference:** ClassForKids (3-click booking, deferred registration), Sawyer (both-sides friction removal), Hoop (age-first discovery), KidPass (age 0-18), Bookwhen (provider self-onboard, free page in minutes)

---

## Vision Statement

A Cape Town parent opens ILALI on their phone with one question in mind: *"What should my kid do this weekend?"* — and gets an answer in under 30 seconds, **without ever being asked to create an account**. Browsing, searching, and AI-matching are completely open. The moment they do something meaningful — save an activity, message a provider, book a spot — ILALI quietly captures their email and sends a magic link: *"We'll keep you posted 👋"*. From then on, ILALI feels like a helpful village auntie: confirming bookings, reminding them the night before, nudging a review after, and surfacing *"new things for your 4-year-old near Claremont"* when they go quiet. Zero forms, zero friction, always in the loop.

On the other side, a provider (a dance teacher, a soccer coach, a holiday-programme organiser) opens ILALI, signs in with a magic link — **no temp passwords, ever** — and walks through a 4-step wizard with a live preview of what parents will see. They submit, see *"Under review — usually 24-48h"* with a status tracker, and when approved get a celebration email with their shareable link. The Assitej launch keeps the admin poster-import flow (George's explicit requirement) as the concierge path for providers who never self-serve.

The marketplace's job is removing friction on both sides: overload for parents, admin for providers.

---

## User Scenarios

### Scenario 1: Busy parent, first visit (guest-first)
**As a** parent of a 4-year-old and a 7-year-old
**I want to** find an activity near me this weekend without signing up
**So that** I get value on my first visit, before I commit anything

**Acceptance criteria:**
- [ ] The homepage and browse/search/map/AI-match pages are fully usable with NO account
- [ ] Age-appropriate filtering is visible and prominent on every discovery surface ("Ages 3-5, 6-8, 9-12, 13+")
- [ ] A parent can reach a provider's detail page and see price in Rands, location, age range, and trust badge within 3 taps on a 375px screen
- [ ] No signup prompt interrupts browsing (at most a dismissible banner)

### Scenario 2: Parent shows intent — email capture, magic link
**As a** parent who found a great holiday programme
**I want to** save it / message the provider with just my email
**So that** I stay in the loop without inventing a password

**Acceptance criteria:**
- [ ] Tapping "Save" or "Contact" on an activity prompts ONLY for email (+ name optional), then sends a magic link
- [ ] The prompt explains the benefit: "We'll keep you posted 👋 — new spots, reminders, nothing spammy"
- [ ] The saved activity appears in a "Saved" list once the link is clicked (persistent, not local-only)
- [ ] If the email already exists, the user is signed in without creating a duplicate account
- [ ] Password creation is optional and deferred (a "set a password" link in the account area)

### Scenario 3: Booking moment — child profile is born
**As a** parent booking a spot
**I want to** add "who this is for" in one step
**So that** my child profile is created at the moment it's needed, not during signup

**Acceptance criteria:**
- [ ] At booking/favouriting, the flow asks "Who is this for?" with the child's name + age only (interests/suburb/availability are optional, learned later)
- [ ] Previously added children appear as one-tap options
- [ ] A parent can add a second child in the same flow without friction

### Scenario 4: Parent is kept in the loop (notification state machine)
**As a** signed-up parent
**I want to** get stage-based updates
**So that** I never wonder whether my booking went through or what happens next

**Acceptance criteria:**
- [ ] The system sends each trigger once, at the right time: Welcome → Saved → Booking confirmed → 24h reminder → Post-activity review nudge → Monthly "new for your kids" digest
- [ ] Every notification is context-aware (mentions the actual activity, child name, provider, date/time)
- [ ] Notifications go out via email now; the send layer is an abstraction so WhatsApp can be plugged in when infra is ready (existing flag pattern)
- [ ] Parents can mute non-essential triggers from account settings without leaving the app
- [ ] All messaging copy is human and warm — no "Dear User", no robotic system voice

### Scenario 5: Provider self-onboards (wizard + magic link)
**As a** dance teacher who runs weekend classes
**I want to** list my activity in minutes with a guided wizard
**So that** I'm live without deciphering admin portals or temp passwords

**Acceptance criteria:**
- [ ] Provider signup asks for email first → magic link sign-in (NO password creation, NO temp password, NO claim code as the primary path)
- [ ] The wizard has exactly 4 steps: (1) What do you offer, (2) Details — price in Rands, ages, location/suburb, schedule, (3) Photos + description, (4) Live preview of the listing "what parents will see"
- [ ] A progress indicator is visible at all times; every step can be saved and resumed later
- [ ] Submit shows status tracker: Draft → Submitted → Reviewing → Live, with "usually reviewed within 24-48h"
- [ ] Approval delivers a celebration email: "You're live! 🎉 Here's your link to share" + onboarding checklist
- [ ] The poster-import admin flow (WS-7) is preserved unchanged as the concierge path — George's explicit requirement

### Scenario 6: Provider is kept in the loop
**As a** live provider
**I want to** know what's happening with my listing and bookings
**So that** I trust the platform and keep coming back

**Acceptance criteria:**
- [ ] Status changes (Submitted → Reviewing → Live) trigger a notification
- [ ] First booking/enquiry triggers a celebration + clear next steps
- [ ] Weekly digest: views, enquiries, bookings for the week (simple, no analytics overload)
- [ ] All provider comms point back to one dashboard (single source of truth)

---

## Functional Requirements

### FR-1: Guest-first discovery (zero-account browsing)
All discovery surfaces (home, browse, search, map, AI match, category pages) MUST be fully usable without authentication. Account prompts MUST NOT interrupt the first visit.

### FR-2: Email-first auth with magic links
New account creation is email + optional name → magic link. Password creation is deferred and optional. Better Auth magic-link capability is the mechanism. Email verification is implicit in the magic link (no separate "verify your email" step).

### FR-3: Intent-triggered capture
The ONLY places that ask for email are moments of intent: Save, Contact/Enquire, Book, Join club. Copy MUST explain the benefit of staying in the loop.

### FR-4: Deferred child profiles
Child profiles (childProfiles table exists) are created at the booking/favourite moment with minimal fields (name + age). Interests, suburb, availability are learned progressively (optional, never blocking).

### FR-5: One account, two doors
A single users table with role (parent/provider/admin — already exists). Separate entry points for parents and providers, but a parent can become a provider (or vice versa) without creating a second account.

### FR-6: Stage-based notification state machine
The notification system is defined as states, not ad-hoc emails:
- Parent: `welcome` → `saved` → `booking-confirmed` → `reminder-24h` → `review-nudge` → `digest-monthly`
- Provider: `status-change` → `first-booking` → `digest-weekly`
Each trigger: single send, context-aware, dismissable/mutable, human copy. Send layer is an abstraction (email now; WhatsApp via existing flag when infra ready).

### FR-7: Provider wizard onboarding
4-step wizard (offer → details → photos/description → live preview) with progress indicator, save-and-resume, and a dashboard status tracker (Draft → Submitted → Reviewing → Live).

### FR-8: No temp-password primary path
Provider account activation is magic-link based. Temp passwords and claim codes remain ONLY as a fallback for admin bulk import (Assitej cohort), never as the self-serve path.

### FR-9: Review SLA transparency
Provider application shows an explicit SLA ("usually reviewed within 24-48h") and every status change is communicated. Admin approval triggers the celebration email automatically.

### FR-10: Progressive verification (trust without friction)
New providers appear instantly as "Listed" (grey badge). "Verified" is an opt-in upgrade (document upload, existing flow). "Trusted" stays community-driven (vouches + reviews). Verification MUST NOT gate going live. ⚠️ See constitution note below.

### FR-11: Booking layering + no dead ends
- Today: WhatsApp CTA (wa.me, pre-filled) remains the booking action
- When Paystack is live (WS-6): 3-click online booking + waiting list ("join waiting list" when full)
- Until then: "Notify me when booking opens" captures interest so full listings never dead-end
- Waiting-list parents get an automatic invite when a spot opens (ClassForKids pattern)

### FR-12: Monetization decision (REQUIRED before launch) [NEEDS CLARIFICATION]
Website copy currently claims R99/month + 10% commission (for-providers, help-centre) and a "service fee on bookings" (terms). **Decision (Leroy, 2026-08-13):** match the website — **providers pay R99/month (first 30 days free) + 10% commission on online bookings; parents always free.** The 10% commission is only collectible once Paystack online booking is live (WS-6) — until then the effective charge is the R99 subscription. Copy across all pages (signup, for-providers, help-centre, terms, why-list) MUST state the same structure without stacking confusion, and the R99 figure MUST be env-configurable (stakeholder-flex: George/Assitej deal may override).

### FR-13: Admin poster-import preserved (George requirement)
The WS-7 poster-to-profile admin flow (`/admin/poster-import`) is kept as-is and is the concierge path for Assitej onboarding. It coexists with the provider self-serve wizard. Providers onboarded via poster still receive magic-link activation (replacing temp-password handoff where possible).

### FR-14: Assitej accommodation (configurable, when the time comes)
The pricing structure MUST accommodate Assitej-affiliated providers without code changes. The providers record carries plan fields (billingPlan / planFreeUntil / assitejExempt — Tier 2 provision), and George's deal terms are applied by flipping config, not by rebuilding. Provider-facing copy shows the free-trial framing ("first 30 days free") so Assitej onboarding is never blocked by the R99 figure.

---

## Non-Functional Requirements

### NFR-1: Performance
Every page in the parent journey loads < 2s on mobile 3G (constitution P3). No new heavy client bundles; magic-link + notification flows must not add measurable weight to discovery pages.

### NFR-2: Accessibility
WCAG 2.1 AA (constitution P6). Magic-link screens, wizard steps, and status tracker all keyboard-navigable and screen-reader friendly.

### NFR-3: Security
Magic links: single-use, short expiry, rate-limited. No plaintext emails/passwords in logs. Provider approval flow reuses existing admin gate. Child data (names/ages) handled with the same care as today.

### NFR-4: Mobile-first
375px-first for every new screen. Notifications preview correctly on mobile email clients. The wizard is fully usable on a phone (providers often onboard from their phone after a WhatsApp outreach).

---

## Visual / UX Direction

- **Warm, human, one-thing-at-a-time.** Every screen asks ONE question. The signup/wizard experience should feel like chatting with a helpful person, not filling a form. Progressive disclosure is the rule: show the minimum, reveal more as needed.
- **ILALI's voice in every notification** — copy that a village auntie would send: "Saved! We'll nudge you when spots open", "Reminder: Art Club tomorrow at 09:00 — bring a smock 🎨". No "Dear User".
- **Magic link screens** feel like a warm landing: logo, one sentence ("You're one tap away"), button ("Continue to ILALI"), and a reassuring fallback ("Didn't get the email? Resend").
- **Wizard:** teal progress indicator (4 dots or a thin bar), large friendly inputs, a live preview card on the final step that mirrors the real listing card (image, age range, price in Rands, badge).
- **Status tracker:** pill-based states (Draft grey → Submitted teal → Reviewing amber → Live green) — always visible on the provider dashboard.
- **Save/Contact prompt:** a small, friendly modal — never a full-page interruption. Benefit-first copy, email field, "Keep me posted" button.
- Design stack: Hallmark + Premium Design System + Frontend Design (mandatory per ILALI skill) when building.

---

## Key Entities

- Users (role: parent/provider/admin — exists)
- ChildProfiles (exists — creation moves from signup to intent moment)
- Providers / providerApplications (exists — status tracker adds visibility, not new tables)
- Notifications: new `notification_events` table (or reuse/extend notificationPreferences) — one row per triggered event for audit + dedupe
- Saved activities: new `savedActivities` (parent ↔ provider) — replaces local-only saves
- WaitingList (exists conceptually in clubMemberships? — new small table for booking waitlists when Paystack lands; Tier 2)

---

## MVP Scope Boundary (3-tier)

### Tier 1 — Ships in MVP
| Feature | What/Why |
|---|---|
| Guest-first discovery | Remove account requirement from all browse surfaces |
| Magic-link auth (email-first) | Replace password-first signup for parents AND providers |
| Intent-triggered email capture + Saved list | Save/Contact/Book → email → magic link → persistent saved items |
| Deferred child profiles | Child added at booking/favourite moment, minimal fields |
| Notification state machine (email) | welcome, saved, booking-confirmed, reminder, review-nudge, provider status-change, first-booking; monthly/weekly digests; abstraction layer for WhatsApp |
| Provider 4-step wizard + live preview | Self-serve onboarding with progress + preview |
| Provider status tracker + SLA copy | Draft → Submitted → Reviewing → Live, "24-48h" |
| Magic-link activation on approval (replaces temp-password primary path) | Bulk-import fallback stays |
| Poster-import admin flow preserved | George requirement — unchanged |

### Tier 2 — Architecture must accommodate (Coming soon placeholders)
| Feature | What/Why |
|---|---|
| Online booking + waiting lists (Paystack) | Booking CTA position reserved; waitingList table shape; "Notify me when booking opens" ships NOW so the funnel never dead-ends |
| WhatsApp notification delivery | send layer is an abstraction + flag from day one |
| Parent "become a provider" switch | users.role already supports it; UI placeholder on account page |
| Monetization billing hooks | providers table gains billingPlan / planFreeUntil / assitejExempt fields (nullable) — structure decided (FR-12/FR-14), collection deferred |
| Social login (Google) | Better Auth supports it; env-var ready, UI optional |

### Tier 3 — Truly deferred (backlog)
| Feature | When |
|---|---|
| Mobile app / push notifications | When PWA/mobile app exists (backlog #1, #7) |
| Full notification centre (read/unread, polling) | When daily active parents > 50 (backlog #12) |
| Provider analytics dashboard | When 10+ providers active (backlog #13) |
| i18n (isiXhosa, Afrikaans) | Phase 2 (constitution P6) |
| Provider team accounts, financial reporting | Backlog #14, #15 |

---

## Assumptions

1. **Monetization structure is DECIDED (Leroy, 2026-08-13):** parents free; providers pay R99/month (first 30 days free) + 10% commission on online bookings — matching the website. Billing/collection infrastructure is NOT built yet (Tier 2): the R99 subscription needs billing infra, the 10% commission needs Paystack online booking (WS-6). Until then, the structure lives in copy + schema provision, and collection starts when those land. Assitej terms are configurable (FR-14), not hardcoded.
2. Better Auth in this codebase supports the magic-link plugin (verify in plan phase; fallback: email-OTP).
3. Resend (WS-2) is the email send layer; it may be inactive until keys/domain are set — the notification state machine should degrade gracefully (log + dashboard, never crash).
4. Parents primarily discover on mobile; providers may onboard from a phone after WhatsApp outreach (Assitej).
5. **Constitution amendment RATIFIED (Leroy, 2026-08-13):** Principle 1 is amended to "progressive verification with clearly visible badges; nothing unlabelled" — providers appear instantly as Listed (grey), upgrade to Verified/Trusted via existing flows. Recorded in constitution.md governance notes.
6. Existing clubs, rewards, rides, community features are NOT touched by this spec — entry points and journeys only.

## Out of Scope (backlogged)

- [ ] Social login (Google/Apple) — Tier 2 placeholder, env-ready, not built
- [ ] Full notification centre with read/unread state — backlog #12
- [ ] Provider analytics dashboard — backlog #13
- [ ] Mobile app / push notifications — backlog #1, #7
- [ ] i18n (isiXhosa, Afrikaans) — Phase 2
- [ ] Paystack online booking + waiting list implementation — separate WS-6 spec; this spec only provisions the funnel (notify-me) and CTA position
- [ ] Billing/subscription infrastructure (collecting R99/commission) — structure decided (FR-12); collection deferred to Tier 2, revisit with WS-6
- [ ] Reviews system changes — existing, untouched
- [ ] Any change to clubs/community/rides/rewards feature sets

## Spec Quality Checklist

- [x] No implementation details (framework names only where they reference existing capabilities — acceptable in Assumptions)
- [x] Focused on user value and business needs
- [x] All mandatory sections completed
- [x] No [NEEDS CLARIFICATION] markers remain (FR-12 resolved 2026-08-13)
- [x] Requirements are testable and unambiguous
- [x] Acceptance criteria measurable and technology-agnostic
- [x] Edge cases identified (duplicate email, no contact number, full classes, dormant parents)
- [x] Scope clearly bounded (Out of Scope ≥ 3 items)
- [x] Dependencies and assumptions identified
- [x] Visual/UX direction concrete
