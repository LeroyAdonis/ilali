<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ILALI — Agent Guide

## Project identity

ILALI is a children's extramural activities marketplace for Cape Town, SA.
- URL: https://ilali.vercel.app (prod), https://preview.ilali.co (preview)
- Stack: Next.js 16.2.7 App Router, React 19.2.4, TypeScript 5, Tailwind CSS v4, lucide-react, @fontsource/inter
- Backend: Neon PostgreSQL + Drizzle ORM (21 tables), Better Auth
- AI: NVIDIA NIM `nvidia/nemotron-3-super-120b-a12b` (free, 40 RPM), fallback: DeepSeek
- E2E: Playwright (10 smoke tests), Unit: Vitest (48 tests)

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (localhost:3001) |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint (flat config: `eslint.config.mjs`) |
| `npx vitest run` | Unit tests (48 tests, 4 suites) |
| `npx playwright test` | E2E smoke tests (10 tests) |
| `npx tsc --noEmit` | Type-check |
| `npx drizzle-kit push` | Push schema changes to Neon DB |

## Architecture

- **30+ routes** in `src/app/` (App Router, file-based)
- **Path alias** — `@/*` maps to `./src/*`
- **Auth** — Better Auth (email/password). Admins: leroy@ilali.co, george@ilali.co / ilali-admin-2026
- **Proxy** — `src/proxy.ts` (Next.js 16 — not middleware.ts)
- **DB client** — `src/lib/db/index.ts` — lazy-init proxy (safe for Turbopack)

## Data flow

```
src/lib/data-source.ts → USE_MOCK toggle → mock or DB
  ├── USE_MOCK=true  → src/lib/mock/* (15 providers, 34 reviews, 25 parents, 51 children)
  └── USE_MOCK=false → src/lib/db/queries.ts → Neon PostgreSQL (Drizzle ORM)
```

Set `NEXT_PUBLIC_USE_MOCK=true` in `.env` to run without a DB connection.

## Database (21 tables)

| Table | Purpose |
|-------|---------|
| categories | Activity categories (managed, not user-creatable) |
| providers | Activity listings with location, pricing, tags |
| venues | Physical venues with amenities |
| venueAmenities | Amenity tags per venue |
| users | Auth users (parents, providers, admins) |
| authSessions | Better Auth sessions |
| authAccounts | Better Auth accounts (password hashes) |
| authVerifications | Better Auth email verifications |
| providerApplications | Provider signup applications |
| referrals | Provider referrals |
| reviews | Activity/venue reviews (supports providerId + venueId) |
| childProfiles | Parent's children — age, interests, availability, suburb |
| notificationPreferences | Opt-in notification toggles per user |
| providerVerifications | Document uploads + AI review for provider verification tiers |
| providerVouches | Community vouching from parents (3 needed for Trusted tier) |
| clubEvents | Club schedule — practices/games/events per provider |
| clubMemberships | Parents + children joined to a provider club (unique per provider+parent) |
| rideRequests | Carpool ride requests with two-sided parent confirmation |
| clubMessages | Club chat messages |
| rewardPoints | Rewards points ledger (action-based) |
| rewardRedemptions | Points redemption log |

## Key API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/match` | POST | AI natural language → provider matches |
| `/api/ai/chat-match` | POST | AI chat: extract query → match → explain (Phase 0) |
| `/api/ai/extract-provider` | POST | Free text → structured provider fields |
| `/api/ai/search-suggestions` | POST | Failed search → alternative category suggestions |
| `/api/onboarding` | POST | Parent onboarding: create child profiles + notification prefs |
| `/api/onboard` | POST | Email poster onboarding (WhatsApp substitute, Phase 0) |
| `/api/providers/verify` | POST | Provider document upload for verification |
| `/api/admin/applications` | GET | List provider applications (admin) |
| `/api/admin/applications/[id]` | POST | Approve/reject applications (admin) |
| `/api/admin/providers` | GET/POST | Manage providers (admin) |
| `/api/admin/providers/[id]` | DELETE | Delete provider (admin) |

## Verification Tiers

| Tier | Requirements | Badge |
|------|-------------|-------|
| 🥉 Listed | Self-registered or AI-onboarded | Grey |
| 🥈 Verified | Approved verification docs | Teal (ilali-600) |
| 🥇 Trusted | Verified + 3+ parent vouches + 5+ reviews | Gold |

## Tailwind CSS v4

Uses `@tailwindcss/postcss` with `@theme inline` custom tokens:
- `ilali-50` through `ilali-900` (teal palette, primary brand color)
- `sunset-50` through `sunset-600` (orange accent)
- `warm-50` through `warm-500` (yellow)
Font family: `"Inter", ui-sans-serif, system-ui, sans-serif` via `@fontsource/inter`.

## Quirks

- Dev server on port 3001 (KitFix occupies 3000)
- Nemotron wraps JSON in ```json``` blocks — always clean with `.replace()` before parsing
- `useSearchParams()` requires `<Suspense>` wrapper in Next.js 16
- Better Auth admin sign-out must use client-side `signOut()`, not `<form method="POST">`
- Server-side fetch to self must check `NEXT_PUBLIC_APP_URL` not just `NEXT_PUBLIC_SITE_URL`
- `searchParams` is an async Promise in Next.js 16 page props
- DB client is lazy-init proxy — no module-level `DATABASE_URL` check
- `vercel env pull` may leave critical vars empty — use `vercel env add` for explicit values
