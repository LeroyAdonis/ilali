# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: map.spec.ts >> ILALI — Map View >> provider pins are fetched and rendered (SVG overlay, not canvas)
- Location: tests/e2e/map.spec.ts:24:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('map-status')
Expected pattern: /of \d+ clubs/
Received string:  "Loading clubs…"
Timeout: 15000ms

Call log:
  - Expect "toContainText" with timeout 15000ms
  - waiting for getByTestId('map-status')
    33 × locator resolved to <span aria-live="polite" data-testid="map-status" class="ml-auto text-sm text-ink-faint">Loading clubs…</span>
       - unexpected value "Loading clubs…"

```

```yaml
- text: Loading clubs…
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
  13  |     await expect(page.locator(".leaflet-container")).toBeVisible({
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
> 30  |     await expect(page.getByTestId("map-status")).toContainText(/of \d+ clubs/, {
      |                                                  ^ Error: expect(locator).toContainText(expected) failed
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