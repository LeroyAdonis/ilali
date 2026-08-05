import { describe, it, expect } from "vitest";
import {
  unsplashUrl,
  isUnsplashUrl,
  HERO_MOBILE_W,
  HERO_DESKTOP_W,
} from "@/lib/images/unsplash";
import { HERO_IMAGES, CATEGORY_IMAGES } from "@/lib/images/registry";

const PHOTO = "https://images.unsplash.com/photo-1516890896652-41ca1a35787c";

describe("unsplashUrl", () => {
  it("builds a URL with default params", () => {
    const url = unsplashUrl(PHOTO, { w: 800 });
    expect(url).toBe(
      `${PHOTO}?w=800&fit=crop&crop=entropy&q=75&fm=auto&auto=format`
    );
  });

  it("includes h and crop when provided", () => {
    const url = unsplashUrl(PHOTO, { w: 800, h: 600, crop: "faces" });
    expect(url).toContain("w=800");
    expect(url).toContain("h=600");
    expect(url).toContain("crop=faces");
  });

  it("strips existing query params and rebuilds", () => {
    const seeded = `${PHOTO}?ixid=M3wxMjA3fDB8&w=3000&q=80`;
    const url = unsplashUrl(seeded, { w: 400 });
    expect(url.startsWith(PHOTO)).toBe(true);
    expect(url).not.toContain("ixid");
    expect(url).toContain("w=400");
  });

  it("honours fm override", () => {
    const url = unsplashUrl(PHOTO, { w: 400, fm: "webp" });
    expect(url).toContain("fm=webp");
  });

  it("omits h when not provided", () => {
    const url = unsplashUrl(PHOTO, { w: 400 });
    expect(url).not.toContain("h=");
  });
});

describe("isUnsplashUrl", () => {
  it("recognises Unsplash CDN URLs", () => {
    expect(isUnsplashUrl(PHOTO)).toBe(true);
    expect(isUnsplashUrl("https://images.unsplash.com/photo-abc")).toBe(true);
  });

  it("rejects other hosts", () => {
    expect(isUnsplashUrl("/images/hero/hero-home.jpg")).toBe(false);
    expect(
      isUnsplashUrl("https://jbmdbhqgmbxufqtstfgi.supabase.co/storage/v1/x")
    ).toBe(false);
  });
});

describe("image registry", () => {
  it("has all 13 hero slots with src + alt", () => {
    const keys = Object.keys(HERO_IMAGES);
    expect(keys).toHaveLength(13);
    expect(keys).toEqual(
      expect.arrayContaining([
        "landing",
        "browse",
        "categories",
        "home",
        "clubs",
        "how-it-works",
        "about",
        "safety",
        "contact",
        "locations",
        "for-providers",
        "provider-resources",
        "invite",
      ])
    );
    for (const [key, entry] of Object.entries(HERO_IMAGES)) {
      expect(entry.src.length, `${key} src`).toBeGreaterThan(0);
      expect(entry.alt.length, `${key} alt`).toBeGreaterThan(0);
    }
  });

  it("has all 6 category images with src + alt", () => {
    const keys = Object.keys(CATEGORY_IMAGES);
    expect(keys).toEqual(
      expect.arrayContaining([
        "arts-culture",
        "sports",
        "education",
        "music-lessons",
        "holiday-programs",
        "emotional-intelligence",
      ])
    );
    for (const [key, entry] of Object.entries(CATEGORY_IMAGES)) {
      expect(entry.src.length, `${key} src`).toBeGreaterThan(0);
      expect(entry.alt.length, `${key} alt`).toBeGreaterThan(0);
    }
  });

  it("landing hero is local with a mobile crop", () => {
    const landing = HERO_IMAGES.landing;
    expect(landing.local).toBe(true);
    expect(landing.mobileSrc).toBeTruthy();
  });

  it("hero images are unique per slot", () => {
    const srcs = Object.values(HERO_IMAGES).map((e) => e.src);
    expect(new Set(srcs).size).toBe(srcs.length);
  });
});
