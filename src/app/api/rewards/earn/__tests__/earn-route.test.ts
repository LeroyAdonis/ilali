import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mocks ──
const { getSessionMock, dbMock, getRewardPointsMock, getRewardRedemptionsMock, makeChain } =
  vi.hoisted(() => {
    function makeChain<T>(resolveValue: T, onValues?: (values: unknown) => void) {
      const chain = Promise.resolve(resolveValue) as Promise<T> & {
        values: ReturnType<typeof vi.fn>;
      };
      chain.values = vi.fn((values: unknown) => {
        onValues?.(values);
        return chain;
      });
      return chain;
    }

    return {
      getSessionMock: vi.fn(),
      dbMock: { insert: vi.fn() },
      getRewardPointsMock: vi.fn(),
      getRewardRedemptionsMock: vi.fn(),
      makeChain,
    };
  });

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@/lib/db/index", () => ({ db: dbMock }));

vi.mock("@/lib/data-source", () => ({
  getRewardPoints: getRewardPointsMock,
  getRewardRedemptions: getRewardRedemptionsMock,
}));

import { POST } from "@/app/api/rewards/earn/route";

const USER = { id: "user-1", email: "parent@example.com", role: "parent" };

function postRequest(body: unknown): Request {
  return new Request("http://localhost/api/rewards/earn", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/rewards/earn", () => {
  let ledger: Record<string, unknown>[];

  beforeEach(() => {
    vi.clearAllMocks();
    ledger = [];
    getSessionMock.mockResolvedValue({ user: USER });
    getRewardPointsMock.mockImplementation(() => Promise.resolve(ledger));
    getRewardRedemptionsMock.mockResolvedValue([]);
    dbMock.insert.mockImplementation(() =>
      makeChain(undefined, (values: unknown) => {
        ledger.push(values as Record<string, unknown>);
      })
    );
  });

  it("credits a community contribution with the type-specific points override", async () => {
    const res = await POST(
      postRequest({
        action: "community",
        referenceId: "contrib-1",
        userId: "user-2",
        points: 50,
      })
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as { points: number; balance: number };
    expect(data.points).toBe(50);
    expect(data.balance).toBe(50);

    const insertChain = dbMock.insert.mock.results[0].value as {
      values: ReturnType<typeof vi.fn>;
    };
    const values = insertChain.values.mock.calls[0][0] as Record<string, unknown>;
    expect(values.userId).toBe("user-2");
    expect(values.action).toBe("community");
    expect(values.amount).toBe(50);
    expect(values.referenceId).toBe("contrib-1");
  });

  it("rejects an unknown action with 400", async () => {
    const res = await POST(postRequest({ action: "hack" }));

    expect(res.status).toBe(400);
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it("does not double-credit the same (user, action, referenceId)", async () => {
    const body = {
      action: "community",
      referenceId: "contrib-1",
      userId: "user-2",
      points: 50,
    };

    const first = await POST(postRequest(body));
    expect(first.status).toBe(200);

    const second = await POST(postRequest(body));
    expect(second.status).toBe(200);
    const data = (await second.json()) as { alreadyEarned: boolean; balance: number };
    expect(data.alreadyEarned).toBe(true);
    expect(data.balance).toBe(50);

    expect(ledger).toHaveLength(1);
    expect(dbMock.insert).toHaveBeenCalledTimes(1);
  });

  it("keeps the map value when no points override is supplied", async () => {
    const res = await POST(
      postRequest({ action: "lift", referenceId: "ride-1", userId: "user-2" })
    );

    expect(res.status).toBe(200);
    const data = (await res.json()) as { points: number };
    expect(data.points).toBe(50);

    const insertChain = dbMock.insert.mock.results[0].value as {
      values: ReturnType<typeof vi.fn>;
    };
    const values = insertChain.values.mock.calls[0][0] as Record<string, unknown>;
    expect(values.amount).toBe(50);
  });

  it("rejects an invalid points override", async () => {
    for (const points of [-1, 1.5, 5000]) {
      const res = await POST(
        postRequest({ action: "community", userId: "user-2", points })
      );
      expect(res.status).toBe(400);
    }
    expect(dbMock.insert).not.toHaveBeenCalled();
  });
});
