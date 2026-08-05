# Feature Spec: Responsive Image System

**Date:** 2026-08-05
**Status:** Clarified — Ready for Planning
**Vision owner:** Leroy
**Related:** Interior redesign (shipped), Hero image debugging (`references/interior-hero-images.md`)

## Vision Statement

Every image on ILALI should feel sharp, intentional, and right-sized on whatever
screen a parent opens — a phone shows the kids close and joyful, a desktop shows
the full wide scene, and nothing ever looks stretched, blurry, or slow. Images
come from one curated library (Unsplash + one Gemini hero), served in modern
formats, so the whole site has a consistent warm, premium, editorial feel instead
of a mix of AI-generated and stock images with different qualities.

## Context — Why This Spec Exists

Leroy: *"Not happy with how it looks right now."* Diagnosis (verified on prod):

1. **Hero banners are soft/blurry on desktop.** All 13 interior banners are
   FLUX-generated at 1344×768 max. On a 1920px+ screen they upscale ~1.4× and
   crop up to ~57% — the landing hero literally reads as "soft and blurry" in
   visual QA. FLUX free tier cannot produce bigger sources.
2. **Provider card images are unoptimized.** Cards use a bare `<img>` pointing at
   full-size Unsplash originals (often 3000px+) to fill a 176px-tall card —
   wasted bytes and slow loads, especially on mobile data.
3. **No per-device cropping.** Heroes serve one image to every viewport, so
   phones show a thin slice of the subject instead of a composed shot.
4. **Inconsistent sources.** FLUX heroes + Unsplash provider images + Supabase
   uploads create visible quality/style drift.

**Decisions already made (grilled & approved 2026-08-05):**
- Landing hero = **Gemini-generated image** (2752×1536, provided by Leroy at
  `/root/ilali-landing-page-banner.png`), replacing FLUX `hero-kids.jpg`.
- All other hero banners = **curated Unsplash photos** ("joyful kids doing the
  activity" standard is sufficient; landing carries the Cape Town identity).
- **Heroes: art direction** (different crops per breakpoint). **Cards: srcset
  scaling** (same image, different widths).
- **Modern formats: WebP, AVIF where supported**.
- All picks are approved by Leroy (see Appendix A).

## User Scenarios

### Scenario 1: Parent on a phone (mobile hero)
**As a** parent browsing on a phone
**I want** the hero banner to show the kids close and clear, not a thin slice of a wide photo
**So that** the page feels designed for my device, not squished

**Acceptance criteria:**
- [ ] On a 375px-wide screen, the hero shows the subject (kids/activity) prominently in frame — no more than 20% of the subject cropped out of a tight, composed shot
- [ ] The headline text remains legible over the image with the warm overlay
- [ ] Hero image loads from a mobile-sized source (≤ ~800px wide), not a desktop 1920px file

### Scenario 2: Parent on a desktop (wide hero)
**As a** parent on a laptop/desktop
**I want** the hero to show the full wide scene with the negative space for the headline
**So that** it reads as the cinematic banner the design calls for

**Acceptance criteria:**
- [ ] On a 1440px+ screen, the hero serves a ≥1920px-wide crop and is sharp (no upscale blur)
- [ ] The left third of the hero remains calm (subject right-of-center or text-safe) so the headline + gradient overlay stay legible

### Scenario 3: Browsing cards on mobile data
**As a** parent on 3G/4G
**I want** provider cards and category tiles to load fast without downloading huge originals
**So that** browsing doesn't eat my data or stall

**Acceptance criteria:**
- [ ] Card images download at ≤ ~400px wide (2× retina of a 176px card) instead of the full original
- [ ] Images are served in AVIF/WebP when the browser supports it
- [ ] No layout shift while images load (space reserved by aspect ratio)

### Scenario 4: Adding a new page in future
**As a** developer (Ricky or a subagent)
**I want** one obvious place to add an image for a new page
**So that** new pages get consistent images without hunting through components

**Acceptance criteria:**
- [ ] Adding a hero to a new page is a single registry entry (image + alt + crop hint) — no bespoke per-page image code
- [ ] The registry is the single source of truth for curated images

## Functional Requirements

### FR-1: Art-directed hero banners
Hero banners serve different crops per breakpoint: a tight mobile crop
(subject fills frame, ~4:3) and a wide desktop crop (~2:1, negative space for
headline). At least 2 breakpoint variants per hero; tablet may share desktop.

### FR-2: Responsive card/category images
Card and tile images (provider cards, category tiles, club cards) serve
width-based variants (srcset) sized to their rendered box ×2 for retina.
No per-device cropping needed for cards.

### FR-3: Curated image registry
A single registry defines every curated image on the site: page/category →
image source + alt text + crop hint (focal point bias). Both Unsplash photo
references and local files (Gemini hero) live in the same registry. No
hardcoded image URLs scattered in page components.

### FR-4: Modern formats with fallback
Images served as AVIF where supported, WebP everywhere else, JPEG as last
resort. Automatic — a parent never sees a broken image.

### FR-5: Gemini landing hero
The landing hero uses the Gemini-generated 2752×1536 image, with a mobile
crop and a desktop crop derived from it. It must preserve the approved
composition (kids right, negative space left, Table Mountain).

### FR-6: Unique image per page
Every hero slot gets its own image. No two pages share a hero image
(fixes current reuse: /locations reuses hero-browse, /for-parents reuses
hero-home, /safeguarding reuses hero-safety, /invite reuses hero-kids).

### FR-7: Provider images stay as content, get optimized delivery
Provider-uploaded/assigned images (currently Unsplash URLs per provider, plus
future Supabase uploads) are NOT re-curated — they are content. They get the
same responsive delivery (srcset + AVIF/WebP) but keep their own URLs.

### FR-8: Accessibility
Every image has meaningful alt text (from the registry). Decorative overlay
elements are hidden from screen readers.

### FR-9: Graceful failure
If an image fails to load (provider deleted their Unsplash image, network
failure), the component falls back: curated image → category fallback →
branded placeholder. No broken-image icon on prod.

### FR-10: Crop hints
The registry stores a focal/crop hint per image (e.g. "subject right", "faces")
so crops keep the important content in frame at every breakpoint. Hints are
tuned per image during implementation QA.

## Non-Functional Requirements

### NFR-1: Performance
- Hero banners: largest hero source ≤ ~250KB (AVIF/WebP, q≈75-80). LCP
  budget on hero pages unchanged or improved vs today.
- Card images: ≤ ~40KB each at 2× retina.
- Mobile hero must not download the desktop source (no 1920px file on a phone).
- No layout shift (CLS ≈ 0) from images — aspect ratio reserved.

### NFR-2: Accessibility
- WCAG 2.1 AA: meaningful alt text on all content images.
- Decorative images `aria-hidden` + empty alt.

### NFR-3: Maintainability
- Registry entries are plain data (add/swap an image = edit one line, no code).
- Format/URL construction logic lives in one place.

### NFR-4: Robustness
- Unsplash CDN URLs are stable photo IDs (not the deprecated Source API).
- Fallback chain never renders a broken image.

## Key Entities

- **Hero Slot** — a page-level banner (Browse, Categories, Home, Clubs, How It
  Works, About, Safety, Contact, Locations, For Providers, Provider Resources,
  Invite, Landing).
- **Category Image** — image for a category tile/header (Arts & Culture,
  Sports, Education, Music Lessons, Holiday Programs, Emotional Intelligence).
- **Provider Image** — per-provider content image (not curated, content-owned).
- **Registry Entry** — slot + source (Unsplash photo or local file) + alt +
  crop hint + breakpoint crop definitions.
- **Breakpoint Crop** — the target aspect/crop for a device class (mobile ~4:3
  vs desktop ~2:1), used to build per-device sources.

## Visual/UX Direction

The site's approved design language: warm off-white paper (#FFFFFD / #FBF8F2),
ink text, teal/gold/purple/orange color-wheel accents, Bricolage display type,
mono eyebrows. Images must feel like a **premium family brand campaign** —
golden-hour warmth, joyful authentic kids, editorial grade, never stocky or
over-saturated.

- The **landing hero** keeps the Cape Town identity (Gemini shot).
- **Interior heroes** are "joyful kids doing the activity" — warm, natural,
  authentic; subject placed to keep the left third text-safe where possible.
- On **mobile**, the hero should feel composed — kids big in frame, no awkward
  head-crops. On **desktop**, wide and cinematic.
- **Cards/tiles**: bright, warm, consistent quality; faces natural.
- No grayscale, no heavy filters, no text/watermarks baked into images.

## Assumptions

- Unsplash photo hotlinking via `images.unsplash.com` CDN params is permitted
  and stable for the free license (standard practice; no API key needed).
- The Gemini landing image at `/root/ilali-landing-page-banner.png`
  (2752×1536) is the final landing hero source.
- Existing provider Unsplash URLs remain valid; if a provider image 404s, the
  fallback chain handles it.
- Category fallback images (currently FLUX) are replaced by curated Unsplash
  picks as part of this work.

## Out of Scope

1. **Migrating provider-uploaded storage (Supabase) to a CDN** — provider
   uploads keep working via the same responsive delivery; storage migration is
   a separate future spec. *(Backlog trigger: when provider upload volume or
   image size becomes a real cost/perf issue.)*
2. **Replacing all existing FLUX images beyond heroes + categories** — e.g.
   any remaining AI-generated imagery in community/portal areas is out of
   scope unless flagged. *(Backlog trigger: if a specific page still "looks
   off" after this ships.)*
3. **On-the-fly AI image generation / dynamic per-user imagery** — no runtime
   AI generation; all imagery is curated/static. *(Backlog trigger: if we
   ever need personalized banners.)*
4. **Video banners / animated heroes** — still images only. *(Backlog
   trigger: post-MVP brand push.)*
5. **Image CDN swap (e.g. imgix/Cloudinary)** — Unsplash + local files cover
   the need; a full CDN is overkill today. *(Backlog trigger: when we have
   user-upload-heavy flows and need on-the-fly transforms.)*
6. **Dark-mode / alternate theme image variants** — one theme today.
   *(Backlog trigger: if dark mode is specced.)*

## Appendix A — Approved Curation (2026-08-05, vision-QA'd, Leroy-approved)

**Landing hero:** Gemini image (2752×1536, local file) — kids football, golden
hour, Table Mountain, negative space left.

**Interior heroes (Unsplash):**

| Slot | Photo | Alt (registry) |
|---|---|---|
| Browse | photo-151689089665 | Two girls playing with a red ball on a green field |
| Categories | photo-162776494062 | Children holding hands in a circle in a sunny park |
| Home / For Parents | photo-177464137377 | Mother and child on a playground slide |
| Clubs | photo-175139422022 | Soccer team huddling with their coach |
| How It Works | photo-175859873811 | Two girls building with colorful blocks |
| About | photo-153322248125 | Girl running and laughing outdoors |
| Safety | photo-177176576708 | Teacher showing a child numbers with her fingers |
| Contact | photo-163787825790 | Kids sitting together in a field |
| Locations | photo-151144896221 | Two children exploring in a forest |
| For Providers | photo-160741730815 | Coach with kids on a soccer field |
| Provider Resources | photo-168002443902 | Young children playing soccer |
| Invite | photo-168903202557 | Children playing tug of war |

**Category images (Unsplash):**

| Category | Photo | Alt (registry) |
|---|---|---|
| Arts & Culture | photo-151083284223 | Child painting at a table |
| Sports | photo-152623276168 | Children in red jerseys playing soccer |
| Education | photo-1554721299 | Two children reading and writing together |
| Music Lessons | photo-157787777775 | Girl with headphones playing a piano |
| Holiday Programs | photo-177624377320 | Children playing tug-of-war in a field |
| Emotional Intelligence | photo-160571328861 | Boy hugging a girl |

*Full photo IDs + previews: `curation-previews/` folder alongside this spec.
Each entry's exact crop hint is tuned during implementation QA.*

## Spec Quality Checklist

- [x] No implementation details (languages, frameworks, APIs, file paths)
- [x] Focused on user value (sharp, fast, intentional images on every device)
- [x] All mandatory sections completed
- [x] No [NEEDS CLARIFICATION] markers — all decisions grilled & confirmed
- [x] Requirements testable and unambiguous
- [x] Acceptance criteria measurable and technology-agnostic
- [x] All acceptance scenarios defined (mobile, desktop, data, future page)
- [x] Edge cases identified (image failure, provider image 404, format fallback)
- [x] Scope clearly bounded (6 out-of-scope items)
- [x] Dependencies and assumptions identified
- [x] Visual/UX direction concrete (palette, tone, composition rules)
