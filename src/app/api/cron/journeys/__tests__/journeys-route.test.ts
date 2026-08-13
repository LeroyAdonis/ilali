import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { dbMock, makeChain } = vi.hoisted(() => {
  const dbMock = { select: vi.fn() };
  function makeChain(resolveValue: unknown) {
    const chain = Promise.resolve(resolveValue) as Promise<unknown> &
      Record<string, ReturnType<typeof vi.fn>>;
    for (const m of ["from", "where", "limit", "groupBy"]) {
      chain[m] = vi.fn(() => chain);
    }
    return chain;
  }
  return { dbMock, makeChain };
});

vi.mock("@/lib/db/index", () => ({ db: dbMock }));

import { GET } from "@/app/api/cron/journeys/route";

function getRequest(url: string): Request {
  return new Request(url, { method: "GET" });
}

async function jsonOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

describe("GET /api/cron/journeys — auth guard", () => {
  beforeEach(() => {
    dbMock.select.mockReturnValue(makeChain([]));
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
  });

  it("returns 401 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;
    const res = await GET(getRequest("http://localhost/api/cron/journeys?job=reminders-24h"));
    expect(res.status).toBe(401);
  });

  it("returns 401 with a wrong cronSecret query param", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const res = await GET(
      getRequest("http://localhost/api/cron/journeys?job=reminders-24h&cronSecret=wrong")
    );
    expect(res.status).toBe(401);
  });

  it("returns 401 with a wrong Bearer header", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const res = await GET(
      new Request("http://localhost/api/cron/journeys?job=reminders-24h", {
        headers: { authorization: "Bearer wrong" },
      })
    );
    expect(res.status).toBe(401);
  });

  it("runs a job with the correct cronSecret query param", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const res = await GET(
      getRequest("http://localhost/api/cron/journeys?job=reminders-24h&cronSecret=correct-secret")
    );
    expect(res.status).toBe(200);
    const data = await jsonOf(res);
    expect(data.ok).toBe(true);
    expect(data.job).toBe("reminders-24h");
    expect(data.batch).toMatchObject({ total: 0, sent: 0, skipped: 0, failed: 0 });
  });

  it("runs a job with a correct Bearer header", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const res = await GET(
      new Request("http://localhost/api/cron/journeys?job=digest-weekly", {
        headers: { authorization: "Bearer correct-secret" },
      })
    );
    expect(res.status).toBe(200);
    expect((await jsonOf(res)).ok).toBe(true);
  });

  it("rejects an unknown job with 400", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const res = await GET(
      getRequest("http://localhost/api/cron/journeys?job=nonsense&cronSecret=correct-secret")
    );
    expect(res.status).toBe(400);
  });

  it("runs the daily pass (no job param) — reminders always run", async () => {
    process.env.CRON_SECRET = "correct-secret";
    const res = await GET(
      getRequest("http://localhost/api/cron/journeys?cronSecret=correct-secret")
    );
    expect(res.status).toBe(200);
    const data = await jsonOf(res);
    expect(data.ok).toBe(true);
    const jobs = data.jobs as Record<string, { total: number }>;
    expect(jobs["reminders-24h"]).toBeDefined();
    expect(jobs["reminders-24h"].total).toBe(0);
  });
});
