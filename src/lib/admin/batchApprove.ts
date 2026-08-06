/**
 * WS-4 Bulk Import — per-row batch approval loop (T019/T023).
 *
 * Extracted from the batch-approve route so the partial-failure logic is
 * unit-testable. `approveFn` is injectable (defaults to the shared WS-1
 * helper): each row runs in its own try/catch — a failed row reports
 * { id, email, error } and keeps its status; a failure on one row never
 * rolls back or blocks other rows.
 */
import { providerApplications } from "@/lib/db/schema";
import { approveApplication, type ApproveResult } from "./approveApplication";
import type { BatchApproveResult } from "@/lib/import/types";

export const APPROVABLE_STATUSES = ["pending", "contacted"];

export async function approveBatch(
  applications: (typeof providerApplications.$inferSelect)[],
  approveFn: (app: typeof providerApplications.$inferSelect) => Promise<ApproveResult> = approveApplication
): Promise<BatchApproveResult> {
  const result: BatchApproveResult = { approved: [], failed: [] };

  for (const app of applications) {
    const email = app.email.toLowerCase().trim();
    const status = app.status || "pending";

    if (!APPROVABLE_STATUSES.includes(status)) {
      result.failed.push({
        id: app.id,
        email,
        error: `Application is not approvable (status: ${status})`,
      });
      continue;
    }

    try {
      const { tempPassword, emailSent } = await approveFn(app);
      result.approved.push({ id: app.id, email, tempPassword, emailSent });
    } catch (e) {
      // Failed row keeps its status — never half-approved.
      result.failed.push({
        id: app.id,
        email,
        error: e instanceof Error ? e.message : "Approval failed",
      });
    }
  }

  return result;
}
