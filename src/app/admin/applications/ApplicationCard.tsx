"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle,
  Copy,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { AdminStatusBadge } from "@/components/admin";
import { ApplicationEditForm } from "./ApplicationEditForm";

type ApplicationStatus = "pending" | "contacted" | "approved" | "rejected";

export type Application = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  activityType: string;
  description: string | null;
  location: string | null;
  ageMin: number | null;
  ageMax: number | null;
  priceValue: number | null;
  imageUrl: string | null;
  status: string | null;
  onboardSource?: string | null;
  importBatchId?: string | null;
  createdAt: Date | string | null;
};

type BusyAction = "contacted" | "approved" | "rejected" | "regenerate" | null;

const BTN_BASE =
  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

export function ApplicationCard({
  application,
  accountExists,
  selected = false,
  onToggleSelect,
}: {
  application: Application;
  accountExists: boolean;
  /** WS-4 bulk approve: when provided (and the app is approvable) a checkbox is shown. */
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ApplicationStatus>(
    (application.status as ApplicationStatus) || "pending"
  );
  const [accountCreated, setAccountCreated] = useState(accountExists);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);

  const canApprove = status === "pending" || status === "contacted";
  const canEdit = status === "pending" || status === "contacted";
  const selectable = canApprove && typeof onToggleSelect === "function";

  async function transition(next: "contacted" | "approved" | "rejected") {
    setBusy(next);
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${application.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Something went wrong. Please try again.");
        return;
      }
      setStatus(next);
      if (next === "approved" && body.tempPassword) {
        setAccountCreated(true);
        setTempPassword(body.tempPassword);
        setEmailSent(typeof body.emailSent === "boolean" ? body.emailSent : null);
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function regenerateTempPassword() {
    setBusy("regenerate");
    setError(null);
    try {
      const res = await fetch(`/api/admin/applications/${application.id}`, {
        method: "PATCH",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Could not regenerate the temp password.");
        return;
      }
      setTempPassword(body.tempPassword);
      setCopied(false);
    } catch {
      setError("Could not regenerate the temp password.");
    } finally {
      setBusy(null);
    }
  }

  async function copyPassword() {
    if (!tempPassword) return;
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy automatically — select the password and copy manually.");
    }
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {selectable && (
              <input
                type="checkbox"
                checked={selected}
                onChange={onToggleSelect}
                aria-label={`Select ${application.name}`}
                className="h-4 w-4 shrink-0 rounded border-ink/20 text-ilali-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600"
              />
            )}
            <h3 className="font-display text-lg font-semibold text-ink">
              {application.name}
            </h3>
            <AdminStatusBadge status={status} />
          </div>
          <p className="mt-1 text-sm text-ink-faint">
            {application.activityType}
            {application.location && ` · ${application.location}`}
          </p>
          {application.description && (
            <p className="mt-2 text-sm text-ink-soft line-clamp-2">
              {application.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-ink-faint">
            {application.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {application.email}
              </span>
            )}
            {application.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {application.phone}
              </span>
            )}
            {application.createdAt && (
              <span>
                {new Date(application.createdAt).toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
          {application.ageMin != null && application.ageMax != null && (
            <p className="mt-2 text-xs text-ink-faint">
              Ages {application.ageMin}–{application.ageMax}
              {application.priceValue != null &&
                ` · R${application.priceValue.toLocaleString()}`}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="ml-4 flex flex-col gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing((e) => !e)}
              disabled={busy !== null}
              className={`${BTN_BASE} bg-amber-50 text-amber-700 hover:bg-amber-100`}
            >
              <Pencil className="h-3.5 w-3.5" />
              {editing ? "Close editor" : "Edit draft"}
            </button>
          )}
          {status === "pending" && (
            <button
              type="button"
              onClick={() => transition("contacted")}
              disabled={busy !== null}
              className={`${BTN_BASE} bg-blue-50 text-blue-700 hover:bg-blue-100`}
            >
              {busy === "contacted" ? "Updating…" : "Mark Contacted"}
            </button>
          )}
          {canApprove && (
            <>
              <button
                type="button"
                onClick={() => transition("approved")}
                disabled={busy !== null}
                className={`${BTN_BASE} bg-teal-50 text-teal-700 hover:bg-teal-100`}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                {busy === "approved" ? "Approving…" : "Approve"}
              </button>
              <button
                type="button"
                onClick={() => transition("rejected")}
                disabled={busy !== null}
                className={`${BTN_BASE} bg-red-50 text-red-700 hover:bg-red-100`}
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
            </>
          )}
          {status === "approved" && (
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700">
                <KeyRound className="h-3.5 w-3.5" />
                {accountCreated
                  ? `Account created: ${application.email}`
                  : "No account yet"}
              </span>
              {accountCreated && (
                <button
                  type="button"
                  onClick={regenerateTempPassword}
                  disabled={busy !== null}
                  className={`${BTN_BASE} bg-ilali-50 text-ilali-700 hover:bg-ilali-100`}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  {busy === "regenerate"
                    ? "Generating…"
                    : tempPassword
                      ? "Regenerate temp password"
                      : "Reveal temp password"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {editing && (
        <ApplicationEditForm
          application={application}
          onDone={() => setEditing(false)}
        />
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      {tempPassword && (
        <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                Temporary password for {application.email}
              </p>
              <p className="mt-1 break-all font-mono text-base font-semibold tracking-wide text-ink">
                {tempPassword}
              </p>
              <p className="mt-1 text-xs text-teal-700/80">
                Provider must change this on first login. Share it securely.
              </p>
              {emailSent === true ? (
                <p className="mt-2 text-xs font-medium text-teal-700">
                  📧 Welcome email sent to {application.email}
                </p>
              ) : emailSent === false ? (
                <p className="mt-2 text-xs text-ink-faint">
                  Email sending not configured — copy the password manually.
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={copyPassword}
                className={`${BTN_BASE} bg-white text-ink-soft ring-1 ring-ink/10 hover:bg-paper-warm`}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-teal-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? "Copied" : "Copy"}
              </button>
              <button
                type="button"
                onClick={regenerateTempPassword}
                disabled={busy !== null}
                className={`${BTN_BASE} bg-white text-ink-soft ring-1 ring-ink/10 hover:bg-paper-warm`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
