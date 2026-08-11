import { describe, it, expect, vi, afterEach } from "vitest";
import {
  shouldCompress,
  buildUploadFormData,
  MAX_UPLOAD_BYTES,
  COMPRESS_MAX_DIMENSION,
  COMPRESS_QUALITY,
} from "../upload-compress";

function makeFile(size: number, name = "poster.jpg", type?: string): File {
  // File size is read from the Blob parts — pad with a buffer of the right size.
  const bytes = new Uint8Array(size);
  const mime =
    type ?? (name.endsWith(".png") ? "image/png" : "image/jpeg");
  return new File([bytes], name, { type: mime });
}

describe("upload-compress — client-side poster compression (413 fix 2026-08-11)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exports sensible constants", () => {
    expect(MAX_UPLOAD_BYTES).toBe(3 * 1024 * 1024);
    expect(COMPRESS_MAX_DIMENSION).toBe(1600);
    expect(COMPRESS_QUALITY).toBe(0.82);
  });

  it("shouldCompress is true above 3MB (Vercel 413 territory)", () => {
    expect(shouldCompress(makeFile(3 * 1024 * 1024 + 1))).toBe(true);
    expect(shouldCompress(makeFile(7 * 1024 * 1024))).toBe(true);
  });

  it("shouldCompress is false for small files", () => {
    expect(shouldCompress(makeFile(1024))).toBe(false);
    expect(shouldCompress(makeFile(2 * 1024 * 1024))).toBe(false);
  });

  it("buildUploadFormData passes small files through untouched", async () => {
    const small = makeFile(1024, "small.png");
    const { formData, usedCompression } = await buildUploadFormData(small);
    expect(usedCompression).toBe(false);
    const sent = formData.get("file") as File;
    expect(sent.name).toBe("small.png");
    expect(sent.type).toBe("image/png");
  });

  it("buildUploadFormData compresses large files to a JPEG blob", async () => {
    // Mock canvas + Image for the browser-only path.
    const mockBlob = new Blob(["compressed"], { type: "image/jpeg" });
    const toBlob = vi.fn((cb: BlobCallback) => cb(mockBlob));
    const drawImage = vi.fn();
    const getContext = vi.fn(() => ({ drawImage }));
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
        // Fire onload synchronously so the promise resolves in the test.
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
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), "image/jpeg", 0.82);

    const sent = formData.get("file") as File;
    expect(sent.type).toBe("image/jpeg");
    expect(sent.name).toBe("huge.jpg");
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
});
