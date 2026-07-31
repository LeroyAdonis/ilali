import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3001";

test.describe("ILALI — Map View", () => {
  test("/map loads with map container, legend and status line", async ({
    page,
  }) => {
    await page.goto(`${BASE}/map`);

    await expect(page.locator("h1")).toContainText("Find clubs near you");
    // Leaflet container mounts (client-side, after dynamic import)
    await expect(page.locator(".leaflet-container")).toBeVisible({
      timeout: 15000,
    });
    // Legend
    await expect(page.getByText("Verified", { exact: true })).toBeVisible();
    await expect(page.getByText("Listed", { exact: true })).toBeVisible();
    await expect(page.getByText("Parents nearby", { exact: true })).toBeVisible();
    // Nav link reaches the map (exact — avoids matching "OpenStreetMap" attribution)
    await expect(page.getByRole("link", { name: "Map", exact: true })).toBeVisible();
  });

  test("provider pins are fetched and rendered (SVG overlay, not canvas)", async ({
    page,
  }) => {
    await page.goto(`${BASE}/map`);

    // Status line confirms provider data arrived from the API
    await expect(page.getByTestId("map-status")).toContainText(/of \d+ clubs/, {
      timeout: 15000,
    });
    // At least one interactive SVG path (circleMarker) in the overlay pane
    await expect(
      page.locator(".leaflet-overlay-pane path.leaflet-interactive").first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("filtering narrows the shown club count", async ({ page }) => {
    await page.goto(`${BASE}/map`);

    await expect(page.getByTestId("map-status")).toContainText(/of \d+ clubs/, {
      timeout: 15000,
    });

    // Verified only — count should drop (some providers are listed)
    await page.getByRole("button", { name: "Verified only" }).click();
    await expect(page.getByTestId("map-status")).toContainText(
      /^\d+ of \d+ clubs shown$/
    );
    const statusText = await page.getByTestId("map-status").textContent();
    const [shown, total] = (statusText ?? "").match(/(\d+) of (\d+)/)?.slice(1).map(Number) ?? [0, 0];
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(total);
  });

  test("GET /api/map/providers returns providers with coords + tier", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/api/map/providers`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.total).toBeGreaterThan(0);

    const first = body.data[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("name");
    expect(first).toHaveProperty("slug");
    expect(first).toHaveProperty("category");
    expect(first).toHaveProperty("lat");
    expect(first).toHaveProperty("lng");
    expect(first).toHaveProperty("rating");
    expect(first).toHaveProperty("verifiedTier");
    expect(first).toHaveProperty("suburb");
    expect(["trusted", "verified", "listed"]).toContain(first.verifiedTier);
  });

  test("GET /api/map/providers?verified=true returns only verified/trusted", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/api/map/providers?verified=true`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.total).toBeGreaterThan(0);
    for (const p of body.data) {
      expect(p.verifiedTier).not.toBe("listed");
    }
  });

  test("GET /api/map/density returns suburb-level counts with coords", async ({
    request,
  }) => {
    const res = await request.get(`${BASE}/api/map/density`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.length).toBeGreaterThan(0);

    for (const row of body.data) {
      expect(row).toHaveProperty("suburb");
      expect(row).toHaveProperty("count");
      expect(typeof row.count).toBe("number");
      expect(row).toHaveProperty("lat");
      expect(row).toHaveProperty("lng");
    }
  });
});
