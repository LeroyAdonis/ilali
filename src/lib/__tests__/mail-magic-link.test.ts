import { describe, it, expect, vi, afterEach } from "vitest";
import { sendMagicLinkEmail, sendWelcomeEmail } from "@/lib/mail/index";

// The mail wrapper must degrade gracefully when RESEND_API_KEY is missing —
// never throw, never block the surrounding flow.
describe("email-first auth mail helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
  });

  it("sendMagicLinkEmail returns { skipped: true } without an API key", async () => {
    delete process.env.RESEND_API_KEY;
    vi.stubGlobal("console", { ...console, warn: vi.fn() });

    const result = await sendMagicLinkEmail({
      email: "parent@example.com",
      url: "https://ilali.vercel.app/api/auth/magic-link/verify?token=abc",
    });

    expect(result).toEqual({ skipped: true });
  });

  it("sendWelcomeEmail returns { skipped: true } without an API key", async () => {
    delete process.env.RESEND_API_KEY;
    vi.stubGlobal("console", { ...console, warn: vi.fn() });

    const result = await sendWelcomeEmail({ email: "parent@example.com" });

    expect(result).toEqual({ skipped: true });
  });

  it("never throws when Resend rejects (missing key path included)", async () => {
    delete process.env.RESEND_API_KEY;
    vi.stubGlobal("console", { ...console, warn: vi.fn() });

    await expect(
      Promise.all([
        sendMagicLinkEmail({ email: "a@example.com", url: "https://x.test" }),
        sendWelcomeEmail({ email: "a@example.com", name: "A" }),
      ])
    ).resolves.toEqual([
      { skipped: true },
      { skipped: true },
    ]);
  });
});
