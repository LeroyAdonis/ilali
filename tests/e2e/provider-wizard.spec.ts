import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3001";

/**
 * Painless Journeys Phase 4 — provider self-onboarding wizard (T026–T030).
 *
 * Covers the guest gate, the four-step wizard with autosave/resume, submit,
 * and the post-submit status tracker on the provider dashboard. Email is never
 * blocking, so the magic-link send always returns success — the guest gate
 * test asserts the "Check your inbox" confirmation exactly like guest-save.
 * The signed-in flow signs up a throwaway email+password account via the
 * Better Auth API (the browser then signs in with that password), keeping the
 * shared admin accounts untouched.
 */
test.describe("Provider wizard — painless onboarding", () => {
  test("guest gate captures an email and offers a magic link", async ({ page }) => {
    await page.goto(`${BASE}/providers/signup`);
    await expect(
      page.getByRole("heading", { name: /Get started — it's free/ })
    ).toBeVisible();

    await page.fill("#wizard-guest-name", "Wizard Guest");
    await page.fill(
      "#wizard-guest-email",
      `wizard-guest-${Date.now()}@example.com`
    );
    await page.getByRole("button", { name: "Send magic link" }).click();

    await expect(
      page.getByRole("heading", { name: "Check your inbox" })
    ).toBeVisible({ timeout: 10000 });
  });

  test("full wizard: save, resume, submit, and see the status tracker", async ({
    page,
    request,
  }) => {
    const email = `wizard-e2e-${Date.now()}@example.com`;
    const password = "wizard-pass-2026";

    // Create a throwaway account via the Better Auth API.
    const signup = await request.post(`${BASE}/api/auth/sign-up/email`, {
      headers: { "Content-Type": "application/json", Origin: BASE },
      data: { name: "Wizard E2E", email, password },
    });
    expect([200, 201]).toContain(signup.status());

    // Sign in with the password through the real UI (smoke.spec does the same).
    await page.goto(`${BASE}/auth/signin`);
    await page.click("text=Use password instead");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.click("button[type='submit']");
    await page.waitForURL(/\/home|\/provider/, { timeout: 10000 });

    // ── Wizard step 1: Offer ──
    await page.goto(`${BASE}/providers/signup`);
    await expect(
      page.getByRole("heading", { name: "The offer" })
    ).toBeVisible({ timeout: 10000 });

    await page.fill("#name", "Wizard Test Art Club");
    await page.selectOption("#category", { label: "Arts & Culture" });
    await page.fill("#ageMin", "4");
    await page.fill("#ageMax", "12");
    await page.getByRole("button", { name: "Continue" }).click();

    // ── Wizard step 2: Details ──
    await expect(
      page.getByRole("heading", { name: "Practical details" })
    ).toBeVisible();
    await page.selectOption("#location", { label: "Muizenberg" });
    await page.fill("#priceValue", "150");
    await page.selectOption("#priceLabel", "per session");
    await page.fill("#phone", "+27 82 123 4567");
    await page.fill("#schedule", "Saturdays 09:00–11:00");
    await page.getByRole("button", { name: "Continue" }).click();

    // ── Wizard step 3: Photos & story ──
    await expect(
      page.getByRole("heading", { name: /Photos & story/ })
    ).toBeVisible();
    await page.fill(
      "#description",
      "A hands-on Saturday art club for kids exploring paint, clay and collage."
    );
    await page.getByRole("button", { name: "Continue" }).click();

    // ── Wizard step 4: Review + live preview ──
    await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
    await expect(page.getByText("Wizard Test Art Club").first()).toBeVisible();

    // Resume proof: going back keeps the saved values (Review → Photos).
    await page.getByRole("button", { name: "Back" }).click();
    await expect(
      page.getByRole("heading", { name: /Photos & story/ })
    ).toBeVisible();
    await expect(page.locator("#description")).toHaveValue(
      "A hands-on Saturday art club for kids exploring paint, clay and collage."
    );

    // Back through to the offer step — everything is still saved.
    await page.getByRole("button", { name: "Back" }).click();
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByRole("heading", { name: "The offer" })).toBeVisible();
    await expect(page.locator("#name")).toHaveValue("Wizard Test Art Club");

    // Forward again to Review and submit.
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
    await page.getByRole("button", { name: "Submit listing" }).click();

    // ── Submitted → success screen ──
    await expect(
      page.getByRole("heading", { name: /You're on your way/ })
    ).toBeVisible({ timeout: 10000 });

    // ── Returning shows "already in review" (submitted, not resumable) ──
    await page.goto(`${BASE}/providers/signup`);
    await expect(
      page.getByRole("heading", { name: /already in review/ })
    ).toBeVisible({ timeout: 10000 });

    // ── Dashboard status tracker (Submitted → Reviewing → Live) ──
    await page.goto(`${BASE}/provider`);
    await expect(
      page.getByRole("heading", { name: "Where your listing stands" })
    ).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Most listings are reviewed within 24–48 hours")).toBeVisible();
  });
});
