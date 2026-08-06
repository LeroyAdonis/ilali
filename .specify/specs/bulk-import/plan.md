# Implementation Plan: Bulk Import (CSV → Application Queue → Batch Approve)

**Spec:** [spec.md](./spec.md)
**Date:** 2026-08-06

## Technical Context

| Dimension | Decision | Rationale |
|---|---|---|
| Frontend framework | Next.js 16 App Router (existing) | Same stack as rest of ILALI |
| Styling | Tailwind CSS v4 + ILALI design tokens | Existing `@theme inline` tokens in globals.css |
| Database | Neon PostgreSQL + Drizzle ORM | Same stack. 1 new table (`importBatches`), 1 new column on `providerApplications`, 1 comment update |
| CSV parsing | `papaparse` (new dependency) + `@types/papaparse` | Launch plan (WS-4) already names papaparse; battle-tested, handles quotes/BOM/CRLF |
| Excel parsing | `xlsx` / SheetJS (new dependency) | Multi-format intake (spec FR-1): Assitej data may arrive as an Excel/Google Sheets export. Parsed server-side with `cellFormula: false` (values only — no formula execution), first sheet only |
| Pasted text | Built-in delimiter detection (tab > comma), no dependency | Multi-format intake: admin may paste a list from email/WhatsApp. Quoted-value support, whitespace trim, header-name matching |
| Auth | Better Auth + `withAdmin` (existing) | Every new route admin-gated; NO signup rate limiter on import routes |
| Validation | `providerApplicationSchema` from `src/lib/validations.ts` (existing) | Import rows must satisfy the same rules as the signup form |
| Design skills | Hallmark + Premium Design System + Frontend Design (light pass) | Internal admin tool — consistency > distinctiveness |
| Deploy | Vercel (`ilali.vercel.app`) | Same pipeline |

## Constitution Check

| Principle | Compliance |
|---|---|
| Light, off-white theme with color-wheel accents | ✅ Import page uses `bg-paper`/`bg-paper-warm`; status chips reuse admin badge patterns |
| WCAG AA accessibility | ✅ Hallmark gates, premium-design-system contrast floor, keyboard-navigable tables |
| Mobile-first | ✅ Preview table scrolls inside its container; page itself never scrolls sideways at 375px |
| Data-source rule (reads via `@/lib/data-source`) | ⚠️ Admin flows already query the DB directly (e.g. `/admin/applications` server component, approve route) — import follows the admin pattern, not the parent-facing data-source toggle |
| Admin data isolation | ✅ `withAdmin` on every route; role check in admin layout |
| No invented metrics | ✅ Every count (approved per batch, etc.) is a real DB query — no stored counters |

## Data Model

### New Table: `importBatches`

```typescript
export const importBatches = pgTable("import_batches", {
  id: uuid("id").defaultRandom().primaryKey(),
  filename: text("filename").notNull(),
  totalRows: integer("total_rows").notNull(),        // data rows in the file (excl. header)
  importedRows: integer("imported_rows").notNull(),  // inserted as applications
  skippedRows: integer("skipped_rows").notNull(),    // rows rejected at commit
  rowErrors: jsonb("row_errors"),                    // [{ row, email, errors: string[] }] audit trail
  createdBy: text("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### New Column on `providerApplications`

```typescript
importBatchId: uuid("import_batch_id").references(() => importBatches.id),
```

Imported rows: `status = 'pending'`, `onboardSource = 'bulk-import'`.

### Comment Update on `providerApplications.onboardSource`

```typescript
onboardSource: text("onboard_source"), // 'email' | 'form' | 'whatsapp' | 'bulk-import' | null
```

Plain `text` column — no DB enum/CHECK. Comment update + insert discipline. **Flag:** the schema comment today says `'email' | 'form' | 'whatsapp' | null` (schema.ts line ~149) and must include `'bulk-import'`. `drizzle-kit push` will sync the comment.

### Derived Counts (no stored counters)

- **Approved per batch:** `SELECT COUNT(*) FROM provider_applications WHERE import_batch_id = ? AND status = 'approved'`
- **History totals:** from `importBatches` row (`importedRows`, `skippedRows`)

## CSV Format

### Expected Headers (canonical)

```csv
name,email,phone,activityType,location,ageMin,ageMax,priceValue,description
```

Header matching is case-insensitive and whitespace-tolerant; snake_case aliases accepted: `activity_type`, `age_min`, `age_max`, `price_value`, `image_url` (mapped but unused — imported rows don't set `imageUrl`).

### Sample

```csv
name,email,phone,activityType,location,ageMin,ageMax,priceValue,description
Assitej Football Academy,coach@assitej.co.za,+27 82 123 4567,sports,Khayelitsha,6,16,150,"Saturday morning football development programme"
Langa Music Studio,info@langamusic.co.za,,music-lessons,Langa,7,14,200,"Guitar and voice lessons for kids"
Cape Town Swim School,hello@ctswim.co.za,+27 21 555 0123,sports,Camps Bay,4,12,180,"Learn-to-swim and stroke correction"
```

Notes:
- `priceValue` in Rands (whole number) — the existing approval flow converts ×100 to cents.
- Optional columns: `phone`, `description` (and implicitly `location`, `ageMin`, `ageMax`, `priceValue` — empty → null).
- Empty optional cells are fine; `ageMin`/`ageMax` must be whole 0–18 and `ageMin ≤ ageMax`; phone must match `+27` regex when present.

### Limits & Security

| Guard | Value |
|---|---|
| File size | ≤ 5MB |
| Data rows | ≤ 500 |
| File type | `.csv` only (extension + parse success) |
| Cell handling | `dynamicTyping: false` — every cell a string; no formula execution |
| Rate limit | None from the signup limiter — `withAdmin` is the gate |

## API Contracts

### `POST /api/admin/import/preview`
```
Request:  multipart/form-data, field "file" (CSV)
Auth:     withAdmin (admin session required)
Action:   Parse CSV → normalize headers → validate each row against
          providerApplicationSchema + dedup checks (in-file, users,
          providerApplications pending/contacted/approved)
          → NO database writes
Response: 200 {
  totalRows, validRows, warningRows, errorRows,
  rows: [{ row, name, email, activityType, status: "valid"|"warning"|"error",
           errors: string[], warnings: string[] }]
}
Error:    400 { error } — not csv / >5MB / >500 rows / empty / malformed / bad header
```

### `POST /api/admin/import/commit`
```
Request:  JSON { filename: string, rows: ParsedRow[] }   // client sends the validated rows from preview
Auth:     withAdmin
Action:   Re-validate + re-run dedup (race-safe — state may have changed since preview),
          insert valid rows into providerApplications (multi-row insert,
          status='pending', onboardSource='bulk-import', importBatchId),
          create importBatches record
Response: 200 { batchId, imported, skipped, rowErrors: [{ row, email, errors[] }] }
Error:    400 { error } on malformed payload / 401/403 via withAdmin
```

### `POST /api/admin/applications/batch-approve`
```
Request:  JSON { ids?: string[], importBatchId?: string }   // one of the two
Auth:     withAdmin
Action:   For each eligible application (status pending|contacted):
          run shared approveApplication() in its own try/catch
Response: 200 {
  approved: [{ id, email, tempPassword, emailSent }],
  failed:   [{ id, email, error }]
}
```

### `POST /api/admin/applications/[id]` (MODIFIED — refactor only)
Behavior byte-identical. Account-creation + status + email logic moves to `src/lib/admin/approveApplication.ts`; the route becomes a thin caller. Existing tests must pass unchanged.

### `GET /api/admin/import/batches`
```
Auth:     withAdmin
Action:   List importBatches newest-first with derived approved count
Response: 200 [{ id, filename, totalRows, importedRows, skippedRows,
                 approvedCount, createdAt }]
```

## Implementation Phases

### Phase 1: CSV Parse + Validate
**Goal:** papaparse wired, rows validated + deduped, preview/commit endpoints working.

- T001 Install `papaparse` + `@types/papaparse`
- T002 Add `importBatchId` column to `providerApplications` in `src/lib/db/schema.ts`
- T003 Create `importBatches` table in `src/lib/db/schema.ts`
- T004 Update `onboardSource` comment to include `'bulk-import'`
- T005 Run `npx drizzle-kit push` to deploy schema changes
- T006 Create `src/lib/import/csv.ts` — parse + header normalization + limits
- T007 Create `src/lib/import/validate.ts` — per-row schema validation + dedup plan (pure, testable)
- T008 Create `POST /api/admin/import/preview/route.ts` (withAdmin)
- T009 Create `POST /api/admin/import/commit/route.ts` (withAdmin)
- T010 Write unit tests for csv.ts + validate.ts (valid rows, every error class, BOM, CRLF, quoted commas, caps)

### Phase 2: Import Preview UI
**Goal:** Admin uploads → sees preview → commits.

- T011 Add "Import" nav item to `src/app/admin/AdminShell.tsx`
- T012 Create `/admin/import/page.tsx` — server component shell (Upload + History tabs)
- T013 Create `ImportUpload` client component — file picker, template download, calls preview, renders per-row status table + counts
- T014 Commit confirmation ("Import N valid rows") → success summary + "Approve all pending" CTA → router.refresh
- T015 CSV template download (static file or generated blob)

### Phase 3: Batch Approve
**Goal:** Multi-select approve + approve-all-per-batch with WS-2 temp-password reporting.

- T016 Extract `src/lib/admin/approveApplication.ts` from `[id]/route.ts`; refactor route to use it (behavior unchanged)
- T017 Create `POST /api/admin/applications/batch-approve/route.ts` (withAdmin)
- T018 Add selection checkboxes + bulk bar to `/admin/applications` (new client wrapper or prop on `ApplicationCard`)
- T019 Batch summary modal — per-provider temp passwords with Copy + email-sent status
- T020 "Approve all pending" on import history rows
- T021 Unit tests for batch-approve partial-failure logic

### Phase 4: Import History
**Goal:** Audit trail of imports with derived approved counts.

- T022 Create `ImportHistory` component — list batches, expandable row errors, per-batch approve
- T023 Add `GET /api/admin/import/batches` route
- T024 Add source filter chip (`bulk-import`) on `/admin/applications`

### Phase 5: Integration + Verification Gates
**Goal:** Everything green before ship.

- T025 `npx tsc --noEmit` — zero errors
- T026 `npx vitest run` — existing 81 + new import/batch tests pass
- T027 `npm run build` — clean production build
- T028 Add Playwright e2e: admin sign-in → upload sample CSV → preview → commit → batch approve → summary shows temp passwords
- T029 `npx playwright test` — all tests pass (dev server on PORT=3001 per AGENTS.md quirk)
- T030 `vercel deploy --prod --yes`
- T031 Manual smoke: 10-row sample CSV → preview → commit → batch approve → temp passwords shown → provider can sign in

## File Manifest

### New Files (~11)
```
src/
  lib/
    import/
      csv.ts                  — parse + header normalization + caps
      validate.ts             — per-row validation + dedup (pure)
      types.ts                — ParsedRow, ImportPreview, ImportCommitResult
    admin/
      approveApplication.ts   — shared WS-1 approval logic (extracted)
  app/
    api/
      admin/
        import/
          preview/route.ts
          commit/route.ts
          batches/route.ts
        applications/
          batch-approve/route.ts
    admin/
      import/
        page.tsx              — server shell, Upload + History tabs
        ImportUpload.tsx      — client: upload → preview → commit
        ImportHistory.tsx     — client: batch list, errors, per-batch approve
        csv-template.csv      — downloadable template (or generated)
  __tests__/ or src/lib/__tests__/
    import.test.ts            — csv + validate unit tests
    batch-approve.test.ts     — partial-failure logic tests
tests/e2e/
  admin-import.spec.ts        — full import + batch approve smoke
```

### Modified Files (~5)
```
src/
  lib/db/schema.ts                 — importBatches table, importBatchId column, onboardSource comment
  app/api/admin/applications/[id]/route.ts — refactor to shared approveApplication (behavior unchanged)
  app/admin/applications/page.tsx  — selection wrapper / pass-through for bulk approve
  app/admin/applications/ApplicationCard.tsx — optional selectable prop (checkbox)
  app/admin/AdminShell.tsx         — "Import" nav item
package.json                       — papaparse, @types/papaparse
```

## OpenCode Dispatch Strategy

**Batch 1 — Foundation (Phase 1, sequential):** Schema + parsing + endpoints are tightly coupled (drizzle push must verify between steps). Run sequentially — schema first, then csv.ts/validate.ts (pure, testable), then the two routes.

**Batch 2 — UI (Phases 2 + 4, one agent):** ImportUpload + ImportHistory + AdminShell nav + applications filter are all client UI on top of Batch 1's endpoints. One agent, one worktree `bulk-import-ui`:
```
Read .specify/specs/bulk-import/spec.md and plan.md first.
Build the import UI:
- src/app/admin/import/page.tsx + ImportUpload.tsx + ImportHistory.tsx
- src/app/admin/AdminShell.tsx "Import" nav item
- src/app/admin/applications selection + source filter
Follow the existing admin design language (ApplicationCard, AdminStatusBadge).
Run npm run build after implementation.
```

**Batch 3 — Batch Approve (Phase 3, sequential with Batch 1):** Depends on `approveApplication.ts` extraction. Do the refactor first (verify `[id]` route unchanged via existing tests), then the batch route, then the UI wiring.

**Batch 4 — Verification (Phase 5):** tsc → vitest → build → playwright → deploy, in order.

**Parallel opportunities:** Batch 2 (UI) can start once preview/commit endpoints exist; Batch 3's route can be built in parallel with Batch 2's UI. Phase 1 and the approveApplication extraction are the critical path.

## Dependencies

```
Phase 1 (schema + parse + endpoints) ──→ Phase 2 (preview UI) ──→ Phase 4 (history)
        │                                              ↑
        └─→ Phase 3 (batch approve: refactor → route → UI) ──┘
        └────────────────────────────────────────→ Phase 5 (gates)
```

## MVP Scope

MVP = Phase 1 + Phase 2 + Phase 3 (upload → preview → commit → batch approve with temp-password summary). Phase 4 (history) is small and ships in the same release but can be trimmed to a plain list if time-constrained. Phase 5 is mandatory before deploy.

## Quickstart

```bash
# Setup
cd /root/ilali
npm install papaparse @types/papaparse
npx drizzle-kit push                                    # Deploy schema (import_batches + import_batch_id + comment)

# Verify
npx tsc --noEmit
npx vitest run
npm run build
PORT=3001 npx playwright test                           # dev server port quirk (AGENTS.md)

# Deploy
vercel deploy --prod --yes
```
