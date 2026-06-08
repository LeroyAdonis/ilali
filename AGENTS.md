<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ILALI — Agent Guide

## Project identity

ILALI is a children's extramural activities marketplace for Cape Town, SA.
- URL: https://preview.ilali.co
- Stack: Next.js 16.2.7 App Router, React 19.2.4, TypeScript 5, Tailwind CSS v4, lucide-react, @fontsource/inter
- All data is static mock data in `src/lib/constants.ts` — no backend, database, or auth yet.
- Backend migration plan (Neon + Drizzle + Next.js API Routes) documented in `docs/backend-plan.md`.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (localhost:3000) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint (flat config: `eslint.config.mjs`) |

No test runner, typecheck script, CI/CD, or pre-commit hooks configured.

## Architecture

- **26 routes** in `src/app/` (App Router, file-based). All server components by default.
- **`"use client"` files** — only `Header.tsx`, `SearchBar.tsx`, `FilterBar.tsx`, `TestimonialCarousel.tsx`.
- **Dynamic routes** — `activity/[slug]/page.tsx` and `venues/[slug]/page.tsx`. Both use `generateStaticParams()`.
- **Path alias** — `@/*` maps to `./src/*` (configured in `tsconfig.json`).
- **Shared components** — 11 files in `src/components/`. All page layouts wrap `Header` / `<main className="flex-1">` / `Footer`.
- **Auth pages** (`/auth/signin`, `/auth/signup`) are UI-only placeholders with no form submission logic.
- **Forms** (`/providers/signup`, `/providers/refer`) also placeholder — no actual submission.

## Tailwind CSS v4

Uses `@tailwindcss/postcss` (v4-specific PostCSS plugin) with `@theme inline` custom tokens:
- `ilali-50` through `ilali-900` (teal palette, primary brand color)
- `sunset-50` through `sunset-600` (orange accent)
- `warm-50` through `warm-500` (yellow)
Font family: `"Inter", ui-sans-serif, system-ui, sans-serif` via `@fontsource/inter`.

## Data flow

```
src/lib/constants.ts → Server Components (direct import, synchronous)
```

All provider, venue, category, and testimonial data lives in `constants.ts`. Future migration per `docs/backend-plan.md` will replace these with Drizzle ORM queries against Neon PostgreSQL — no UI changes needed, only data source swaps in ~8 files.

## Quirks

- `eslint.config.mjs` uses the new ESLint flat config format (not `.eslintrc.*`).
- No `.env` files exist (`.env*` is gitignored).
- No typecheck npm script — run `npx tsc --noEmit` to type-check manually.
- Build output goes to `.next/` (gitignored). No `opencode.json` in this repo.
