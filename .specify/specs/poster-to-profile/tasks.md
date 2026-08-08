# Tasks: WS-7 Poster-to-Profile

**Plan:** [plan.md](./plan.md)
**Spec:** [spec.md](./spec.md)
**Date:** 2026-08-07

## Phase 1: Data + libs (foundation)
- [ ] T001 Add `poster_imports` + `message_templates` tables to `src/lib/db/schema.ts`; extend `onboardSource` comment with `'poster'`; `npx drizzle-kit push`
- [ ] T002 Create `scripts/seed-message-templates.ts` (whatsapp-outreach, email-subject, email-body) + run
- [ ] T003 Create `src/lib/ai/extract-poster.ts` — `extractPoster(imageUrl)` via NIM 90b-vision, json_object, 20s timeout, fence strip, field whitelist
- [ ] T004 Create `src/lib/web/enrich.ts` — `enrichProvider(name, category, location)` via Jina Reader + DDG HTML, NIM text synthesis, `WEB_SEARCH_PROVIDER` switch
- [ ] T005 Create `src/lib/outreach/templates.ts` (`renderTemplate`) + `src/lib/outreach/send-whatsapp.ts` (`sendWhatsApp` — wa-me default / api stub behind flag)
- [ ] T006 Add unit tests: extract-poster (mock chat), enrich (mock fetch), send-whatsapp (wa-me URL, flag off/on), templates (substitution)

## Phase 2: API routes
- [ ] T007 Create `src/app/api/admin/poster-import/route.ts` — POST multipart upload → store image → insert poster_imports (extracting) → async vision extraction → status needs_review
- [ ] T008 Create `src/app/api/admin/poster-import/[id]/enrich/route.ts` — POST → run enrichProvider → store enrichmentJson → return suggestions
- [ ] T009 Create `src/app/api/admin/poster-import/[id]/save/route.ts` — POST final fields → create providerApplications (onboardSource='poster', placeholder email) → link applicationId → status saved
- [ ] T010 Create `src/app/api/admin/applications/[id]/notify/route.ts` — POST {method} → render template → wa-me URL or email draft or api send; idempotent; mark contacted
- [ ] T011 Create `src/app/api/admin/poster-imports/route.ts` — GET list with status
- [ ] T012 Gate all routes with existing `withAdmin` pattern (verify brace pattern from skill: `});`)

## Phase 3: Admin UI (design stack: Hallmark + PDS + FD)
- [ ] T013 Create `src/app/admin/poster-import/page.tsx` — two-pane review desk
- [ ] T014 Create `src/components/admin/PosterDropzone.tsx` — drag-drop, JPG/PNG/WebP ≤10MB, client-side validation
- [ ] T015 Create `src/components/admin/ExtractionStatus.tsx` — status strip (extracting/complete/failed/manual fallback)
- [ ] T016 Create `src/components/admin/EnrichmentSuggestions.tsx` — globe icon + verify chip, accept/reject per field
- [ ] T017 Create `src/components/admin/NotifyProvider.tsx` — open wa.me, mark contacted, success state
- [ ] T018 Add poster badge to `src/app/admin/applications/page.tsx` list rows (onboardSource==='poster')
- [ ] T019 Create `tests/e2e/poster-import.spec.ts` — upload fixture → extract → save → notify (mock AI where needed)

## Phase 4: Polish + deploy
- [ ] T020 Error states: NIM down → manual form; no phone → email draft; double-notify guard
- [ ] T021 `npm run build`; full vitest + Playwright warm-server run
- [ ] T022 Vercel deploy --prod; set `WEB_SEARCH_PROVIDER=jina`, `WHATSAPP_AUTO_SEND=false` in dashboard
- [ ] T023 Update `docs/launch-plan-sept-2026.md` (WS-7 section) + ilali skill

## Dependencies
T002 depends on T001. T003-T005 depend on T001. T006 depends on T003-T005.
T007-T011 depend on T001, T003-T005. T012 gates T007-T011.
T013-T017 depend on T007-T011. T018 depends on T009. T019 depends on T013-T017.
T020-T023 depend on T019.

## Parallel Opportunities
- T003, T004, T005 can run in parallel (different files, T001 done)
- T008, T009, T010, T011 can run in parallel after T007
- T013-T017 UI components can be scaffolded in parallel once routes are stable

## MVP Scope
MVP = Phase 1 + Phase 2 + Phase 3 (upload → extract → enrich → save → notify wa-me). Phase 4 is release hardening — all required for prod, but no new features.
