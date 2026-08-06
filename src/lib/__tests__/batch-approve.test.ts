import { describe, it, expect, vi } from "vitest";
import { approveBatch } from "@/lib/admin/batchApprove";
import type { providerApplications } from "@/lib/db/schema";

type App = typeof providerApplications.$inferSelect;

function makeApp(overrides: Partial<App> = {}): App {
  return {
    id: "app-1",
    name: "Test Provider",
    email: "test@example.com",
    phone: null,
    activityType: "sports",
    description: null,
    location: null,
    ageMin: null,
    ageMax: null,
    priceValue: null,
    imageUrl: null,
    status: "pending",
    onboardSource: null,
    importBatchId: null,
    createdAt: new Date("2026-08-06T10:00:00Z"),
    ...overrides,
  } as App;
}

const OK_RESULT = { tempPassword: "Abc123Def456", emailSent: false };

describe("approveBatch — partial-failure logic (spec FR-4)", () => {
  it("approves every row when all approvals succeed", async () => {
    const apps = [
      makeApp({ id: "a", email: "a@x.co.za" }),
      makeApp({ id: "b", email: "b@x.co.za", status: "contacted" }),
    ];
    const approveFn = vi.fn().mockResolvedValue(OK_RESULT);

    const result = await approveBatch(apps, approveFn);

    expect(result.approved).toHaveLength(2);
    expect(result.failed).toHaveLength(0);
    expect(result.approved[0]).toMatchObject({
      id: "a",
      email: "a@x.co.za",
      tempPassword: "Abc123Def456",
      emailSent: false,
    });
    expect(approveFn).toHaveBeenCalledTimes(2);
  });

  it("reports partial success — failing rows are reported, others still approve", async () => {
    const apps = [
      makeApp({ id: "ok", email: "ok@x.co.za" }),
      makeApp({ id: "dup", email: "dup@x.co.za" }),
      makeApp({ id: "ok2", email: "ok2@x.co.za" }),
    ];
    const approveFn = vi
      .fn()
      .mockResolvedValueOnce(OK_RESULT)
      .mockRejectedValueOnce(new Error("A user with this email already exists"))
      .mockResolvedValueOnce(OK_RESULT);

    const result = await approveBatch(apps, approveFn);

    expect(result.approved).toHaveLength(2);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0]).toMatchObject({
      id: "dup",
      email: "dup@x.co.za",
      error: "A user with this email already exists",
    });
  });

  it("never rolls back or blocks other rows when one row throws", async () => {
    const apps = [
      makeApp({ id: "boom", email: "boom@x.co.za" }),
      makeApp({ id: "fine", email: "fine@x.co.za" }),
      makeApp({ id: "fine2", email: "fine2@x.co.za" }),
    ];
    const approveFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("Account creation failed — application not approved. Check the server logs and try again."))
      .mockResolvedValueOnce(OK_RESULT)
      .mockResolvedValueOnce(OK_RESULT);

    const result = await approveBatch(apps, approveFn);

    expect(result.approved).toHaveLength(2);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].id).toBe("boom");
  });

  it("skips ineligible statuses with an actionable error and never calls the approval fn", async () => {
    const apps = [
      makeApp({ id: "approved", email: "done@x.co.za", status: "approved" }),
      makeApp({ id: "rejected", email: "no@x.co.za", status: "rejected" }),
      makeApp({ id: "pending", email: "pending@x.co.za", status: "pending" }),
    ];
    const approveFn = vi.fn().mockResolvedValue(OK_RESULT);

    const result = await approveBatch(apps, approveFn);

    expect(result.failed).toHaveLength(2);
    expect(result.failed.map((f) => f.id)).toEqual(["approved", "rejected"]);
    expect(result.failed[0].error).toMatch(/not approvable \(status: approved\)/);
    expect(approveFn).toHaveBeenCalledTimes(1); // only the pending row
  });

  it("treats a null status as pending", async () => {
    const apps = [makeApp({ id: "null-status", email: "n@x.co.za", status: null })];
    const approveFn = vi.fn().mockResolvedValue(OK_RESULT);
    const result = await approveBatch(apps, approveFn);
    expect(result.approved).toHaveLength(1);
  });

  it("email non-blocking: emailSent=false still counts as approved (WS-2 contract)", async () => {
    const apps = [makeApp({ id: "no-mail", email: "no@x.co.za" })];
    const approveFn = vi.fn().mockResolvedValue({
      tempPassword: "Abc123Def456",
      emailSent: false,
    });
    const result = await approveBatch(apps, approveFn);
    expect(result.approved).toHaveLength(1);
    expect(result.approved[0].emailSent).toBe(false);
    expect(result.failed).toHaveLength(0);
  });

  it("normalizes emails to lowercase in the report", async () => {
    const apps = [makeApp({ id: "mixed", email: "Mixed@Case.CO.ZA" })];
    const approveFn = vi.fn().mockResolvedValue(OK_RESULT);
    const result = await approveBatch(apps, approveFn);
    expect(result.approved[0].email).toBe("mixed@case.co.za");
  });

  it("empty input returns an empty report", async () => {
    const result = await approveBatch([], vi.fn());
    expect(result.approved).toEqual([]);
    expect(result.failed).toEqual([]);
  });
});
