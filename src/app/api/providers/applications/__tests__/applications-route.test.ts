import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──
const { getSessionMock, dbMock, makeChain } = vi.hoisted(() => {
  function makeChain<T>(resolveValue: T) {
    const chain = Promise.resolve(resolveValue) as Promise<T> &
      Record<string, ReturnType<typeof vi.fn>>;
    for (const m of [
      "from",
      "innerJoin",
      "where",
      "orderBy",
      "limit",
      "values",
      "set",
      "returning",
      "onConflictDoUpdate",
      "onConflictDoNothing",
    ]) {
      chain[m] = vi.fn(() => chain);
    }
    return chain;
  }

  const dbMock = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  return { getSessionMock: vi.fn(), dbMock, makeChain };
});

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@/lib/db/index", () => ({ db: dbMock }));

const sendNotificationMock = vi.fn((..._args: unknown[]) =>
  Promise.resolve({ status: "sent", eventId: 1 })
);
vi.mock("@/lib/notifications", () => ({
  sendNotification: (...args: unknown[]) => sendNotificationMock(...args),
  // Phase 4 cleanup: provider-status now routes through the typed helper.
  sendProviderStatusNotification: (...args: unknown[]) => sendNotificationMock(...args),
}));

import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/providers/applications/route";

const USER = { id: "user-1", email: "teacher@example.com", role: "parent" };
const EXISTING_DRAFT = {
  id: "app-1",
  name: "Creative Arts Workshop",
  email: "teacher@example.com",
  phone: "+27 82 123 4567",
  activityType: "Arts & Culture",
  description: null,
  location: "Muizenberg",
  ageMin: 4,
  ageMax: 12,
  priceValue: 150,
  priceLabel: "per session",
  schedule: null,
  imageUrl: null,
  userId: "user-1",
  status: "draft",
  onboardSource: "wizard",
  importBatchId: null,
  createdAt: new Date(),
};

const OFFER_FIELDS = {
  name: "Creative Arts Workshop",
  category: "Arts & Culture",
  ageMin: 4,
  ageMax: 12,
};

const DETAILS_FIELDS = {
  priceValue: 150,
  priceLabel: "per session",
  location: "Muizenberg",
  schedule: "Saturdays 09:00",
  phone: "+27 82 123 4567",
};

const PHOTOS_FIELDS = {
  description: "A hands-on Saturday art club exploring paint, clay and collage.",
  imageUrl: "",
};

const ALL_FIELDS = { ...OFFER_FIELDS, ...DETAILS_FIELDS, ...PHOTOS_FIELDS };

function getRequest(): NextRequest {
  return new NextRequest("http://localhost/api/providers/applications", { method: "GET" });
}

function postRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/providers/applications", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function jsonOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe("GET /api/providers/applications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for guests", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await GET(getRequest());
    expect(res.status).toBe(401);
  });

  it("returns the signed-in user's draft for resume", async () => {
    getSessionMock.mockResolvedValue({ user: USER });
    dbMock.select.mockReturnValue(makeChain([EXISTING_DRAFT]));

    const res = await GET(getRequest());
    expect(res.status).toBe(200);
    const data = await jsonOf(res);
    expect((data.application as { id: string }).id).toBe("app-1");
  });

  it("returns application: null when the user has no draft", async () => {
    getSessionMock.mockResolvedValue({ user: USER });
    dbMock.select.mockReturnValue(makeChain([]));

    const res = await GET(getRequest());
    const data = await jsonOf(res);
    expect(data.application).toBeNull();
  });
});

describe("POST /api/providers/applications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for guests", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await POST(postRequest({ fields: OFFER_FIELDS, step: 1 }));
    expect(res.status).toBe(401);
  });

  it("creates a draft on the first step save (status draft, userId, onboardSource wizard)", async () => {
    getSessionMock.mockResolvedValue({ user: USER });
    dbMock.select.mockReturnValue(makeChain([]));
    const insertChain = makeChain([{ ...EXISTING_DRAFT }]);
    dbMock.insert.mockReturnValue(insertChain);

    const res = await POST(postRequest({ fields: OFFER_FIELDS, step: 1 }));
    expect(res.status).toBe(200);
    expect((await jsonOf(res)).application).toBeDefined();

    const values = insertChain.values.mock.calls[0][0] as Record<string, unknown>;
    expect(values.userId).toBe("user-1");
    expect(values.status).toBe("draft");
    expect(values.onboardSource).toBe("wizard");
    expect(values.email).toBe("teacher@example.com");
    expect(values.activityType).toBe("Arts & Culture");
  });

  it("rejects an invalid step (bad phone in step 2)", async () => {
    getSessionMock.mockResolvedValue({ user: USER });
    const res = await POST(
      postRequest({ fields: { ...DETAILS_FIELDS, phone: "0821234567" }, step: 2 })
    );
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).error).toMatch(/\+27/);
  });

  it("upserts into the existing draft instead of creating a second row", async () => {
    getSessionMock.mockResolvedValue({ user: USER });
    dbMock.select.mockReturnValue(makeChain([EXISTING_DRAFT]));
    const updateChain = makeChain([{ ...EXISTING_DRAFT, location: "Claremont" }]);
    dbMock.update.mockReturnValue(updateChain);

    const res = await POST(
      postRequest({ fields: { ...DETAILS_FIELDS, location: "Claremont" }, step: 2 })
    );
    expect(res.status).toBe(200);
    expect(dbMock.update).toHaveBeenCalledTimes(1);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("submit: sets status pending, flips the user to provider, fires the submitted notification", async () => {
    getSessionMock.mockResolvedValue({ user: USER });
    dbMock.select.mockReturnValue(makeChain([EXISTING_DRAFT]));
    const updateChain = makeChain([{ ...EXISTING_DRAFT, status: "pending" }]);
    dbMock.update.mockReturnValue(updateChain);

    const res = await POST(
      postRequest({ fields: ALL_FIELDS, step: 4, submitted: true })
    );
    expect(res.status).toBe(200);
    const data = await jsonOf(res);
    expect((data.application as { status: string }).status).toBe("pending");

    const updateSets = updateChain.set.mock.calls.map((c: unknown[]) => c[0]) as Array<
      Record<string, unknown>
    >;
    expect(updateSets.some((s) => s.status === "pending")).toBe(true);

    expect(sendNotificationMock).toHaveBeenCalledTimes(1);
    expect(sendNotificationMock.mock.calls[0][0]).toBe("user-1");
    // sendProviderStatusNotification(userId, status, application, opts)
    expect(sendNotificationMock.mock.calls[0][1]).toBe("submitted");
    expect(sendNotificationMock.mock.calls[0][2]).toMatchObject({
      name: "Creative Arts Workshop",
    });
  });

  it("submit: rejects an incomplete application", async () => {
    getSessionMock.mockResolvedValue({ user: USER });
    dbMock.select.mockReturnValue(makeChain([EXISTING_DRAFT]));
    const missingLocation = { ...ALL_FIELDS, location: "" };

    const res = await POST(
      postRequest({ fields: missingLocation, step: 4, submitted: true })
    );
    expect(res.status).toBe(400);
    expect(dbMock.update).not.toHaveBeenCalled();
    expect(sendNotificationMock).not.toHaveBeenCalled();
  });
});
