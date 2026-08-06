# Tasks: Bulk Import (CSV → Application Queue → Batch Approve)

**Plan:** [plan.md](./plan.md)
**Spec:** [spec.md](./spec.md)

## Phase 1: Multi-Format Parse + Validate

- [ ] T001 Install `papaparse` + `@types/papaparse` AND `xlsx` (SheetJS) — new dependencies
- [ ] T002 Add `importBatchId` column to `providerApplications` in `src/lib/db/schema.ts` (nullable uuid FK → import_batches.id)
- [ ] T003 Create `importBatches` table in `src/lib/db/schema.ts` (id, filename, totalRows, importedRows, skippedRows, rowErrors jsonb, createdBy → users.id, createdAt)
- [ ] T004 Update `onboardSource` column comment in `src/lib/db/schema.ts` to `'email' | 'form' | 'whatsapp' | 'bulk-import' | null`
- [ ] T005 Run `npx drizzle-kit push` to deploy schema changes to Neon; verify `import_batches` exists and comment synced
- [ ] T006 Create `src/lib/import/types.ts` — ParsedRow, ImportPreview, ImportCommitResult types
- [ ] T007 Create `src/lib/import/normalize.ts` — shared `normalizeIntake()`: CSV via papaparse (`dynamicTyping: false`, BOM/CRLF tolerance), XLSX/XLS via `xlsx` (SheetJS, `cellFormula: false`, first sheet only), pasted text via delimiter detection (tab > comma) with quoted-value support. All → same ParsedRow model. Case-insensitive header normalization (snake_case aliases), header matched by NAME not position, file/row caps (5MB, 500 rows), structural error detection (bad header, empty file, unbalanced quotes, unrecognized format)
- [ ] T008 Create `src/lib/import/validate.ts` — pure per-row validation: providerApplicationSchema semantics (name ≥ 2, email format, +27 phone, ages 0–18 ints, ageMin ≤ ageMax, price ≥ 0) + dedup plan (in-file dup, users table, providerApplications pending/contacted/approved) + unknown-activityType warning
- [ ] T009 Create `POST /api/admin/import/preview/route.ts` — withAdmin; multipart file (csv/xlsx/xls) OR `{ text }` pasted body → normalize → validate → dedup (read-only DB queries) → per-row report; 400 on structural failures; NO writes
- [ ] T010 Create `POST /api/admin/import/commit/route.ts` — withAdmin; re-validate + re-dedup (race-safe), multi-row insert into providerApplications (status='pending', onboardSource='bulk-import', importBatchId), create importBatches row, return { batchId, imported, skipped, rowErrors }
- [ ] T011 Write unit tests in `src/lib/__tests__/import.test.ts` — valid rows, every error class (missing/bad email, dup in file, dup in users, dup in pending application, rejected application re-importable, bad phone/age/price, ageMin>ageMax), BOM, CRLF, quoted commas, header aliases, row/file caps, malformed file errors, xlsx parse, pasted-tab-text parse, pasted-comma-text parse

## Phase 2: Import Preview UI

- [ ] T012 Add "Import" nav item (Upload icon) to `src/app/admin/AdminShell.tsx`
- [ ] T013 Create `/admin/import/page.tsx` — server component shell with Upload / History tabs (admin layout gating)
- [ ] T014 Create `src/app/admin/import/ImportUpload.tsx` — client component: file picker + dropzone (csv/xlsx/xls) AND a paste-text textarea (tab/comma separated) with format tabs, "Download CSV template" link, calls `POST /api/admin/import/preview`, renders per-row status table (row #, name, email, activityType, ✅/⚠️/❌ chip, errors/warnings text) + counts summary
- [ ] T015 Commit flow: "Import N valid rows" confirmation → `POST /api/admin/import/commit` → success summary (imported/skipped) + "Approve all pending" CTA → router.refresh
- [ ] T016 Add downloadable CSV template (`csv-template.csv` with exact headers: name,email,phone,activityType,location,ageMin,ageMax,priceValue,description)
- [ ] T017 Design QA (light pass): token discipline, 8 states on all interactive elements, 375px+ readable preview table (scroll inside container only), WCAG AA, no invented metrics

## Phase 3: Batch Approve

- [ ] T018 Extract shared approval logic from `src/app/api/admin/applications/[id]/route.ts` into `src/lib/admin/approveApplication.ts` (createProviderAccount + providers link/create + status update + WS-2 email fire) and refactor the route to use it — behavior byte-identical, existing tests pass unchanged
- [ ] T019 Create `POST /api/admin/applications/batch-approve/route.ts` — withAdmin; accepts `{ ids }` or `{ importBatchId }`; per-row independent try/catch; returns `{ approved: [{ id, email, tempPassword, emailSent }], failed: [{ id, email, error }] }`; failed rows keep their status
- [ ] T020 Add selection support to `/admin/applications` — checkboxes on pending/contacted cards (selectable prop on ApplicationCard or wrapper), bulk bar "Approve selected (N)", disabled states while busy
- [ ] T021 Create batch summary modal — per-provider temp passwords with Copy buttons + per-row "📧 Welcome email sent" vs "Email sending not configured — copy manually" (WS-2 consistent)
- [ ] T022 Add "Approve all pending (N)" action on import history rows → calls batch-approve with `{ importBatchId }`
- [ ] T023 Write unit tests in `src/lib/__tests__/batch-approve.test.ts` — partial success (some rows fail, others approve), failed rows unchanged, email non-blocking, ineligible statuses skipped with error

## Phase 4: Import History

- [ ] T024 Create `GET /api/admin/import/batches/route.ts` — withAdmin; list importBatches newest-first with derived `approvedCount` (COUNT provider_applications WHERE import_batch_id = ? AND status='approved')
- [ ] T025 Create `src/app/admin/import/ImportHistory.tsx` — batch list (filename, date, imported, skipped, approved), expandable row-error audit (from rowErrors jsonb), "Approve all pending" per batch
- [ ] T026 Add source filter chip ("Bulk imports") on `/admin/applications` — filters `onboardSource = 'bulk-import'` via query param
- [ ] T027 Verify derived counts match actual applications after a real import + approvals

## Phase 5: Integration + Verification Gates

- [ ] T028 Full `npx tsc --noEmit` — zero errors
- [ ] T029 Full `npx vitest run` — existing 81 + new import/batch tests pass
- [ ] T030 `npm run build` — clean production build
- [ ] T031 Create Playwright e2e `tests/e2e/admin-import.spec.ts` — admin sign-in → /admin/import → upload sample CSV → preview shows rows → commit → batch approve → summary shows temp passwords
- [ ] T032 Full `npx playwright test` — all tests pass (PORT=3001 dev server quirk)
- [ ] T033 `vercel deploy --prod --yes` — deploy to ilali.vercel.app
- [ ] T034 Manual smoke: 10-row sample CSV → preview → commit → batch approve → temp passwords displayed → sign in as imported provider → forced password creation

## Dependencies

```
T001-005 (schema + deps) → T006-008 (parse/validate libs) → T009-010 (endpoints)
T009-010 → T012-017 (preview UI)                    → T024-027 (history)
T018 (approveApplication refactor) → T019 (batch route) → T020-022 (UI wiring)
T012-017 + T020-022 → T028-034 (verification gates)
```

## Parallel Opportunities

- T006-008 (pure libs) can be written before T009-010 but after T005 (schema) — no DB dependency in csv.ts/validate.ts except the dedup inputs which are passed in
- Phase 2 (UI) runs on top of preview/commit endpoints — start once T009-010 merge
- T018 (refactor) is the critical path for Phase 3 — do it first, verify with existing tests, then T019
- Phase 4 (history) can be built in parallel with Phase 3 UI once T010 (commit) exists
- T028-030 (tsc/vitest/build) run sequentially; T031-032 (playwright) after build

## OpenCode Dispatch Strategy

**Batch 1 — Foundation (Phase 1, sequential, run in-session):** Schema changes need `drizzle-kit push` verification between steps; csv.ts/validate.ts are pure and unit-tested before the routes are written. Do not parallelize.

**Batch 2 — UI (Phases 2 + 4, one agent):** worktree `bulk-import-ui`
```
Read .specify/specs/bulk-import/spec.md and plan.md first.
Build the admin import UI:
- src/app/admin/import/page.tsx + ImportUpload.tsx + ImportHistory.tsx
- src/app/admin/AdminShell.tsx "Import" nav item
- src/app/admin/applications: selection checkboxes + bulk approve bar + source filter chip
- csv-template.csv
Follow existing admin design language (ApplicationCard, AdminStatusBadge, light tokens).
Run npm run build after implementation.
```

**Batch 3 — Batch Approve (Phase 3, one agent):** worktree `bulk-import-batch-approve` — requires T018 refactor merged first:
```
Read .specify/specs/bulk-import/spec.md and plan.md first.
- src/lib/admin/approveApplication.ts (extract from [id]/route.ts, behavior unchanged)
- src/app/api/admin/applications/batch-approve/route.ts
- Batch summary modal + bulk bar wiring in /admin/applications
Run npm run build + npx vitest run after implementation.
```

**Batch 4 — Verification (Phase 5):** tsc → vitest → build → playwright → deploy, in order, in-session.

## MVP Scope

MVP = Phase 1 + Phase 2 + Phase 3 (upload → preview → commit → batch approve with temp-password summary). Phase 4 (history) ships in the same release; if time-constrained, trim to a plain batch list without expandable errors. Phase 5 is mandatory before deploy.
