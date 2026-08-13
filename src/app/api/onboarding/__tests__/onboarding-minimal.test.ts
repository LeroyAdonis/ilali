import { describe, it, expect, vi, beforeEach } from "vitest";

const { getSessionMock, dbMock, makeChain, txMock } = vi.hoisted(() => {
  function makeChain<T>(resolveValue: T) {
    const chain = Promise.resolve(resolveValue) as Promise<T> &
      Record<string, ReturnType<typeof vi.fn>>;
    for (const m of ["values", "onConflictDoUpdate"]) {
      chain[m] = vi.fn(() => chain);
    }
    return chain;
  }

  const txMock = {
    insert: vi.fn(),
  };

  const dbMock = {
    transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(txMock)),
  };

  return { getSessionMock: vi.fn(), dbMock, makeChain, txMock };
});

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@/lib/db/index", () => ({ db: dbMock }));

import { POST } from "@/app/api/onboarding/route";

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/onboarding", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function jsonOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe("POST /api/onboarding — minimal child payload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    txMock.insert.mockReturnValue(makeChain(undefined));
  });

  it("returns 401 for guests", async () => {
    getSessionMock.mockResolvedValue(null);
    const res = await POST(postRequest({ children: [{ name: "Thandi", age: 7 }] }));
    expect(res.status).toBe(401);
  });

  it("accepts a minimal { name, age } child (no interests/availability/suburb)", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });

    const res = await POST(postRequest({ children: [{ name: "Thandi", age: 7 }] }));

    expect(res.status).toBe(200);
    expect((await jsonOf(res)).childrenCount).toBe(1);

    const insertChain = txMock.insert.mock.results[0].value as {
      values: ReturnType<typeof vi.fn>;
    };
    const childValues = insertChain.values.mock.calls[0][0] as Record<string, unknown>;
    expect(childValues.parentId).toBe("user-1");
    expect(childValues.name).toBe("Thandi");
    expect(childValues.age).toBe(7);
    expect(childValues.interests).toBeNull();
    expect(childValues.availability).toBeNull();
    expect(childValues.suburb).toBeNull();
  });

  it("still rejects a child without a name", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    const res = await POST(postRequest({ children: [{ age: 7 }] }));
    expect(res.status).toBe(400);
  });

  it("still rejects an out-of-range age", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    const res = await POST(postRequest({ children: [{ name: "Kai", age: 0 }] }));
    expect(res.status).toBe(400);
  });
});
