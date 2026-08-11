import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the DB layer so the cache module never touches Neon in tests.
const { selectMock, insertMock, deleteMock } = vi.hoisted(() => ({
  selectMock: vi.fn(),
  insertMock: vi.fn(),
  deleteMock: vi.fn(),
}));

vi.mock("@/lib/db/index", () => ({
  db: {
    select: selectMock,
    insert: insertMock,
    delete: deleteMock,
  },
}));

// Minimal stand-in for the schema table — only the column refs the module
// uses in eq()/lt()/insert().values(). Drizzle builds SQL expressions from
// these without executing anything, so plain objects are enough.
vi.mock("@/lib/db/schema", () => ({
  matchIntentCache: {
    queryKey: "query_key",
    intentJson: "intent_json",
    mode: "mode",
    createdAt: "created_at",
  },
}));

import {
  deleteCachedIntent,
  getCachedIntent,
  normalizeQueryKey,
  setCachedIntent,
} from "@/lib/ai/intent-cache";

describe("normalizeQueryKey — canonical cache keys", () => {
  it("trims, lowercases and collapses whitespace", () => {
    expect(normalizeQueryKey("  Football   For My 7 Year Old ")).toBe(
      "football for my 7 year old"
    );
  });

  it("collapses tabs and repeated spaces", () => {
    expect(normalizeQueryKey("Swimming\t  in   Claremont")).toBe(
      "swimming in claremont"
    );
  });

  it("leaves already-normalized queries untouched", () => {
    expect(normalizeQueryKey("art classes")).toBe("art classes");
  });
});

describe("getCachedIntent — read path", () => {
  beforeEach(() => {
    selectMock.mockReset();
  });

  function mockSelectRow(row: unknown): void {
    selectMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(row ? [row] : []),
        }),
      }),
    });
  }

  it("returns null when no row exists", async () => {
    mockSelectRow(null);
    await expect(getCachedIntent("soccer")).resolves.toBeNull();
  });

  it("returns the cached intent + mode for a fresh row", async () => {
    mockSelectRow({
      queryKey: "soccer",
      intentJson: { tags: ["sport", "outdoor"], location: "Sea Point" },
      mode: "deterministic",
      createdAt: new Date(),
    });
    await expect(getCachedIntent("soccer")).resolves.toEqual({
      intent: { tags: ["sport", "outdoor"], location: "Sea Point" },
      mode: "deterministic",
    });
  });

  it("returns null for a row older than the 7-day TTL", async () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    mockSelectRow({
      queryKey: "soccer",
      intentJson: { tags: ["sport"] },
      mode: "ai",
      createdAt: eightDaysAgo,
    });
    await expect(getCachedIntent("soccer")).resolves.toBeNull();
  });

  it("returns a row just inside the TTL", async () => {
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    mockSelectRow({
      queryKey: "soccer",
      intentJson: { tags: ["sport"] },
      mode: "ai",
      createdAt: sixDaysAgo,
    });
    await expect(getCachedIntent("soccer")).resolves.toEqual({
      intent: { tags: ["sport"] },
      mode: "ai",
    });
  });

  it("returns null on DB error — a broken cache must never break the route", async () => {
    selectMock.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockRejectedValue(new Error("connection refused")),
        }),
      }),
    });
    await expect(getCachedIntent("soccer")).resolves.toBeNull();
  });
});

describe("setCachedIntent / deleteCachedIntent — write path", () => {
  beforeEach(() => {
    insertMock.mockReset();
    deleteMock.mockReset();
  });

  it("upserts via onConflictDoUpdate and does not throw", async () => {
    const onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    insertMock.mockReturnValue({
      values: vi.fn().mockReturnValue({ onConflictDoUpdate }),
    });
    deleteMock.mockReturnValue({
      where: vi.fn().mockReturnValue({ catch: vi.fn().mockResolvedValue(undefined) }),
    });

    await expect(
      setCachedIntent("soccer", { tags: ["sport"] }, "deterministic")
    ).resolves.toBeUndefined();

    expect(onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        target: "query_key",
        set: expect.objectContaining({
          intentJson: { tags: ["sport"] },
          mode: "deterministic",
        }),
      })
    );
    // Opportunistic 14-day prune ran fire-and-forget.
    expect(deleteMock).toHaveBeenCalled();
  });

  it("does not throw when the DB write fails", async () => {
    insertMock.mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockRejectedValue(new Error("db down")),
      }),
    });
    await expect(
      setCachedIntent("soccer", { tags: ["sport"] }, "ai")
    ).resolves.toBeUndefined();
  });

  it("deleteCachedIntent does not throw on DB error", async () => {
    deleteMock.mockReturnValue({
      where: vi.fn().mockRejectedValue(new Error("db down")),
    });
    await expect(deleteCachedIntent("soccer")).resolves.toBeUndefined();
  });
});
