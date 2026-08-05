# Implementation Plan: Responsive Image System

**Spec:** `../spec.md`
**Date:** 2026-08-05
**Status:** Ready for Tasks

## Technical Context

| Dimension | Decision | Rationale |
|---|---|---|
| Image delivery | Unsplash CDN URL params + `<picture>` element + plain `<img>` | Unsplash's imgix-based CDN does resize/crop/format natively. Bypasses Vercel's image optimizer (cost + cache limits). Art direction requires `<picture>`, which next/image doesn't support |
| Formats | `auto=format` on Unsplash (AVIF → WebP → JPEG), WebP for local crops | AVIF ~30% smaller than WebP; automatic fallback |
| Local hero crops | Pre-generated WebP files via Pillow script (committed to repo) | Gemini PNG is 7MB; two curated crops (mobile 4:3, desktop 2:1) — no runtime processing |
| Hero art direction | 2 breakpoint crops per hero: mobile ≤640px (~4:3, subject tight), desktop ≥641px (~2:1 wide) | Mobile close-up vs desktop cinematic (approved) |
| Card images | Single crop, width srcset (400/800px) — no per-device crop | 176px card, 2× retina = 352px; cropping differently is pointless |
| Focal points | Per-image `crop` hint in registry (`faces`/`entropy`/`left`/`right`/`center`/`edges`) | Unsplash `crop=` param biases crop toward subject |
| DB | No schema changes | Provider `image_url` stays; fallback logic switches to registry |
| Deploy | Standard Vercel (existing pipeline) | No new infra |

## Constitution Check

ILALI has no written constitution (prior specs set the convention). Compliance
with the project's established design rules:

- **Warm premium editorial tone** — all picks vision-QA'd; grayscale rejected.
  ✅ Phase 1-6
- **Unique image per page** — registry enforces one entry per slot; fixes
  current hero reuse. ✅ Phase 3
- **Text legibility over heroes** — crops keep left third text-safe where
  possible; existing gradient overlay + text-shadow retained. ✅ Phase 3
- **Performance discipline** — hero ≤250KB, card ≤40KB, no desktop file on
  mobile. ✅ Phase 1 (URL builder enforces widths)
- **No broken images** — fallback chain everywhere. ✅ Phase 4

## Research Summary

| Question | Decision | Alternatives considered |
|---|---|---|
| next/image vs `<picture>` | `<picture>` + plain `<img>` for ALL curated images | next/image can't art-direct (single src); Vercel optimizer proxying Unsplash wastes compute and adds cache limits |
| How to crop Gemini hero per breakpoint | Pre-generate 2 WebP crops with a Pillow script (committed) | Server-side runtime cropping (overkill); single file (defeats art direction) |
| Provider URLs with existing params | URL builder strips existing query params and rebuilds | Passing through raw URLs (can't control width/format); double params break |
| Non-Unsplash images (Supabase uploads) | Pass through as-is (no srcset) | next/image (optimizer cost); Supabase transforms (needs storage API config) |
| Where the category fallback lives | `mapProvider` image fallback → registry category entry | Keeping FLUX files (loses curation benefit) |

## Data Model

No database changes. A TypeScript registry module is the single source of truth:

```
src/lib/images/registry.ts
  ImageEntry { src, alt, crop?, local? }
  HERO_IMAGES: Record<heroKey, ImageEntry>   // browse, categories, home, clubs,
                                             // how-it-works, about, safety, contact,
                                             // locations, for-providers,
                                             // provider-resources, invite, landing
  CATEGORY_IMAGES: Record<categorySlug, ImageEntry>  // arts-culture, sports, education,
                                             // music-lessons, holiday-programs,
                                             // emotional-intelligence
```

## API Contracts

### `unsplashUrl(photoId, { w, h?, q=75, fit="crop", crop="entropy", fm="auto" })`
Builds `https://images.unsplash.com/photo-{id}?w=..&h=..&fit=crop&crop=..&q=75&fm=auto&auto=format`.
Also accepts a full existing Unsplash URL (strips params, rebuilds).

### `ResponsiveImage` component props
```ts
interface ResponsiveImageProps {
  image: ImageEntry;            // registry entry
  variant: "hero" | "card";
  className?: string;
  priority?: boolean;           // hero LCP → eager + fetchpriority=high
  sizes?: string;               // optional explicit sizes hint
}
```
- **hero**: `<picture>` with mobile source (`media="(max-width: 640px)"`, ~4:3 crop, w≈1100) + desktop source (≥641px, ~2:1 crop, w≈1920) + `<img>` fallback.
- **card**: single source, width srcset (`w=400 1x, w=800 2x`), `loading="lazy"`.
- **local** images (Gemini hero): `<picture>` sources point at pre-generated local WebP files; no Unsplash params.

### `InteriorHero` new props
Replace `imageSrc: string; imageAlt: string` with `image: ImageEntry` (resolved
from registry by the page). Internally renders `<ResponsiveImage variant="hero">`.
Container unchanged (`min-h-[32vh] sm:min-h-[42vh]`, gradient overlay, text block).

## Implementation Phases

### Phase 1: Core system
**Goal:** registry + URL builder + ResponsiveImage component, no page changes.
**Tasks:** T001-T005
**Verification:** vitest/tsc; unit-test `unsplashUrl` (params, existing-URL stripping, fm fallback).

### Phase 2: Gemini landing hero crops
**Goal:** mobile + desktop WebP crops from the 2752×1536 PNG.
**Tasks:** T006-T007
**Verification:** files exist, sizes ≤250KB, vision-QA both crops (kids in frame, left negative space, no distortion).

### Phase 3: Hero conversion (InteriorHero + 12 pages + landing)
**Goal:** every hero renders through ResponsiveImage with its curated image.
**Tasks:** T008-T013
**Verification:** `npx tsc --noEmit` clean; browser at 375px + 1440px — hero sharp, subject in frame, headline legible; network tab shows ≤800px source on mobile, ≥1920px on desktop; WebP/AVIF content-type.

### Phase 4: Category images + fallback chain
**Goal:** category pages + provider fallbacks use curated images.
**Tasks:** T014-T016
**Verification:** `/category/sports` shows curated sports image; a provider with null image falls back to the curated category image; no broken images.

### Phase 5: Card images
**Goal:** ProviderCard (and other cards) serve optimized srcset instead of full originals.
**Tasks:** T017-T019
**Verification:** network tab on /browse — card images ≤~40KB, w=400/800 srcset, AVIF/WebP; hover zoom still works.

### Phase 6: Verify + ship
**Goal:** full QA + deploy.
**Tasks:** T020-T022
**Verification:** Playwright suite green; manual browser QA (mobile/desktop, CLS check); build clean; deploy to prod; post-deploy smoke on ilali.vercel.app.

## Quickstart

```bash
cd /root/ilali
npx tsc --noEmit                     # type gate after each phase
npx vitest run                       # unit tests (URL builder)
npx playwright test --reporter=list  # E2E smoke
npm run build                        # production build gate
vercel deploy --prod --yes           # ship
```

Manual QA checklist after deploy:
1. `https://ilali.vercel.app` (landing) — Gemini hero sharp at 375px AND 1440px
2. `/browse` — hero + cards: check network tab image sizes/formats
3. `/category/sports` — curated category image
4. `/clubs/aquakids-swimming` — provider image optimized, not 3000px
5. Lighthouse: CLS ≈ 0, LCP unchanged or better
