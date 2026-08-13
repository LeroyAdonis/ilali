# ILALI Constitution

**Ratified:** TBD
**Version:** 1.0.0
**Project:** Children's extramural activities marketplace for Cape Town
**Domain:** preview.ilali.co → ilali.co

---

## Principles

### 1. Trust First
Every provider listed MUST be background-checked. Trust badges (verified, background-checked, reviewed) MUST be visible on every provider card and detail page. No unverified providers appear in search results unless clearly labelled. Safety is the non-negotiable foundation — parents must feel confident leaving their children with any provider on the platform.

### 2. Warm Family Aesthetic
Teal primary (`ilali-*`) with sunset orange accent (`sunset-*`) — warm, approachable, premium but not corporate. Full-width hero imagery of happy kids doing activities. Rounded corners, friendly typography (Inter), generous whitespace. NOT dark and edgy — this is a family brand, not a sport brand. Light theme is default with dark mode as optional.

### 3. Mobile-First, Cape Town Local
375px-first design. Location-aware browsing by Cape Town suburb. Pricing in Rands. Age-appropriate activity filtering (3-5, 6-8, 9-12, 13+). School holiday alignment. Every page must load under 2s on mobile 3G.

### 4. Community-Powered Growth
Supply-side growth through school partnerships, WhatsApp group integration, and community referrals — NOT paid ads. AI-assisted provider onboarding (WhatsApp poster → auto-generated profile) is the core growth engine. The platform should feel like a village, not a marketplace.

### 5. MVP Simplicity
MVP = browse activities → filter → view provider → WhatsApp contact. NO online booking, NO payments, NO reviews (Phase 2). Every feature MUST prove demand before it's built. If it doesn't directly help a parent find an activity or a provider get listed, it's out of scope.

### 6. SA Context & Accessibility
WCAG 2.1 AA minimum. Content in English (isiXhosa and Afrikaans in Phase 2). SA ID number validation (Luhn checksum), +27 mobile prefix, Cape Town suburb dropdown. Providers with ECD certification, SAPS clearance, or First Aid training get priority placement and badges.

### 7. Build-Then-Ship Cadence
MVP ships within 4 weeks of account setup being completed. No perfectionism — ship working features, iterate. Front-end changes deploy instantly (Vercel preview → prod). DB schema changes require review before migration.

---

## Governance

- Amendments to this constitution require Leroy's approval
- Every spec references this constitution and must pass its gates
- "Should" = recommendation. "MUST" = non-negotiable
- If a principle conflicts with a user request, flag the conflict — don't silently violate the constitution

## Amendments

- **2026-08-13 (Leroy):** Principle 1 amended — "progressive verification with clearly visible badges; nothing unlabelled." Providers appear instantly as Listed (grey badge); Verified (docs) and Trusted (vouches + reviews) are opt-in upgrades. Rationale: instant supply with transparent trust tiers (painless-journeys spec FR-10).
- This constitution applies to ALL features, not just the MVP
