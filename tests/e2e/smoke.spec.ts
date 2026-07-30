import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3001";

test.describe("ILALI MVP — E2E Smoke Tests", () => {
  test("Landing page loads", async ({ page }) => {
    const res = await page.goto(BASE);
    expect(res?.status()).toBe(200);
    await expect(page.locator("h1")).toContainText("Find activities");
  });

  test("Browse page shows sections and categories", async ({ page }) => {
    await page.goto(`${BASE}/browse`);
    await expect(page.getByRole("heading", { name: "New providers" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Local favourites" })).toBeVisible();
    // Category links exist
    await expect(page.getByRole("link", { name: /Arts & Culture/ }).first()).toBeVisible();
  });

  test("Activity detail page loads with WhatsApp + similar", async ({ page }) => {
    await page.goto(`${BASE}/activity/ilali-creative-arts-workshop`);
    await expect(page.locator("h1")).toContainText("ILALI Creative Arts Workshop");
    // WhatsApp button
    await expect(page.locator("text=Chat on WhatsApp")).toBeVisible();
    // Similar providers
    await expect(page.locator("text=You might also like")).toBeVisible();
  });

  test("Provider signup form — validation errors", async ({ page }) => {
    await page.goto(`${BASE}/providers/signup`);
    // Try submitting empty
    await page.click("button[type='submit']");
    await expect(page.locator("text=Full name")).toBeVisible();
  });

  test("Auth — signin page loads, /admin redirects to signin", async ({ page }) => {
    await page.goto(`${BASE}/admin`);
    await expect(page).toHaveURL(/signin/);
    await expect(page.locator("h1")).toContainText("Welcome back");
  });

  test("Auth — signin with valid admin credentials", async ({ page }) => {
    await page.goto(`${BASE}/auth/signin`);
    await page.fill("#email", "leroy@ilali.co");
    await page.fill("#password", "ilali-admin-2026");
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 5000 });
  });

  test("Static pages load (spot-check)", async ({ page }) => {
    const pages = ["/about", "/how-it-works", "/safeguarding", "/terms", "/privacy", "/contact"];
    for (const path of pages) {
      const res = await page.goto(`${BASE}${path}`);
      expect(res?.status()).toBe(200);
    }
  });

  test("AI matching — natural language search returns results", async ({ request }) => {
    const res = await request.post(`${BASE}/api/match`, {
      headers: { "Content-Type": "application/json" },
      data: { query: "creative arts for my teenager in Muizenberg" },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.mode).toBe("ai");
    expect(json.fallback).toBe(false);
    expect(json.matches.length).toBeGreaterThanOrEqual(1);
    expect(json.matches[0].score).toBeGreaterThan(50);
  });

  test("Search API returns results", async ({ request }) => {
    const res = await request.get(`${BASE}/api/search?q=creative`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.providers.length).toBeGreaterThanOrEqual(1);
  });

  test("Admin API — list applications (authenticated)", async ({ request }) => {
    // Login
    const loginRes = await request.post(`${BASE}/api/auth/sign-in/email`, {
      headers: { "Content-Type": "application/json", Origin: BASE },
      data: { email: "leroy@ilali.co", password: "ilali-admin-2026" },
    });
    expect(loginRes.status()).toBe(200);
    const cookies = loginRes.headers()["set-cookie"];
    
    // List applications
    const res = await request.get(`${BASE}/api/admin/applications`, {
      headers: { Cookie: cookies, Origin: BASE },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json)).toBe(true);
  });
});
