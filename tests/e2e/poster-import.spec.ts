import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3001";
const FIXTURE = "tests/e2e/fixtures/poster-dance.png";

async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto(`${BASE}/auth/signin`);
  await page.fill("#email", "leroy@ilali.co");
  await page.fill("#password", "ilali-admin-2026");
  await page.click("button[type='submit']");
  await page.waitForURL(/\/admin/, { timeout: 15000 });
}

test.describe("WS-7 Poster Import — admin pipeline", () => {
  // Upload runs AI vision extraction INLINE (20s NIM timeout + network); even
  // the extraction_failed path needs time to return. 30s default is too tight.
  test.setTimeout(90000);

  test("admin can upload a poster and reach the review desk", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE}/admin/poster-import`);

    await expect(page.getByRole("heading", { name: "Poster Import" })).toBeVisible();

    // Upload the fixture poster via the hidden file input.
    await page.setInputFiles('input[type="file"]', FIXTURE);

    // Either AI extraction succeeds (name filled) or falls back to manual form —
    // both paths show the review desk with editable fields.
    await expect(page.getByRole("heading", { name: "Profile review" })).toBeVisible({
      timeout: 60000,
    });

    // The profile form renders.
    await expect(page.locator("#f-name")).toBeVisible();
    await expect(page.locator("#f-type")).toBeVisible();
    await expect(page.locator("#f-phone")).toBeVisible();

    // Poster preview is shown.
    await expect(page.locator("img[alt='Uploaded activity poster']")).toBeVisible();
  });

  test("save requires name + category then succeeds", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE}/admin/poster-import`);
    await page.setInputFiles('input[type="file"]', FIXTURE);

    await expect(page.getByRole("heading", { name: "Profile review" })).toBeVisible({
      timeout: 60000,
    });

    // Ensure required fields are filled (AI may have filled them already).
    const name = page.locator("#f-name");
    if ((await name.inputValue()).trim() === "") {
      await name.fill("E2E Test Studio");
    }
    const type = page.locator("#f-type");
    if ((await type.inputValue()) === "") {
      await type.selectOption({ label: "Arts & Culture" });
    }
    const phone = page.locator("#f-phone");
    if ((await phone.inputValue()).trim() === "") {
      await phone.fill("+27821234567");
    }

    await page.getByRole("button", { name: /Save application/ }).click();

    // Success message appears after save.
    await expect(page.getByText(/Application saved/)).toBeVisible({ timeout: 15000 });
  });

  test("auto-crops the logo when the AI detects one on the poster", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE}/admin/poster-import`);

    await expect(page.getByRole("heading", { name: "Poster Import" })).toBeVisible();

    // Upload the poster that has a clear logo (top-right corner).
    await page.setInputFiles(
      'input[type="file"]',
      "tests/e2e/fixtures/poster-with-logo.png"
    );

    // Review desk renders.
    await expect(page.getByRole("heading", { name: "Profile review" })).toBeVisible({
      timeout: 60000,
    });

    // The logo should be cropped + displayed automatically (regression test
    // for the stale-closure bug: cropLogoFromPoster captured a null posterUrl
    // because handleFile had empty deps — the logo was NEVER extracted even
    // though the AI returned logoBox. Fixed 2026-08-11 by passing the source
    // URL explicitly instead of reading it from a stale closure.)
    await expect(page.locator("img[alt='Provider logo']")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText(/Logo detected on the poster/)).toBeVisible();
  });

  test("applications page has a Posters filter chip", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE}/admin/applications`);

    await expect(
      page.getByRole("link", { name: /Posters/ })
    ).toBeVisible();
  });
});
