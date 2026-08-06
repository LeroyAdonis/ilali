/**
 * WS-4 Bulk Import — per-row validation + dedup planning (T008 / spec FR-2).
 *
 * Pure and testable: `validateRows()` takes precomputed dedup sets and known
 * activity types (the routes build them from the DB) and returns a per-row
 * status report. No database access here.
 *
 * Rules mirror `providerApplicationSchema` semantics (src/lib/validations.ts):
 * name ≥ 2 chars; valid email; +27 phone or empty; ages whole 0–18 with
 * ageMin ≤ ageMax; price whole ≥ 0; image URL valid or empty. Dedup (email
 * compared case-insensitively, trimmed):
 *   1. duplicated within the file → all-but-first rejected
 *   2. already in `users` (any role) → rejected
 *   3. already in a pending/contacted/approved application → rejected
 *   4. only in a rejected application → allowed (re-importable)
 * Unknown (but non-empty) activityType → warning, not an error — approval-time
 * `resolveCategoryId` falls back to a category.
 */
import type { ParsedRow, ValidatedRow } from "./types";

export interface ValidationContext {
  /** Lowercased emails that already exist in `users` (any role). */
  userEmails: Set<string>;
  /** Lowercased emails already in a pending/contacted/approved application. */
  applicationEmails: Set<string>;
  /**
   * Lowercased activity types that resolve cleanly at approval time:
   * category names + slugs + the form's activity-type aliases.
   */
  knownActivityTypes: Set<string>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+27\s?\d{2}\s?\d{3}\s?\d{4}$/;
const URL_RE = /^https?:\/\/\S+$/i;

export function validateRow(
  parsed: ParsedRow,
  ctx: ValidationContext
): ValidatedRow {
  const errors: string[] = [];
  const warnings: string[] = [];
  const email = parsed.email.trim().toLowerCase();

  // ── name ──
  const name = parsed.name.trim();
  if (name.length < 2) {
    errors.push("Name must be at least 2 characters");
  }

  // ── email ──
  if (email === "") {
    errors.push("Email is required");
  } else if (!EMAIL_RE.test(email)) {
    errors.push("Please enter a valid email address");
  }

  // ── phone (+27 format or empty) ──
  const phone = parsed.phone.trim();
  if (phone !== "" && !PHONE_RE.test(phone)) {
    errors.push("Phone must be in +27 format (e.g. +27 82 123 4567)");
  }

  // ── activity type: empty is an error, unknown is a warning ──
  const activityType = parsed.activityType.trim();
  if (activityType === "") {
    errors.push("Activity type is required");
  } else if (!ctx.knownActivityTypes.has(activityType.toLowerCase())) {
    warnings.push(
      "Unknown activity type — will map to a default category at approval time"
    );
  }

  // ── numeric fields (whole 0–18 ages, price ≥ 0) ──
  const ageMin = coerceWholeNumber(parsed.ageMin, "Age", errors);
  const ageMax = coerceWholeNumber(parsed.ageMax, "Age", errors);
  const priceValue = coerceWholeNumber(parsed.priceValue, "Price", errors);
  if (priceValue != null && priceValue < 0) {
    errors.push("Price cannot be negative");
  }
  if (ageMin != null && (ageMin < 0 || ageMin > 18)) {
    errors.push("Age must be between 0 and 18");
  }
  if (ageMax != null && (ageMax < 0 || ageMax > 18)) {
    errors.push("Age must be between 0 and 18");
  }
  if (ageMin != null && ageMax != null && ageMin > ageMax) {
    errors.push("Minimum age cannot be greater than maximum age");
  }

  // ── image URL (optional, must be a URL when present) ──
  const imageUrl = parsed.imageUrl.trim();
  if (imageUrl !== "" && !URL_RE.test(imageUrl)) {
    errors.push("Image URL must be a valid URL");
  }

  const hasErrors = errors.length > 0;

  return {
    row: parsed.row,
    email,
    status: hasErrors ? "error" : warnings.length > 0 ? "warning" : "valid",
    errors,
    warnings,
    application: hasErrors
      ? null
      : {
          name,
          email,
          phone: phone === "" ? null : phone,
          activityType,
          location: parsed.location.trim() === "" ? null : parsed.location.trim(),
          ageMin,
          ageMax,
          priceValue,
          description:
            parsed.description.trim() === "" ? null : parsed.description.trim(),
          imageUrl: imageUrl === "" ? null : imageUrl,
        },
  };
}

function coerceWholeNumber(
  raw: string,
  label: string,
  errors: string[]
): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isInteger(n)) {
    errors.push(`${label} must be a whole number`);
    return null;
  }
  return n;
}

/**
 * Validate + dedup a batch of parsed rows in file order.
 * Within-file duplicates: all-but-first occurrence rejected.
 */
export function validateRows(
  rows: ParsedRow[],
  ctx: ValidationContext
): ValidatedRow[] {
  const seenEmails = new Set<string>();
  const results: ValidatedRow[] = [];

  for (const parsed of rows) {
    const result = validateRow(parsed, ctx);

    // Within-file dedup runs even for rows with other errors, and marks the
    // duplicate with a single clear reason.
    const email = result.email;
    if (email !== "" && EMAIL_RE.test(email)) {
      if (seenEmails.has(email)) {
        result.status = "error";
        result.errors = ["Duplicate email within file"];
        result.application = null;
        result.warnings = [];
      } else {
        seenEmails.add(email);
      }
    }

    // DB dedup (users + live applications). Rejected applications are NOT a
    // dupe — rejected rows have no account and aren't approvable.
    if (result.application && ctx.userEmails.has(email)) {
      result.status = "error";
      result.errors = ["A user with this email already exists"];
      result.application = null;
      result.warnings = [];
    } else if (result.application && ctx.applicationEmails.has(email)) {
      result.status = "error";
      result.errors = [
        "An application with this email already exists (pending, contacted or approved)",
      ];
      result.application = null;
      result.warnings = [];
    }

    results.push(result);
  }

  return results;
}
