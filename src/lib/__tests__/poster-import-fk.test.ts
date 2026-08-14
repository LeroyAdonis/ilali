import { describe, expect, it } from "vitest";
import { posterImports } from "@/lib/db/schema";

/**
 * Regression guard for the "Could not delete the application." bug:
 * deleting a provider_application that a poster_import links to used to
 * fail with FK violation 23503 because the FK defaulted to NO ACTION.
 * The FK must be "set null" so admin delete (single + batch) works and
 * the poster import audit row survives (just unlinked).
 */
function inlineForeignKeys(table: unknown): Array<{ onDelete?: string }> {
  const t = table as Record<symbol, unknown>;
  return (t[Symbol.for("drizzle:PgInlineForeignKeys")] as Array<{
    onDelete?: string;
  }>) ?? [];
}

describe("poster_imports → provider_applications FK (delete applications bug)", () => {
  it("uses onDelete 'set null' so applications linked to poster imports can be deleted", () => {
    const fks = inlineForeignKeys(posterImports);
    expect(fks.length).toBeGreaterThan(0);
    expect(fks.some((fk) => fk.onDelete === "set null")).toBe(true);
  });
});
