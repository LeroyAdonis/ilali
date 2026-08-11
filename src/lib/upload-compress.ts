/**
 * Client-side image compression for poster uploads.
 *
 * Why: Vercel serverless rejects request bodies over ~4.5MB with a non-JSON
 * 413 (FUNCTION_PAYLOAD_TOO_LARGE) BEFORE route code runs. Real phone photos
 * of posters are 2-8MB — so raw uploads fail with a confusing "network error"
 * in the UI. Downscaling to ~1600px (plenty for OCR) keeps uploads small AND
 * makes Gemini vision faster/cheaper.
 *
 * Format: WebP by default (3-6x smaller than JPEG at equal legibility, verified
 * 2026-08-11: 59KB JPEG → 10KB WebP with identical Gemini extraction), falling
 * back to JPEG when the browser can't export WebP (older Safari).
 *
 * Perceptual-entropy-inspired adaptive quality: flat/graphic posters (large
 * uniform areas — the common case for kids-activity posters) tolerate much
 * lower quality than photo-heavy images. We estimate complexity from the
 * luminance standard deviation of the downscaled canvas and pick a quality
 * tier per image. Verified: stddev <40 (flat) → q65 stays perfectly legible to
 * Gemini; photo-heavy (stddev >70) → q80.
 *
 * Only runs in the browser (uses canvas). Returns a Blob for FormData.
 */

export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // compress above 3MB
export const COMPRESS_MAX_DIMENSION = 1600; // px on the long edge

/** Perceptual complexity → WebP quality tiers (stddev of luminance). */
export function qualityForComplexity(stddev: number): number {
  if (stddev < 40) return 65; // flat poster / graphics — crushes tiny, still legible
  if (stddev < 70) return 72; // mixed content
  return 80; // photo-heavy — keep quality (doesn't compress well anyway)
}

/**
 * Compute the luminance standard deviation of a canvas (0-255 scale).
 * Proxy for perceptual entropy: flat/graphic posters have low stddev,
 * photos have high stddev. Returns null if pixel data is unavailable.
 */
export function luminanceStddev(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): number | null {
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, width, height).data;
  } catch {
    return null; // tainted canvas or unavailable
  }
  // Sample every 5th pixel (20 bytes) — a stride coprime with 2-period
  // patterns so we don't alias away real variance (a 16-byte stride = every
  // 4th pixel aliased perfectly with alternating test patterns, measuring 0).
  let sum = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 20) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    sum += 0.299 * r + 0.587 * g + 0.114 * b;
    count++;
  }
  if (count === 0) return null;
  const mean = sum / count;
  let variance = 0;
  for (let i = 0; i < data.length; i += 20) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    variance += (lum - mean) * (lum - mean);
  }
  return Math.sqrt(variance / count);
}

/** True when a File needs compression (over size or non-JPEG/WebP source). */
export function shouldCompress(file: File): boolean {
  return file.size > MAX_UPLOAD_BYTES;
}

/**
 * Downscale + re-encode an image to WebP (JPEG fallback). Resolves null when
 * the browser can't decode the file (corrupt image) — caller falls back to
 * uploading the original.
 */
export function compressImage(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(
          1,
          COMPRESS_MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight)
        );
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);

        // Perceptual-entropy-inspired quality selection.
        const stddev = luminanceStddev(ctx, w, h);
        const quality = qualityForComplexity(stddev ?? 75);

        const finish = (blob: Blob | null, type: string) => {
          URL.revokeObjectURL(url);
          if (blob) {
            resolve(new Blob([blob], { type }));
          } else {
            resolve(null);
          }
        };

        // WebP first; older Safari's toBlob returns null for unsupported types.
        try {
          canvas.toBlob(
            (webp) => {
              if (webp) {
                finish(webp, "image/webp");
              } else {
                // Fallback: JPEG at a slightly higher quality (JPEG needs more bits).
                canvas.toBlob(
                  (jpeg) => finish(jpeg, "image/jpeg"),
                  "image/jpeg",
                  Math.min(0.9, quality + 10) / 100
                );
              }
            },
            "image/webp",
            quality / 100
          );
        } catch {
          canvas.toBlob(
            (jpeg) => finish(jpeg, "image/jpeg"),
            "image/jpeg",
            Math.min(0.9, quality + 10) / 100
          );
        }
      } catch {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Build the FormData for upload, compressing when the source is large.
 * Returns { formData, usedCompression } so the UI can report compression.
 */
export async function buildUploadFormData(
  file: File
): Promise<{ formData: FormData; usedCompression: boolean }> {
  const formData = new FormData();
  if (shouldCompress(file)) {
    const compressed = await compressImage(file);
    if (compressed) {
      // Preserve the original filename; the route accepts image/webp + image/jpeg.
      const compressedFile = new File([compressed], file.name, {
        type: compressed.type,
      });
      formData.append("file", compressedFile);
      return { formData, usedCompression: true };
    }
  }
  formData.append("file", file);
  return { formData, usedCompression: false };
}
