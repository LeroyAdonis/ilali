# ILALI

Children's extramural activities marketplace for Cape Town, South Africa. Discover and book background-checked providers — sports, arts, music, holiday programs, and more.

**Site:** https://preview.ilali.co

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.2.7 (App Router) |
| Language | TypeScript 5 |
| UI | React 19.2.4, Tailwind CSS v4 |
| Icons | lucide-react |
| Font | Inter (@fontsource/inter) |
| Linter | ESLint 9 (flat config) |

## Data

All providers, venues, categories, and testimonials live in `src/lib/constants.ts` as static mock data. There is no backend, database, or authentication yet.

A migration plan is documented in `docs/backend-plan.md` — Neon PostgreSQL, Drizzle ORM, and Next.js API Routes.

## Commands

```sh
npm run dev       # dev server → localhost:3000
npm run build     # production build
npm run start     # serve production build
npm run lint      # ESLint
npx tsc --noEmit  # type-check (no script defined)
```

No test runner or CI is configured.

## Structure

```
src/
  app/           —  26 routes (App Router)
  components/    —  11 shared components
  lib/           —  types.ts, constants.ts
docs/
  backend-plan.md
```

- 4 client components: `Header`, `SearchBar`, `FilterBar`, `TestimonialCarousel`. Everything else is a server component.
- Dynamic routes: `activity/[slug]/page.tsx`, `venues/[slug]/page.tsx`. Both use `generateStaticParams()`.
- Auth pages (`/auth/signin`, `/auth/signup`) and provider forms (`/providers/signup`, `/providers/refer`) are UI-only placeholders.
- Path alias `@/*` maps to `./src/*`.

## Tailwind

Custom `@theme inline` tokens: `ilali-*` (teal, primary), `sunset-*` (orange), `warm-*` (yellow). Font: Inter.

## Deployment

Hosted on Vercel. Build output is `.next/` (gitignored).
