# ILALI — Backend Plan

## Overview

The front-end is fully built with 39 static routes and mock data from `src/lib/constants.ts`. This plan outlines how to replace the static mock data with a real backend — keeping the front-end exactly as-is, just swapping data sources.

## Architecture

```
ILALI Front-end (Next.js 16 — Vercel)
       │
       ├── Server Components (RSC) fetch data at build/render time
       ├── API Routes (Next.js `/api/*`) handle form submissions
       └── External Backend (optional — Node/Go/Python — any host)
```

**Recommended Approach:** Next.js API Routes + Neon PostgreSQL (serverless) — same pattern as NoZar. No separate backend server needed.

---

## Phase 1: Database Schema (Neon PostgreSQL + Drizzle)

### Tables

```sql
-- Providers (activity providers/businesses)
providers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,              -- activity name (e.g. "Creative Art Workshop")
  slug          TEXT NOT NULL UNIQUE,       -- URL slug (e.g. "creative-art-workshop")
  category      TEXT NOT NULL,              -- FK to categories
  description   TEXT NOT NULL,
  provider_name TEXT NOT NULL,              -- business name (e.g. "Art Studio Cape Town")
  location      TEXT NOT NULL,
  lat           DECIMAL(10,7),
  lng           DECIMAL(10,7),
  age_min       INT NOT NULL,
  age_max       INT NOT NULL,
  rating        DECIMAL(2,1) DEFAULT 0,
  review_count  INT DEFAULT 0,
  price_value   INT NOT NULL,               -- in cents (R25000 = R250)
  price_label   TEXT DEFAULT 'per session',
  image_url     TEXT,
  featured      BOOLEAN DEFAULT false,
  is_free       BOOLEAN DEFAULT false,
  verified      BOOLEAN DEFAULT false,      -- background check passed
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
)

-- Venues
venues (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  type          TEXT NOT NULL,              -- 'studio', 'hall', 'outdoor'
  location      TEXT NOT NULL,
  lat           DECIMAL(10,7),
  lng           DECIMAL(10,7),
  rating        DECIMAL(2,1) DEFAULT 0,
  review_count  INT DEFAULT 0,
  capacity      INT,
  image_url     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
)

-- Venue amenities (many-to-many)
venue_amenities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id      UUID REFERENCES venues(id) ON DELETE CASCADE,
  amenity       TEXT NOT NULL               -- e.g. "WiFi", "Parking", "Chairs"
)

-- Categories (managed, not user-creatable)
categories (
  id            TEXT PRIMARY KEY,            -- slug as PK (e.g. "arts-culture")
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  icon          TEXT NOT NULL,              -- emoji
  color         TEXT NOT NULL               -- tailwind classes
)

-- Users (auth)
users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT,
  email         TEXT UNIQUE,
  phone         TEXT,
  role          TEXT DEFAULT 'parent',      -- 'parent', 'provider', 'admin'
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
)

-- Provider registrations (from /providers/signup form)
provider_applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL,
  phone         TEXT,
  activity_type TEXT NOT NULL,
  status        TEXT DEFAULT 'pending',     -- 'pending', 'contacted', 'approved', 'rejected'
  created_at    TIMESTAMPTZ DEFAULT NOW()
)

-- Referrals (from /providers/refer form)
referrals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_name TEXT NOT NULL,
  referrer_email TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  provider_email TEXT NOT NULL,
  provider_phone TEXT,
  status        TEXT DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT NOW()
)

-- Reviews
reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id   UUID REFERENCES providers(id) ON DELETE CASCADE,
  venue_id      UUID REFERENCES venues(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id),
  rating        INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
)
```

---

## Phase 2: Data Flow

### Current (static mock data)
```
src/lib/constants.ts → Server Components render directly
```

### Future (database-backed)
```
Neon PostgreSQL → Drizzle ORM → Next.js Server Components (async) → Same UI
```

**Migration pattern** — one file change per data type:

| File | Current | Future |
|------|---------|--------|
| `src/app/browse/page.tsx` | `import { providers } from "@/lib/constants"` | `import { getProviders } from "@/lib/db"` |
| `src/app/providers/page.tsx` | Same | Same |
| `src/app/activity/[slug]/page.tsx` | `providers.find(p => p.slug === slug)` | `getProviderBySlug(slug)` |
| `src/app/venues/[slug]/page.tsx` | `venues.find(v => v.slug === slug)` | `getVenueBySlug(slug)` |
| `src/app/providers/signup/page.tsx` | Form → alert() | Form → POST /api/providers/apply |
| `src/app/providers/refer/page.tsx` | Form → alert() | Form → POST /api/referrals |

### Example: Converting activity/[slug] to DB

```typescript
// Current (constants.ts):
const provider = providers.find(p => p.slug === params.slug);

// Future (db.ts):
import { db } from "./db.server";
import { providers } from "./schema";
import { eq } from "drizzle-orm";

export async function getProviderBySlug(slug: string) {
  const [provider] = await db
    .select()
    .from(providers)
    .where(eq(providers.slug, slug))
    .limit(1);
  return provider;
}
```

---

## Phase 3: API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/providers/apply` | POST | Submit provider signup form |
| `/api/referrals` | POST | Submit referral form |
| `/api/contact` | POST | Submit contact form |
| `/api/auth/*` | Various | Authentication (Better Auth) |
| `/api/search` | GET | Search activities (query params) |
| `/api/providers` | GET | List providers (with filters) |
| `/api/venues` | GET | List venues (with filters) |

---

## Phase 4: Tech Stack Recommendations

| Layer | Choice | Why |
|-------|--------|-----|
| Database | **Neon PostgreSQL** (serverless) | Free tier, auto-pauses, integrates with Vercel |
| ORM | **Drizzle** | Already proven in NoZar, type-safe, fast |
| Auth | **Better Auth** | Same setup as NoZar, Google OAuth + email/password |
| Forms | React Server Actions | No separate API endpoints needed for simple forms |
| File uploads | **Vercel Blob** | For provider/venue images |
| Hosting | **Vercel** (already deployed) | Same front-end, no extra infra |
| Email | **Brevo** or **Resend** | For verification emails and notifications |

---

## Phase 5: Implementation Order

1. **Set up Neon DB + Drizzle** — schema, migrations, db connection
2. **Seed data** — migrate all current mock data from `constants.ts` into the DB
3. **Convert `activity/[slug]`** — replace constants lookup with DB query
4. **Convert `venues/[slug]`** — same pattern
5. **Convert browse/providers pages** — replace list queries with DB
6. **Wire up forms** — `/providers/signup`, `/providers/refer`, `/contact`
7. **Add auth** — Better Auth for user accounts
8. **Add search** — full-text search across providers/venues
9. **Deploy** — update env vars and deploy

---

## Files That Don't Change

These pages are purely informational and stay as-is (static HTML, no backend needed):

- `/`, `/about`, `/how-it-works`, `/for-parents`, `/for-providers`, `/for-venues`
- `/safeguarding`, `/safety-guidelines`, `/code-of-conduct`
- `/privacy`, `/terms`, `/ubuntu-rewards`, `/provider-resources`
- `/auth/signin`, `/auth/signup` (visual only — auth handled by Better Auth)
- `/contact`, `/locations`
- `/categories`

## Files That Change (one-by-one, no refactor needed)

```
src/app/activity/[slug]/page.tsx     → DB lookup instead of constants.find
src/app/venues/[slug]/page.tsx       → DB lookup instead of constants.find
src/app/browse/page.tsx              → DB query instead of constants.providers
src/app/providers/page.tsx           → DB query instead of constants.providers
src/app/venues/page.tsx              → DB query instead of constants.venues
src/app/locations/page.tsx           → DB query for local providers
src/app/providers/signup/form.tsx    → POST to API instead of alert()
src/app/providers/refer/form.tsx     → POST to API instead of alert()
src/lib/constants.ts                 → Keep as fallback/seed data reference
```

**Total: ~8 files to modify, zero new UI work needed.** The front-end is fully complete and production-ready.
