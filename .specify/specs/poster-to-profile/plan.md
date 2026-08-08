# Implementation Plan: WS-7 Poster-to-Profile

**Spec:** [spec.md](./spec.md)
**Constitution:** [../../memory/constitution.md](../../memory/constitution.md)
**Date:** 2026-08-07

## Technical Context

| Dimension | Decision | Rationale |
|---|---|---|
| Frontend | Next.js 16 App Router + React 19 (existing) | No new framework |
| Admin UI | New `/admin/poster-import` page + panel in applications | Matches existing admin patterns |
| DB | Neon Postgres + Drizzle (existing) | Two new small tables, one enum value |
| Auth | Better Auth admin gate (`proxy.ts` + route check) | Existing WS-1 pattern |
| Vision AI | NVIDIA NIM `meta/llama-3.2-90b-vision-instruct` via existing `chat()` client | Free, bake-off winner for vision |
| Web search | Jina Reader (`r.jina.ai` + DDG HTML) — zero key, verified working; `WEB_SEARCH_PROVIDER` env switch | Free, mirrors agent-reach; swappable to Webclaw/Serper later |
| Outreach | `sendWhatsApp()` abstraction: wa.me link (default) / Business API (flagged) | Spec requirement: semi-auto now, auto-ready |
| Image storage | Existing upload mechanism (check `/api/providers/verify` pattern) | No new infra |
| Deploy | Vercel, env vars in dashboard | Existing flow |

## Constitution Check

| Principle | Compliance |
|---|---|
| 1. Trust First | Poster-sourced applications enter the SAME pending/approval queue — no auto-public listings. ✅ |
| 2. Warm Family Aesthetic | Admin UI uses existing ilali teal/rounded card language. ✅ |
| 3. Mobile-First CT Local | Poster flow is admin/desktop-focused; extracted suburbs validated against CT_SUBURBS. ✅ |
| 4. Community-Powered Growth | **This IS the growth engine principle** — WhatsApp group → auto profile. ✅ |
| 5. MVP Simplicity | One poster at a time, reuses approval flow, no new auth/payments. ✅ |
| 6. SA Context | WhatsApp outreach (+27), claim codes (WS-3), Rands pricing extraction. ✅ |
| 7. Build-Then-Ship | Phases defined, MVP = upload→extract→enrich→save→notify(wa.me). ✅ |

## Data Model

### 1. `poster_imports` (NEW — audit + extraction snapshot)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| imagePath | text | uploaded poster (Vercel blob or /public-uploads) |
| extractedJson | jsonb | raw vision extraction snapshot (before human edits) |
| enrichmentJson | jsonb | web-sourced suggestions [{field, value, sourceUrl}] |
| finalJson | jsonb | human-approved fields at save time |
| status | text | `extracting` → `needs_review` → `saved` → `contacted` |
| contactedAt | timestamp | set when "Notify provider" used |
| outreachMethod | text | `wa-me` \| `email-draft` \| `whatsapp-api` \| null |
| applicationId | uuid FK → providerApplications | link after save |
| createdBy | uuid FK → users | admin who ran it |
| createdAt | timestamp | |

### 2. `message_templates` (NEW — centralised outreach copy)

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| templateKey | text unique | `whatsapp-outreach`, `email-subject`, `email-body` |
| body | text | with `{{providerName}}`, `{{activityName}}`, `{{claimUrl}}` |
| updatedAt | timestamp | |

### 3. `providerApplications` (MODIFY — additive only)

- `onboardSource` comment: add `'poster'` to allowed values
- No column changes needed (has imageUrl, phone, status already)
- `email` is NOT NULL today — poster flow uses placeholder `poster-<id>@ilali.co` (established pattern from WS-3 provider accounts)

### 4. Message templates seeded

WhatsApp (default):
```
Hi {{providerName}}! 👋 We saw your {{activityName}} in the Fun with Kids group and
have already created your free listing on ILALI — Cape Town's home for kids' activities.
Claim your profile here: {{claimUrl}} (your code: {{claimCode}})
```
Email subject: `Your {{activityName}} listing is ready on ILALI 🎉`
Email body: same message + longer explanation + no-code-required note.

## API Contracts

### POST `/api/admin/poster-import` (multipart/form-data)
Admin-only. Uploads image → returns `{ posterImportId, status: "extracting" }`.
Flow: store image → insert poster_imports (extracting) → async vision extraction → update extractedJson + status `needs_review`.

### POST `/api/admin/poster-import/[id]/enrich`
Admin-only. Given extracted name → Jina/DDG search → scrape top results → NIM synthesis → `{ suggestions: [{ field, value, sourceUrl }] }`. Stores enrichmentJson. Idempotent.

### POST `/api/admin/poster-import/[id]/save`
Admin-only. Body = final approved fields. Creates providerApplications row (onboardSource='poster', placeholder email), links applicationId, status → `saved`.

### POST `/api/admin/applications/[id]/notify`
Admin-only (extends existing applications route or new). Body = `{ method: "wa-me" | "email-draft" }`.
- wa-me: returns `{ waUrl }` (pre-filled with template + claim code if available); marks poster_import contacted + outreachMethod
- email-draft: returns `{ subject, body }` for manual copy
- auto path: if `WHATSAPP_AUTO_SEND=true` AND Business API configured → calls `sendWhatsApp()`, records `whatsapp-api`
- Idempotent: already contacted → return existing waUrl / 409-ish notice

### GET `/api/admin/poster-imports`
Admin-only. List recent imports with status for the admin page.

### lib: `src/lib/ai/extract-poster.ts` (NEW)
`extractPoster(imageUrl): Promise<PosterExtract | null>` — vision call (90b-vision) with json_object format, timeout ~20s, fence stripping (existing pattern), field whitelist.

### lib: `src/lib/outreach/send-whatsapp.ts` (NEW)
`sendWhatsApp({ phone, templateKey, vars }): Promise<{ mode: "wa-me", waUrl } | { mode: "api", status }>` — reads `WHATSAPP_AUTO_SEND`; wa-me path builds URL; api path stubs the Business API call (throws "not configured" until SIM+verification).

### lib: `src/lib/outreach/templates.ts` (NEW)
`renderTemplate(key, vars)` — loads message_templates, substitutes `{{var}}`.

### lib: `src/lib/web/enrich.ts` (NEW)
`enrichProvider(name, category, location): Promise<EnrichmentSuggestion[]>` — reads `WEB_SEARCH_PROVIDER` (`jina` default): DDG HTML via r.jina.ai → top 3-5 links → r.jina.ai scrape → NIM text synth → suggestions. Upgrade: `webclaw` (zahra) or `serper` key.

## Implementation Phases

### Phase 1: Data + libs (foundation)
**Tasks:**
- [ ] T001 Drizzle schema: `poster_imports` + `message_templates` in `src/lib/db/schema.ts`; push to Neon
- [ ] T002 Seed message templates (script in `scripts/seed-message-templates.ts`)
- [ ] T003 `src/lib/ai/extract-poster.ts` — vision extraction
- [ ] T004 `src/lib/web/enrich.ts` — Jina/DDG search + NIM synthesis
- [ ] T005 `src/lib/outreach/templates.ts` + `send-whatsapp.ts`
- [ ] T006 Unit tests for T003-T005 (mock chat/search)

**Verification:** `npx tsc --noEmit` clean; `npx vitest run` all green (incl. new tests); drizzle push to Neon OK; template seed inserts rows.

### Phase 2: API routes
**Tasks:**
- [ ] T007 POST `/api/admin/poster-import` (upload → store → insert → async extract)
- [ ] T008 POST `/api/admin/poster-import/[id]/enrich`
- [ ] T009 POST `/api/admin/poster-import/[id]/save`
- [ ] T010 POST `/api/admin/applications/[id]/notify`
- [ ] T011 GET `/api/admin/poster-imports`
- [ ] T012 Admin-gate all (withAdmin pattern — existing)

**Verification:** curl the routes with admin cookie (pattern in skill references); tsc + vitest; extract returns JSON; enrich returns suggestions; save creates application; notify returns waUrl.

### Phase 3: Admin UI (design stack mandatory — Hallmark + PDS + FD)
**Tasks:**
- [ ] T013 `/admin/poster-import/page.tsx` — two-pane review desk (poster left, form right, sticky action bar)
- [ ] T014 Poster dropzone (client component, drag-drop + file validation)
- [ ] T015 Extraction status strip (extracting → complete/failed → manual fallback form)
- [ ] T016 Enrichment suggestions UI (globe icon + "verify" chip, accept/reject per field)
- [ ] T017 Notify action (wa.me open in new tab, mark contacted, success state)
- [ ] T018 Poster badge on `/admin/applications` list
- [ ] T019 E2E test: upload fixture poster → extract → save → notify (mock AI where needed)

**Verification:** manual browse of `/admin/poster-import` (screenshot QA), Playwright new spec green, tsc/vitest/build clean.

### Phase 4: Polish + deploy
**Tasks:**
- [ ] T020 Error states (NIM down → manual form; no phone → email draft; double-notify guard)
- [ ] T021 `npm run build` + full test suite + E2E warm-server run
- [ ] T022 Vercel deploy --prod; env vars (`WEB_SEARCH_PROVIDER`, `WHATSAPP_AUTO_SEND=false`) in dashboard
- [ ] T023 Update launch plan + ilali skill

**Verification:** prod HTTP 200; admin flow works live; test suite green.

## Quickstart (validate end-to-end)

```bash
# local
cd /root/ilali && npm run dev   # port 3001
# admin login (existing): leroy@ilali.co / ilali-admin-2026
# go to /admin/poster-import, upload a fixture poster
# expect: extraction status → fields appear → enrich → save → notify
# run tests
npx tsc --noEmit && npx vitest run && npx playwright test tests/e2e/poster-import.spec.ts
```

Expected outcome: a providerApplication with onboardSource='poster' appears in /admin/applications with the poster badge; Notify opens a pre-filled wa.me message.
