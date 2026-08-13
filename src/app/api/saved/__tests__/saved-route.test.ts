import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──
const { getSessionMock, dbMock, makeChain } = vi.hoisted(() => {
  /** Build a thenable chain that resolves to `resolveValue` after any method calls. */
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
    delete: vi.fn(),
  };

  return {
    getSessionMock: vi.fn(),
    dbMock,
    makeChain,
  };
});

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@/lib/db/index", () => ({ db: dbMock }));

import { GET, POST, DELETE } from "@/app/api/saved/route";

const USER = { id: "user-1" };
const PROVIDER_ID = "a1b2c3d4-0001-4000-8000-000000000001";
const PROVIDER_ROW = {
  id: PROVIDER_ID,
  name: "Sea Point Football",
  slug: "sea-point-football",
  category: "soccer",
  location: "Sea Point",
  imageUrl: null,
  priceValue: 12000,
  priceLabel: "per term",
  rating: "4.8",
  reviewCount: 12,
};

function getRequest(): Request {
  return new Request("http://localhost/api/saved", { method: "GET" });
}

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/saved", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function deleteRequest(body?: unknown): Request {
  return new Request("http://localhost/api/saved", {
    method: "DELETE",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function jsonOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe("GET /api/saved", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for guests", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await GET(getRequest());
    expect(res.status).toBe(401);
    expect((await jsonOf(res)).error).toContain("signed in");
  });

  it("lists saved providers with details for a signed-in parent", async () => {
    getSessionMock.mockResolvedValue({ user: USER });
    dbMock.select.mockReturnValue(
      makeChain([
        { id: 1, notifyWhenOpen: false, createdAt: new Date(), provider: PROVIDER_ROW },
      ])
    );

    const res = await GET(getRequest());
    expect(res.status).toBe(200);
    const data = await jsonOf(res);
    expect(Array.isArray(data.saved)).toBe(true);
    expect((data.saved as Array<{ provider: { name: string } }>)[0].provider.name).toBe(
      "Sea Point Football"
    );
  });
});

describe("POST /api/saved", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for guests", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await POST(postRequest({ providerId: PROVIDER_ID }));
    expect(res.status).toBe(401);
  });

  it("returns 400 for a malformed providerId", async () => {
    getSessionMock.mockResolvedValue({ user: USER });
    const res = await POST(postRequest({ providerId: "not-a-uuid" }));
    expect(res.status).toBe(400);
    expect((await jsonOf(res)).error).toContain("providerId");
  });

  it("returns 404 when the provider does not exist", async () => {
    getSessionMock.mockResolvedValue({ user: USER });
    dbMock.select.mockReturnValue(makeChain([]));
    const res = await POST(postRequest({ providerId: PROVIDER_ID }));
    expect(res.status).toBe(404);
  });

  it("upserts a save idempotently for an existing provider", async () => {
    getSessionMock.mockResolvedValue({ user: USER });
    dbMock.select.mockReturnValue(makeChain([{ id: PROVIDER_ID }]));
    const insertChain = makeChain(undefined);
    dbMock.insert.mockReturnValue(insertChain);

    const res = await POST(postRequest({ providerId: PROVIDER_ID, notifyWhenOpen: true }));
    expect(res.status).toBe(200);
    expect((await jsonOf(res)).saved).toBe(true);

    const second = await POST(postRequest({ providerId: PROVIDER_ID }));
    expect(second.status).toBe(200);
    expect(dbMock.insert).toHaveBeenCalledTimes(2);
  });

  it("stores notifyWhenOpen for the notify-me action", async () => {
    getSessionMock.mockResolvedValue({ user: USER });
    dbMock.select.mockReturnValue(makeChain([{ id: PROVIDER_ID }]));
    const insertChain = makeChain(undefined);
    dbMock.insert.mockReturnValue(insertChain);

    await POST(postRequest({ providerId: PROVIDER_ID, notifyWhenOpen: true }));

    const values = insertChain.values.mock.calls[0][0] as Record<string, unknown>;
    expect(values.notifyWhenOpen).toBe(true);
  });
});

describe("DELETE /api/saved", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 for guests", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await DELETE(deleteRequest());
    expect(res.status).toBe(401);
  });

  it("removes a save by providerId query param", async () => {
    getSessionMock.mockResolvedValue({ user: USER });
    dbMock.delete.mockReturnValue(makeChain(undefined));

    const res = await DELETE(
      new Request(`http://localhost/api/saved?providerId=${PROVIDER_ID}`, { method: "DELETE" })
    );
    expect(res.status).toBe(200);
    expect((await jsonOf(res)).saved).toBe(false);
  });

  it("removes a save by providerId in the JSON body", async () => {
    getSessionMock.mockResolvedValue({ user: USER });
    dbMock.delete.mockReturnValue(makeChain(undefined));

    const res = await DELETE(deleteRequest({ providerId: PROVIDER_ID }));
    expect(res.status).toBe(200);
  });
});
