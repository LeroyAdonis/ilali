import { describe, it, expect, vi, afterEach } from "vitest";
import {
  shouldCompress,
  buildUploadFormData,
  compressImage,
  qualityForComplexity,
  luminanceStddev,
  MAX_UPLOAD_BYTES,
  COMPRESS_MAX_DIMENSION,
} from "../upload-compress";

function makeFile(size: number, name = "poster.jpg", type?: string): File {
  // File size is read from the Blob parts — pad with a buffer of the right size.
  const bytes = new Uint8Array(size);
  const mime =
    type ?? (name.endsWith(".png") ? "image/png" : "image/jpeg");
  return new File([bytes], name, { type: mime });
}

/** Build a luminance sample buffer with a controllable stddev. */
function makeImageData(stddev: number, mean = 128): Uint8ClampedArray {
  // Deterministic-ish pseudo pattern: alternate dark/light blocks to create
  // variance, scaled to the requested stddev (approx).
  const n = 400; // pixels
  const data = new Uint8ClampedArray(n * 4);
  for (let i = 0; i < n; i++) {
    const offset = (i % 2 === 0 ? -1 : 1) * stddev * 1.1;
    const lum = Math.max(0, Math.min(255, mean + offset));
    data[i * 4] = lum;
    data[i * 4 + 1] = lum;
    data[i * 4 + 2] = lum;
    data[i * 4 + 3] = 255;
  }
  return data;
}

describe("upload-compress — client-side poster compression (413 fix 2026-08-11)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exports sensible constants", () => {
    expect(MAX_UPLOAD_BYTES).toBe(3 * 1024 * 1024);
    expect(COMPRESS_MAX_DIMENSION).toBe(1600);
  });

  it("shouldCompress is true above 3MB (Vercel 413 territory)", () => {
    expect(shouldCompress(makeFile(3 * 1024 * 1024 + 1))).toBe(true);
    expect(shouldCompress(makeFile(7 * 1024 * 1024))).toBe(true);
  });

  it("shouldCompress is false for small files", () => {
    expect(shouldCompress(makeFile(1024))).toBe(false);
    expect(shouldCompress(makeFile(2 * 1024 * 1024))).toBe(false);
  });

  it("qualityForComplexity picks lower quality for flat content (perceptual entropy)", () => {
    expect(qualityForComplexity(10)).toBe(65); // flat poster
    expect(qualityForComplexity(39)).toBe(65); // still flat
    expect(qualityForComplexity(55)).toBe(72); // mixed
    expect(qualityForComplexity(100)).toBe(80); // photo-heavy
  });

  it("luminanceStddev estimates complexity from pixel data", () => {
    const flat = luminanceStddev(
      { getImageData: () => ({ data: makeImageData(5) }) } as unknown as CanvasRenderingContext2D,
      10,
      10
    );
    const busy = luminanceStddev(
      { getImageData: () => ({ data: makeImageData(60) }) } as unknown as CanvasRenderingContext2D,
      10,
      10
    );
    expect(flat).not.toBeNull();
    expect(busy).not.toBeNull();
    expect(busy!).toBeGreaterThan(flat!);
  });

  it("luminanceStddev returns null when getImageData throws (tainted canvas)", () => {
    const result = luminanceStddev(
      {
        getImageData: () => {
          throw new Error("tainted");
        },
      } as unknown as CanvasRenderingContext2D,
      10,
      10
    );
    expect(result).toBeNull();
  });

  it("buildUploadFormData passes small files through untouched", async () => {
    const small = makeFile(1024, "small.png");
    const { formData, usedCompression } = await buildUploadFormData(small);
    expect(usedCompression).toBe(false);
    const sent = formData.get("file") as File;
    expect(sent.name).toBe("small.png");
    expect(sent.type).toBe("image/png");
  });

  it("buildUploadFormData compresses large files to WebP with adaptive quality", async () => {
    const mockWebp = new Blob(["webp-data"], { type: "image/webp" });
    const toBlob = vi.fn((cb: BlobCallback) => cb(mockWebp));
    const drawImage = vi.fn();
    const getContext = vi.fn(() => ({
      drawImage,
      getImageData: () => ({ data: makeImageData(20) }), // flat → q65
      toBlob,
    }));
    const createElement = vi.fn(() => ({
      width: 0,
      height: 0,
      getContext,
      toBlob,
    }));

    vi.stubGlobal("Image", class {
      naturalWidth = 3024;
      naturalHeight = 4032;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_v: string) {
        this.onload?.();
      }
    });
    vi.stubGlobal("URL", { createObjectURL: () => "blob:test", revokeObjectURL: () => {} });
    vi.stubGlobal("document", { createElement });

    const big = makeFile(7 * 1024 * 1024, "huge.jpg");
    const { formData, usedCompression } = await buildUploadFormData(big);

    expect(usedCompression).toBe(true);
    expect(createElement).toHaveBeenCalledWith("canvas");
    expect(drawImage).toHaveBeenCalledTimes(1);
    // Canvas sized to the 1600px long edge (3024x4032 → 1200x1600)
    expect(createElement.mock.results[0].value.width).toBe(1200);
    expect(createElement.mock.results[0].value.height).toBe(1600);
    // WebP export requested with the flat-content quality (65)
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/webp", 0.65);

    const sent = formData.get("file") as File;
    expect(sent.type).toBe("image/webp");
    expect(sent.name).toBe("huge.jpg");
  });

  it("falls back to JPEG when WebP export is unsupported (older Safari)", async () => {
    const mockJpeg = new Blob(["jpeg-data"], { type: "image/jpeg" });
    // toBlob: first call (webp) → null; second call (jpeg) → jpeg blob
    const toBlob = vi
      .fn()
      .mockImplementationOnce((cb: BlobCallback) => cb(null))
      .mockImplementationOnce((cb: BlobCallback) => cb(mockJpeg));
    const getContext = vi.fn(() => ({
      drawImage: vi.fn(),
      getImageData: () => ({ data: makeImageData(20) }),
      toBlob,
    }));

    vi.stubGlobal("Image", class {
      naturalWidth = 3024;
      naturalHeight = 4032;
      onload: (() => void) | null = null;
      set src(_v: string) {
        this.onload?.();
      }
    });
    vi.stubGlobal("URL", { createObjectURL: () => "blob:test", revokeObjectURL: () => {} });
    vi.stubGlobal("document", { createElement: () => ({ getContext, toBlob }) });

    const big = makeFile(6 * 1024 * 1024);
    const { formData, usedCompression } = await buildUploadFormData(big);
    expect(usedCompression).toBe(true);
    const sent = formData.get("file") as File;
    expect(sent.type).toBe("image/jpeg");
  });

  it("buildUploadFormData falls back to original when canvas is unavailable", async () => {
    vi.stubGlobal("Image", class {
      naturalWidth = 3024;
      naturalHeight = 4032;
      onload: (() => void) | null = null;
      set src(_v: string) {
        this.onload?.();
      }
    });
    vi.stubGlobal("URL", { createObjectURL: () => "blob:test", revokeObjectURL: () => {} });
    // getContext returns null → cannot draw → resolve null → fallback to original
    vi.stubGlobal("document", {
      createElement: () => ({ getContext: () => null, toBlob: () => {} }),
    });

    const big = makeFile(6 * 1024 * 1024);
    const { formData, usedCompression } = await buildUploadFormData(big);
    expect(usedCompression).toBe(false);
    const sent = formData.get("file") as File;
    expect(sent.type).toBe("image/jpeg");
    expect(sent.size).toBe(6 * 1024 * 1024);
  });

  it("compressImage resolves null for an undecodable image", async () => {
    vi.stubGlobal("Image", class {
      naturalWidth = 0;
      naturalHeight = 0;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_v: string) {
        this.onerror?.();
      }
    });
    vi.stubGlobal("URL", { createObjectURL: () => "blob:test", revokeObjectURL: () => {} });

    const bad = makeFile(4 * 1024 * 1024, "corrupt.png");
    const result = await compressImage(bad);
    expect(result).toBeNull();
  });
});
