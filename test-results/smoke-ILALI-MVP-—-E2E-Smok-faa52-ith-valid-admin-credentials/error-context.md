# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> ILALI MVP — E2E Smoke Tests >> Auth — signin with valid admin credentials
- Location: tests/e2e/smoke.spec.ts:42:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/admin/
Received string:  "http://localhost:3001/auth/signin?email=leroy%40ilali.co&password=ilali-admin-2026"
Timeout: 10000ms

Call log:
  - Expect "toHaveURL" with timeout 10000ms
    24 × locator resolved to <html lang="en" class="h-full scroll-smooth">…</html>
       - unexpected value "http://localhost:3001/auth/signin?email=leroy%40ilali.co&password=ilali-admin-2026"

```

```yaml
- link "ILALI":
  - /url: /
- heading "Welcome back" [level=1]
- paragraph: Sign in to your ILALI account
- text: Email address
- textbox "Email address":
  - /placeholder: you@example.com
- text: Password
- textbox "Password":
  - /placeholder: Enter your password
- button "Sign In"
- paragraph:
  - text: Don't have an account?
  - link "Create one":
    - /url: /auth/signup
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const BASE = "http://localhost:3001";
  4  | 
  5  | test.describe("ILALI MVP — E2E Smoke Tests", () => {
  6  |   test("Landing page loads", async ({ page }) => {
  7  |     const res = await page.goto(BASE);
  8  |     expect(res?.status()).toBe(200);
  9  |     await expect(page.locator("h1")).toContainText("Find activities");
  10 |   });
  11 | 
  12 |   test("Browse page shows sections and categories", async ({ page }) => {
  13 |     await page.goto(`${BASE}/browse`);
  14 |     await expect(page.getByRole("heading", { name: "New providers" })).toBeVisible();
  15 |     await expect(page.getByRole("heading", { name: "Local favourites" })).toBeVisible();
  16 |     // Category links exist
  17 |     await expect(page.getByRole("link", { name: /Arts & Culture/ }).first()).toBeVisible();
  18 |   });
  19 | 
  20 |   test("Activity detail page loads with WhatsApp + similar", async ({ page }) => {
  21 |     await page.goto(`${BASE}/activity/ilali-creative-arts-workshop`);
  22 |     await expect(page.locator("h1")).toContainText("ILALI Creative Arts Workshop");
  23 |     // WhatsApp button
  24 |     await expect(page.locator("text=Chat on WhatsApp")).toBeVisible();
  25 |     // Similar providers
  26 |     await expect(page.locator("text=You might also like")).toBeVisible();
  27 |   });
  28 | 
  29 |   test("Provider signup form — validation errors", async ({ page }) => {
  30 |     await page.goto(`${BASE}/providers/signup`);
  31 |     // Try submitting empty
  32 |     await page.click("button[type='submit']");
  33 |     await expect(page.locator("text=Full name")).toBeVisible();
  34 |   });
  35 | 
  36 |   test("Auth — signin page loads, /admin redirects to signin", async ({ page }) => {
  37 |     await page.goto(`${BASE}/admin`);
  38 |     await expect(page).toHaveURL(/signin/);
  39 |     await expect(page.locator("h1")).toContainText("Welcome back");
  40 |   });
  41 | 
  42 |   test("Auth — signin with valid admin credentials", async ({ page }) => {
  43 |     await page.goto(`${BASE}/auth/signin`);
  44 |     await page.fill("#email", "leroy@ilali.co");
  45 |     await page.fill("#password", "ilali-admin-2026");
  46 |     await page.click("button[type='submit']");
> 47 |     await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  48 |     await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 5000 });
  49 |   });
  50 | 
  51 |   test("Static pages load (spot-check)", async ({ page }) => {
  52 |     const pages = ["/about", "/how-it-works", "/safeguarding", "/terms", "/privacy", "/contact"];
  53 |     for (const path of pages) {
  54 |       const res = await page.goto(`${BASE}${path}`);
  55 |       expect(res?.status()).toBe(200);
  56 |     }
  57 |   });
  58 | 
  59 |   test("AI matching — natural language search returns results", async ({ request }) => {
  60 |     const res = await request.post(`${BASE}/api/match`, {
  61 |       headers: { "Content-Type": "application/json" },
  62 |       data: { query: "creative arts for my teenager in Muizenberg" },
  63 |     });
  64 |     expect(res.status()).toBe(200);
  65 |     const json = await res.json();
  66 |     expect(json.mode).toBe("ai");
  67 |     expect(json.fallback).toBe(false);
  68 |     expect(json.matches.length).toBeGreaterThanOrEqual(1);
  69 |     expect(json.matches[0].score).toBeGreaterThan(50);
  70 |   });
  71 | 
  72 |   test("Search API returns results", async ({ request }) => {
  73 |     const res = await request.get(`${BASE}/api/search?q=creative`);
  74 |     expect(res.status()).toBe(200);
  75 |     const json = await res.json();
  76 |     expect(json.providers.length).toBeGreaterThanOrEqual(1);
  77 |   });
  78 | 
  79 |   test("Admin API — list applications (authenticated)", async ({ request }) => {
  80 |     // Login
  81 |     const loginRes = await request.post(`${BASE}/api/auth/sign-in/email`, {
  82 |       headers: { "Content-Type": "application/json", Origin: BASE },
  83 |       data: { email: "leroy@ilali.co", password: "ilali-admin-2026" },
  84 |     });
  85 |     expect(loginRes.status()).toBe(200);
  86 |     const cookies = loginRes.headers()["set-cookie"];
  87 |     
  88 |     // List applications
  89 |     const res = await request.get(`${BASE}/api/admin/applications`, {
  90 |       headers: { Cookie: cookies, Origin: BASE },
  91 |     });
  92 |     expect(res.status()).toBe(200);
  93 |     const json = await res.json();
  94 |     expect(Array.isArray(json)).toBe(true);
  95 |   });
  96 | });
  97 | 
```