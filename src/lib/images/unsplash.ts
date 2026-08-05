/**
 * Unsplash CDN URL builder.
 *
 * Unsplash's imgix-based CDN does resize/crop/format negotiation server-side,
 * so we hotlink with params instead of proxying through next/image (saves
 * Vercel optimizer compute and cache limits, and is required for `<picture>`
 * art direction).
 *
 * Format negotiation: `fm=auto` serves AVIF where supported, WebP elsewhere,
 * JPEG last.
 */

export interface UnsplashOptions {
  /** Target width in px. */
  w: number;
  /** Optional target height in px (with fit=crop this defines the crop box). */
  h?: number;
  /** Quality 1-100. Default 75. */
  q?: number;
  /** Fit mode. Default "crop". */
  fit?: "crop" | "max" | "min" | "scale";
  /** Focal-point hint. Default "entropy" (saliency-based). */
  crop?: "faces" | "entropy" | "left" | "right" | "center" | "edges" | "top" | "bottom";
  /** Output format. Default "auto" (AVIF → WebP → JPEG). */
  fm?: "auto" | "webp" | "jpg" | "png" | "avif";
}

const DEFAULT_OPTIONS: Required<Pick<UnsplashOptions, "q" | "fit" | "crop" | "fm">> = {
  q: 75,
  fit: "crop",
  crop: "entropy",
  fm: "auto",
};

export function isUnsplashUrl(src: string): boolean {
  return src.startsWith("https://images.unsplash.com/");
}

/**
 * Build an Unsplash CDN URL with the given transforms.
 *
 * Accepts either a bare base URL (from the registry) or a full Unsplash URL
 * that already has query params (e.g. provider image URLs seeded with
 * `ixid`) — existing params are stripped and rebuilt.
 */
export function unsplashUrl(src: string, opts: UnsplashOptions): string {
  const base = src.split("?")[0];
  const params = new URLSearchParams();
  params.set("w", String(opts.w));
  if (opts.h) params.set("h", String(opts.h));
  params.set("fit", opts.fit ?? DEFAULT_OPTIONS.fit);
  params.set("crop", opts.crop ?? DEFAULT_OPTIONS.crop);
  params.set("q", String(opts.q ?? DEFAULT_OPTIONS.q));
  params.set("fm", opts.fm ?? DEFAULT_OPTIONS.fm);
  params.set("auto", "format");
  return `${base}?${params.toString()}`;
}

/**
 * Standard hero breakpoint sizes (approved 2026-08-05):
 * mobile ~4:3 crop (800/1600px), desktop ~2:1 crop (1920/2560px).
 */
export const HERO_MOBILE_W = 800;
export const HERO_MOBILE_H = 600;
export const HERO_MOBILE_2X = 1600;
export const HERO_DESKTOP_W = 1920;
export const HERO_DESKTOP_H = 900;
export const HERO_DESKTOP_2X = 2560;

/** Card images: single crop, width srcset (400/800px = 2× retina of ~176-200px cards). */
export const CARD_W = 400;
export const CARD_2X = 800;
