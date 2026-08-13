// ── Application lifecycle vocabulary (Painless Journeys Phase 4) ──
// Single source for the three status vocabularies that otherwise drift:
// DB states, notification states, and the tracker's display steps.

/** providerApplications.status values (DB). */
export const APPLICATION_STATUS = [
  "draft",
  "pending",
  "contacted",
  "approved",
  "rejected",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUS)[number];

/** provider-status notification payload values. */
export const NOTIFICATION_STATUS = ["submitted", "reviewing", "live", "rejected"] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUS)[number];

/** Tracker display steps. */
export type StatusStep = "draft" | "submitted" | "reviewing" | "live";

/** DB status → tracker display step. */
export function statusToStep(status: string): StatusStep {
  switch (status) {
    case "pending":
      return "submitted";
    case "contacted":
      return "reviewing";
    case "approved":
      return "live";
    default:
      return "draft"; // draft or unknown
  }
}

/** DB status → provider-status notification state. */
export function toNotificationStatus(status: ApplicationStatus): NotificationStatus {
  switch (status) {
    case "contacted":
      return "reviewing";
    case "approved":
      return "live";
    case "rejected":
      return "rejected";
    default:
      return "submitted";
  }
}
