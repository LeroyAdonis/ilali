import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTableName } from "drizzle-orm";

// ── Mocks ──
const { dbMock, sendEmailMock, makeBuilder } = vi.hoisted(() => {
  const sendEmailMock = vi.fn();

  const dbMock = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  };

  /**
   * Build a thenable query builder that resolves via `resolve(table)` — the
   * table object captured from `.from()` — so a single db.select mock can
   * return different rows per table (dedupe events vs users vs prefs).
   */
  function makeBuilder(resolve: (table: unknown) => unknown) {
    const state: { table?: unknown } = {};
    const builder = {
      then: (onF: (v: unknown) => unknown, onR: (v: unknown) => unknown) =>
        Promise.resolve(resolve(state.table)).then(onF, onR),
      catch: (onR: (v: unknown) => unknown) => Promise.resolve(resolve(state.table)).catch(onR),
      finally: (cb: () => void) => Promise.resolve(resolve(state.table)).finally(cb),
    } as Promise<unknown>;
    const chain = builder as Promise<unknown> & Record<string, ReturnType<typeof vi.fn>>;
    for (const m of [
      "from",
      "where",
      "limit",
      "values",
      "returning",
      "set",
      "innerJoin",
      "orderBy",
      "groupBy",
      "onConflictDoUpdate",
      "onConflictDoNothing",
    ]) {
      chain[m] = vi.fn(() => chain);
    }
    chain.from = vi.fn((table: unknown) => {
      state.table = table;
      return chain;
    });
    return chain;
  }

  return { dbMock, sendEmailMock, makeBuilder };
});

vi.mock("@/lib/db/index", () => ({ db: dbMock }));
vi.mock("@/lib/mail", () => ({
  sendEmail: sendEmailMock,
  appUrl: vi.fn(() => "https://ilali.vercel.app"),
}));

import { sendNotification } from "@/lib/notifications";

const USER_ID = "user-1";

const ROWS: Record<string, unknown> = {
  notification_events: [],
  users: [{ id: USER_ID, email: "parent@example.com" }],
  notification_preferences: [],
};

/** Wire db.select to return per-table rows by their drizzle table name. */
function stubSelect(rowsByTable: Record<string, unknown>) {
  dbMock.select.mockImplementation(() =>
    makeBuilder((table) => {
      const name = table ? getTableName(table as never) : "";
      return rowsByTable[name] ?? [];
    })
  );
}

function stubInsert(rows: unknown[]) {
  dbMock.insert.mockReturnValue(makeBuilder(() => rows));
}

function stubUpdate() {
  dbMock.update.mockReturnValue(makeBuilder(() => []));
}

beforeEach(() => {
  vi.clearAllMocks();
  stubInsert([{ id: 7 }]);
  stubUpdate();
  stubSelect({ ...ROWS });
});

describe("sendNotification — dedupe (FR-6: one event per trigger)", () => {
  it("skips a second identical event within the dedupe window", async () => {
    stubSelect({
      ...ROWS,
      notification_events: [
        {
          payload: { providerName: "Sea Point Art", activityName: "Sea Point Art" },
          status: "sent",
        },
      ],
    });

    const result = await sendNotification(USER_ID, "saved", {
      providerName: "Sea Point Art",
      activityName: "Sea Point Art",
    });

    expect(result.status).toBe("skipped");
    if (result.status === "skipped") {
      expect(result.reason).toMatch(/Duplicate/i);
    }
    expect(dbMock.insert).not.toHaveBeenCalled();
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("sends when the same type has a different payload (context-aware)", async () => {
    sendEmailMock.mockResolvedValue({ sent: true, id: "resend-1" });

    const result = await sendNotification(USER_ID, "saved", {
      providerName: "Sea Point Art",
      activityName: "Sea Point Art",
    });

    expect(result.status).toBe("sent");
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });

  it("sends when the dedupe window has passed", async () => {
    sendEmailMock.mockResolvedValue({ sent: true, id: "resend-2" });

    const result = await sendNotification(USER_ID, "saved", { providerName: "X" }, {
      dedupeWindowMs: 0,
    });

    expect(result.status).toBe("sent");
  });
});

describe("sendNotification — graceful failure (never throws)", () => {
  it("returns failed and records an audit row when the mail wrapper throws", async () => {
    sendEmailMock.mockRejectedValue(new Error("network down"));

    let result: Awaited<ReturnType<typeof sendNotification>> | undefined;
    try {
      result = await sendNotification(USER_ID, "saved", { providerName: "X" });
    } catch (e) {
      expect.unreachable(`sendNotification must never throw — got ${e}`);
    }

    expect(result!.status).toBe("failed");
    expect(dbMock.insert).toHaveBeenCalled(); // audit row still recorded
  });

  it("marks the event skipped when the mail wrapper returns { skipped: true }", async () => {
    sendEmailMock.mockResolvedValue({ skipped: true });

    const result = await sendNotification(USER_ID, "saved", { providerName: "X" });

    expect(result.status).toBe("skipped");
    if (result.status === "skipped") {
      expect(result.eventId).toBe(7);
    }
  });

  it("records a failed row when the user does not exist", async () => {
    stubSelect({ ...ROWS, users: [] });

    const result = await sendNotification("no-such-user", "saved", { providerName: "X" });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.reason).toMatch(/user/i);
    }
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});

describe("sendNotification — preference gates (FR-6: parents can mute)", () => {
  it("skips reminder-24h when notifyReminders is off — no email, no send", async () => {
    stubSelect({
      ...ROWS,
      notification_preferences: [{ pref: false }],
    });

    const result = await sendNotification(USER_ID, "reminder-24h", { activityName: "Art Club" });

    expect(result.status).toBe("skipped");
    if (result.status === "skipped") {
      expect(result.reason).toMatch(/preferences/i);
    }
    expect(sendEmailMock).not.toHaveBeenCalled();
  });

  it("still sends transactional triggers (saved) when digests are muted", async () => {
    sendEmailMock.mockResolvedValue({ sent: true, id: "resend-3" });
    stubSelect({
      ...ROWS,
      notification_preferences: [{ pref: false }],
    });

    const result = await sendNotification(USER_ID, "saved", { providerName: "X" });

    expect(result.status).toBe("sent");
    expect(sendEmailMock).toHaveBeenCalledTimes(1);
  });
});

describe("sendNotification — channel abstraction", () => {
  it("records a skipped event for the not-yet-implemented whatsapp channel", async () => {
    const result = await sendNotification(USER_ID, "saved", { providerName: "X" }, {
      channel: "whatsapp",
    });

    expect(result.status).toBe("skipped");
    if (result.status === "skipped") {
      expect(result.reason).toMatch(/whatsapp/i);
    }
    expect(sendEmailMock).not.toHaveBeenCalled();
  });
});
