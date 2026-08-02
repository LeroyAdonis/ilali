# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: clubs.spec.ts >> ILALI — Club / Community Pages >> Club members page renders member directory heading
- Location: tests/e2e/clubs.spec.ts:46:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Members' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Members' })

```

```yaml
- img
- heading "This page couldn’t load" [level=1]
- paragraph: Reload to try again, or go back.
- button "Reload"
- button "Back"
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const BASE = "http://localhost:3001";
  4  | const CLUB_SLUG = "soccer-stars-academy";
  5  | 
  6  | test.describe("ILALI — Club / Community Pages", () => {
  7  |   test("/clubs redirects to /browse", async ({ page }) => {
  8  |     await page.goto(`${BASE}/clubs`);
  9  |     await expect(page).toHaveURL(/\/browse/);
  10 |   });
  11 | 
  12 |   test("Club home page renders header, verification badge slot and schedule", async ({
  13 |     page,
  14 |   }) => {
  15 |     await page.goto(`${BASE}/clubs/${CLUB_SLUG}`);
  16 | 
  17 |     // Header — provider name as h1
  18 |     await expect(page.locator("h1")).toContainText("Soccer Stars Academy");
  19 | 
  20 |     // Tab nav — About | Schedule | Members | Chat
  21 |     const tabs = page.getByRole("navigation", { name: "Club sections" });
  22 |     await expect(tabs.getByRole("link", { name: "About" })).toBeVisible();
  23 |     await expect(tabs.getByRole("link", { name: "Schedule" })).toBeVisible();
  24 |     await expect(tabs.getByRole("link", { name: "Members" })).toBeVisible();
  25 |     await expect(tabs.getByRole("link", { name: "Chat" })).toBeVisible();
  26 | 
  27 |     // Schedule section renders
  28 |     await expect(
  29 |       page.getByRole("heading", { name: "Upcoming events" })
  30 |     ).toBeVisible();
  31 | 
  32 |     // Ride requests section (lift club) renders
  33 |     await expect(
  34 |       page.getByRole("heading", { name: "Ride requests" })
  35 |     ).toBeVisible();
  36 |   });
  37 | 
  38 |   test("Club events page groups by month and renders schedule heading", async ({
  39 |     page,
  40 |   }) => {
  41 |     await page.goto(`${BASE}/clubs/${CLUB_SLUG}/events`);
  42 |     await expect(page.getByRole("heading", { name: "Full schedule" })).toBeVisible();
  43 |     await expect(page.locator("h1")).toContainText("Soccer Stars Academy");
  44 |   });
  45 | 
  46 |   test("Club members page renders member directory heading", async ({
  47 |     page,
  48 |   }) => {
  49 |     await page.goto(`${BASE}/clubs/${CLUB_SLUG}/members`);
> 50 |     await expect(page.getByRole("heading", { name: "Members" })).toBeVisible();
     |                                                                  ^ Error: expect(locator).toBeVisible() failed
  51 |     await expect(page.locator("h1")).toContainText("Soccer Stars Academy");
  52 |   });
  53 | 
  54 |   test("Unknown club slug returns 404", async ({ page }) => {
  55 |     const res = await page.goto(`${BASE}/clubs/this-club-does-not-exist`);
  56 |     expect(res?.status()).toBe(404);
  57 |   });
  58 | });
  59 | 
```