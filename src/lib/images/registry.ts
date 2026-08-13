/**
 * Curated image registry — the single source of truth for every brand image
 * on ILALI (hero banners + category images).
 *
 * Approved by Leroy 2026-08-05. See
 * `.specify/specs/responsive-images/spec.md` Appendix A for the curation
 * record and `unsplash-curation-pipeline` skill for how picks were made.
 *
 * Usage:
 *   <ResponsiveImage image={HERO_IMAGES.browse} variant="hero" priority />
 */

export type CropHint =
  | "faces"
  | "entropy"
  | "left"
  | "right"
  | "center"
  | "edges"
  | "top"
  | "bottom";

export interface ImageEntry {
  /**
   * Base source. Either an Unsplash CDN URL (no query params —
   * the URL builder appends them) or a local file path (when `local`).
   */
  src: string;
  /** Meaningful alt text (a11y, WCAG 2.1 AA). */
  alt: string;
  /** Unsplash focal-point hint for crops. Ignored for local images. */
  crop?: CropHint;
  /**
   * True for pre-generated local files (Gemini landing hero) — the image is
   * served as-is, no CDN params. Hero variant uses `mobileSrc` + `src`.
   */
  local?: boolean;
  /** For local art-directed heroes: the mobile crop file. */
  mobileSrc?: string;
}

/**
 * Hero banner slots. Key = page identity used across the app.
 * Every slot has its own image — no sharing between pages.
 */
export const HERO_IMAGES: Record<string, ImageEntry> = {
  landing: {
    src: "/images/hero/hero-landing-desktop.webp",
    mobileSrc: "/images/hero/hero-landing-mobile.webp",
    alt: "Children playing football at golden hour in Cape Town with Table Mountain behind them",
    local: true,
  },
  browse: {
    src: "/images/hero/hero-browse-desktop.webp",
    mobileSrc: "/images/hero/hero-browse-mobile.webp",
    alt: "A child pointing at colorful activity posters on a wall board",
    local: true,
  },
  categories: {
    src: "/images/hero/hero-categories-desktop.webp",
    mobileSrc: "/images/hero/hero-categories-mobile.webp",
    alt: "Three children doing different activities — painting, soccer, and keyboard",
    local: true,
  },
  home: {
    src: "/images/hero/hero-home-desktop.webp",
    mobileSrc: "/images/hero/hero-home-mobile.webp",
    alt: "A mother and daughter looking at a tablet together on a couch",
    local: true,
  },
  clubs: {
    src: "/images/hero/hero-clubs-desktop.webp",
    mobileSrc: "/images/hero/hero-clubs-mobile.webp",
    alt: "A soccer team of kids in a huddle with their coach on the field",
    local: true,
  },
  "how-it-works": {
    src: "/images/hero/hero-how-it-works-desktop.webp",
    mobileSrc: "/images/hero/hero-how-it-works-mobile.webp",
    alt: "Two girls building with colorful blocks at a wooden table",
    local: true,
  },
  about: {
    src: "https://images.unsplash.com/photo-1533222481259-ce20eda1e20b",
    alt: "Girl running and laughing outdoors",
    crop: "entropy",
  },
  safety: {
    src: "https://images.unsplash.com/photo-1771765767087-ce71e4a7916a",
    alt: "Teacher showing a child numbers with her fingers",
    crop: "faces",
  },
  contact: {
    src: "/images/hero/hero-contact-desktop.webp",
    mobileSrc: "/images/hero/hero-contact-mobile.webp",
    alt: "Kids sitting together in a field",
    local: true,
  },
  locations: {
    src: "https://images.unsplash.com/photo-1511448962213-2f9bc14ed197",
    alt: "Two children exploring in a forest",
    crop: "entropy",
  },
  "for-providers": {
    src: "/images/hero/hero-for-providers-desktop.webp",
    mobileSrc: "/images/hero/hero-for-providers-mobile.webp",
    alt: "Coach with kids on a soccer field",
    local: true,
  },
  "provider-resources": {
    src: "https://images.unsplash.com/photo-1680024439029-d7d4b7f4cba1",
    alt: "Young children playing soccer",
    crop: "faces",
  },
  invite: {
    src: "https://images.unsplash.com/photo-1689032025577-b1aa0b43d357",
    alt: "Children playing tug of war",
    crop: "faces",
  },
};

/**
 * Category images, keyed by category slug (matches `categories` table slugs
 * and the old `/images/providers/{slug}.jpg` fallback keys).
 * Gemini-generated 2026-08-05 (2752x1536) — art-directed WebP crops:
 * desktop 2:1, mobile 4:3. Local files, no CDN transforms.
 */
export const CATEGORY_IMAGES: Record<string, ImageEntry> = {
  "arts-culture": {
    src: "/images/hero/cat-arts-culture-desktop.webp",
    mobileSrc: "/images/hero/cat-arts-culture-mobile.webp",
    alt: "A child painting at a table with colorful paint pots",
    local: true,
  },
  sports: {
    src: "/images/hero/cat-sports-desktop.webp",
    mobileSrc: "/images/hero/cat-sports-mobile.webp",
    alt: "South African kids in red jerseys playing soccer on a green field",
    local: true,
  },
  education: {
    src: "/images/hero/cat-education-desktop.webp",
    mobileSrc: "/images/hero/cat-education-mobile.webp",
    alt: "Two children reading a picture book together at a table",
    local: true,
  },
  "music-lessons": {
    src: "/images/hero/cat-music-lessons-desktop.webp",
    mobileSrc: "/images/hero/cat-music-lessons-mobile.webp",
    alt: "A girl wearing headphones playing a keyboard",
    local: true,
  },
  "holiday-programs": {
    src: "/images/hero/cat-holiday-programs-desktop.webp",
    mobileSrc: "/images/hero/cat-holiday-programs-mobile.webp",
    alt: "Kids doing a fun obstacle-course run at a holiday camp",
    local: true,
  },
  "emotional-intelligence": {
    src: "/images/hero/cat-emotional-intelligence-desktop.webp",
    mobileSrc: "/images/hero/cat-emotional-intelligence-mobile.webp",
    alt: "A circle of kids sitting cross-legged with a calm facilitator",
    local: true,
  },
};
