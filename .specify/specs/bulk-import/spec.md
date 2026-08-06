# Feature Spec: Bulk Import — CSV → Application Queue → Batch Approve

**Date:** 2026-08-06
**Status:** Draft — Ready for Review
**Spec Driven By:** WS-4 of the Sept 2026 Assitej SA launch plan (canonical plan: `docs/launch-plan-sept-2026.md`)

## Vision Statement

Onboarding 100+ Assitej SA providers by hand — one form submission, one approval click at a time — is the single biggest time sink between ILALI and the Sept 1, 2026 launch. The admin should be able to get a cohort of providers into the queue from **whatever format the data arrives in** — a CSV, an Excel/Google Sheets export, a list pasted from an email or WhatsApp message, or individual form signups — see exactly what will be created and what's wrong with each row *before anything touches the database*, and commit the whole cohort with one click. From there the queue is just the normal application queue — same pending rows, same approval flow, same temp-password delivery — except the admin can now approve fifty rows in one action and get a clean per-provider report of temp passwords and email status. Bulk import is the on-ramp; the existing WS-1/WS-2 approval machinery is the engine. **Intake is format-agnostic: every arrival path funnels through one normalizer into the same preview → commit → approve pipeline.**

## Grill Me Synthesis

> **Placeholder — Grill Me session with Leroy pending.** The decisions below are the spec author's proposals grounded in the existing codebase. They must be validated in a Grill Me session (or by Leroy's review of this spec) before build approval. Open questions are flagged inline.

| What's Clear | Key Decisions (proposed) |
|---|---|
| CSV upload → providerApplications rows (`status='pending'`, `onboardSource='bulk-import'`) | Import is **two-step**: preview (validate only, nothing written) → commit (insert only valid rows). Never auto-approve on import. |
| Preview must show per-row validation BEFORE commit | Hard errors (missing/bad email, dupes) exclude the row; warnings (unknown activity type) import with a note. Admin fixes by re-uploading — no in-place row editing. |
| Batch approve reuses the WS-1 approval flow | New `POST /api/admin/applications/batch-approve` route; per-row independent try/catch → partial success with per-row report. Shared `approveApplication()` helper extracted from the existing `[id]` route — its behavior must not change. |
| Temp password delivery follows WS-2 | Batch response returns `tempPassword` + `emailSent` per approved row; admin summary shows copyable passwords AND/OR "📧 email sent". Email stays non-blocking. |
| Duplicate email rule | **Reject the row at import time** (excluded from commit, listed with reason). Dupe sources: within-file, existing `users` row, existing application in pending/contacted/approved. Rejected applications' emails ARE re-importable. |
| Import history | NEW `importBatches` table + `importBatchId` column on `providerApplications`. Approved counts are **derived** by query (no stored counter). |
| Rate limit | Import routes are admin-gated (`withAdmin`) and MUST NOT use the 5/hr/IP signup limiter. |

| Still Uncertain | Resolution |
|---|---|
| How will the Assitej cohort data arrive? (CSV? Excel? pasted lists? form signups?) | **Multi-format intake.** Support `.csv` upload, `.xlsx`/`.xls` upload (Google Sheets/Excel exports), and pasted tab/comma-separated text. All three funnel through one normalizer → same row model → same preview/commit/approve pipeline. Individual form signups (existing `/providers/signup`) and WhatsApp poster onboarding (existing `/onboard`) remain parallel channels — the admin queue is shared either way. |
| Will Resend be live by Sept? | Doesn't matter — temp-password fallback display is the WS-2-consistent behavior either way. |
| Category mapping for arbitrary `activityType` strings in the CSV | Reuse `resolveCategoryId` (aliases + name/slug match + first-category fallback) at approval time; preview shows a warning when a row's activity type won't resolve cleanly. |

## User Scenarios

### Scenario 1: Admin Uploads a Provider CSV
**As an** admin preparing the Assitej SA cohort
**I want to** upload a CSV of providers and turn each row into a pending application
**So that** 100+ providers enter the queue without 100+ form submissions

**Acceptance criteria:**
- [ ] `/admin/import` accepts providers in **three formats**: `.csv` file upload, `.xlsx`/`.xls` file upload (Excel / Google Sheets export), and pasted tab/comma-separated text in a textarea
- [ ] All three formats funnel through ONE normalizer → same row model → same preview/commit/approve pipeline (format-agnostic intake)
- [ ] File uploads capped at 5MB / 500 data rows; pasted text capped at 500 rows
- [ ] Expected headers: `name, email, phone, activityType, location, ageMin, ageMax, priceValue, description` (header matching is case/whitespace tolerant; snake_case aliases like `activity_type` also accepted; Excel/Sheets column order may vary — matched by header name, not position)
- [ ] A "Download CSV template" link produces a file with the exact expected headers
- [ ] Uploading/pasting valid data shows a **preview** — a table of parsed rows with per-row status; NO database writes have happened yet
- [ ] Each row becomes a `providerApplications` row with `status='pending'`, `onboardSource='bulk-import'`
- [ ] `priceValue` is interpreted as Rands (whole number), consistent with the signup form; the existing approval flow converts to cents
- [ ] CSV/XLSX rows map to `providerApplicationSchema` validation (name ≥ 2 chars, valid email, +27 phone when present, ages 0–18 ints, price ≥ 0)
- [ ] Pasted-text rows: whitespace around values trimmed; quoted values with embedded commas supported; rows without a valid email are excluded with a reason (same as file imports)

### Scenario 2: Admin Reviews the Import Preview
**As an** admin
**I want to** see exactly which rows will import and which are rejected, with reasons
**So that** I never commit garbage rows to the queue

**Acceptance criteria:**
- [ ] Preview lists every row with a status: ✅ valid, ⚠️ warning (imports with note), ❌ error (excluded)
- [ ] Per-row error reasons include: missing name, missing/invalid email, invalid phone, invalid age (non-int, <0, >18, min>max), invalid price, duplicate email within the file, duplicate email already in `users`, duplicate email already in a pending/contacted/approved application
- [ ] The preview shows counts: total rows, valid rows, rows with warnings, rows with errors
- [ ] Rows with errors are excluded from the commit — the admin fixes the spreadsheet and re-uploads; there is no in-place row editor
- [ ] Malformed CSV (unclosed quotes, wrong header row, empty file) fails fast with a clear message before any row validation
- [ ] Re-uploading after fixes re-runs the full preview (preview is stateless)

### Scenario 3: Batch Approve
**As an** admin
**I want to** approve many pending applications in one action
**So that** the whole Assitej cohort gets login accounts without 100 clicks

**Acceptance criteria:**
- [ ] On `/admin/applications`, pending/contacted applications have checkboxes; a bulk bar shows "Approve selected (N)"
- [ ] `POST /api/admin/applications/batch-approve` accepts `{ ids: string[] }` or `{ importBatchId: string }` (approves all pending/contacted rows from one import batch)
- [ ] Each row goes through the EXACT WS-1 approval flow: user created (`role='provider'`, 12-char temp password, `passwordResetRequired=true`), providers row linked/created, welcome email fired (WS-2, non-blocking)
- [ ] Partial success is reported per row: `{ approved: [{ id, email, tempPassword, emailSent }], failed: [{ id, email, error }] }` — e.g. "48 approved, 2 failed: duplicate email"
- [ ] Failed rows stay `pending` (or `contacted`) — never half-approved
- [ ] A failure on one row NEVER rolls back or blocks other rows
- [ ] Summary UI shows per-provider temp passwords with Copy buttons (same panel pattern as `ApplicationCard`), plus "📧 Welcome email sent" vs "Email sending not configured — copy manually" per row (WS-2 consistent)
- [ ] A failed row's error is actionable (e.g. "A user with this email already exists" → admin resolves, re-approves individually)

### Scenario 4: Import History
**As an** admin
**I want to** see what was imported, when, and what happened to those applications
**So that** I can audit the Assitej onboarding and follow up on failures

**Acceptance criteria:**
- [ ] `/admin/import` has a History tab listing past imports: filename, date, imported rows, skipped rows, and derived approved count
- [ ] Approved count is derived from `providerApplications` (`COUNT(*) WHERE import_batch_id = X AND status = 'approved'`) — no stored counter to drift
- [ ] Each import row is expandable to show the per-row error list recorded at commit time
- [ ] Each import row has "Approve all pending (N)" when N > 0 — calls the same batch-approve route with `{ importBatchId }`
- [ ] Imported applications are visible and filterable on `/admin/applications` (source filter chip for `bulk-import`)

## Functional Requirements

### FR-1: Multi-Format Intake & Parse
`POST /api/admin/import/preview` MUST accept EITHER a multipart file upload (`.csv`, `.xlsx`, `.xls`) OR a `{ text }` body of pasted tab/comma-separated rows. It MUST normalize all three into the same row model via a shared `normalizeIntake()` helper: CSV parsed with papaparse (`dynamicTyping: false` — all values as strings, no formula execution), XLSX/XLS parsed with `xlsx` (SheetJS) reading the first sheet, pasted text parsed by delimiter detection (tab > comma) with quoted-value support. Headers MUST be matched by name (case/whitespace-tolerant, snake_case aliases accepted), not position. Parsing MUST tolerate a UTF-8 BOM, quoted fields, and CRLF line endings. Files MUST be rejected with a 400 + clear message when: not a supported type, > 5MB, > 500 data rows, empty, or structurally malformed (bad header row, unbalanced quotes). Pasted text MUST be rejected when it has no recognizable header row or > 500 rows.

### FR-2: Per-Row Validation & Dedup
Each row MUST be validated against `providerApplicationSchema` semantics (name ≥ 2 chars; valid email; phone `+27` format or empty; ages whole 0–18; price whole ≥ 0; `ageMin ≤ ageMax` when both present). Dedup rules (email compared case-insensitively, trimmed):
1. Email duplicated within the file → all-but-first occurrence rejected.
2. Email exists in `users` (any role) → rejected.
3. Email exists in `providerApplications` with status `pending | contacted | approved` → rejected.
4. Email exists only in a `rejected` application → **allowed** (re-importable; rejected applications have no account and aren't approvable).
Unknown `activityType` → warning, not an error (approval-time `resolveCategoryId` falls back to a category).

### FR-3: Commit (Two-Step Import)
`POST /api/admin/import/commit` MUST re-run validation + dedup (race-safe: state may have changed since preview), insert all valid rows into `providerApplications` in one multi-row insert with `status='pending'`, `onboardSource='bulk-import'`, and `importBatchId` set, and create one `importBatches` record. The response MUST return `{ batchId, imported, skipped, rowErrors }`. Rows that became duplicates between preview and commit MUST be skipped and reported, not inserted.

### FR-4: Batch Approve
`POST /api/admin/applications/batch-approve` MUST accept `{ ids: string[] }` or `{ importBatchId: string }` and approve each eligible row (status `pending` or `contacted`) through the shared `approveApplication()` helper. Each row MUST be processed in its own try/catch: a failure reports `{ id, email, error }` and leaves that row's status untouched. The response MUST include per-approved-row `tempPassword` and `emailSent` (WS-2 behavior). The route MUST NOT be subject to the signup rate limiter — admin session (`withAdmin`) is the gate.

### FR-5: Approval Logic Reuse (Refactor Constraint)
The existing `POST /api/admin/applications/[id]` approval path (account creation, providers link/create, email, status update) MUST be extracted into `src/lib/admin/approveApplication.ts` and used by BOTH the single-approve route (behavior byte-identical — existing tests must pass unchanged) and the batch route. Duplication of account-creation logic is not allowed.

### FR-6: Import UI
`/admin/import` MUST provide: Upload tab (file picker, template download, preview table with per-row status chips and reasons, counts summary, "Import N valid rows" confirmation, success summary with "Approve all pending" CTA) and History tab (import list with derived approved counts, expandable row errors, per-batch "Approve all pending"). All routes/pages MUST be admin-gated (`withAdmin` for APIs; admin layout for pages).

### FR-7: Selection UI on Applications Page
`/admin/applications` MUST support selecting multiple applications and approving them via the batch route, with a summary modal showing per-provider temp passwords (Copy buttons) and email status. The existing single-card Approve/Reject/Regenerate flow MUST remain fully functional.

### FR-8: onboardSource `'bulk-import'`
The `onboardSource` column comment in `src/lib/db/schema.ts` MUST be extended from `'email' | 'form' | 'whatsapp' | null` to include `'bulk-import'`. It is a plain `text` column (no DB enum/CHECK), so this is a comment update + discipline at insert time — the commit route MUST always set `'bulk-import'` for imported rows.

## Non-Functional Requirements

### NFR-1: Security
Every new API route MUST be wrapped in `withAdmin` (401/403 per `src/lib/auth-guard.ts`). Upload limits: 5MB file size, 500 data rows, supported extension check (`.csv`/`.xlsx`/`.xls`). No CSV formula injection (all parsed cells treated as strings; no cell value is ever executed or rendered as HTML). XLSX parsed with SheetJS `cellFormula: false` (values only — formulas never evaluated) and the same treat-everything-as-string rule. Temp passwords MUST only appear in API responses and the admin summary — never logged.

### NFR-2: Performance
Preview + validation for 500 rows MUST complete in under 3s. Commit (500-row multi-insert + one batch record) MUST complete in under 5s. Batch approve of 100 rows MUST return per-row results without client timeouts (Vercel function limits: keep work per row cheap — bcrypt hashing is the dominant cost; sequential is acceptable for ≤500 rows).

### NFR-3: Reliability
Import MUST be stateless between preview and commit (commit re-validates). Batch approve MUST be at-least-once per row with explicit per-row reporting — no silent skips, no partial state (a row is either fully approved with account + status update, or unchanged with an error). Email failures MUST NOT fail approvals (WS-2 contract).

### NFR-4: UX Consistency
The import UI MUST match the existing admin design language (light theme, `bg-paper`/`text-ink` tokens, `ApplicationCard`-style panels, `AdminShell` nav). Preview tables and status chips MUST be keyboard-navigable and readable at 375px+. All interactive elements ship the standard 8 states (default/hover/focus-visible/active/disabled/loading/error/success).

## Key Entities

- **providerApplications** — existing table. Modified: new nullable `importBatchId` column (`uuid REFERENCES import_batches(id)`). Imported rows: `status='pending'`, `onboardSource='bulk-import'`. NOTE: email has NO unique index — dedup is enforced at the application layer (FR-2).
- **importBatches** — NEW table. One row per committed import: `id, filename, totalRows, importedRows, skippedRows, rowErrors (jsonb: [{ row, email, errors[] }]), createdBy (users.id), createdAt`. Approved counts are NOT stored — derived by counting `providerApplications` rows with this `importBatchId` and `status='approved'`.
- **users / providers / authAccounts** — unchanged. Created by the shared approval helper exactly as WS-1 does today.

## Visual/UX Direction

### Design Skill Stack (mandatory for implementation)
This is an **internal admin tool**, so the design pass is lighter than the provider portal but still uses the repo's design discipline:
1. **Hallmark** — load first; gate the pages against the 58-gate slop test (no invented metrics — every count is a real DB query; no decorative chrome; no italic headers). Macrostructure: standard admin list/detail — do NOT over-design an internal tool.
2. **Premium Design System** — token discipline (no raw hex, no `text-gray-500`), WCAG AA contrast floor, 8-state coverage on every interactive component.
3. **Frontend Design** — consistency with the existing admin shell (`AdminShell`, `ApplicationCard`, `AdminStatusBadge`) matters more than distinctiveness here. The import preview is a data-dense table; clarity and error legibility are the aesthetic goals.

### Platform Style
- Same light theme as existing admin pages (`bg-paper`/`bg-paper-warm`, `text-ink`/`text-ink-soft`/`text-ink-faint`)
- Status chips reuse `AdminStatusBadge`-style patterns: ✅ teal (valid), ⚠️ gold (warning), ❌ red (error)
- New "Import" nav item in `AdminShell` (icon: `Upload`), next to Applications
- Batch-approve summary reuses the exact temp-password panel pattern from `ApplicationCard` (teal panel, mono password, Copy button, email-sent note)

### Component Quality Gates
- [ ] Every interactive element ships all 8 states
- [ ] No italic headers, no re-drawn chrome, no invented metrics
- [ ] No mid-render token improvisation — named tokens only
- [ ] Preview table readable at 375px+ (horizontal scroll within table container is acceptable; page itself never scrolls sideways)
- [ ] `prefers-reduced-motion` respected

## Assumptions

- The Sept 2026 Assitej cohort is 100+ providers; a 500-row cap covers it (split into multiple files if larger).
- The cohort may arrive as CSV, Excel/Google Sheets export, pasted text, or individual form signups — intake is format-agnostic (FR-1). The exact channel is unknown, so all three upload/paste paths are in scope; form signups and WhatsApp poster onboarding already exist as parallel channels.
- `priceValue` in the CSV is in Rands (whole numbers), matching the signup form — the existing approval flow converts to cents for the `providers` table.
- Resend email may or may not be live by Sept — the temp-password display fallback is required either way (WS-2 behavior).
- `providerApplications.email` has no unique index; dedup is application-layer (FR-2). Adding a DB unique index is deliberately NOT in scope (existing applications may already contain duplicates from the live form).
- `activityType` values in the CSV are free text; mapping to categories happens at approval time via the existing `resolveCategoryId` logic.
- Admin users already exist (leroy@ilali.co, george@ilali.co); no new roles needed.
- The decorative Export button on `/admin/applications` stays as-is (separate backlog item).
- New dependency: `xlsx` (SheetJS) for Excel parsing — tree-shakeable, widely used; evaluate bundle impact in the plan (client-side bundle is unaffected since parsing is server-side in API routes).

## Out of Scope (→ Backlog)

| # | Feature | Trigger to Revisit |
|---|---|---|
| 1 | In-place row editing in the import preview (fix-then-commit) | When a single import consistently has >10% error rows |
| 2 | CSV export (wire the decorative Export button on `/admin/applications`) | When admins need to share queue data externally |
| 3 | DB-level unique index on `providerApplications.email` | After a cleanup pass dedupes existing rows |
| 4 | Auto-approve on import (skip the two-step review) | When the cohort is fully trusted / verified upstream |
| 5 | Bulk club invite (backlog #9 — parent-facing club invites) | Different feature; when clubs hit 30+ members |
| 6 | Import row → provider auto-linking by email (import straight into `providers`) | If a future cohort arrives already verified and listing-ready |
| 7 | Admin-scoped rate limit on import routes (e.g. 10 imports/hr) | If import abuse becomes a concern post-launch |
