# Feature Spec: Launch UX Polish (pre-Assitej onboarding)

**Date:** 2026-08-18
**Constitution:** `.specify/memory/constitution.md`
**Status:** Clarified (from Playwright UX audit 2026-08-18 — evidence-backed)
**Source:** Combined parent (7.7/10) + provider (~7/10) journey audits with screenshots at `/tmp/ux-audit/`

## Vision Statement

A non-tech-savvy parent should find an activity for their child in under 30 seconds
without needing to know URL parameters. A non-tech-savvy provider should understand
exactly what listing costs them (effort + info) BEFORE committing their email. No
dead-ends, no jargon, no "did it work?" moments. The platform should feel like a
helpful village auntie, not a software product.

## User Scenarios

### Scenario 1: Sarah, mom of a 7-year-old (non-tech-savvy)
**As a** parent in Cape Town
**I want to** filter activities by my child's age group with a visible tap
**So that** I don't have to guess search terms or know URL tricks

**Acceptance criteria:**
- [ ] Age-group pill selector (0-3, 4-7, 8-12, 13+) is VISIBLE on the browse page
  without scrolling or opening a dropdown
- [ ] Tapping "4-7" filters the results to that age band via `?age=` param
- [ ] The selected pill is visually distinct (active state)
- [ ] Works at 375px mobile width

### Scenario 2: Sarah saves an activity as a guest
**As a** guest parent
**I want to** see confirmation that the save worked after entering my email
**So that** I trust the action completed

**Acceptance criteria:**
- [ ] After the magic-link intent capture, the Save button reflects a "Saved" state
  (or a toast confirms) — the parent is not left wondering "did it work?"
- [ ] State persists for the session (cookie-backed, same as intent)

### Scenario 3: Thabo, dance studio owner (non-tech-savvy)
**As a** potential provider
**I want to** see what information listing will ask for BEFORE I give my email
**So that** I can evaluate the commitment without being forced to sign up first

**Acceptance criteria:**
- [ ] A collapsible "What you'll need" preview (or step list) is visible on the
  signup entry page WITHOUT requiring email first
- [ ] The preview lists the 4 wizard steps in plain language (no jargon)
- [ ] The email gate still works as the primary path — preview is additive

### Scenario 4: Thabo lands on /provider while signed out
**As a** signed-out visitor who typed a provider URL
**I want to** see context about the provider dashboard + a clear "New here?" path
**So that** I don't hit a generic sign-in wall

**Acceptance criteria:**
- [ ] `/provider` while signed out shows provider-dashboard context ("Manage your
  activity listings") instead of a bare "Welcome back"
- [ ] A "New here? List your activity" CTA is visible
- [ ] Sign-in still works for existing providers

### Scenario 5: Sarah's first-time sign-in
**As a** first-time visitor who clicked "Sign in"
**I want to** not be confused by "Welcome back" (I was never here before)
**So that** I don't think I have an account already

**Acceptance criteria:**
- [ ] Signin page copy distinguishes first-time vs returning users, or uses neutral
  copy that works for both (e.g. "Sign in or create your account")
- [ ] No dead-end for first-timers

## Functional Requirements

### FR-1: Visible age filter (parent P1 — HIGH)
Browse page shows age-group pills (0-3, 4-7, 8-12, 13+) inline in the filter bar,
mapped to the existing `?age=` query param. Current gap: age filtering exists in the
URL but has NO visible UI (audit evidence: agent had to know `?age=4-7` trick).

### FR-2: Post-save confirmation state (parent P2 — MEDIUM)
After guest intent capture completes, the Save button reflects saved state (or a
toast fires). Current gap: modal closes, button stays "Save", parent wonders if it
worked (audit: "no visible confirmation — she might not trust that it worked").

### FR-3: CTA clarity on homepage (parent P2 — MEDIUM)
Primary hero CTA "Enter ILALI" → "Browse Activities" (or "Find Activities for My
Kids"). "Enter" sounds like entering a building. Secondary CTA stays.

### FR-4: Provider "what you'll need" preview (provider P1 — HIGH)
Collapsible preview of the 4-step wizard content available BEFORE the email gate.
Current gap: provider must give email to evaluate the commitment (audit: "biggest
drop-off risk").

### FR-5: Provider dashboard context for signed-out users (provider P2 — MEDIUM)
`/provider` signed-out shows dashboard context + "New here?" CTA instead of bare
sign-in redirect. Current gap: generic "Welcome back" wall with zero context
(audit: "they hit a wall").

### FR-6: Photo field clarity (provider P2 — MEDIUM)
"Photo URL" field in the wizard gets a file-upload alternative OR clearer
optional/subtext ("optional — skip if you don't have one online"). Current gap:
non-tech-savvy providers don't have hosted photos (audit evidence).

### FR-7: Signin copy — first-time friendly (parent P3 — LOW)
Signin page "Welcome back" → neutral copy that doesn't assume a prior visit.

### FR-8 (BUG): Fix React hydration mismatch on club page (MEDIUM)
`src/components/community/RideRequest.tsx:553` throws a hydration mismatch on
`/clubs/[slug]` (observed in dev server log during audit: auth-prompt `<Link>` renders
differently server vs client). Fix the conditional rendering to match between
server and client (guard the signed-in check properly).

## Non-Functional Requirements

### NFR-1: Performance
Age filter + save-state changes MUST NOT add measurable load (client-side only,
no new API round-trips for FR-1/FR-2/FR-3).

### NFR-2: Accessibility
Age pills MUST be keyboard-navigable and have proper aria-pressed state. WCAG 2.1 AA
per constitution Principle 6.

### NFR-3: Mobile
All new UI MUST work at 375px (constitution Principle 3).

## Visual/UX Direction

Follow the existing ILALI warm family aesthetic (teal `ilali-*`, sunset accents).
Age pills: rounded-full pill buttons matching the FilterBar's existing dropdown
styling — selected = ilali-500 fill, unselected = white border ink/10. The "What
you'll need" preview uses the same card style as the wizard's review step (live
preview card already in the product). Copy tone: "village auntie" — warm, plain,
no jargon. "What you'll need" items should be phrased like a helpful checklist:
"What activity is it? / Where and when? / A photo (optional) / Your prices".

## Assumptions

- The existing `?age=` param already filters correctly server-side (audit confirmed
  `?age=4-7` works) — FR-1 is purely UI wiring, not new filtering logic.
- Intent cookie (`ilali_intent`, 10-min TTL) is the session store for guest saves;
  FR-2 should reuse it rather than add new storage.
- All changes are client-component UI + copy — no schema, no DB, no new API routes
  (except possibly a tiny upload endpoint for FR-6 if file upload is chosen).
- Assitej onboarding (launch) is targeted for early Sept — this polish is the
  pre-launch quality gate.

## Out of Scope

- **Online booking / payments** — separate WS-6 spec (Tier 3).
- **Full provider wizard redesign** — only the preview + photo field change here;
  the 4-step flow itself is already good (autosave praised in audit).
- **New age-filtering logic** — filtering works; only the UI is missing.
- **i18n (isiXhosa/Afrikaans)** — Phase 2 per constitution.
- **Review system UI** — Phase 2 per constitution.
- **Email delivery changes** (Resend/WhatsApp) — untouched.

## Backlog Additions (out-of-scope → backlog.md)

| Item | Trigger | Effort |
|---|---|---|
| Online booking + payments (WS-6) | Post-launch | L |
| Provider photo file-upload infrastructure | If FR-6 chooses URL-only for MVP | M |
| i18n | Post-launch | L |
| Reviews UI | Post-launch | M |
