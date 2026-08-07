import { describe, it, expect } from "vitest";
import { buildWhatsAppUrl } from "@/components/WhatsAppButton";

const PHONE = "+27721234567";

describe("buildWhatsAppUrl — WhatsApp deep link construction", () => {
  it("starts with the wa.me prefix and text param", () => {
    const url = buildWhatsAppUrl(PHONE, "Tennis Lessons");
    expect(url.startsWith(`https://wa.me/${PHONE}?text=`)).toBe(true);
  });

  it("URL-encodes the message", () => {
    const url = buildWhatsAppUrl(PHONE, "Tennis Lessons");
    expect(url).toContain("%22"); // quotes are encoded
    expect(url).toContain("%20"); // spaces are encoded
    expect(url).not.toContain(" "); // no raw spaces
    expect(url).toContain(
      encodeURIComponent(
        `Hi! I found your "Tennis Lessons" listing on ILALI and I'm interested in learning more.`
      )
    );
  });

  it("uses the override when provided", () => {
    const override = "+27719999999";
    const url = buildWhatsAppUrl(PHONE, "Art Class", override);
    expect(url.startsWith(`https://wa.me/${override}?text=`)).toBe(true);
    expect(url).not.toContain(PHONE);
  });

  it("falls back to the phone when no override is provided", () => {
    const url = buildWhatsAppUrl(PHONE, "Art Class");
    expect(url.startsWith(`https://wa.me/${PHONE}?text=`)).toBe(true);
  });
});
