# Main Navigation — Parent & Provider Entries

**Status:** Clarified (2026-08-13)
**Branch:** main
**Related:** ilali-mvp FR-8 (static pages), parent-profile FR-9 (profile settings), provider-portal FR-5 (dashboard)

## Problem

1. The **For Parents** (`/for-parents`) and **For Providers** (`/for-providers`) information pages exist as routes (MVP FR-8) but are **not reachable from the main menu** — they only appear in the Footer. New parents/providers can't find the two audience-specific entry points from the header.
2. Signed-in **profile links** exist only as role-conditional accent pills ("🏠 Parent" → `/home`, "📋 Provider" → `/provider`) whose labels don't communicate that they're profile/dashboard entry points.
3. The desktop nav (6 links + search + auth) is already near the 1024px breakpoint limit; **adding 2 flat links overflows** the header at md–lg widths (768–1279px).

## Goals

- Both audience info pages reachable from the main menu (desktop + mobile).
- Signed-in parents and providers have obvious profile/dashboard entries in the nav.
- Nav stays uncluttered and doesn't overflow at any supported breakpoint.

## FRs

### FR-1: "For Parents" info link in main menu
**Must:** `/for-parents` reachable from the header nav — desktop and mobile. Label: **For Parents**.
**Acceptance:** Clicking from the header lands on the For Parents guide page. Visible to signed-out and signed-in users.

### FR-2: "For Providers" info link in main menu
**Must:** `/for-providers` reachable from the header nav — desktop and mobile. Label: **For Providers**.
**Acceptance:** Clicking from the header lands on the For Providers listing page (with pricing + signup CTA). Visible to all users.

### FR-3: Parent profile entry for signed-in parents
**Must:** signed-in parent sees a nav entry labeled **Parent Profile** → `/home` (dashboard incl. ProfileSettingsPanel).
**Acceptance:** role `parent` → entry visible in desktop nav and mobile menu; role `provider`/`admin`/guest → not shown. Replaces the current "🏠 Parent" pill label.

### FR-4: Provider profile entry for signed-in providers
**Must:** signed-in provider sees a nav entry labeled **Provider Portal** → `/provider` (dashboard incl. listing edit).
**Acceptance:** role `provider` → entry visible in desktop nav and mobile menu; other roles → not shown. Replaces the current "📋 Provider" pill label.

### FR-5: Keep /browse in the nav (catalog hub)
**Decision (2026-08-13, Leroy query):** `/browse` stays. The landing page (`/`) is marketing-only — no provider grid, no filters. `/browse` is the canonical filtered catalog that search, categories, and map all funnel into. Removing it from the nav would orphan the catalog behind search.
**Acceptance:** "Browse" remains a top-level nav link.

### FR-6: Desktop nav fits 768–1440px without overflow
**Must:** top-level desktop nav = **Browse, Map, Categories, Community, Rewards, More ▾**. The **More** dropdown holds **How It Works, For Parents, For Providers, Contact** (single nav-architecture change that absorbs the 2 new links without overflow).
**Acceptance:** no horizontal scroll/overflow at 768, 1024, 1280, 1440px; dropdown opens on click, closes on outside-click and Esc; `aria-expanded` toggles; mobile menu lists all nav items flat (incl. the new two).

## Out of scope

- Active/current-page nav highlight styling (no aria-current today; backlog candidate).
- New profile routes — parent profile = `/home`, provider profile = `/provider` (existing).
- Removing the `/browse` route itself.
- Footer changes (already has For Parents / For Providers).

## Verification

- `npx tsc --noEmit` clean; `npx vitest run` green; `npm run build` clean.
- Manual QA: 375px mobile menu shows all links incl. For Parents/For Providers; 768/1024px desktop nav no overflow; More dropdown opens/closes correctly; role pills show correct label per role.
