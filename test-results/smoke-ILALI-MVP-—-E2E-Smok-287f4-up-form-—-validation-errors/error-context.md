# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> ILALI MVP — E2E Smoke Tests >> Provider signup form — validation errors
- Location: tests/e2e/smoke.spec.ts:29:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button[type=\'submit\']')

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]:
      - link [ref=e5] [cursor=pointer]:
        - /url: /
        - img "ILALI" [ref=e6]
      - navigation [ref=e7]:
        - link "Browse" [ref=e8] [cursor=pointer]:
          - /url: /browse
        - link "Map" [ref=e9] [cursor=pointer]:
          - /url: /map
        - link "Categories" [ref=e10] [cursor=pointer]:
          - /url: /categories
        - link "How It Works" [ref=e11] [cursor=pointer]:
          - /url: /how-it-works
        - link "Ubuntu Rewards" [ref=e12] [cursor=pointer]:
          - /url: /ubuntu-rewards
      - generic [ref=e13]:
        - textbox "Search activities..." [ref=e18]
        - link "Sign In" [ref=e19] [cursor=pointer]:
          - /url: /auth/signin
      - button "Open menu" [ref=e20]
  - main [ref=e22]:
    - generic [ref=e24]:
      - text: Provider sign up
      - heading "List Your Activity on ILALI" [level=1] [ref=e25]
      - paragraph [ref=e26]: Join South Africa's fastest-growing marketplace for children's activities. Reach thousands of local families looking for trusted programs.
      - generic [ref=e27]: R99/month — first 30 days free
    - generic [ref=e29]:
      - heading "Why list with ILALI?" [level=2] [ref=e30]
      - generic [ref=e31]:
        - generic [ref=e32]:
          - heading "Reach Local Families" [level=3] [ref=e39]
          - paragraph [ref=e40]: Connect with parents actively searching for quality activities for their children in your area.
        - generic [ref=e41]:
          - heading "Trusted & Vetted" [level=3] [ref=e45]
          - paragraph [ref=e46]: Join a platform built on trust. Every provider is verified, giving parents peace of mind.
        - generic [ref=e47]:
          - heading "Simple Setup" [level=3] [ref=e51]
          - paragraph [ref=e52]: No long contracts or hidden fees. Start listing in minutes and manage everything from one dashboard.
    - generic [ref=e54]:
      - heading "Everything you need to grow" [level=2] [ref=e55]
      - generic [ref=e56]:
        - generic [ref=e57]: Easy activity listing management
        - generic [ref=e60]: Built-in booking and scheduling system
        - generic [ref=e63]: Secure payment processing
        - generic [ref=e66]: Customer reviews and ratings
        - generic [ref=e69]: Ubuntu Rewards loyalty programme
        - generic [ref=e72]: Dedicated provider support
        - generic [ref=e75]: Marketing exposure to thousands of families
        - generic [ref=e78]: Performance analytics dashboard
  - contentinfo [ref=e81]:
    - generic [ref=e83]:
      - generic [ref=e84]:
        - link [ref=e85] [cursor=pointer]:
          - /url: /
          - img "ILALI" [ref=e86]
        - paragraph [ref=e87]: A child-safety-first marketplace connecting families with vetted providers and activities. Building communities, enriching childhoods.
        - generic [ref=e88]:
          - link "Browse activities →" [ref=e89] [cursor=pointer]:
            - /url: /browse
          - link "List your activity →" [ref=e90] [cursor=pointer]:
            - /url: /for-providers
      - generic [ref=e91]:
        - heading "DISCOVER" [level=3] [ref=e92]
        - list [ref=e93]:
          - listitem [ref=e94]:
            - link "Browse Activities" [ref=e95] [cursor=pointer]:
              - /url: /browse
          - listitem [ref=e96]:
            - link "Browse Venues" [ref=e97] [cursor=pointer]:
              - /url: /venues
          - listitem [ref=e98]:
            - link "Categories" [ref=e99] [cursor=pointer]:
              - /url: /categories
          - listitem [ref=e100]:
            - link "Locations" [ref=e101] [cursor=pointer]:
              - /url: /locations
          - listitem [ref=e102]:
            - link "How It Works" [ref=e103] [cursor=pointer]:
              - /url: /how-it-works
      - generic [ref=e104]:
        - heading "FOR PARENTS" [level=3] [ref=e105]
        - list [ref=e106]:
          - listitem [ref=e107]:
            - link "Getting Started" [ref=e108] [cursor=pointer]:
              - /url: /for-parents
          - listitem [ref=e109]:
            - link "Browse Activities" [ref=e110] [cursor=pointer]:
              - /url: /browse
          - listitem [ref=e111]:
            - link "Safety & Trust" [ref=e112] [cursor=pointer]:
              - /url: /safeguarding
          - listitem [ref=e113]:
            - link "Ubuntu Rewards" [ref=e114] [cursor=pointer]:
              - /url: /ubuntu-rewards
      - generic [ref=e115]:
        - heading "FOR PROVIDERS" [level=3] [ref=e116]
        - list [ref=e117]:
          - listitem [ref=e118]:
            - link "Why List With Us" [ref=e119] [cursor=pointer]:
              - /url: /for-providers
          - listitem [ref=e120]:
            - link "Start Provider Signup" [ref=e121] [cursor=pointer]:
              - /url: /auth/signup
          - listitem [ref=e122]:
            - link "Refer a Provider" [ref=e123] [cursor=pointer]:
              - /url: /contact
          - listitem [ref=e124]:
            - link "Provider Resources" [ref=e125] [cursor=pointer]:
              - /url: /provider-resources
      - generic [ref=e126]:
        - heading "FOR VENUES" [level=3] [ref=e127]
        - list [ref=e128]:
          - listitem [ref=e129]:
            - link "Partner With Us" [ref=e130] [cursor=pointer]:
              - /url: /for-venues
          - listitem [ref=e131]:
            - link "List Your Venue" [ref=e132] [cursor=pointer]:
              - /url: /auth/signup
          - listitem [ref=e133]:
            - link "Venue Resources" [ref=e134] [cursor=pointer]:
              - /url: /provider-resources
      - generic [ref=e135]:
        - heading "TRUST & SAFETY" [level=3] [ref=e136]
        - list [ref=e137]:
          - listitem [ref=e138]:
            - link "Safeguarding Policy" [ref=e139] [cursor=pointer]:
              - /url: /safeguarding
          - listitem [ref=e140]:
            - link "Code of Conduct" [ref=e141] [cursor=pointer]:
              - /url: /code-of-conduct
          - listitem [ref=e142]:
            - link "Safety Guidelines" [ref=e143] [cursor=pointer]:
              - /url: /safety-guidelines
          - listitem [ref=e144]:
            - link "Report a Concern" [ref=e145] [cursor=pointer]:
              - /url: /contact
      - generic [ref=e146]:
        - heading "SUPPORT" [level=3] [ref=e147]
        - list [ref=e148]:
          - listitem [ref=e149]:
            - link "Contact Us" [ref=e150] [cursor=pointer]:
              - /url: /contact
          - listitem [ref=e151]:
            - link "About ILALI" [ref=e152] [cursor=pointer]:
              - /url: /about
          - listitem [ref=e153]:
            - link "Ubuntu Rewards" [ref=e154] [cursor=pointer]:
              - /url: /ubuntu-rewards
          - listitem [ref=e155]:
            - link "Terms of Service" [ref=e156] [cursor=pointer]:
              - /url: /terms
    - generic [ref=e158]:
      - paragraph [ref=e159]: © 2026 ILALI. All rights reserved.
      - generic [ref=e160]:
        - link "Terms of Service" [ref=e161] [cursor=pointer]:
          - /url: /terms
        - link "Privacy Policy" [ref=e162] [cursor=pointer]:
          - /url: /privacy
        - link "Cookie Policy" [ref=e163] [cursor=pointer]:
          - /url: /privacy
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
> 32 |     await page.click("button[type='submit']");
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
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
  47 |     await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
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