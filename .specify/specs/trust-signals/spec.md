# Feature Spec: Trust & Safety Signals

**Date:** 2026-08-03
**Status:** Draft

## Vision Statement

Instead of a decorative stamp competing with hero images, ILALI's trust promise should live where users make decisions — in the browsing experience and on the landing page. A clean, credible, transparent trust bar that says "every provider on this platform is vetted" without needing a rubber stamp.

## Where Trust Lives Today

| Location | Current trust signal | Status |
|---|---|---|
| Provider cards | VerificationBadge (Listed/Verified/Trusted) | ✅ Working, could be more prominent |
| Activity detail | VerificationBadge | ✅ Working |
| Footer | Safeguarding, Code of Conduct, Safety links | ✅ Present |
| Landing page | VETTED stamp (removed) | ❌ Missing |
| Browse/Search | Nothing | ❌ Missing |
| Club pages | Nothing | ❌ Missing |

## The Replacements

### 1. Trust Bar on Landing Page (`/`)

A clean horizontal bar on the homepage, between the hero and the feature sections:

```
┌──────────────────────────────────────────────────────────────┐
│  🛡️ Every provider is background-checked                     │
│     Police clearance verified · ID confirmed · Ongoing review │
│                                          [Learn more →]      │
└──────────────────────────────────────────────────────────────┘
```

- Subtle `bg-paper-warm` background, no border, simple text
- Shield emoji or SVG icon (not a loud stamp)
- Three bullet points of what vetting means
- Link to `/safeguarding`
- This replaces the removed VETTED stamp — same message, better location

### 2. Trust Badge on Browse/Results

A subtle banner above the provider grid on browse and category pages:

```
Showing 6 activities · ⚡ All providers are background-checked
```

- Small, text-only, `text-xs text-ink-faint`
- Appears above the results count line
- Not a feature — just quiet reassurance while browsing

### 3. Enhanced VerificationBadge on Provider Cards

Make the existing VerificationBadge slightly more visible:
- Currently: small text badge inline with provider name
- Update: keep position but increase contrast — add a subtle border ring on Verified/Trusted cards
- Trusted tier: gold left-border accent on the card itself (already partially done via accentColor)

### 4. Trust Signal on Club Pages

Add the provider's verification tier to the club sidebar:

```
┌──────────────────────────┐
│  Community               │
│  4 member families       │
│  ...                     │
├──────────────────────────┤
│  🛡️ Trusted Provider     │   ← NEW
│  Verified + vouched      │
│  by 3+ parents           │
└──────────────────────────┘
```

- Simple card in the club sidebar
- Shows the provider's tier with explanation
- Links to `/safeguarding`

## Key Design Principles

- **Quiet confidence, not loud stamps** — credibility doesn't need a rubber stamp
- **Data-backed** — the trust signal is powered by real verification data, not marketing copy
- **Where decisions happen** — browsing results, provider profiles, club pages — not hero images
- **Consistent** — same shield icon, same language, same trust promise across all touchpoints

## Out of Scope

- Redesigning the full verification system (tiers, vouching, documents)
- Trust signals on mobile app (web only)
- Provider-specific trust pages (single safeguarding page covers all)
- Trust score / numeric rating for providers beyond tier badges
