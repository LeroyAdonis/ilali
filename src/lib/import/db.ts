/**
 * WS-4 Bulk Import — DB-backed context builders for the preview/commit routes.
 *
 * Kept out of validate.ts so the pure validation logic stays unit-testable
 * without a database. Both `buildDedupContext` and `buildKnownActivityTypes`
 * run read-only queries; commit re-runs them to stay race-safe.
 */
import { db } from "@/lib/db/index";
import { providerApplications, users, categories } from "@/lib/db/schema";
import { inArray, sql } from "drizzle-orm";
import { ACTIVITY_TYPE_TO_CATEGORY } from "@/lib/admin/approveApplication";
import type { ValidationContext } from "./validate";

/** Emails live in the DB as lowercased in the application layer (FR-2). */
const LIVE_APPLICATION_STATUSES = ["pending", "contacted", "approved"];

/**
 * Build the dedup sets (userEmails + applicationEmails) for a batch of emails.
 * Queries use `lower(email)` so case variants in the DB are caught too.
 */
export async function buildDedupContext(
  emails: string[]
): Promise<Pick<ValidationContext, "userEmails" | "applicationEmails">> {
  const unique = [...new Set(emails.map((e) => e.toLowerCase().trim()).filter(Boolean))];
  if (unique.length === 0) {
    return { userEmails: new Set<string>(), applicationEmails: new Set<string>() };
  }

  const [userRows, appRows] = await Promise.all([
    db
      .select({ email: users.email })
      .from(users)
      .where(inArray(sql`lower(${users.email})`, unique)),
    db
      .select({ email: providerApplications.email, status: providerApplications.status })
      .from(providerApplications)
      .where(inArray(sql`lower(${providerApplications.email})`, unique)),
  ]);

  return {
    userEmails: new Set(userRows.map((r) => r.email.toLowerCase())),
    applicationEmails: new Set(
      appRows
        .filter((r) => LIVE_APPLICATION_STATUSES.includes(r.status ?? ""))
        .map((r) => r.email.toLowerCase())
    ),
  };
}

/**
 * Activity types that resolve cleanly at approval time: category names + slugs
 * plus the form's activity-type aliases. Anything else is a preview warning.
 */
export async function buildKnownActivityTypes(): Promise<Set<string>> {
  const cats = await db.select({ name: categories.name, slug: categories.slug }).from(categories);
  const known = new Set<string>();
  for (const c of cats) {
    known.add(c.name.toLowerCase());
    known.add(c.slug.toLowerCase());
  }
  for (const alias of Object.keys(ACTIVITY_TYPE_TO_CATEGORY)) {
    known.add(alias.toLowerCase());
  }
  return known;
}
