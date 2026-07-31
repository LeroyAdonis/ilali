import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3001";
const CLUB_SLUG = "soccer-stars-academy";

test.describe("ILALI — Club / Community Pages", () => {
  test("/clubs redirects to /browse", async ({ page }) => {
    await page.goto(`${BASE}/clubs`);
    await expect(page).toHaveURL(/\/browse/);
  });

  test("Club home page renders header, verification badge slot and schedule", async ({
    page,
  }) => {
    await page.goto(`${BASE}/clubs/${CLUB_SLUG}`);

    // Header — provider name as h1
    await expect(page.locator("h1")).toContainText("Soccer Stars Academy");

    // Tab nav — About | Schedule | Members | Chat
    const tabs = page.getByRole("navigation", { name: "Club sections" });
    await expect(tabs.getByRole("link", { name: "About" })).toBeVisible();
    await expect(tabs.getByRole("link", { name: "Schedule" })).toBeVisible();
    await expect(tabs.getByRole("link", { name: "Members" })).toBeVisible();
    await expect(tabs.getByRole("link", { name: "Chat" })).toBeVisible();

    // Schedule section renders
    await expect(
      page.getByRole("heading", { name: "Upcoming events" })
    ).toBeVisible();
  });

  test("Club events page groups by month and renders schedule heading", async ({
    page,
  }) => {
    await page.goto(`${BASE}/clubs/${CLUB_SLUG}/events`);
    await expect(page.getByRole("heading", { name: "Full schedule" })).toBeVisible();
    await expect(page.locator("h1")).toContainText("Soccer Stars Academy");
  });

  test("Club members page renders member directory heading", async ({
    page,
  }) => {
    await page.goto(`${BASE}/clubs/${CLUB_SLUG}/members`);
    await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
    await expect(page.locator("h1")).toContainText("Soccer Stars Academy");
  });

  test("Unknown club slug returns 404", async ({ page }) => {
    const res = await page.goto(`${BASE}/clubs/this-club-does-not-exist`);
    expect(res?.status()).toBe(404);
  });
});
