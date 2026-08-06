/**
 * WS-4 Bulk Import — shared types.
 *
 * Every intake format (CSV file, XLSX/XLS file, pasted text) funnels through
 * `normalizeIntake()` into the same `ParsedRow` model, then through
 * `validateRows()` into a per-row status report. Preview is stateless: the
 * client sends the parsed rows back to the commit route, which re-validates
 * (race-safe) before inserting.
 */

/** Canonical import fields — header matching is by NAME, not position. */
export type ParsedField =
  | "name"
  | "email"
  | "phone"
  | "activityType"
  | "location"
  | "ageMin"
  | "ageMax"
  | "priceValue"
  | "description"
  | "imageUrl";

/** One parsed data row (raw string values, header-normalized). */
export interface ParsedRow {
  /** 1-based data row number in the source (excludes the header row). */
  row: number;
  name: string;
  email: string;
  phone: string;
  activityType: string;
  location: string;
  ageMin: string;
  ageMax: string;
  priceValue: string;
  description: string;
  imageUrl: string;
}

/** A row validated against providerApplicationSchema semantics. */
export interface ValidatedRow {
  row: number;
  email: string;
  status: "valid" | "warning" | "error";
  errors: string[];
  warnings: string[];
  /** Normalized application payload — set when status is valid/warning. */
  application: NormalizedApplication | null;
}

/** Normalized, DB-ready application payload (price in Rands, whole number). */
export interface NormalizedApplication {
  name: string;
  email: string;
  phone: string | null;
  activityType: string;
  location: string | null;
  ageMin: number | null;
  ageMax: number | null;
  priceValue: number | null;
  description: string | null;
  imageUrl: string | null;
}

export type RowStatus = "valid" | "warning" | "error";

/** Preview row surfaced to the admin UI. */
export interface PreviewRow {
  row: number;
  name: string;
  email: string;
  activityType: string | null;
  status: RowStatus;
  errors: string[];
  warnings: string[];
  /** Raw parsed row, echoed back so the client can submit it to commit. */
  data: ParsedRow;
}

/** POST /api/admin/import/preview response body. */
export interface ImportPreview {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  rows: PreviewRow[];
}

/** Per-row error recorded on the import batch (audit trail). */
export interface RowError {
  row: number;
  email: string;
  errors: string[];
}

/** POST /api/admin/import/commit response body. */
export interface ImportCommitResult {
  batchId: string;
  imported: number;
  skipped: number;
  rowErrors: RowError[];
}

/** GET /api/admin/import/batches list item. */
export interface ImportBatchSummary {
  id: string;
  filename: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  approvedCount: number;
  pendingCount: number;
  rowErrors: RowError[] | null;
  createdAt: Date | string | null;
}

/** POST /api/admin/applications/batch-approve response body. */
export interface BatchApproveResult {
  approved: {
    id: string;
    email: string;
    tempPassword: string;
    emailSent: boolean;
  }[];
  failed: { id: string; email: string; error: string }[];
}
