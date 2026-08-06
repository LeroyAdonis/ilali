/**
 * WS-4 Bulk Import — normalizeIntake() (T007 / spec FR-1).
 *
 * Multi-format intake: CSV (papaparse), XLSX/XLS (SheetJS, values only), and
 * pasted tab/comma-separated text (built-in delimiter detection). All three
 * produce the same `ParsedRow[]` model. Headers are matched by NAME
 * (case/whitespace-tolerant, snake_case aliases accepted), never position.
 *
 * Every cell is treated as a string — no formula execution, no dynamic typing
 * (NFR-1: no CSV formula injection; XLSX parsed with `cellFormula: false`).
 */
import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { ParsedField, ParsedRow } from "./types";

export const MAX_DATA_ROWS = 500;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

/** User-facing parse error — routes map this to a 400 response. */
export class IntakeError extends Error {}

export type IntakeInput =
  | { kind: "csv"; content: string }
  | { kind: "xlsx"; content: Buffer }
  | { kind: "text"; content: string };

export interface NormalizedIntake {
  format: "csv" | "xlsx" | "text";
  rows: ParsedRow[];
}

// ── Header normalization ──
// Canonical field ← accepted raw headers. Keys are lowercased, trimmed and
// internal-whitespace-stripped ("Activity Type" → "activitytype"). The map
// keys below are ALREADY in that normalized form (no spaces/hyphens) so
// normalizeHeader() matches without a second normalization pass.
const HEADER_ALIASES: Record<string, ParsedField> = {
  name: "name",
  providername: "name",
  email: "email",
  "e-mail": "email",
  emailaddress: "email",
  phone: "phone",
  telephone: "phone",
  phonenumber: "phone",
  activitytype: "activityType",
  activity_type: "activityType",
  activity: "activityType",
  location: "location",
  area: "location",
  suburb: "location",
  agemin: "ageMin",
  age_min: "ageMin",
  minage: "ageMin",
  agemax: "ageMax",
  age_max: "ageMax",
  maxage: "ageMax",
  pricevalue: "priceValue",
  price_value: "priceValue",
  price: "priceValue",
  description: "description",
  notes: "description",
  imageurl: "imageUrl",
  image_url: "imageUrl",
  image: "imageUrl",
};

function normalizeHeader(raw: string): ParsedField | null {
  const key = raw.toLowerCase().trim().replace(/\s+/g, "");
  return HEADER_ALIASES[key] ?? null;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

// ── CSV (papaparse) ──
function parseCsv(content: string): string[][] {
  const result = Papa.parse<string[]>(stripBom(content), {
    dynamicTyping: false, // every cell a string — no formula execution
    skipEmptyLines: "greedy",
  });
  if (result.errors.length > 0) {
    const first = result.errors[0];
    const where = first.row != null ? ` (row ${first.row + 1})` : "";
    throw new IntakeError(
      `Malformed CSV: ${first.message}${where}. Fix the file and re-upload.`
    );
  }
  return result.data;
}

// ── XLSX / XLS (SheetJS — values only, first sheet only) ──
function parseXlsx(content: Buffer): string[][] {
  const workbook = XLSX.read(content, { type: "buffer", cellFormula: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new IntakeError("Excel file has no sheets.");
  }
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false, // formatted text values — everything a string
    defval: "",
  });
  return matrix
    .filter((row): row is unknown[] => Array.isArray(row))
    .map((row) => row.map((cell) => (cell == null ? "" : String(cell))))
    .filter((row) => row.some((cell) => cell.trim() !== ""));
}

// ── Pasted text (delimiter detection: tab > comma, quoted values) ──
function countDelimiter(line: string, delim: string): number {
  let count = 0;
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') i++;
        else inQuotes = false;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      count++;
    }
  }
  return count;
}

function parseDelimitedLine(line: string, delim: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (inQuotes) {
    throw new IntakeError(
      "Malformed pasted text — unbalanced quote in a row. Check the text and re-paste."
    );
  }
  fields.push(current);
  return fields;
}

function parseDelimitedText(content: string): string[][] {
  const text = stripBom(content).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  if (lines.length === 0) {
    throw new IntakeError("Empty input — nothing to import.");
  }
  const headerLine = lines[0];
  const hasTab = countDelimiter(headerLine, "\t") > 0;
  const hasComma = countDelimiter(headerLine, ",") > 0;
  if (!hasTab && !hasComma) {
    throw new IntakeError(
      "Unrecognized format — separate columns with tabs or commas, with a header row first."
    );
  }
  const delim = hasTab ? "\t" : ",";
  return lines.map((line) => parseDelimitedLine(line, delim));
}

// ── Matrix → ParsedRow (header matched by NAME, not position) ──
function matrixToRows(matrix: string[][]): ParsedRow[] {
  if (matrix.length === 0) {
    throw new IntakeError("Empty file — nothing to import.");
  }

  const rawHeaders = matrix[0];
  const headers: (ParsedField | null)[] = rawHeaders.map(normalizeHeader);

  const seen = new Set<ParsedField>();
  for (const h of headers) {
    if (h && seen.has(h)) {
      throw new IntakeError(`Duplicate column header: "${h}" appears more than once.`);
    }
    if (h) seen.add(h);
  }

  // Structural gate: the header row must be recognizable (name + email are the
  // two hard-required fields). A title row or misordered/renamed columns fail
  // fast with a clear message (spec Scenario 2: "wrong header row").
  if (!headers.includes("name") || !headers.includes("email")) {
    throw new IntakeError(
      "Unrecognized header row — expected columns: name, email, phone, activityType, location, ageMin, ageMax, priceValue, description."
    );
  }

  const dataRows = matrix.slice(1);
  if (dataRows.length > MAX_DATA_ROWS) {
    throw new IntakeError(
      `Too many rows — the limit is ${MAX_DATA_ROWS} data rows per import (this file has ${dataRows.length}). Split it into multiple files.`
    );
  }

  const get = (row: string[], field: ParsedField): string => {
    const idx = headers.indexOf(field);
    return idx >= 0 && idx < row.length ? row[idx] : "";
  };

  return dataRows.map((raw, i) => ({
    row: i + 1,
    name: get(raw, "name"),
    email: get(raw, "email"),
    phone: get(raw, "phone"),
    activityType: get(raw, "activityType"),
    location: get(raw, "location"),
    ageMin: get(raw, "ageMin"),
    ageMax: get(raw, "ageMax"),
    priceValue: get(raw, "priceValue"),
    description: get(raw, "description"),
    imageUrl: get(raw, "imageUrl"),
  }));
}

/**
 * Normalize any intake format into the shared ParsedRow model.
 * Throws IntakeError (→ 400) on structural failures: empty input, bad header
 * row, duplicate headers, unbalanced quotes, > 500 data rows.
 */
export function normalizeIntake(input: IntakeInput): NormalizedIntake {
  let matrix: string[][];
  let format: NormalizedIntake["format"];

  switch (input.kind) {
    case "csv":
      matrix = parseCsv(input.content);
      format = "csv";
      break;
    case "xlsx":
      matrix = parseXlsx(input.content);
      format = "xlsx";
      break;
    case "text":
      matrix = parseDelimitedText(input.content);
      format = "text";
      break;
  }

  return { format, rows: matrixToRows(matrix) };
}
