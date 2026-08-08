import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DB (message_templates table) — fall back to built-in defaults.
vi.mock("@/lib/db/index", () => ({
  db: {
    select: vi.fn(),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: (a: unknown, b: unknown) => ({ a, b }),
}));

import { renderTemplate, renderStoredTemplate } from "../templates";
import { buildWaMeUrl, sendWhatsApp, isAutoSendEnabled } from "../send-whatsapp";

describe("renderTemplate — {{var}} substitution", () => {
  it("substitutes known vars", () => {
    const body = "Hi {{providerName}}, claim at {{claimUrl}} code {{claimCode}}";
    expect(
      renderTemplate(body, {
        providerName: "Thandi",
        claimUrl: "https://ilali.co/claim/abc",
        claimCode: "XYZ123",
      })
    ).toBe(
      "Hi Thandi, claim at https://ilali.co/claim/abc code XYZ123"
    );
  });

  it("leaves unknown vars untouched", () => {
    expect(renderTemplate("Hello {{missing}}", {})).toBe("Hello {{missing}}");
  });
});

describe("renderStoredTemplate — falls back to defaults when DB unavailable", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns the whatsapp default when DB query fails", async () => {
    const message = await renderStoredTemplate("whatsapp-outreach", {
      providerName: "Thandi",
      activityName: "Dance Class",
      claimUrl: "https://ilali.co/claim/abc",
      claimCode: "XYZ123",
    });
    expect(message).toContain("Hi Thandi! 👋");
    expect(message).toContain("Dance Class");
    expect(message).toContain("https://ilali.co/claim/abc");
    expect(message).toContain("XYZ123");
  });

  it("returns empty string for unknown template key", async () => {
    const message = await renderStoredTemplate("does-not-exist", {});
    expect(message).toBe("");
  });
});

describe("buildWaMeUrl", () => {
  it("builds a wa.me link with encoded message", () => {
    const url = buildWaMeUrl("+27821234567", "Hi there, claim it!");
    expect(url).toBe(
      "https://wa.me/+27821234567?text=Hi%20there%2C%20claim%20it!"
    );
  });
});

describe("sendWhatsApp — swappable send layer", () => {
  const original = process.env.WHATSAPP_AUTO_SEND;

  beforeEach(() => {
    process.env.WHATSAPP_AUTO_SEND = original;
  });

  it("returns wa-me mode by default (semi-auto)", async () => {
    delete process.env.WHATSAPP_AUTO_SEND;
    const result = await sendWhatsApp({
      phone: "+27821234567",
      vars: { providerName: "Thandi", activityName: "Dance", claimUrl: "https://ilali.co/claim/abc", claimCode: "XYZ" },
    });
    expect(result.mode).toBe("wa-me");
    if (result.mode === "wa-me") {
      expect(result.waUrl).toContain("wa.me/+27821234567");
      expect(result.waUrl).toContain(encodeURIComponent("Hi Thandi!"));
    }
  });

  it("returns api not-configured when auto flag is on but API is absent", async () => {
    process.env.WHATSAPP_AUTO_SEND = "true";
    const result = await sendWhatsApp({
      phone: "+27821234567",
      vars: { providerName: "Thandi" },
    });
    expect(result).toEqual({ mode: "api", status: "not-configured" });
  });
});

describe("isAutoSendEnabled", () => {
  it("reads the flag", () => {
    const prev = process.env.WHATSAPP_AUTO_SEND;
    process.env.WHATSAPP_AUTO_SEND = "true";
    expect(isAutoSendEnabled()).toBe(true);
    process.env.WHATSAPP_AUTO_SEND = "false";
    expect(isAutoSendEnabled()).toBe(false);
    process.env.WHATSAPP_AUTO_SEND = prev;
  });
});
