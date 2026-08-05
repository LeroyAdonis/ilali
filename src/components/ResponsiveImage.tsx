import type { ImageEntry } from "@/lib/images";
import {
  isUnsplashUrl,
  unsplashUrl,
  HERO_MOBILE_W,
  HERO_MOBILE_H,
  HERO_MOBILE_2X,
  HERO_DESKTOP_W,
  HERO_DESKTOP_H,
  HERO_DESKTOP_2X,
  CARD_W,
  CARD_2X,
} from "@/lib/images";

interface ResponsiveImageProps {
  /** Registry entry — curated image + alt. */
  image: ImageEntry;
  /**
   * "hero" = art-directed `<picture>` (mobile crop ≤640px, desktop crop ≥641px).
   * "card" = single crop, width srcset (400/800px).
   * "banner" = full-width band (club hero), width srcset (800/1600px).
   */
  variant: "hero" | "card" | "banner";
  className?: string;
  /** Hero LCP images: eager + fetchpriority=high. */
  priority?: boolean;
  /** Explicit sizes hint. Defaults per variant. */
  sizes?: string;
}

const HERO_MOBILE_BREAKPOINT = "640px";
const CARD_SIZES = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw";
const BANNER_SIZES = "100vw";
const BANNER_W = 800;
const BANNER_2X = 1600;

/**
 * Responsive image delivery for ILALI's curated images.
 *
 * - Unsplash sources: CDN does resize/crop/format (AVIF → WebP → JPEG via
 *   fm=auto). No next/image proxying — the CDN is the optimizer.
 * - Local sources (Gemini hero): pre-generated WebP crops served as-is.
 * - Unknown hosts (Supabase uploads, legacy local files): pass-through
 *   plain img (no transforms available).
 */
export default function ResponsiveImage({
  image,
  variant,
  className,
  priority = false,
  sizes,
}: ResponsiveImageProps) {
  const loading: "lazy" | "eager" = priority ? "eager" : "lazy";
  const imgSizes =
    sizes ?? (variant === "hero" ? "100vw" : variant === "banner" ? BANNER_SIZES : CARD_SIZES);

  // Pass-through: not Unsplash, not local curated → serve as-is.
  if (!image.local && !isUnsplashUrl(image.src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image.src}
        alt={image.alt}
        loading={loading}
        fetchPriority={priority ? "high" : "auto"}
        className={className}
        sizes={imgSizes}
      />
    );
  }

  if (variant === "hero") {
    return (
      <picture className="block h-full w-full">
        {image.local ? (
          <>
            <source
              media={`(max-width: ${HERO_MOBILE_BREAKPOINT})`}
              srcSet={image.mobileSrc ?? image.src}
            />
            <source
              media={`(min-width: ${HERO_MOBILE_BREAKPOINT})`}
              srcSet={image.src}
            />
          </>
        ) : (
          <>
            <source
              media={`(max-width: ${HERO_MOBILE_BREAKPOINT})`}
              srcSet={[
                unsplashUrl(image.src, {
                  w: HERO_MOBILE_W,
                  h: HERO_MOBILE_H,
                  crop: image.crop,
                }),
                `${unsplashUrl(image.src, {
                  w: HERO_MOBILE_2X,
                  h: HERO_MOBILE_H * 2,
                  crop: image.crop,
                })} 2x`,
              ].join(", ")}
            />
            <source
              media={`(min-width: ${HERO_MOBILE_BREAKPOINT})`}
              srcSet={[
                unsplashUrl(image.src, {
                  w: HERO_DESKTOP_W,
                  h: HERO_DESKTOP_H,
                  crop: image.crop,
                }),
                `${unsplashUrl(image.src, {
                  w: HERO_DESKTOP_2X,
                  h: HERO_DESKTOP_H * 2,
                  crop: image.crop,
                })} 2x`,
              ].join(", ")}
            />
          </>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            image.local
              ? (image.mobileSrc ?? image.src)
              : unsplashUrl(image.src, {
                  w: HERO_MOBILE_W,
                  h: HERO_MOBILE_H,
                  crop: image.crop,
                })
          }
          alt={image.alt}
          loading={loading}
          fetchPriority={priority ? "high" : "auto"}
          className={className}
          sizes={imgSizes}
        />
      </picture>
    );
  }

  // Card / banner variants — width srcset, single crop.
  if (isUnsplashUrl(image.src)) {
    const w = variant === "banner" ? BANNER_W : CARD_W;
    const w2x = variant === "banner" ? BANNER_2X : CARD_2X;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={unsplashUrl(image.src, { w, crop: image.crop })}
        srcSet={`${unsplashUrl(image.src, { w, crop: image.crop })} 1x, ${unsplashUrl(image.src, { w: w2x, crop: image.crop })} 2x`}
        alt={image.alt}
        loading={loading}
        fetchPriority={priority ? "high" : "auto"}
        className={className}
        sizes={imgSizes}
      />
    );
  }

  // Local card source (rare) — serve as-is.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.src}
      alt={image.alt}
      loading={loading}
      fetchPriority={priority ? "high" : "auto"}
      className={className}
      sizes={imgSizes}
    />
  );
}
