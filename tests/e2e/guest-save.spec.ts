import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3001";
const CLUB = "ilali-creative-arts-workshop";

test.describe("Painless Journeys — guest intent capture", () => {
  test("guest save opens email capture, sends a magic link, and sets intent", async ({
    page,
  }) => {
    await page.goto(`${BASE}/clubs/${CLUB}`);

    // Save button is present (Save & follow section)
    await expect(
      page.getByRole("button", { name: /Save/ }).first()
    ).toBeVisible();

    // Guest click → intent capture modal
    await page.getByRole("button", { name: `Save ILALI Creative Arts Workshop` }).first().click();
    await expect(
      page.getByRole("heading", { name: "Save it for later" })
    ).toBeVisible();

    // Benefit copy + email field
    await expect(page.getByText(/nothing spammy/)).toBeVisible();
    await page.fill("#intent-email", "guest-parent@example.com");
    await page.fill("#intent-name", "Guest Parent");

    await page.getByRole("button", { name: "Send magic link" }).click();

    // "Check your inbox" confirmation state
    await expect(
      page.getByRole("heading", { name: "Check your inbox" })
    ).toBeVisible({ timeout: 10000 });

    // The intent was stashed in a short-lived cookie for post-sign-in resume
    const cookies = await page.context().cookies();
    const intent = cookies.find((c) => c.name === "ilali_intent");
    expect(intent).toBeDefined();

    // Close the modal
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByRole("heading", { name: "Save it for later" })).toHaveCount(0);
  });

  test("saved page prompts guests to sign in (browsing never requires auth)", async ({
    page,
  }) => {
    await page.goto(`${BASE}/saved`);
    await expect(page.getByRole("heading", { name: "Your saved activities" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Sign in with a magic link" })
    ).toBeVisible();
  });
});
