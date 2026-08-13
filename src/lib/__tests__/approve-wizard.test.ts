import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──
const { dbMock, makeChain } = vi.hoisted(() => {
  function makeChain<T>(resolveValue: T) {
    const chain = Promise.resolve(resolveValue) as Promise<T> &
      Record<string, ReturnType<typeof vi.fn>>;
    for (const m of [
      "from",
      "where",
      "limit",
      "set",
      "values",
      "returning",
      "orderBy",
      "innerJoin",
    ]) {
      chain[m] = vi.fn(() => chain);
    }
    return chain;
  }
  return {
    dbMock: {
      select: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    makeChain,
  };
});

vi.mock("@/lib/db/index", () => ({ db: dbMock }));

const sendWelcomeMock = vi.fn((..._args: unknown[]) => Promise.resolve({ skipped: true }));
vi.mock("@/lib/mail", () => ({
  sendProviderWelcomeEmail: (...args: unknown[]) => sendWelcomeMock(...args),
  appUrl: () => "https://ilali.vercel.app",
}));

const sendNotificationMock = vi.fn((..._args: unknown[]) =>
  Promise.resolve({ status: "sent", eventId: 1 })
);
vi.mock("@/lib/notifications", () => ({
  sendNotification: (...args: unknown[]) => sendNotificationMock(...args),
}));

import { approveApplication, ApproveError } from "@/lib/admin/approveApplication";
import type { providerApplications } from "@/lib/db/schema";

type App = typeof providerApplications.$inferSelect;

function makeApp(overrides: Partial<App> = {}): App {
  return {
    id: "app-1",
    name: "Creative Arts Workshop",
    email: "teacher@example.com",
    phone: "+27 82 123 4567",
    activityType: "Arts & Culture",
    description: "A hands-on Saturday art club.",
    location: "Muizenberg",
    ageMin: 4,
    ageMax: 12,
    priceValue: 150,
    priceLabel: "per session",
    schedule: "Saturdays 09:00",
    imageUrl: null,
    userId: null,
    status: "pending",
    onboardSource: null,
    importBatchId: null,
    createdAt: new Date("2026-08-06T10:00:00Z"),
    ...overrides,
  } as App;
}

/** Queue resolved values for sequential db.select() calls in a test. */
function queueSelects(...values: unknown[]) {
  dbMock.select.mockImplementation(() => makeChain(values.shift() ?? []));
}

beforeEach(() => {
  vi.clearAllMocks();
  sendWelcomeMock.mockClear();
  sendNotificationMock.mockClear();
  dbMock.select.mockReset();
  dbMock.insert.mockReset();
  dbMock.update.mockReset();
});

describe("approveApplication — wizard path (userId set, magic-link account)", () => {
  it("skips temp-password account creation and returns no temp password", async () => {
    queueSelects(
      [], // providers table (link-or-create: nothing to match)
      [], // categories by name
      [], // categories fallback first row
      [] // existing slugs
    );
    const insertChain = makeChain([{ id: "prov-1" }]);
    dbMock.insert.mockReturnValue(insertChain);
    dbMock.update.mockReturnValue(makeChain([{ id: "app-1", status: "approved" }]));

    const result = await approveApplication(makeApp({ userId: "user-1" }));

    expect(result.tempPassword).toBe("");
    expect(result.emailSent).toBe(false);
    // No user/authAccount creation for a wizard account — the only insert is
    // the providers row, which carries the wizard's userId (not an auth account).
    expect(dbMock.insert).toHaveBeenCalledTimes(1);
    const providerRow = insertChain.values.mock.calls[0][0] as Record<string, unknown>;
    expect(providerRow.userId).toBe("user-1");
    expect(providerRow).not.toHaveProperty("password");
  });

  it("flips the existing user to role=provider without creating one", async () => {
    queueSelects(
      [], // providers
      [], // categories by name
      [], // categories fallback
      [] // slugs
    );
    dbMock.insert.mockReturnValue(makeChain([{ id: "prov-1" }]));
    const updateChain = makeChain([{ id: "app-1", status: "approved" }]);
    dbMock.update.mockReturnValue(updateChain);

    await approveApplication(makeApp({ userId: "user-1" }));

    const setCalls = updateChain.set.mock.calls.map(
      (c: unknown[]) => c[0]
    ) as Array<Record<string, unknown>>;
    // wizard path: the user's role flips to provider (no user was created)
    expect(setCalls).toContainEqual({ role: "provider" });
    expect(dbMock.insert).toHaveBeenCalledTimes(1); // only the providers row
  });

  it("creates the providers row with cents price and the wizard userId", async () => {
    queueSelects(
      [], // providers
      [], // categories by name
      [], // categories fallback
      [] // slugs
    );
    const insertChain = makeChain([{ id: "prov-1" }]);
    dbMock.insert.mockReturnValue(insertChain);
    dbMock.update.mockReturnValue(makeChain([{ id: "app-1", status: "approved" }]));

    await approveApplication(makeApp({ userId: "user-1", priceValue: 150 }));

    const providerInsert = insertChain.values.mock.calls[0][0] as Record<string, unknown>;
    expect(providerInsert.userId).toBe("user-1");
    expect(providerInsert.priceValue).toBe(15000); // Rands → cents
    expect(providerInsert.category).toBe("arts-culture");
  });

  it("links an existing providers row (matched by name+location) instead of inserting", async () => {
    queueSelects([
      {
        id: "prov-1",
        name: "Creative Arts Workshop",
        location: "Muizenberg",
        phone: null,
        userId: null,
      },
    ]);
    const updateChain = makeChain([{ id: "app-1", status: "approved" }]);
    dbMock.update.mockReturnValue(updateChain);

    await approveApplication(makeApp({ userId: "user-1" }));

    expect(dbMock.insert).not.toHaveBeenCalled();
    // the providers row gets userId linked (no new row inserted)
    const setCalls = updateChain.set.mock.calls.map(
      (c: unknown[]) => c[0]
    ) as Array<Record<string, unknown>>;
    expect(setCalls).toContainEqual({ userId: "user-1" });
  });

  it("marks the application approved and fires the live notification to the wizard user", async () => {
    queueSelects(
      [], // providers
      [], // categories
      [], // categories
      [] // slugs
    );
    dbMock.insert.mockReturnValue(makeChain([{ id: "prov-1" }]));
    dbMock.update.mockReturnValue(makeChain([{ id: "app-1", status: "approved" }]));

    await approveApplication(makeApp({ userId: "user-1" }));

    expect(sendNotificationMock).toHaveBeenCalledTimes(1);
    expect(sendNotificationMock.mock.calls[0][0]).toBe("user-1");
    expect(sendNotificationMock.mock.calls[0][1]).toBe("provider-status");
    expect(sendNotificationMock.mock.calls[0][2]).toMatchObject({
      status: "live",
      providerName: "Creative Arts Workshop",
    });
  });

  it("does NOT throw the duplicate-email error when the wizard user already exists", async () => {
    queueSelects(
      [], // providers
      [], // categories
      [], // categories
      [] // slugs
    );
    dbMock.insert.mockReturnValue(makeChain([{ id: "prov-1" }]));
    dbMock.update.mockReturnValue(makeChain([{ id: "app-1", status: "approved" }]));

    await expect(
      approveApplication(makeApp({ userId: "user-1" }))
    ).resolves.toBeDefined();
  });
});

describe("approveApplication — admin/bulk path (no userId) keeps temp-password flow", () => {
  it("throws the duplicate-email 409 when a user already exists", async () => {
    queueSelects([{ id: "existing-user" }]); // dup check hits first
    const promise = approveApplication(makeApp());
    await expect(promise).rejects.toThrow(ApproveError);
    await expect(promise).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("creates a provider account with a 12-char temp password and a credential account", async () => {
    queueSelects(
      [], // dup check: no existing user
      [], // providers (link-or-create: nothing)
      [], // categories by name
      [], // categories fallback
      [] // slugs
    );
    const insertChain = makeChain([{ id: "prov-1" }]);
    dbMock.insert.mockReturnValue(insertChain);
    dbMock.update.mockReturnValue(makeChain([{ id: "app-1", status: "approved" }]));

    const result = await approveApplication(makeApp());

    expect(result.tempPassword).toHaveLength(12);
    // users + authAccounts + providers inserts (account creation + listing)
    expect(dbMock.insert).toHaveBeenCalledTimes(3);
    const valuesCalls = insertChain.values.mock.calls.map(
      (c: unknown[]) => c[0]
    ) as Array<Record<string, unknown>>;
    // 1. users row (role provider, password reset armed)
    expect(valuesCalls[0]).toMatchObject({
      role: "provider",
      passwordResetRequired: true,
      email: "teacher@example.com",
    });
    // 2. authAccounts credential row with a bcrypt password hash
    expect(valuesCalls[1]).toMatchObject({
      userId: expect.any(String),
      providerId: "credential",
    });
    expect(typeof valuesCalls[1].password).toBe("string");
    expect(String(valuesCalls[1].password)).not.toBe(result.tempPassword);
    // 3. providers row
    expect(valuesCalls[2]).toMatchObject({
      name: "Creative Arts Workshop",
      userId: expect.any(String),
    });
  });

  it("sends the temp-password welcome email and reports emailSent", async () => {
    queueSelects(
      [],
      [],
      [],
      [],
      []
    );
    dbMock.insert.mockReturnValue(makeChain([{ id: "prov-1" }]));
    dbMock.update.mockReturnValue(makeChain([{ id: "app-1", status: "approved" }]));
    sendWelcomeMock.mockResolvedValueOnce({ skipped: true });

    const result = await approveApplication(makeApp());

    expect(sendWelcomeMock).toHaveBeenCalledTimes(1);
    expect(sendWelcomeMock.mock.calls[0][0]).toMatchObject({
      to: "teacher@example.com",
      tempPassword: result.tempPassword,
    });
    expect(result.emailSent).toBe(false);
  });
});
