import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import {
  CLAIM_CODE_TTL_MS,
  CLAIM_LOCK_MS,
  UNIFORM_CLAIM_ERROR,
  CLAIM_LOCKOUT_ERROR,
  generateClaimCode,
  setClaimCode,
  regenerateClaimCode,
  verifyClaimCode,
  isClaimLocked,
  isClaimCodeExpired,
  nextClaimAttempt,
} from "@/lib/claim-codes";
import { POST } from "@/app/api/providers/claim/route";

// ── Mock the db (lazy proxy) with an in-memory store the route mutates ──
type MockRow = Record<string, unknown>;

const state = vi.hoisted(() => ({
  userRows: [] as MockRow[],
  providerRows: [] as MockRow[],
  accountRows: [] as MockRow[],
  accountInserts: [] as MockRow[],
}));

vi.mock("@/lib/db/index", async () => {
  const schema = await import("@/lib/db/schema");
  return {
    db: {
      select: () => ({
        from: (table: unknown) => ({
          where: () => ({
            limit: async () => {
              if (table === schema.users) return state.userRows;
              if (table === schema.providers) return state.providerRows;
              if (table === schema.authAccounts) return state.accountRows;
              return [];
            },
          }),
        }),
      }),
      update: (table: unknown) => ({
        set: (values: Record<string, unknown>) => ({
          where: () => {
            if (table === schema.users && state.userRows[0]) {
              Object.assign(state.userRows[0], values);
            }
            if (table === schema.authAccounts && state.accountRows[0]) {
              Object.assign(state.accountRows[0], values);
            }
          },
        }),
      }),
      insert: (table: unknown) => ({
        values: (values: Record<string, unknown>) => {
          if (table === schema.authAccounts) state.accountInserts.push(values);
          return Promise.resolve();
        },
      }),
    },
  };
});

const VALID_PAYLOAD = {
  email: "test-provider@ilali.co",
  password: "supersecret123",
  passphrase: "green elephant dances quietly",
};

async function makeProviderUser(overrides: Record<string, unknown> = {}) {
  const fields = await setClaimCode();
  const user = {
    id: "user-claim-1",
    name: "Test Provider",
    email: "test-provider@ilali.co",
    role: "provider",
    needsClaim: true,
    passwordResetRequired: false,
    passphraseHash: null,
    claimCodeHash: fields.claimCodeHash,
    claimCodeExpiresAt: fields.claimCodeExpiresAt,
    claimAttempts: 0,
    claimLockedUntil: null,
    ...overrides,
  };
  state.userRows = [user];
  state.providerRows = [
    { id: "prov-1", name: "Test Provider", slug: "test-provider", userId: user.id },
  ];
  return { user, claimCode: fields.claimCode };
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/providers/claim", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  state.userRows = [];
  state.providerRows = [];
  state.accountRows = [];
  state.accountInserts = [];
});

describe("claim-code lib", () => {
  it("generates a 12-char code in 3 dashed groups of 4", () => {
    const code = generateClaimCode();
    expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(code.replace(/-/g, "")).toHaveLength(12);
  });

  it("uses an unambiguous alphabet — never emits 0/O/1/I/l", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateClaimCode()).not.toMatch(/[0O1Il]/);
    }
  });

  it("produces varied codes", () => {
    const codes = new Set(Array.from({ length: 500 }, () => generateClaimCode()));
    expect(codes.size).toBe(500);
  });

  it("setClaimCode stores only a hash, with a 7-day expiry, attempts/lock reset", async () => {
    const before = Date.now();
    const fields = await setClaimCode();
    const after = Date.now();
    expect(fields.claimCode).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect(fields.claimCodeHash).not.toBe(fields.claimCode);
    const bcrypt = await import("bcryptjs");
    expect(await bcrypt.compare(fields.claimCode, fields.claimCodeHash)).toBe(true);
    expect(fields.claimCodeExpiresAt.getTime()).toBeGreaterThanOrEqual(
      before + CLAIM_CODE_TTL_MS - 1000
    );
    expect(fields.claimCodeExpiresAt.getTime()).toBeLessThanOrEqual(
      after + CLAIM_CODE_TTL_MS
    );
    expect(fields.claimAttempts).toBe(0);
    expect(fields.claimLockedUntil).toBeNull();
  });

  it("regenerateClaimCode invalidates the previous code", async () => {
    const first = await setClaimCode();
    const second = await regenerateClaimCode();
    expect(second.claimCode).not.toBe(first.claimCode);
    await expect(
      verifyClaimCode({ claimCodeHash: second.claimCodeHash }, first.claimCode)
    ).resolves.toBe(false);
    await expect(
      verifyClaimCode({ claimCodeHash: second.claimCodeHash }, second.claimCode)
    ).resolves.toBe(true);
  });

  it("verifyClaimCode: correct → true, wrong → false, null hash → false", async () => {
    const { claimCode, claimCodeHash } = await setClaimCode();
    await expect(verifyClaimCode({ claimCodeHash }, claimCode)).resolves.toBe(true);
    await expect(verifyClaimCode({ claimCodeHash }, "WRONG-CODE-1234")).resolves.toBe(false);
    await expect(verifyClaimCode({ claimCodeHash: null }, claimCode)).resolves.toBe(false);
  });

  it("nextClaimAttempt: counts fails; the 5th arms the 15-min lock and resets the counter", () => {
    const now = new Date("2026-08-06T12:00:00Z");
    const first = nextClaimAttempt({ claimAttempts: 0 }, now);
    expect(first).toMatchObject({ claimAttempts: 1, locked: false });
    expect(first.claimLockedUntil).toBeNull();

    const fifth = nextClaimAttempt({ claimAttempts: 4 }, now);
    expect(fifth.locked).toBe(true);
    expect(fifth.claimAttempts).toBe(0); // fresh set once the lock expires
    expect(fifth.claimLockedUntil!.getTime()).toBe(now.getTime() + CLAIM_LOCK_MS);
  });

  it("isClaimLocked / isClaimCodeExpired helpers", () => {
    const now = new Date("2026-08-06T12:00:00Z");
    expect(isClaimLocked({ claimLockedUntil: new Date(now.getTime() + 1000) }, now)).toBe(true);
    expect(isClaimLocked({ claimLockedUntil: new Date(now.getTime() - 1000) }, now)).toBe(false);
    expect(isClaimLocked({ claimLockedUntil: null }, now)).toBe(false);

    expect(isClaimCodeExpired({ claimCodeExpiresAt: new Date(now.getTime() - 1000) }, now)).toBe(true);
    expect(isClaimCodeExpired({ claimCodeExpiresAt: new Date(now.getTime() + 1000) }, now)).toBe(false);
    expect(isClaimCodeExpired({ claimCodeExpiresAt: null }, now)).toBe(false);
  });
});

describe("POST /api/providers/claim — WS-3 rewrite", () => {
  it("claims successfully with a valid code: sets credentials, clears code + needsClaim", async () => {
    const { user, claimCode } = await makeProviderUser();
    const res = await POST(makeRequest({ ...VALID_PAYLOAD, claimCode }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });

    expect(state.userRows[0].needsClaim).toBe(false);
    expect(state.userRows[0].passwordResetRequired).toBe(false);
    expect(state.userRows[0].passphraseHash).toBeTruthy();
    expect(state.userRows[0].claimCodeHash).toBeNull(); // single-use
    expect(state.userRows[0].claimCodeExpiresAt).toBeNull();
    expect(state.userRows[0].claimAttempts).toBe(0);
    expect(state.userRows[0].claimLockedUntil).toBeNull();

    expect(state.accountInserts).toHaveLength(1);
    expect(state.accountInserts[0].userId).toBe(user.id);
    expect(state.accountInserts[0].password).toMatch(/^\$2/);
  });

  it("updates an existing credential account instead of inserting a duplicate", async () => {
    const { user, claimCode } = await makeProviderUser();
    state.accountRows = [
      { id: "acct-1", userId: user.id, providerId: "credential", accountId: user.id, password: "old" },
    ];
    const res = await POST(makeRequest({ ...VALID_PAYLOAD, claimCode }));
    expect(res.status).toBe(200);
    expect(state.accountInserts).toHaveLength(0);
    expect(state.accountRows[0].password).toMatch(/^\$2/);
  });

  it("is single-use — the same code cannot claim twice", async () => {
    const { claimCode } = await makeProviderUser();
    const first = await POST(makeRequest({ ...VALID_PAYLOAD, claimCode }));
    expect(first.status).toBe(200);

    const second = await POST(makeRequest({ ...VALID_PAYLOAD, claimCode }));
    expect(second.status).toBe(400);
    expect((await second.json()).error).toBe(UNIFORM_CLAIM_ERROR);
  });

  it("wrong code → uniform 400 and increments claimAttempts", async () => {
    await makeProviderUser();
    const res = await POST(
      makeRequest({ ...VALID_PAYLOAD, claimCode: "WRONG-CODE-1234" })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(UNIFORM_CLAIM_ERROR);
    expect(state.userRows[0].claimAttempts).toBe(1);
  });

  it("5 failed attempts arm the lock (429); the account stays locked for the correct code", async () => {
    const { claimCode } = await makeProviderUser();
    for (let i = 0; i < 4; i++) {
      const res = await POST(
        makeRequest({ ...VALID_PAYLOAD, claimCode: "WRONG-CODE-1234" })
      );
      expect(res.status).toBe(400);
    }
    const fifth = await POST(
      makeRequest({ ...VALID_PAYLOAD, claimCode: "WRONG-CODE-1234" })
    );
    expect(fifth.status).toBe(429);
    expect((await fifth.json()).error).toBe(CLAIM_LOCKOUT_ERROR);
    expect(state.userRows[0].claimLockedUntil).not.toBeNull();
    expect(state.userRows[0].claimAttempts).toBe(0);

    const locked = await POST(makeRequest({ ...VALID_PAYLOAD, claimCode }));
    expect(locked.status).toBe(429);
    expect((await locked.json()).error).toBe(CLAIM_LOCKOUT_ERROR);
  });

  it("rejects with 429 when the account is already locked", async () => {
    const { claimCode } = await makeProviderUser({
      claimLockedUntil: new Date(Date.now() + 10 * 60 * 1000),
    });
    const res = await POST(makeRequest({ ...VALID_PAYLOAD, claimCode }));
    expect(res.status).toBe(429);
    expect((await res.json()).error).toBe(CLAIM_LOCKOUT_ERROR);
  });

  it("expired code → uniform 400 (never reveals the code state)", async () => {
    await makeProviderUser({ claimCodeExpiresAt: new Date(Date.now() - 1000) });
    const res = await POST(
      makeRequest({ ...VALID_PAYLOAD, claimCode: "K7XQ-M2NP-V8RT" })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(UNIFORM_CLAIM_ERROR);
  });

  it("unknown email → uniform 400, not 404 (prevents enumeration)", async () => {
    await makeProviderUser();
    const res = await POST(
      makeRequest({
        ...VALID_PAYLOAD,
        email: "nobody@example.com",
        claimCode: "K7XQ-M2NP-V8RT",
      })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(UNIFORM_CLAIM_ERROR);
  });

  it("missing claimCode field → uniform 400", async () => {
    await makeProviderUser();
    const res = await POST(
      makeRequest({
        email: VALID_PAYLOAD.email,
        password: VALID_PAYLOAD.password,
        passphrase: VALID_PAYLOAD.passphrase,
      })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(UNIFORM_CLAIM_ERROR);
  });

  it("user with no code issued → uniform 400", async () => {
    await makeProviderUser({ claimCodeHash: null, claimCodeExpiresAt: null });
    const res = await POST(
      makeRequest({ ...VALID_PAYLOAD, claimCode: "K7XQ-M2NP-V8RT" })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(UNIFORM_CLAIM_ERROR);
  });

  it("non-provider role → uniform 400", async () => {
    await makeProviderUser({ role: "parent" });
    const res = await POST(
      makeRequest({ ...VALID_PAYLOAD, claimCode: "K7XQ-M2NP-V8RT" })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe(UNIFORM_CLAIM_ERROR);
  });
});
