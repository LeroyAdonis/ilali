import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3001";

test("admin can edit a pending application draft", async ({ page }) => {
  await page.goto(`${BASE}/auth/signin`);
  await page.fill("#email", "leroy@ilali.co");
  await page.fill("#password", "ilali-admin-2026");
  await page.click("button[type='submit']");
  await page.waitForURL(/\/admin/, { timeout: 20000 });

  await page.goto(`${BASE}/admin/applications`);

  // The pending poster application should show an Edit draft button
  const editBtn = page.getByRole("button", { name: "Edit draft" }).first();
  await expect(editBtn).toBeVisible({ timeout: 15000 });

  await editBtn.click();
  // Form appears with the name field pre-filled
  await expect(page.getByText("Edit draft", { exact: true }).first()).toBeVisible();
  const nameInput = page.locator('input[id^="edit-name-"]').first();
  await expect(nameInput).toBeVisible();

  // Change the description and save
  const desc = page.locator('textarea[id^="edit-desc-"]').first();
  const current = await desc.inputValue();
  await desc.fill(current ? current + " — updated via UI test" : "UI test description");
  await page.getByRole("button", { name: "Save changes" }).click();

  // Editor closes after save
  await expect(page.locator("textarea[id^=\"edit-desc-\"]").first()).not.toBeVisible({ timeout: 10000 });
});

test("admin can edit extended poster fields in the draft", async ({ page }) => {
  await page.goto(`${BASE}/auth/signin`);
  await page.fill("#email", "leroy@ilali.co");
  await page.fill("#password", "ilali-admin-2026");
  await page.click("button[type='submit']");
  await page.waitForURL(/\/admin/, { timeout: 20000 });

  await page.goto(`${BASE}/admin/applications`);
  const editBtn = page.getByRole("button", { name: "Edit draft" }).first();
  await expect(editBtn).toBeVisible({ timeout: 15000 });
  await editBtn.click();

  // The extended fields are present in the editor
  const venue = page.locator('input[id^="edit-venue-"]').first();
  await expect(venue).toBeVisible();
  await venue.fill("Test Venue");

  const booking = page.locator('textarea[id^="edit-booking-"]').first();
  await expect(booking).toBeVisible();
  await booking.fill("WhatsApp to book");

  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("textarea[id^=\"edit-desc-\"]").first()).not.toBeVisible({ timeout: 10000 });
});
