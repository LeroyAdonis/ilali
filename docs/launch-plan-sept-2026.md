# ILALI — Sept 2026 Assitej Launch Plan

**Canonical plan doc.** Each workstream runs in its OWN Hermes session (context-rot rule).
When a WS is confirmed done, tick it and the next session picks the next unchecked WS.
**Deadline:** Assitej SA provider onboarding begins Sept 1 2026, Cape Town first (George + Yvette Hardie agreement).

## Context (verified audit 2026-08-06)

- Prod is LIVE (ilali.vercel.app, HTTP 200) on the REAL Neon DB (25 tables, in sync). No USE_MOCK in prod.
- 81/81 unit tests pass, `tsc --noEmit` clean. E2E 19/21 pass (2 failures are dev-server cold-compile flakes, not product bugs).
- All 7 specs shipped in core (ilali-mvp, provider-portal, parent-profile, join-a-club, trust-signals, community-contributions, responsive-images).
- `ilali.co` email IS hosted (MX → smtp.google.com, Google Workspace). SPF record missing.
- Lint fails: 56 errors (no-explicit-any in `src/lib/db/reseed-admin.ts` + `src/lib/db/test-queries.ts`), 75 warnings.
- Playwright webServer waits on :3001 but dev binds :3000 — set PORT=3001 or `-p 3001` in playwright.config.ts.
- `.env` DEEPSEEK_API_KEY is a placeholder (8 chars) — replace with real key or it 401s on fallback.
- Migration SQL files `drizzle/0001`/`0002` missing from disk/git (journal+snapshots exist; live DB is in sync — use `drizzle-kit push`, not `migrate`).

## Workstreams (in order)

### WS-1: Admin approval → account creation flow ✅ SHIPPED
**Status:** DEPLOYED TO PROD 2026-08-06 (commits `0976a97` + `78d519e` on main, ilali.vercel.app live).
**Result:** POST approve auto-creates provider user (role=provider, temp password 12 chars mixed, passwordResetRequired=true), links or creates providers row (match by name+location or phone — the old providers.id===applicationId bug is gone), 409 "A user with this email already exists" per spec, pending→approved allowed directly. UI: `ApplicationCard.tsx` client card with temp-password panel + Copy + Regenerate (PATCH invalidates old hash, re-arms reset).
**Files:** `src/app/api/admin/applications/[id]/route.ts`, `src/app/admin/applications/page.tsx`, `src/app/admin/applications/ApplicationCard.tsx` (new)
**Verified (Ricky, 2026-08-06):** tsc clean, 81/81 vitest, npm run build clean.
**Next:** Leroy reviews → merge to main → deploy. Then WS-2 (email) delivers these temp passwords automatically.

### WS-2: Email delivery (Resend + ilali.co) ✅ SHIPPED
**Status:** DEPLOYED TO PROD 2026-08-06 (commit `78d519e` on main). Email inactive until RESEND_API_KEY set + ilali.co domain verified.
**Result:** `src/lib/mail/index.ts` lazy Resend wrapper (never throws at module load; missing RESEND_API_KEY → console.warn + `{skipped:true}`; send errors returned not thrown). Approval route fires welcome email (temp password + first-login instructions) after account creation, try/catch non-blocking, response includes `emailSent`. ApplicationCard shows "📧 Welcome email sent" vs "Email sending not configured — copy manually". Forgot-password is passphrase-only — reset email exported for future use, not wired (correct call).
**Files:** `src/lib/mail/index.ts` (new), `src/app/api/admin/applications/[id]/route.ts`, `src/app/admin/applications/ApplicationCard.tsx`, `.env.example`
**Verified (Ricky, 2026-08-06):** tsc clean, 81/81 vitest, npm run build clean.
**To activate:** add RESEND_API_KEY + verify ilali.co domain in Resend (needs George's admin details + SPF).

### WS-3: Claim flow security ✅ SHIPPED
**Status:** DEPLOYED TO PROD 2026-08-06 (commit `e8c988a` on main, ilali.vercel.app live). Schema pushed to Neon (4 new users columns verified).
**Result:** Zero-verification claim hole closed. Admin-issued claim codes (12-char unambiguous alphabet, bcrypt-hashed, 7-day expiry, 5-fail → 15-min lockout, single-use). POST /api/providers/claim now requires email + claimCode + password + passphrase with UNIFORM errors (never reveals whether an email/code exists; only 429 for lockout). Migration script issues codes → claim-codes.csv. New /admin/claims page (generate/regenerate/copy/clear). Claim page gains code input.
**Verified (Ricky, 2026-08-06):** tsc clean, vitest 145/145 (19 new), eslint 0 errors, build clean. Prod HTTP 200, /admin/claims gated, /providers/claim live, DB columns present.

### WS-4: Bulk import (multi-format intake → applications) ✅ SHIPPED
**Status:** DEPLOYED TO PROD 2026-08-06 (commit `1e16b60` on main, ilali.vercel.app live). Schema pushed to Neon (import_batches + importBatchId).
**Result:** Multi-format intake (CSV/XLSX/pasted text) → preview (per-row ✅/⚠️/❌, no writes) → commit → batch approve (shared approveApplication helper; per-row partial success with temp passwords + email status) → import history. Admin: /admin/import + bulk-select on /admin/applications.
**Verified (Ricky):** tsc clean, vitest 126/126 (45 new), eslint clean, build clean. Prod HTTP 200, admin routes gated.

### WS-5: Parent-facing quick wins ✅ SHIPPED
**Status:** DEPLOYED TO PROD 2026-08-07 (commit `e316c7c` on main, ilali.vercel.app live, GitHub pushed). tsc clean, 153/153 vitest, build clean, club E2E 6/6 (incl. new WS-5 test). Full E2E 20/22 — 2 pre-existing unrelated flakes (map Leaflet pins, NIM rate-limit AI fallback).
**Result:** All 4 wins on the canonical club page (`/clubs/[slug]`):
1. **WhatsAppButton wired** — "Contact this club" sidebar card (green button, `wa.me` prefilled with listing message) renders when provider has a phone. Zero call sites before.
2. **Reviews on club page** — `ReviewSection providerId` (was venues-only), main column after Upcoming events.
3. **"You might also like"** — `getSimilarProviders` (tag-overlap, excludes self) → mapped via `mapProvider` → ProviderCard grid with rotating accent colors + verification badges.
4. **ComingSoon wired** — "Online booking" badge in sidebar (WS-6 Paystack not live; message adapts whether phone exists).
Also fixed Playwright webServer port (`PORT=3001 npm run dev`) — documented WS-0 housekeeping item that blocked E2E.
**Files:** `src/app/clubs/[slug]/page.tsx`, `tests/e2e/clubs.spec.ts`, `playwright.config.ts`

### WS-6: Paystack payments (SDD spec first) ✅/❌
**Status:** added 2026-08-06 (Leroy request). **SDD + grill-me → spec → approval → build** before any code.
**Goal:** Paystack as payment gateway (SA). MVP scope note: master plan said "no booking/payment until traction" — so scope must be decided: minimal = provider payouts / contributions; full = paid bookings. Paystack SA requires business verification (ID + bank, multi-day) — **George starts the Paystack account NOW in parallel** so verification is done by Sept.
**Files (future):** new `src/lib/payments/paystack.ts`, API routes, checkout/payout UI. Env: PAYSTACK_SECRET_KEY (test + live).
**George's side (in setup email):** sign up at paystack.com (South Africa, Business), verify business, add bank details, send API keys to Leroy.

### WS-0: Housekeeping (fold into WS-1/WS-2 sessions) ✅/❌
- Fix 56 lint errors (no-explicit-any × 5 in 2 files)
- Playwright webServer port (3001)
- Real DEEPSEEK_API_KEY in `.env`
- Restore/regenerate `drizzle/0001`/`0002` SQL files

## After all WS: final launch gate
- Full tsc + lint + vitest + playwright green
- Deploy main → ilali.vercel.app
- Assitej comms (Yvette), first CT cohort import
- Notion workspace live (see `docs/notion-launch-workspace.md` + `scripts/notion-bootstrap.sh`; needs Leroy's NOTION_API_KEY)
