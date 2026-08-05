# Tasks: Responsive Image System

**Plan:** `../plan.md`
**Spec:** `../spec.md`

## Phase 1: Core system
- [ ] T001 Create `src/lib/images/registry.ts` — `ImageEntry` type + `HERO_IMAGES` (13 keys incl. `landing` → local Gemini) + `CATEGORY_IMAGES` (6 keys) with all approved photo IDs + alts from spec Appendix A
- [ ] T002 Create `src/lib/images/unsplash.ts` — `unsplashUrl(photoId|fullUrl, { w, h?, q=75, fit, crop, fm })` builder; strips existing query params; `fm=auto` default
- [ ] T003 Create `src/components/ResponsiveImage.tsx` — hero variant (`<picture>` media ≤640px / ≥641px, srcset 1x+2x, priority→eager+fetchpriority) + card variant (single source width srcset, lazy); local image support (no params)
- [ ] T004 Unit tests: `src/lib/images/unsplash.test.ts` — params correct, existing-URL stripping, fm fallback, crop hint passthrough
- [ ] T005 [P] `src/lib/images/index.ts` barrel export (registry + unsplashUrl + component types)

## Phase 2: Gemini landing hero crops
- [ ] T006 Write `scripts/generate-hero-crops.py` — opens `/root/ilali-landing-page-banner.png` (or repo copy), crops mobile 4:3 (subject right) + desktop 2:1 (left negative space), saves WebP q≈80 to `public/images/hero/hero-landing-mobile.webp` + `hero-landing-desktop.webp`; commit the 7MB PNG to `public/images/hero/hero-landing-source.png` (or git-lfs note) OR keep source at `/root` and commit only crops (decision: commit only crops — repo hygiene)
- [ ] T007 Vision-QA both crops; re-tune crop offsets until kids in frame + left text-safe

## Phase 3: Hero conversion
- [ ] T008 Rewrite `src/components/InteriorHero.tsx` — props `image: ImageEntry` (replaces imageSrc/imageAlt); render `<ResponsiveImage variant="hero">` inside existing container; keep gradient overlay + text block classes
- [ ] T009 [P] Update 12 pages to pass `image={HERO_IMAGES.<key>}`: browse, categories, home, clubs, how-it-works, about, safety-guidelines, safeguarding, contact, locations, for-providers, provider-resources, providers/why-list, invite (14 call sites; note: locations/safeguarding/for-parents/invite get their OWN images — fixes reuse)
- [ ] T010 Update landing `src/app/page.tsx` hero — swap FLUX `hero-kids.jpg` for `<ResponsiveImage image={HERO_IMAGES.landing} variant="hero" priority>`
- [ ] T011 `npx tsc --noEmit` clean; `npx vitest run` clean
- [ ] T012 [P] Browser QA at 375px + 1440px across /browse, /clubs, /safeguarding — sharpness, subject framing, legibility, network source widths
- [ ] T013 Delete now-unused FLUX hero files from `public/images/hero/` (keep only landing crops + any still referenced)

## Phase 4: Category images + fallback chain
- [ ] T014 Update `src/lib/db/mappers.ts` — `mapProvider` image fallback: `dbRow.imageUrl ?? CATEGORY_IMAGES[category]` source resolution (keep returning a string URL or pass category key — decide in code; goal: category pages + card fallbacks render curated images)
- [ ] T015 Update `/category/[slug]` hero + CategoryCard (`src/components/CategoryCard.tsx`) to render curated category image via ResponsiveImage
- [ ] T016 Verify fallback: provider with `image_url = null` shows curated category image; no broken images anywhere

## Phase 5: Card images
- [ ] T017 Update `src/components/ProviderCard.tsx` — swap plain `<img>` for `<ResponsiveImage variant="card">` (srcset 400/800, lazy, WebP/AVIF via Unsplash URL builder); keep hover zoom + badge overlay
- [ ] T018 Sweep other cards rendering provider images (AIChatPanel matches, club cards on /clubs, ListingCardPreview) — reuse ResponsiveImage card variant where they render `provider.image`
- [ ] T019 Network-verify on /browse: card images ≤~40KB, formats AVIF/WebP, no 3000px originals

## Phase 6: Verify + ship
- [ ] T020 `npx playwright test --reporter=list` green (no regressions from image changes)
- [ ] T021 `npm run build` clean (NODE_OPTIONS memory guard if needed); `npx tsc --noEmit` clean
- [ ] T022 Commit + push + `vercel deploy --prod --yes`; post-deploy smoke: landing hero, /browse, /category/sports, /clubs/aquakids-swimming; Lighthouse CLS ≈ 0

## Dependencies
T006→T007→T010. T008→T009→T011. T014→T015→T016. T017→T018→T019.
T003→T008. T001→T003. T005→T008/T014/T017 (barrel).
Phase 4 needs Phase 1 (registry). Phase 5 needs Phase 1. Phase 3/4/5 → Phase 6.

## Parallel Opportunities
- T002, T004 can run parallel (different files)
- T009 page updates run parallel after T008
- Phase 4 and Phase 5 run parallel after Phase 1 (disjoint files: mappers/CategoryCard vs ProviderCard)

## MVP Scope
MVP = Phase 1 + Phase 2 + Phase 3 (heroes: the visible "blurry/crop" complaint).
Phases 4-5 (categories + card perf) are high-value but separable; ship in same
release since the registry is in place.
