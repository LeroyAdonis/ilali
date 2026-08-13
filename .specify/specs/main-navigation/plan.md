# Plan: Main Navigation — Parent & Provider Entries

## Approach

Single source of truth stays `src/lib/constants.ts` (`navLinks`). The Header (`src/components/Header.tsx`) gains a small **More** dropdown for desktop; the mobile menu already renders `navLinks` flat, so the two new links appear there automatically. Role pills get relabelled per FR-3/FR-4.

## Changes

| File | Change |
|---|---|
| `src/lib/constants.ts` | Add `{ label: "For Parents", href: "/for-parents" }` and `{ label: "For Providers", href: "/for-providers" }` to `navLinks` (mobile + dropdown source) |
| `src/components/Header.tsx` | Desktop nav: top-level = first 5 links + "More ▾" dropdown (How It Works, For Parents, For Providers, Contact). Dropdown: click toggle, outside-click + Esc close, `aria-expanded`. Relabel role pills → "Parent Profile" (`/home`) / "Provider Portal" (`/provider`) |

## No DB / schema / API changes

Pure UI + constants. No migrations, no new routes (pages exist).

## Risks

- Dropdown focus/a11y — keep minimal: click-outside + Esc + aria-expanded; no full arrow-key menu (documented, acceptable).
- Overflow at 768px — top-level drops to 5 links + More, so strictly fewer top-level items than today.
