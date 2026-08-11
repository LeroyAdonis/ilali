/**
 * Client-side image compression for poster uploads.
 *
 * Why: Vercel serverless rejects request bodies over ~4.5MB with a non-JSON
 * 413 (FUNCTION_PAYLOAD_TOO_LARGE) BEFORE route code runs. Real phone photos
 * of posters are 2-8MB — so raw uploads fail with a confusing "network error"
 * in the UI. Downscaling to ~1600px JPEG (plenty for OCR) keeps uploads small
 * AND makes Gemini vision faster/cheaper.
 *
 * Only runs in the browser (uses canvas). Returns a Blob for FormData.
 */

export const MAX_UPLOAD_BYTES = 3 * 1024 * 1024; // compress above 3MB
export const COMPRESS_MAX_DIMENSION = 1600; // px on the long edge
export const COMPRESS_QUALITY = 0.82;

/** True when a File needs compression (over size or non-JPEG/WebP source). */
export function shouldCompress(file: File): boolean {
  return file.size > MAX_UPLOAD_BYTES;
}

/**
 * Downscale + re-encode an image to a JPEG Blob. Resolves null when the
 * browser can't decode the file (corrupt image) — caller falls back to
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
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            resolve(blob);
          },
          "image/jpeg",
          COMPRESS_QUALITY
        );
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
      // Keep the original filename/type on the blob — the route only checks
      // image/* + size, and JPEG is in its allowed list.
      const compressedFile = new File([compressed], file.name, {
        type: "image/jpeg",
      });
      formData.append("file", compressedFile);
      return { formData, usedCompression: true };
    }
  }
  formData.append("file", file);
  return { formData, usedCompression: false };
}
