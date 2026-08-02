# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: map.spec.ts >> ILALI — Map View >> /map loads with map container, legend and status line
- Location: tests/e2e/map.spec.ts:6:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.leaflet-container')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('.leaflet-container')

```

```yaml
- banner:
  - link "ILALI":
    - /url: /
    - img "ILALI"
  - navigation:
    - link "Browse":
      - /url: /browse
    - link "Map":
      - /url: /map
    - link "Categories":
      - /url: /categories
    - link "How It Works":
      - /url: /how-it-works
    - link "Ubuntu Rewards":
      - /url: /ubuntu-rewards
  - textbox "Search activities..."
  - link "Sign In":
    - /url: /auth/signin
  - button "Open menu"
- main:
  - heading "Find clubs near you" [level=1]
  - paragraph: Green pins are verified providers, grey pins are listed, and blue circles show how many ILALI parents are nearby — by suburb, never individuals.
  - text: Category
  - combobox "Category":
    - option "All categories" [selected]
    - option "Arts & Culture"
    - option "Education"
    - option "Educational Support"
    - option "Emotional Intel."
    - option "Holiday Programs"
    - option "Music Lessons"
    - option "New & Used Equipment"
    - option "School Open Days"
    - option "Sports"
    - option "Venues"
    - option "Volunteering"
  - button "Verified only"
  - text: Loading clubs… Verified Listed Parents nearby
  - paragraph: Density circles show the number of ILALI parents per suburb — anonymised at suburb level. Coordinates for pins fall back to suburb lookups, so positions are approximate.
- contentinfo:
  - link "ILALI":
    - /url: /
    - img "ILALI"
  - paragraph: A child-safety-first marketplace connecting families with vetted providers and activities. Building communities, enriching childhoods.
  - link "Browse activities →":
    - /url: /browse
  - link "List your activity →":
    - /url: /for-providers
  - heading "DISCOVER" [level=3]
  - list:
    - listitem:
      - link "Browse Activities":
        - /url: /browse
    - listitem:
      - link "Browse Venues":
        - /url: /venues
    - listitem:
      - link "Categories":
        - /url: /categories
    - listitem:
      - link "Locations":
        - /url: /locations
    - listitem:
      - link "How It Works":
        - /url: /how-it-works
  - heading "FOR PARENTS" [level=3]
  - list:
    - listitem:
      - link "Getting Started":
        - /url: /for-parents
    - listitem:
      - link "Browse Activities":
        - /url: /browse
    - listitem:
      - link "Safety & Trust":
        - /url: /safeguarding
    - listitem:
      - link "Ubuntu Rewards":
        - /url: /ubuntu-rewards
  - heading "FOR PROVIDERS" [level=3]
  - list:
    - listitem:
      - link "Why List With Us":
        - /url: /for-providers
    - listitem:
      - link "Start Provider Signup":
        - /url: /auth/signup
    - listitem:
      - link "Refer a Provider":
        - /url: /contact
    - listitem:
      - link "Provider Resources":
        - /url: /provider-resources
  - heading "FOR VENUES" [level=3]
  - list:
    - listitem:
      - link "Partner With Us":
        - /url: /for-venues
    - listitem:
      - link "List Your Venue":
        - /url: /auth/signup
    - listitem:
      - link "Venue Resources":
        - /url: /provider-resources
  - heading "TRUST & SAFETY" [level=3]
  - list:
    - listitem:
      - link "Safeguarding Policy":
        - /url: /safeguarding
    - listitem:
      - link "Code of Conduct":
        - /url: /code-of-conduct
    - listitem:
      - link "Safety Guidelines":
        - /url: /safety-guidelines
    - listitem:
      - link "Report a Concern":
        - /url: /contact
  - heading "SUPPORT" [level=3]
  - list:
    - listitem:
      - link "Contact Us":
        - /url: /contact
    - listitem:
      - link "About ILALI":
        - /url: /about
    - listitem:
      - link "Ubuntu Rewards":
        - /url: /ubuntu-rewards
    - listitem:
      - link "Terms of Service":
        - /url: /terms
  - paragraph: © 2026 ILALI. All rights reserved.
  - link "Terms of Service":
    - /url: /terms
  - link "Privacy Policy":
    - /url: /privacy
  - link "Cookie Policy":
    - /url: /privacy
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | const BASE = "http://localhost:3001";
  4   | 
  5   | test.describe("ILALI — Map View", () => {
  6   |   test("/map loads with map container, legend and status line", async ({
  7   |     page,
  8   |   }) => {
  9   |     await page.goto(`${BASE}/map`);
  10  | 
  11  |     await expect(page.locator("h1")).toContainText("Find clubs near you");
  12  |     // Leaflet container mounts (client-side, after dynamic import)
> 13  |     await expect(page.locator(".leaflet-container")).toBeVisible({
      |                                                      ^ Error: expect(locator).toBeVisible() failed
  14  |       timeout: 15000,
  15  |     });
  16  |     // Legend
  17  |     await expect(page.getByText("Verified", { exact: true })).toBeVisible();
  18  |     await expect(page.getByText("Listed", { exact: true })).toBeVisible();
  19  |     await expect(page.getByText("Parents nearby", { exact: true })).toBeVisible();
  20  |     // Nav link reaches the map (exact — avoids matching "OpenStreetMap" attribution)
  21  |     await expect(page.getByRole("link", { name: "Map", exact: true })).toBeVisible();
  22  |   });
  23  | 
  24  |   test("provider pins are fetched and rendered (SVG overlay, not canvas)", async ({
  25  |     page,
  26  |   }) => {
  27  |     await page.goto(`${BASE}/map`);
  28  | 
  29  |     // Status line confirms provider data arrived from the API
  30  |     await expect(page.getByTestId("map-status")).toContainText(/of \d+ clubs/, {
  31  |       timeout: 15000,
  32  |     });
  33  |     // At least one interactive SVG path (circleMarker) in the overlay pane
  34  |     await expect(
  35  |       page.locator(".leaflet-overlay-pane path.leaflet-interactive").first()
  36  |     ).toBeVisible({ timeout: 15000 });
  37  |   });
  38  | 
  39  |   test("filtering narrows the shown club count", async ({ page }) => {
  40  |     await page.goto(`${BASE}/map`);
  41  | 
  42  |     await expect(page.getByTestId("map-status")).toContainText(/of \d+ clubs/, {
  43  |       timeout: 15000,
  44  |     });
  45  | 
  46  |     // Verified only — count should drop (some providers are listed)
  47  |     await page.getByRole("button", { name: "Verified only" }).click();
  48  |     await expect(page.getByTestId("map-status")).toContainText(
  49  |       /^\d+ of \d+ clubs shown$/
  50  |     );
  51  |     const statusText = await page.getByTestId("map-status").textContent();
  52  |     const [shown, total] = (statusText ?? "").match(/(\d+) of (\d+)/)?.slice(1).map(Number) ?? [0, 0];
  53  |     expect(shown).toBeGreaterThan(0);
  54  |     expect(shown).toBeLessThan(total);
  55  |   });
  56  | 
  57  |   test("GET /api/map/providers returns providers with coords + tier", async ({
  58  |     request,
  59  |   }) => {
  60  |     const res = await request.get(`${BASE}/api/map/providers`);
  61  |     expect(res.status()).toBe(200);
  62  |     const body = await res.json();
  63  |     expect(body.total).toBeGreaterThan(0);
  64  | 
  65  |     const first = body.data[0];
  66  |     expect(first).toHaveProperty("id");
  67  |     expect(first).toHaveProperty("name");
  68  |     expect(first).toHaveProperty("slug");
  69  |     expect(first).toHaveProperty("category");
  70  |     expect(first).toHaveProperty("lat");
  71  |     expect(first).toHaveProperty("lng");
  72  |     expect(first).toHaveProperty("rating");
  73  |     expect(first).toHaveProperty("verifiedTier");
  74  |     expect(first).toHaveProperty("suburb");
  75  |     expect(["trusted", "verified", "listed"]).toContain(first.verifiedTier);
  76  |   });
  77  | 
  78  |   test("GET /api/map/providers?verified=true returns only verified/trusted", async ({
  79  |     request,
  80  |   }) => {
  81  |     const res = await request.get(`${BASE}/api/map/providers?verified=true`);
  82  |     expect(res.status()).toBe(200);
  83  |     const body = await res.json();
  84  |     expect(body.total).toBeGreaterThan(0);
  85  |     for (const p of body.data) {
  86  |       expect(p.verifiedTier).not.toBe("listed");
  87  |     }
  88  |   });
  89  | 
  90  |   test("GET /api/map/density returns suburb-level counts with coords", async ({
  91  |     request,
  92  |   }) => {
  93  |     const res = await request.get(`${BASE}/api/map/density`);
  94  |     expect(res.status()).toBe(200);
  95  |     const body = await res.json();
  96  |     expect(body.data.length).toBeGreaterThan(0);
  97  | 
  98  |     for (const row of body.data) {
  99  |       expect(row).toHaveProperty("suburb");
  100 |       expect(row).toHaveProperty("count");
  101 |       expect(typeof row.count).toBe("number");
  102 |       expect(row).toHaveProperty("lat");
  103 |       expect(row).toHaveProperty("lng");
  104 |     }
  105 |   });
  106 | });
  107 | 
```