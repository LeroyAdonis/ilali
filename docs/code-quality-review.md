# Code Quality Review — ILALI DB Layer + API Routes

**Date**: 2026-07-30 | **Reviewer**: Hermes Agent subagent  
**Scope**: `src/lib/db/`, `src/lib/`, `src/app/api/`  
**Criteria**: Redundant state, parameter sprawl, copy-paste blocks, leaky abstractions, stringly-typed code, AI slop (restating comments, `as any` casts, unnecessary null checks, inconsistent patterns).

---

## P0 — Performance / Correctness Bug

### 1. `GET /api/providers` fetches ALL rows then filters in memory

**File**: `src/app/api/providers/route.ts:10-25`  
**Problem**: `getProviders()` is called with no args, fetched into memory, then filtered with `.filter()`. The DB-level filtering in `getProviders(filters)` is entirely bypassed. As the provider table grows, this becomes a performance cliff — every request pulls the whole table.

```typescript
// CURRENT — in-memory filtering
const [dbProviders, dbCategories] = await Promise.all([
  getProviders(),           // ← fetches EVERYTHING
  getCategories(),
]);
let result = mapProviders(dbProviders, dbCategories);

if (category) {
  const slugs = category.split(",");
  result = result.filter((p) => slugs.includes(p.categorySlug)); // ← JS filter
}
```

**Refactor**: Push filters to the DB.

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const location = searchParams.get("location") || undefined;

  const [dbProviders, dbCategories] = await Promise.all([
    getProviders({ category, location }),
    getCategories(),
  ]);

  const result = mapProviders(dbProviders, dbCategories);

  return NextResponse.json({ data: result, total: result.length });
}
```

**Confidence**: HIGH | **Risk**: LOW

---

## P1 — High-Impact Structural Issues

### 2. Copy-paste filter blocks across `getProviders` and `searchProviders`

**File**: `src/lib/db/queries.ts:26-54, 94-134`  
**Problem**: Both functions build identical `ageMin`, `ageMax`, `location` conditions via copy-paste. `SearchFilters` is structurally `ProviderFilters` minus `maxPrice`. Any new filter field must be added in two places.

**Refactor**: Extract shared filter builder; make `SearchFilters extend ProviderFilters`.

```typescript
// queries.ts

export interface ProviderFilters {
  category?: string;
  ageMin?: number;
  ageMax?: number;
  location?: string;
  maxPrice?: number;
}

// SearchFilters extends the same base
export interface SearchFilters extends Omit<ProviderFilters, "maxPrice"> {}

// Shared filter builder
function buildProviderConditions(filters: ProviderFilters) {
  const conditions: SQL[] = [];

  if (filters.category) conditions.push(eq(providers.category, filters.category));
  if (filters.ageMin !== undefined) conditions.push(sql`${providers.ageMin} >= ${filters.ageMin}`);
  if (filters.ageMax !== undefined) conditions.push(sql`${providers.ageMax} <= ${filters.ageMax}`);
  if (filters.location) conditions.push(ilike(providers.location, `%${filters.location}%`));
  if (filters.maxPrice !== undefined) conditions.push(sql`${providers.priceValue} <= ${filters.maxPrice}`);

  return conditions;
}

export async function getProviders(filters?: ProviderFilters) {
  const conditions = filters ? buildProviderConditions(filters) : [];
  if (conditions.length === 0) {
    return db.select().from(providers).orderBy(providers.name);
  }
  return db.select().from(providers).where(and(...conditions)).orderBy(providers.name);
}

export async function searchProviders(query: string, filters?: SearchFilters) {
  const conditions: SQL[] = [];
  if (query.trim()) {
    conditions.push(or(
      ilike(providers.name, `%${query}%`),
      ilike(providers.category, `%${query}%`),
      ilike(providers.providerName, `%${query}%`),
      ilike(providers.location, `%${query}%`)
    ));
  }
  if (filters) {
    conditions.push(...buildProviderConditions(filters));
  }
  return db.select().from(providers).where(and(...conditions)).orderBy(providers.name);
}
```

**Confidence**: HIGH | **Risk**: LOW

---

### 3. `applications/[id]/route.ts` — POST and PATCH are ~80% copy-paste

**File**: `src/app/api/admin/applications/[id]/route.ts:15-139`  
**Problem**: Lines 15-78 (POST) and 80-139 (PATCH) share identical: auth gate (7 lines), fetch-by-ID (6 lines), existence check (5 lines), transition validation (8 lines), DB update (5 lines). Only difference: POST reads from `formData`, PATCH from `body.json()`.

**Refactor**: Extract shared handler.

```typescript
// POST handler
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult) return authResult; // 401/403 early exit

  const { id } = await params;
  const formData = await request.formData();
  const newStatus = formData.get("status") as string;
  return updateApplicationStatus(id, newStatus);
}

// PATCH handler
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdmin(request);
  if (authResult) return authResult;

  const { id } = await params;
  const body = await request.json();
  return updateApplicationStatus(id, body.status);
}

// Shared
async function requireAdmin(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = session.user as { role?: string };
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

async function updateApplicationStatus(id: string, newStatus: string) {
  if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }

  const [application] = await db.select().from(providerApplications).where(eq(providerApplications.id, id));
  if (!application) return NextResponse.json({ error: "Application not found" }, { status: 404 });

  const currentStatus = application.status || "pending";
  const allowedNext = VALID_TRANSITIONS[currentStatus];
  if (!allowedNext || !allowedNext.includes(newStatus)) {
    return NextResponse.json({ error: `Cannot transition from "${currentStatus}" to "${newStatus}"` }, { status: 400 });
  }

  const [updated] = await db.update(providerApplications).set({ status: newStatus }).where(eq(providerApplications.id, id)).returning();
  return NextResponse.json(updated);
}
```

**Confidence**: HIGH | **Risk**: LOW

---

### 4. `apply/route.ts` and `referrals/route.ts` are copy-paste siblings

**Files**: `src/app/api/providers/apply/route.ts`, `src/app/api/referrals/route.ts`  
**Problem**: Both share the same 5-step pattern: IP extraction → rate limit check → JSON parse → Zod validation → DB insert. The `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS` constants are duplicated. A new form endpoint (contact, newsletter, etc.) would copy this entire file again.

**Refactor**: Extract a `withFormHandler` wrapper that hoists rate-limiting, parsing, and validation.

```typescript
// src/lib/api-helpers.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getRateLimitReset } from "@/lib/rate-limit";

interface FormHandlerConfig<T extends z.ZodType> {
  rateLimitMax: number;
  rateLimitWindowMs: number;
  rateLimitKey: string;
  schema: T;
  handler: (data: z.infer<T>, ip: string) => Promise<NextResponse>;
}

export async function withFormHandler<T extends z.ZodType>(
  request: NextRequest,
  config: FormHandlerConfig<T>
): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip") || "anonymous";

  if (!checkRateLimit(ip, config.rateLimitMax, config.rateLimitWindowMs)) {
    const retryAfter = getRateLimitReset(ip, config.rateLimitWindowMs);
    return NextResponse.json(
      { error: `Too many ${config.rateLimitKey}s. Please try again later.`, retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = config.schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  return config.handler(parsed.data, ip);
}
```

Then `apply/route.ts` becomes:

```typescript
export async function POST(request: NextRequest) {
  return withFormHandler(request, {
    rateLimitMax: 5,
    rateLimitWindowMs: 60 * 60 * 1000,
    rateLimitKey: "application",
    schema: providerApplicationSchema,
    handler: async (data) => {
      try {
        await db.insert(providerApplications).values({ /* ... mapping ... */ });
        return NextResponse.json({ success: true });
      } catch (error) {
        console.error("Failed to insert provider application:", error);
        return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
      }
    },
  });
}
```

**Confidence**: MEDIUM | **Risk**: MEDIUM (introduces abstraction — needs to be tested with both endpoints)

---

### 5. Stringly-typed status/role fields — `text()` instead of `pgEnum` + unused `db/types.ts`

**Files**: `src/lib/db/schema.ts:140,80`, `src/lib/db/types.ts`  
**Problem**: `providerApplications.status` is `text("status").default("pending")` — can hold any string. `users.role` is `text("role").default("parent")`. `db/types.ts` defines `ProviderStatus` and `UserRole` but they're never used in the schema. The DB itself has no constraint; TypeScript sees `string`.

**Refactor**: Use `pgEnum` (Drizzle-native) so the DB enforces values and TS gets a union type.

```typescript
// schema.ts
import { pgEnum } from "drizzle-orm/pg-core";

export const applicationStatusEnum = pgEnum("application_status", [
  "pending", "contacted", "approved", "rejected",
]);

export const userRoleEnum = pgEnum("user_role", [
  "parent", "provider", "admin",
]);

// In providerApplications:
status: applicationStatusEnum("status").default("pending"),

// In users:
role: userRoleEnum("role").default("parent"),
```

Now `db/types.ts` becomes a re-export of inferred types:
```typescript
import { applicationStatusEnum, userRoleEnum } from "./schema";
export type ProviderStatus = (typeof applicationStatusEnum.enumValues)[number];
export type UserRole = (typeof userRoleEnum.enumValues)[number];
```

**Confidence**: HIGH | **Risk**: MEDIUM (requires running migrations — `pgEnum` needs `CREATE TYPE`)

---

## P2 — Medium Quality Issues

### 6. `db/index.ts` — Unnecessary `as any` cast in proxy

**File**: `src/lib/db/index.ts:18`  
**Problem**: `(getDb() as any)[prop]` — the proxy discards all type information at the call boundary. `getDb()` already returns `NeonHttpDatabase<typeof schema>`, so `as any` is unnecessary and defeats type safety.

**Refactor**: Use a properly-typed proxy; actually, the proxy pattern itself is the issue — just use a lazy getter or top-level `await` pattern.

```typescript
// Simpler, no proxy, no as any:
let _dbPromise: Promise<NeonHttpDatabase<typeof schema>> | null = null;

function getDb(): Promise<NeonHttpDatabase<typeof schema>> {
  if (!_dbPromise) {
    _dbPromise = Promise.resolve().then(() => {
      const sql = neon(process.env.DATABASE_URL!);
      return drizzle(sql, { schema });
    });
  }
  return _dbPromise;
}

// If you must keep sync access, at least lose the any:
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) {
    const realDb = getDb();
    return (realDb as Record<string | symbol, unknown>)[prop];
  },
});
```

Best approach: switch to async init pattern used by Next.js starters:
```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

The comment says "prevents Turbopack build failures" but Drizzle + Neon HTTP works fine in Next.js edge/serverless without lazy init. This is premature optimization. Check if the issue is real or just cargo-culted.

**Confidence**: HIGH | **Risk**: LOW

---

### 7. `mapProviders` is a thin `.map()` wrapper — never used meaningfully

**File**: `src/lib/db/mappers.ts:64-69`  
**Problem**: `mapProviders(dbRows, categories)` is literally `dbRows.map(row => mapProvider(row, categories))`. All call sites (3 places) already pass arrays. The function adds zero abstraction, just indirection.

**Refactor**: Inline at call sites, remove the function.

```typescript
// Before:
const result = mapProviders(dbProviders, dbCategories);

// After:
const result = dbProviders.map(row => mapProvider(row, dbCategories));
```

**Confidence**: HIGH | **Risk**: NONE

---

### 8. `score.ts` — `ScoredResult.provider` typed as `unknown` + monstrous generic constraint

**File**: `src/lib/ai/score.ts:105-114`  
**Problem**: `provider: unknown` on line 106 defeats the generic type safety that `scoreAllProviders` tries to provide on line 114. The generic constraint is also copy-pasted from `scoreProvider`'s parameter shape — changes to `scoreProvider` won't automatically update `scoreAllProviders`.

**Refactor**: Extract the provider shape and use it consistently.

```typescript
export interface ScorableProvider {
  id: string;
  ageMin: number;
  ageMax: number;
  tags?: string[] | null;
  location?: string;
  priceValue: number;
  isFree?: boolean | null;
}

export function scoreProvider(provider: ScorableProvider, intent: MatchIntent): { score: number; reasons: string[] } {
  // ... same logic
}

export interface ScoredResult<T = ScorableProvider> {
  provider: T;
  score: number;
  reasons: string[];
}

export function scoreAllProviders<T extends ScorableProvider>(
  providers: T[],
  intent: MatchIntent
): ScoredResult<T>[] {
  return providers
    .map((provider) => ({ provider, ...scoreProvider(provider, intent) }))
    .sort((a, b) => b.score - a.score);
}
```

**Confidence**: HIGH | **Risk**: LOW

---

### 9. `match/route.ts:63-66,84-91` — Bizarre type cast workaround

**File**: `src/app/api/match/route.ts:63-66`  
**Problem**: Uses `s.provider as Parameters<typeof mapProviders>[0][number]` to cast a DB row through the mapper. This is a code smell indicating `mapProviders` expects a specific type it shouldn't need — the provider from `scoreAllProviders` is already a DB row; mapping one at a time is wasteful.

```typescript
// Current — casts array of 1 through the map function:
const mappedGood = goodMatches.map((s) => ({
  provider: mapProviders(
    [s.provider as Parameters<typeof mapProviders>[0][number]],  // ← awful cast
    dbCategories
  )[0],
  score: s.score,
  reasons: s.reasons,
}));
```

**Refactor**: Just call `mapProvider` directly on the single row.

```typescript
const mappedGood = goodMatches.map((s) => ({
  provider: mapProvider(s.provider, dbCategories),
  score: s.score,
  reasons: s.reasons,
}));
```

This works because `scoreAllProviders` returns `ScoredResult` with the DB row as `provider`, which satisfies `DbProvider`. The cast was only needed because `mapProviders` takes an array — just use the single-item mapper.

**Confidence**: HIGH | **Risk**: LOW

---

### 10. Inconsistent `|| ""` vs `|| undefined` patterns for optional query params

**Files**: `providers/route.ts:7-8` vs `search/route.ts:8-11`  
**Problem**: `providers/route.ts` uses `|| ""` to coalesce null params to empty strings, then checks truthiness. `search/route.ts` uses `|| undefined`. The `|| ""` pattern means `filters?.category` is `""` (falsy, safe) but the intent is different — one is a "no filter" signal, the other converts missing to empty for string operations.

**Refactor**: Standardize on a `getOptionalParam` helper:

```typescript
function getParam(searchParams: URLSearchParams, key: string): string | undefined {
  return searchParams.get(key) ?? undefined;
}
```

Then use consistently: `const category = getParam(searchParams, "category");`

**Confidence**: MEDIUM | **Risk**: LOW

---

### 11. `search/route.ts:43` — Misleading AI-slopt comment

**File**: `src/app/api/search/route.ts:43`  
**Problem**: `// Optional client-side price filtering (keep it simple for MVP)` — the price filtering at line 45-59 is **server-side** in the API route, not client-side. This is an AI-generated comment that restates a misunderstanding.

**Refactor**: Fix or remove the comment.

```typescript
// Price band filtering (in-memory since price bands don't map 1:1 to DB columns)
```

**Confidence**: HIGH | **Risk**: NONE

---

## P3 — Low Severity / Code Smells

### 12. `mappers.ts:39` — Redundant null-coalescing after schema defaults

**File**: `src/lib/db/mappers.ts:29-39`  
**Problem**: `dbRow.phone ?? undefined` — phone is `string | null` from the schema. If it's `null`, `?? undefined` returns `undefined`. If it's `undefined`, it stays `undefined`. The `??` has no effect on null values — it doesn't convert null to undefined; TypeScript's `??` only triggers on `null` and `undefined`. Actually... `null ?? undefined` returns `undefined`. So this does convert `null → undefined`. But the schema declares `thing?: string | null` vs `thing?: string` — context matters.

On closer inspection: `dbRow.isFree`, `dbRow.featured`, `dbRow.verified` all have Drizzle `.default(false)` so they're always `boolean`. The `?? false` is dead code. `dbRow.phone` is `text("phone")` without `.notNull()` — so it's `string | null`. `?? undefined` converts `null` to `undefined`, which is a meaningful conversion for optional TypeScript fields. But the UI type `Provider` has `phone?: string`, so `null` would type-error. So the `?? undefined` IS needed. Only the boolean defaults are truly redundant.

**Refactor**: Remove only the redundant boolean fallbacks:

```typescript
// REMOVE — DB has .default(false) on these:
isFree: dbRow.isFree ?? false,    // → isFree: dbRow.isFree
featured: dbRow.featured ?? false, // → featured: dbRow.featured
verified: dbRow.verified ?? false, // → verified: dbRow.verified

// KEEP — necessarily converts null → undefined for optional fields:
phone: dbRow.phone ?? undefined,  // correct
```

**Confidence**: HIGH | **Risk**: NONE

---

### 13. `providers/route.ts:33-51` — Stale POST handler (no-op stub)

**File**: `src/app/api/providers/route.ts:33-51`  
**Problem**: POST handler echoes back the body with a fake ID — doesn't write to DB. The real provider application flow is in `apply/route.ts`. This is leftover dead code that could confuse future devs.

**Refactor**: Delete the POST handler or return 405 Method Not Allowed. The route should only expose GET.

**Confidence**: HIGH | **Risk**: NONE

---

### 14. `admin/providers/route.ts:7-15` — `slugify` defined inline, not shared

**File**: `src/app/api/admin/providers/route.ts:7-15`  
**Problem**: `slugify` is a general-purpose utility defined locally in an admin route. It should live in `src/lib/utils.ts` alongside `formatPhone`. Also has no uniqueness check — two providers named the same would silently collide on slug.

**Refactor**: Move to `src/lib/utils.ts` and add collision handling:

```typescript
// src/lib/utils.ts
export function slugify(text: string): string {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
```

In the route, check uniqueness:
```typescript
const baseSlug = slugify(data.name);
let slug = baseSlug;
let suffix = 1;
while (await db.select({ id: providers.id }).from(providers).where(eq(providers.slug, slug)).limit(1).then(r => r.length > 0)) {
  slug = `${baseSlug}-${suffix++}`;
}
```

**Confidence**: HIGH | **Risk**: LOW

---

### 15. `auth.ts:8` — `Record<string, any>` for schema map

**File**: `src/lib/auth.ts:8`  
**Problem**: `const schemaMap: Record<string, any>` — `any` defeats type safety for the better-auth adapter configuration. better-auth's `drizzleAdapter` has a typed schema parameter.

**Refactor**:

```typescript
const schemaMap = {
  user: allSchemas.users,
  session: allSchemas.authSessions,
  account: allSchemas.authAccounts,
  verification: allSchemas.authVerifications,
} as const;
```

Let TypeScript infer the type. If better-auth demands a specific type, import it from the adapter. `as const` gives literal inference; remove explicit `Record<string, any>`.

**Confidence**: MEDIUM | **Risk**: LOW (better-auth types could reject literal inference — test before shipping)

---

## Summary

| # | Category | File:Line | Issue | Severity |
|---|----------|-----------|-------|----------|
| 1 | Correctness | `api/providers/route.ts:10` | GET filters in memory, not DB | **P0** |
| 2 | Copy-paste | `db/queries.ts:26-134` | Duplicate filter builder blocks | **P1** |
| 3 | Copy-paste | `api/admin/.../[id]/route.ts:15-139` | POST/PATCH 80% identical | **P1** |
| 4 | Copy-paste | `api/.../apply/route.ts` + `referrals/route.ts` | Twin route handlers | **P1** |
| 5 | Stringly-typed | `db/schema.ts:140,80` | `text()` for status/role — no enum constraint | **P1** |
| 6 | `as any` cast | `db/index.ts:18` | Proxy `as any` defeats types | **P2** |
| 7 | Redundant abstraction | `db/mappers.ts:64-69` | `mapProviders` is just `.map()` | **P2** |
| 8 | Type safety | `ai/score.ts:105-114` | `provider: unknown` + copied generic | **P2** |
| 9 | Type workaround | `api/match/route.ts:63-66` | `Parameters<>` cast to hack single-item map | **P2** |
| 10 | Inconsistency | `api/providers/route.ts:7` vs `api/search/route.ts:8` | `\|\| ""` vs `\|\| undefined` | **P2** |
| 11 | AI slop | `api/search/route.ts:43` | Comment says "client-side" but code is server-side | **P2** |
| 12 | Redundant fallback | `db/mappers.ts:29-37` | `?? false` on schema-defaulted booleans | **P3** |
| 13 | Dead code | `api/providers/route.ts:33-51` | Stale POST handler echoes body, no DB write | **P3** |
| 14 | Scattered utility | `api/admin/providers/route.ts:7-15` | `slugify` defined inline, no uniqueness check | **P3** |
| 15 | `any` cast | `auth.ts:8` | `Record<string, any>` schema map | **P3** |

### Patterns found

- **Copy-paste cargo cult**: `apply/` and `referrals/` are structural twins. The admin `applications/[id]` has POST and PATCH as twins. The `getProviders`/`searchProviders` filter logic is a twin. Every endpoint copies IP extraction + rate-limit + JSON-parse + Zod-validate. These should be extracted into shared middleware/wrappers.
- **In-memory filtering blind spot**: The `GET /api/providers` route ignores the DB-level filtering already built into `queries.ts`, duplicating logic client-side. This is the most likely source of production-scale performance issues.
- **Stringly-typed enums**: Status and role fields are raw `text` in both schema and TypeScript. `db/types.ts` exists but is disconnected from schema types. `pgEnum` + Drizzle infer would fix both simultaneously.
- **AI slop patterns**: Restating comments (`// Auth gate` on auth gate code), inaccurate comments ("client-side" filtering that's server-side), `as any` escapes, redundant null coalescing after schema defaults — all consistent with AI-generated code that wasn't reviewed.
