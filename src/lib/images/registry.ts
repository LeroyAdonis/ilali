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
    src: "https://images.unsplash.com/photo-1516890896652-41ca1a35787c",
    alt: "Two girls playing with a red ball on a green field",
    crop: "entropy",
  },
  categories: {
    src: "https://images.unsplash.com/photo-1627764940620-90393d0e8c34",
    alt: "Children holding hands in a circle in a sunny park",
    crop: "entropy",
  },
  home: {
    src: "https://images.unsplash.com/photo-1774641373770-a4c33a2651ab",
    alt: "Mother and child on a playground slide",
    crop: "faces",
  },
  clubs: {
    src: "https://images.unsplash.com/photo-1751394220229-9a23c9ed6a75",
    alt: "Soccer team huddling with their coach on the field",
    crop: "faces",
  },
  "how-it-works": {
    src: "https://images.unsplash.com/photo-1758598738113-86c0f874c85a",
    alt: "Two girls building with colorful blocks at a table",
    crop: "entropy",
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
    src: "https://images.unsplash.com/photo-1637878257903-7f08eab9a7f2",
    alt: "Kids sitting together in a field",
    crop: "entropy",
  },
  locations: {
    src: "https://images.unsplash.com/photo-1511448962213-2f9bc14ed197",
    alt: "Two children exploring in a forest",
    crop: "entropy",
  },
  "for-providers": {
    src: "https://images.unsplash.com/photo-1607417308151-cd5c149775b0",
    alt: "Coach with kids on a soccer field",
    crop: "faces",
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
 */
export const CATEGORY_IMAGES: Record<string, ImageEntry> = {
  "arts-culture": {
    src: "https://images.unsplash.com/photo-1510832842230-87253f48d74f",
    alt: "Child painting at a table",
    crop: "entropy",
  },
  sports: {
    src: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e",
    alt: "Children in red jerseys playing soccer",
    crop: "faces",
  },
  education: {
    src: "https://images.unsplash.com/photo-1554721299-e0b8aa7666ce",
    alt: "Two children reading and writing together",
    crop: "entropy",
  },
  "music-lessons": {
    src: "https://images.unsplash.com/photo-1577877777751-3f1ec20a0715",
    alt: "Girl with headphones playing a piano",
    crop: "entropy",
  },
  "holiday-programs": {
    src: "https://images.unsplash.com/photo-1776243773206-a29b683c97fb",
    alt: "Children playing tug-of-war in a field",
    crop: "faces",
  },
  "emotional-intelligence": {
    src: "https://images.unsplash.com/photo-1605713288610-00c1c630ca1e",
    alt: "Boy hugging a girl",
    crop: "faces",
  },
};
