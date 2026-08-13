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
    await expect(page.getByRole("heading", { name: "New this week" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Local favourites" })).toBeVisible();
    // Category links exist
    await expect(page.getByRole("link", { name: /Arts & Culture/ }).first()).toBeVisible();
  });

  test("Activity detail URL redirects to the canonical club page", async ({
    page,
  }) => {
    await page.goto(`${BASE}/activity/ilali-creative-arts-workshop`);
    await expect(page).toHaveURL(/\/clubs\/ilali-creative-arts-workshop/);
    await expect(page.locator("h1")).toContainText("ILALI Creative Arts Workshop");
    // Club page renders community content
    await expect(
      page.getByRole("heading", { name: "Upcoming events" })
    ).toBeVisible();
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
    // Magic link is the primary path; password sign-in is secondary (T004).
    await page.click("text=Use password instead");
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
    // Fast path (deterministic/cache) now handles parseable queries in <1s —
    // the AI tier is only hit for fuzzy ones. Any successful mode is correct;
    // what matters is that matches came back without a fallback.
    expect(["ai", "deterministic", "cache"]).toContain(json.mode);
    expect(json.fallback).toBe(false);
    expect(json.matches.length).toBeGreaterThanOrEqual(1);
    expect(json.matches[0].score).toBeGreaterThan(50);
  });

  test("AI matching — fuzzy query falls through to the AI tier", async ({ request }) => {
    // A vague query the deterministic parser cannot parse — must reach the
    // AI tier (OpenCode → OpenRouter → Gemini).
    const res = await request.post(`${BASE}/api/match`, {
      headers: { "Content-Type": "application/json" },
      data: { query: "something special for my amazing little one" },
    });
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.mode).toBe("ai");
    expect(json.fallback).toBe(false);
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
