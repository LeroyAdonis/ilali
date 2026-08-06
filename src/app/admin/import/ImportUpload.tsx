"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle,
  ClipboardPaste,
  Download,
  FileSpreadsheet,
  Loader2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import type {
  BatchApproveResult,
  ImportCommitResult,
  ImportPreview,
  PreviewRow,
} from "@/lib/import/types";
import { BatchApproveModal } from "@/components/admin/BatchApproveModal";

const TEMPLATE_HEADERS =
  "name,email,phone,activityType,location,ageMin,ageMax,priceValue,description";

const ACCEPTED_EXTENSIONS = ".csv,.xlsx,.xls";

const BTN_BASE =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600";

const STATUS_CHIP: Record<PreviewRow["status"], string> = {
  valid: "bg-teal-100 text-teal-700 border-teal-300",
  warning: "bg-amber-100 text-amber-700 border-amber-300",
  error: "bg-red-100 text-red-700 border-red-300",
};

const STATUS_LABEL: Record<PreviewRow["status"], string> = {
  valid: "Valid",
  warning: "Warning",
  error: "Error",
};

export default function ImportUpload() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<"file" | "text">("file");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [text, setText] = useState("");

  const [busy, setBusy] = useState<"preview" | "commit" | "approve" | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commitResult, setCommitResult] = useState<ImportCommitResult | null>(null);
  const [batchResult, setBatchResult] = useState<BatchApproveResult | null>(null);

  function downloadTemplate() {
    const csv =
      TEMPLATE_HEADERS +
      "\n" +
      'Assitej Football Academy,coach@assitej.co.za,+27 82 123 4567,sports,Khayelitsha,6,16,150,"Saturday morning football development programme"\n';
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ilali-provider-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function runPreview() {
    setError(null);
    setPreview(null);
    setCommitResult(null);

    if (mode === "file") {
      if (!file) {
        setError("Choose a CSV, XLSX or XLS file to preview.");
        return;
      }
    } else if (text.trim() === "") {
      setError("Paste tab- or comma-separated rows to preview.");
      return;
    }

    setBusy("preview");
    try {
      const res =
        mode === "file"
          ? await fetch("/api/admin/import/preview", {
              method: "POST",
              body: (() => {
                const fd = new FormData();
                fd.append("file", file as File);
                return fd;
              })(),
            })
          : await fetch("/api/admin/import/preview", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text }),
            });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Preview failed. Please try again.");
        return;
      }
      setPreview(body as ImportPreview);
    } catch {
      setError("Preview failed. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function commit() {
    if (!preview) return;
    const importable = preview.rows.filter((r) => r.status !== "error");
    setError(null);
    setBusy("commit");
    try {
      const res = await fetch("/api/admin/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: mode === "file" && file ? file.name : "pasted text",
          rows: importable.map((r) => r.data),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Commit failed. Please try again.");
        return;
      }
      setCommitResult(body as ImportCommitResult);
      setPreview(null);
      setFile(null);
      setText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch {
      setError("Commit failed. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function approveAllPending() {
    if (!commitResult) return;
    setError(null);
    setBusy("approve");
    try {
      const res = await fetch("/api/admin/applications/batch-approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importBatchId: commitResult.batchId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error || "Batch approve failed. Please try again.");
        return;
      }
      setBatchResult(body as BatchApproveResult);
      router.refresh();
    } catch {
      setError("Batch approve failed. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const counts = preview
    ? [
        { label: "Total rows", value: preview.totalRows, cls: "text-ink" },
        { label: "Valid", value: preview.validRows, cls: "text-teal-700" },
        { label: "Warnings", value: preview.warningRows, cls: "text-amber-700" },
        { label: "Errors", value: preview.errorRows, cls: "text-red-700" },
      ]
    : [];

  return (
    <div>
      {/* ── Intake card ── */}
      <div className="rounded-xl border border-ink/10 bg-white p-6">
        {/* Format tabs */}
        <div className="mb-5 flex gap-2" role="tablist" aria-label="Import format">
          {(
            [
              { value: "file", label: "Upload file", icon: UploadCloud },
              { value: "text", label: "Paste text", icon: ClipboardPaste },
            ] as const
          ).map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={mode === t.value}
              onClick={() => {
                setMode(t.value);
                setError(null);
              }}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600 ${
                mode === t.value
                  ? "border-ilali-600 bg-ilali-50 text-ilali-700"
                  : "border-ink/10 text-ink-soft hover:text-ink"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="mb-5">
          <p className="text-sm text-ink-soft">
            Expected headers:{" "}
            <code className="rounded bg-paper-warm px-1.5 py-0.5 text-xs text-ink">
              name, email, phone, activityType, location, ageMin, ageMax,
              priceValue, description
            </code>
          </p>
          <button
            type="button"
            onClick={downloadTemplate}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-ilali-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ilali-600"
          >
            <Download className="h-4 w-4" />
            Download CSV template
          </button>
        </div>

        {mode === "file" ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const dropped = e.dataTransfer.files?.[0];
              if (dropped) setFile(dropped);
            }}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragOver
                ? "border-ilali-600 bg-ilali-50"
                : "border-ink/15 bg-paper-warm/50"
            }`}
          >
            <FileSpreadsheet className="h-10 w-10 text-ink-faint" />
            <p className="mt-3 text-sm font-medium text-ink">
              {file ? file.name : "Drag & drop a file here, or browse"}
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              .csv, .xlsx or .xls · max 5MB · max 500 rows
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              className="sr-only"
              id="import-file-input"
              onChange={(e) => {
                const picked = e.target.files?.[0];
                if (picked) setFile(picked);
              }}
            />
            <label
              htmlFor="import-file-input"
              className={`${BTN_BASE} mt-4 cursor-pointer border border-ink/10 bg-white text-ink-soft hover:bg-paper-warm hover:text-ink`}
            >
              <UploadCloud className="h-4 w-4" />
              {file ? "Choose a different file" : "Browse files"}
            </label>
            {file && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="mt-2 text-xs font-medium text-red-600 underline-offset-4 hover:underline"
              >
                Remove file
              </button>
            )}
          </div>
        ) : (
          <div>
            <label
              htmlFor="import-textarea"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              Pasted rows
            </label>
            <textarea
              id="import-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder={
                "name\temail\tphone\tactivityType\tlocation\tageMin\tageMax\tpriceValue\tdescription\nAssitej Football Academy\tcoach@assitej.co.za\t+27 82 123 4567\tsports\tKhayelitsha\t6\t16\t150\tSaturday morning football development programme"
              }
              className="w-full rounded-lg border border-ink/10 bg-paper-warm/50 px-3 py-2.5 font-mono text-sm text-ink placeholder:text-ink-faint focus:border-ilali-600 focus:outline-2 focus:outline-ilali-600"
            />
            <p className="mt-1.5 text-xs text-ink-faint">
              Tab- or comma-separated, header row first, quoted values allowed ·
              max 500 rows
            </p>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={runPreview}
            disabled={busy !== null}
            className={`${BTN_BASE} bg-ilali-600 text-white hover:bg-ilali-700 active:bg-ilali-800`}
          >
            {busy === "preview" && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy === "preview" ? "Previewing…" : "Preview rows"}
          </button>
        </div>
      </div>

      {/* ── Commit success panel ── */}
      {commitResult && (
        <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-6">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-teal-700" />
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-ink">
                Import complete
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {commitResult.imported} application
                {commitResult.imported === 1 ? "" : "s"} added to the queue
                {commitResult.skipped > 0 &&
                  ` · ${commitResult.skipped} skipped (see import history)`}
                . Nothing was auto-approved.
              </p>
              <button
                type="button"
                onClick={approveAllPending}
                disabled={busy !== null || commitResult.imported === 0}
                className={`${BTN_BASE} mt-4 bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900`}
              >
                {busy === "approve" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {busy === "approve"
                  ? "Approving…"
                  : `Approve all pending (${commitResult.imported})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Preview ── */}
      {preview && (
        <div className="mt-6">
          {/* Counts summary */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {counts.map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-ink/10 bg-white px-4 py-3"
              >
                <p className={`text-2xl font-bold tabular-nums ${c.cls}`}>
                  {c.value}
                </p>
                <p className="text-xs font-medium text-ink-faint">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Per-row table — scrolls inside its container, page never does */}
          <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">Import preview rows</caption>
              <thead>
                <tr className="border-b border-ink/10 bg-paper-warm/60 text-xs uppercase tracking-wide text-ink-faint">
                  <th scope="col" className="px-4 py-3 font-semibold">
                    #
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Name
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Activity
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr
                    key={r.row}
                    className="border-b border-ink/5 align-top last:border-b-0"
                  >
                    <td className="px-4 py-3 tabular-nums text-ink-faint">
                      {r.row}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">{r.name}</td>
                    <td className="break-all px-4 py-3 text-ink-soft">
                      {r.email}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {r.activityType ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_CHIP[r.status]}`}
                      >
                        {r.status === "valid" && (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        {r.status === "warning" && (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {r.status === "error" && <XCircle className="h-3 w-3" />}
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.errors.length > 0 && (
                        <ul className="list-disc space-y-0.5 pl-4 text-xs text-red-700">
                          {r.errors.map((e) => (
                            <li key={e}>{e}</li>
                          ))}
                        </ul>
                      )}
                      {r.warnings.length > 0 && (
                        <ul className="list-disc space-y-0.5 pl-4 text-xs text-amber-700">
                          {r.warnings.map((w) => (
                            <li key={w}>{w}</li>
                          ))}
                        </ul>
                      )}
                      {r.errors.length === 0 && r.warnings.length === 0 && (
                        <span className="text-xs text-teal-700">
                          Ready to import
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={commit}
              disabled={busy !== null || preview.validRows + preview.warningRows === 0}
              className={`${BTN_BASE} bg-ilali-600 text-white hover:bg-ilali-700 active:bg-ilali-800`}
            >
              {busy === "commit" && <Loader2 className="h-4 w-4 animate-spin" />}
              {busy === "commit"
                ? "Importing…"
                : `Import ${preview.validRows + preview.warningRows} valid row${
                    preview.validRows + preview.warningRows === 1 ? "" : "s"
                  }`}
            </button>
            <p className="text-xs text-ink-faint">
              Rows with errors are excluded — fix the file and re-preview.
            </p>
          </div>
        </div>
      )}

      <BatchApproveModal
        result={batchResult}
        onClose={() => setBatchResult(null)}
      />
    </div>
  );
}
