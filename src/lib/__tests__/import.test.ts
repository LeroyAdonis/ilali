import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import {
  IntakeError,
  normalizeIntake,
  MAX_DATA_ROWS,
  type IntakeInput,
} from "@/lib/import/normalize";
import { validateRows } from "@/lib/import/validate";
import type { ParsedRow, ValidatedRow } from "@/lib/import/types";

const HEADER =
  "name,email,phone,activityType,location,ageMin,ageMax,priceValue,description";

const EMPTY_CTX = {
  userEmails: new Set<string>(),
  applicationEmails: new Set<string>(),
  knownActivityTypes: new Set<string>(["sports", "music-lessons", "arts-culture"]),
};

function parse(input: IntakeInput): ParsedRow[] {
  return normalizeIntake(input).rows;
}

function csvRows(rows: string[]): ParsedRow[] {
  return parse({ kind: "csv", content: [HEADER, ...rows].join("\n") });
}

function validate(rows: ParsedRow[]): ValidatedRow[] {
  return validateRows(rows, EMPTY_CTX);
}

function validateOne(row: string): ValidatedRow {
  return validate(csvRows([row]))[0];
}

describe("normalizeIntake — CSV parsing", () => {
  it("parses a valid CSV with all columns", () => {
    const rows = csvRows([
      "Assitej Football Academy,coach@assitej.co.za,+27 82 123 4567,sports,Khayelitsha,6,16,150,\"Saturday morning football\"",
      "Langa Music Studio,info@langamusic.co.za,,music-lessons,Langa,7,14,200,Guitar lessons",
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      row: 1,
      name: "Assitej Football Academy",
      email: "coach@assitej.co.za",
      phone: "+27 82 123 4567",
      activityType: "sports",
      location: "Khayelitsha",
      ageMin: "6",
      ageMax: "16",
      priceValue: "150",
      description: "Saturday morning football",
    });
  });

  it("matches headers by NAME — case/whitespace tolerant with snake_case aliases, any order", () => {
    const rows = parse({
      kind: "csv",
      content: [
        "Name,Email Address,Activity_Type,Age_Min,Age_Max,Price_Value,Description",
        "Assitej FC,coach@assitej.co.za,sports,6,16,150,Kids football",
      ].join("\n"),
    });
    expect(rows[0]).toMatchObject({
      name: "Assitej FC",
      email: "coach@assitej.co.za",
      activityType: "sports",
      ageMin: "6",
      ageMax: "16",
      priceValue: "150",
      description: "Kids football",
    });
  });

  it("tolerates a UTF-8 BOM and CRLF line endings", () => {
    const rows = parse({
      kind: "csv",
      content: "\uFEFFname,email,activityType,ageMin,ageMax,priceValue\r\nAssitej FC,coach@assitej.co.za,sports,6,16,150\r\n",
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Assitej FC");
  });

  it("supports quoted values with embedded commas", () => {
    const rows = csvRows([
      'Assitej FC,coach@assitej.co.za,,sports,Khayelitsha,,,,"Football, cricket and athletics"',
    ]);
    expect(rows[0].description).toBe("Football, cricket and athletics");
  });

  it("trims whitespace around values", () => {
    const rows = csvRows(["  Assitej FC  ,  coach@assitej.co.za  ,,sports, Khayelitsha ,,,,"]);
    expect(rows[0].name).toBe("  Assitej FC  "); // raw parse keeps it; validation trims
    const result = validateOne("  Assitej FC  ,  coach@assitej.co.za  ,,sports, Khayelitsha ,,,,");
    expect(result.application?.name).toBe("Assitej FC");
    expect(result.application?.email).toBe("coach@assitej.co.za");
    expect(result.application?.location).toBe("Khayelitsha");
  });

  it("rejects an empty file", () => {
    expect(() => parse({ kind: "csv", content: "" })).toThrow(IntakeError);
  });

  it("rejects a missing/bad header row with a clear message", () => {
    expect(() =>
      parse({
        kind: "csv",
        content: "Assitej FC,coach@assitej.co.za,sports\nAnother,info@x.co.za,sports",
      })
    ).toThrow(/Unrecognized header row/);
  });

  it("rejects duplicate column headers", () => {
    expect(() =>
      parse({
        kind: "csv",
        content: "name,name,email\nAssitej,FC,coach@assitej.co.za",
      })
    ).toThrow(/Duplicate column header/);
  });

  it("rejects malformed CSV with unbalanced quotes", () => {
    expect(() =>
      parse({
        kind: "csv",
        content: 'name,email,description\nAssitej FC,coach@assitej.co.za,"unclosed quote',
      })
    ).toThrow(IntakeError);
  });

  it("rejects more than 500 data rows", () => {
    const lines = Array.from({ length: MAX_DATA_ROWS + 1 }, (_, i) => `Provider ${i},p${i}@x.co.za,,sports,,,,,`);
    expect(() => csvRows(lines)).toThrow(/Too many rows/);
  });

  it("accepts exactly 500 data rows", () => {
    const lines = Array.from({ length: MAX_DATA_ROWS }, (_, i) => `Provider ${i},p${i}@x.co.za,,sports,,,,,`);
    expect(csvRows(lines)).toHaveLength(MAX_DATA_ROWS);
  });
});

describe("normalizeIntake — XLSX parsing (SheetJS, values only)", () => {
  it("parses the first sheet of an .xlsx buffer", () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["name", "email", "activityType", "ageMin", "ageMax", "priceValue"],
      ["Assitej FC", "coach@assitej.co.za", "sports", 6, 16, 150],
      ["Langa Music", "info@langamusic.co.za", "music-lessons", 7, 14, 200],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Providers");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([["ignored"]]), "Sheet2");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const rows = parse({ kind: "xlsx", content: buf as Buffer });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      row: 1,
      name: "Assitej FC",
      email: "coach@assitej.co.za",
      activityType: "sports",
      ageMin: "6",
      priceValue: "150",
    });
  });

  it("treats numeric cells as strings (no formula execution)", () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["name", "email", "activityType", "priceValue"],
      ["Assitej FC", "coach@assitej.co.za", "sports", "=1+1"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    const rows = parse({ kind: "xlsx", content: buf as Buffer });
    // Formula cells come through as their string text (values only, never evaluated).
    expect(rows[0].priceValue).toBe("=1+1");
  });
});

describe("normalizeIntake — pasted text (delimiter detection)", () => {
  it("parses tab-separated text (tab wins over comma)", () => {
    const rows = parse({
      kind: "text",
      content: [
        "name\temail\tactivityType\tageMin\tageMax\tpriceValue",
        "Assitej FC\tcoach@assitej.co.za\tsports\t6\t16\t150",
        "Langa Music\tinfo@langamusic.co.za\tmusic-lessons\t7\t14\t200",
      ].join("\n"),
    });
    expect(rows).toHaveLength(2);
    expect(rows[0].email).toBe("coach@assitej.co.za");
    expect(rows[1].activityType).toBe("music-lessons");
  });

  it("parses comma-separated text with quoted values", () => {
    const rows = parse({
      kind: "text",
      content: [
        "name,email,activityType,description",
        'Assitej FC,coach@assitej.co.za,sports,"Football, cricket"',
      ].join("\n"),
    });
    expect(rows[0].description).toBe("Football, cricket");
  });

  it("rejects pasted text with no recognizable delimiter", () => {
    expect(() =>
      parse({
        kind: "text",
        content: "name email activityType\nAssitej FC coach@assitej.co.za sports",
      })
    ).toThrow(/Unrecognized format/);
  });

  it("rejects pasted text with unbalanced quotes", () => {
    expect(() =>
      parse({
        kind: "text",
        content: 'name,email,description\nAssitej FC,coach@assitej.co.za,"oops',
      })
    ).toThrow(/unbalanced quote/i);
  });
});

describe("validateRows — per-row validation (providerApplicationSchema semantics)", () => {
  it("marks a fully valid row as valid with a normalized application", () => {
    const result = validateOne("Assitej FC,coach@assitej.co.za,+27 82 123 4567,sports,Khayelitsha,6,16,150,Football");
    expect(result.status).toBe("valid");
    expect(result.errors).toEqual([]);
    expect(result.application).toMatchObject({
      name: "Assitej FC",
      email: "coach@assitej.co.za",
      phone: "+27 82 123 4567",
      activityType: "sports",
      location: "Khayelitsha",
      ageMin: 6,
      ageMax: 16,
      priceValue: 150,
    });
  });

  it("rejects a row with a missing name", () => {
    const result = validateOne(",coach@assitej.co.za,,sports,,,,,");
    expect(result.status).toBe("error");
    expect(result.errors).toContain("Name must be at least 2 characters");
  });

  it("rejects a missing email", () => {
    const result = validateOne("Assitej FC,,,,sports,,,,,");
    expect(result.status).toBe("error");
    expect(result.errors).toContain("Email is required");
  });

  it("rejects an invalid email", () => {
    const result = validateOne("Assitej FC,not-an-email,,sports,,,,,");
    expect(result.status).toBe("error");
    expect(result.errors).toContain("Please enter a valid email address");
  });

  it("rejects an invalid phone (not +27 format)", () => {
    const result = validateOne("Assitej FC,coach@assitej.co.za,0821234567,sports,,,,,");
    expect(result.status).toBe("error");
    expect(result.errors).toContain("Phone must be in +27 format (e.g. +27 82 123 4567)");
  });

  it("accepts an empty phone", () => {
    const result = validateOne("Assitej FC,coach@assitej.co.za,,sports,,,,,");
    expect(result.status).toBe("valid");
  });

  it("rejects a non-integer age", () => {
    const result = validateOne("Assitej FC,coach@assitej.co.za,,sports,,4.5,,,");
    expect(result.status).toBe("error");
    expect(result.errors).toContain("Age must be a whole number");
  });

  it("rejects ages outside 0–18", () => {
    const tooYoung = validateOne("Assitej FC,coach@assitej.co.za,,sports,,-1,,,");
    expect(tooYoung.errors).toContain("Age must be between 0 and 18");
    const tooOld = validateOne("Assitej FC,coach@assitej.co.za,,sports,,,19,,");
    expect(tooOld.errors).toContain("Age must be between 0 and 18");
  });

  it("rejects ageMin > ageMax", () => {
    const result = validateOne("Assitej FC,coach@assitej.co.za,,sports,,16,6,,");
    expect(result.status).toBe("error");
    expect(result.errors).toContain("Minimum age cannot be greater than maximum age");
  });

  it("rejects a non-integer price", () => {
    const result = validateOne("Assitej FC,coach@assitej.co.za,,sports,,,,12.5");
    expect(result.status).toBe("error");
    expect(result.errors).toContain("Price must be a whole number");
  });

  it("rejects a negative price", () => {
    const result = validateOne("Assitej FC,coach@assitej.co.za,,sports,,,,-10");
    expect(result.status).toBe("error");
    expect(result.errors).toContain("Price cannot be negative");
  });

  it("rejects an empty activity type", () => {
    const result = validateOne("Assitej FC,coach@assitej.co.za,,,,,,,");
    expect(result.status).toBe("error");
    expect(result.errors).toContain("Activity type is required");
  });

  it("flags an unknown activity type as a warning (still imports)", () => {
    const result = validateOne("Assitej FC,coach@assitej.co.za,,martial-arts,,,,,");
    expect(result.status).toBe("warning");
    expect(result.warnings).toHaveLength(1);
    expect(result.application?.activityType).toBe("martial-arts");
  });

  it("accepts an invalid image URL as an error, empty as fine", () => {
    const rows = (content: string) =>
      validate(
        parse({
          kind: "csv",
          content: "name,email,activityType,image_url\n" + content,
        })
      );
    const bad = rows("Assitej FC,coach@assitej.co.za,sports,not-a-url");
    expect(bad[0].status).toBe("error");
    expect(bad[0].errors).toContain("Image URL must be a valid URL");
    const ok = rows("Assitej FC,coach@assitej.co.za,sports,");
    expect(ok[0].status).toBe("valid");
    const good = rows("Assitej FC,coach@assitej.co.za,sports,https://example.com/logo.png");
    expect(good[0].status).toBe("valid");
    expect(good[0].application?.imageUrl).toBe("https://example.com/logo.png");
  });
});

describe("validateRows — dedup rules (FR-2)", () => {
  it("rejects all-but-first occurrence of a duplicate email within the file", () => {
    const results = validate([
      ...csvRows(["Assitej FC,coach@assitej.co.za,,sports,,,,,"]),
      ...csvRows(["Other FC,COACH@assitej.co.za,,sports,,,,,"]),
    ]);
    expect(results[0].status).toBe("valid");
    expect(results[1].status).toBe("error");
    expect(results[1].errors).toEqual(["Duplicate email within file"]);
  });

  it("rejects an email that already exists in users", () => {
    const results = validateRows(csvRows(["Assitej FC,coach@assitej.co.za,,sports,,,,,"]), {
      ...EMPTY_CTX,
      userEmails: new Set(["coach@assitej.co.za"]),
    });
    expect(results[0].status).toBe("error");
    expect(results[0].errors).toEqual(["A user with this email already exists"]);
  });

  it("rejects an email with a pending/contacted/approved application", () => {
    const results = validateRows(csvRows(["Assitej FC,coach@assitej.co.za,,sports,,,,,"]), {
      ...EMPTY_CTX,
      applicationEmails: new Set(["coach@assitej.co.za"]),
    });
    expect(results[0].status).toBe("error");
    expect(results[0].errors[0]).toMatch(/application with this email already exists/i);
  });

  it("allows an email that only exists in a rejected application (re-importable)", () => {
    // Rejected applications are not in the context set (the db helper filters
    // to pending/contacted/approved), so the row imports cleanly.
    const results = validateRows(csvRows(["Assitej FC,coach@assitej.co.za,,sports,,,,,"]), EMPTY_CTX);
    expect(results[0].status).toBe("valid");
  });

  it("compares emails case-insensitively and trimmed", () => {
    const results = validateRows(csvRows(["Assitej FC,  Coach@Assitej.CO.ZA  ,,sports,,,,,"]), {
      ...EMPTY_CTX,
      userEmails: new Set(["coach@assitej.co.za"]),
    });
    expect(results[0].status).toBe("error");
  });
});

describe("validateRows — status counts feed the preview summary", () => {
  it("counts valid / warning / error rows independently", () => {
    const results = validate(csvRows([
      "Good One,good@x.co.za,,sports,,,,,",
      "Bad One,not-an-email,,sports,,,,,",
      "Warn One,warn@x.co.za,,martial-arts,,,,,",
    ]));
    expect(results.filter((r) => r.status === "valid")).toHaveLength(1);
    expect(results.filter((r) => r.status === "warning")).toHaveLength(1);
    expect(results.filter((r) => r.status === "error")).toHaveLength(1);
  });
});
