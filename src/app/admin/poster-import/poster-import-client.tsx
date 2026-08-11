"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  Sparkles,
  Globe,
  Check,
  X,
  MessageCircle,
  ImageIcon,
  Loader2,
  History,
} from "lucide-react";
import type { PosterExtract } from "@/lib/ai/extract-poster";
import type { EnrichmentSuggestion } from "@/lib/web/enrich";
import { buildUploadFormData } from "@/lib/upload-compress";

interface RecentImport {
  id: string;
  status: string;
  contactedAt: string | null;
  outreachMethod: string | null;
  applicationId: string | null;
  createdAt: string;
  extractedJson: { name?: string } | null;
}

interface FormState {
  name: string;
  activityType: string;
  description: string;
  location: string;
  ageMin: string;
  ageMax: string;
  priceValue: string;
  phone: string;
  website: string;
  email: string;
  venue: string;
  address: string;
  dateStart: string;
  dateEnd: string;
  timeStart: string;
  timeEnd: string;
  dayOfWeek: string;
  contactName: string;
  bookingInfo: string;
  additionalInfo: string;
  logoPath: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  activityType: "",
  description: "",
  location: "",
  ageMin: "",
  ageMax: "",
  priceValue: "",
  phone: "",
  website: "",
  email: "",
  venue: "",
  address: "",
  dateStart: "",
  dateEnd: "",
  timeStart: "",
  timeEnd: "",
  dayOfWeek: "",
  contactName: "",
  bookingInfo: "",
  additionalInfo: "",
  logoPath: "",
};

type Phase =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "extracting" }
  | { kind: "review" }
  | { kind: "saving" };

export default function PosterImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [posterImportId, setPosterImportId] = useState<string | null>(null);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [suggestions, setSuggestions] = useState<EnrichmentSuggestion[]>([]);
  const [rejectedSuggestion, setRejectedSuggestion] = useState<Set<number>>(new Set());
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [enrichMessage, setEnrichMessage] = useState<string | null>(null);
  const [notifyResult, setNotifyResult] = useState<string | null>(null);
  const [recent, setRecent] = useState<RecentImport[]>([]);
  const [showRecent, setShowRecent] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [logoAutoDetected, setLogoAutoDetected] = useState(false);

  const loadRecent = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/poster-imports");
      if (res.ok) setRecent((await res.json()) as RecentImport[]);
    } catch {
      // non-fatal
    }
  }, []);

  /**
   * Auto-crop the logo from the poster using the AI's bounding box.
   * logoBox is in % of poster dimensions — convert to pixels, draw the region
   * onto a canvas, export as a PNG data URL (logoPath). Falls back silently if
   * the browser can't decode the image or the box is invalid.
   */
  const cropLogoFromPoster = useCallback(
    (logoBox: NonNullable<PosterExtract["logoBox"]>): Promise<string | null> =>
      new Promise((resolve) => {
        if (!posterUrl) return resolve(null);
        const img = new Image();
        img.onload = () => {
          try {
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            const x = Math.max(0, Math.round((logoBox.x / 100) * w));
            const y = Math.max(0, Math.round((logoBox.y / 100) * h));
            const cw = Math.max(1, Math.min(w - x, Math.round((logoBox.width / 100) * w)));
            const ch = Math.max(1, Math.min(h - y, Math.round((logoBox.height / 100) * h)));
            const canvas = document.createElement("canvas");
            canvas.width = cw;
            canvas.height = ch;
            const ctx = canvas.getContext("2d");
            if (!ctx) return resolve(null);
            ctx.drawImage(img, x, y, cw, ch, 0, 0, cw, ch);
            resolve(canvas.toDataURL("image/png"));
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = posterUrl;
      }),
    [posterUrl]
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const localUrl = URL.createObjectURL(file);
      setPosterUrl(localUrl);
      setPhase({ kind: "uploading" });
      setExtractionError(null);
      setSuggestions([]);
      setRejectedSuggestion(new Set());
      setForm(EMPTY_FORM);
      setNotifyResult(null);
      setEnrichMessage(null);
      setLogoAutoDetected(false);

      const { formData, usedCompression } = await buildUploadFormData(file);

      try {
        const res = await fetch("/api/admin/poster-import", {
          method: "POST",
          body: formData,
        });

        // Vercel rejects oversized bodies (413, text/plain) BEFORE the route
        // runs — res.json() would throw on that. Check status first, then
        // parse defensively so a non-JSON error page surfaces a useful
        // message instead of a bogus "network error".
        let data: Record<string, unknown> | null = null;
        try {
          data = (await res.json()) as Record<string, unknown>;
        } catch {
          data = null;
        }

        if (!res.ok) {
          const msg =
            typeof data?.error === "string"
              ? data.error
              : res.status === 413
                ? "That image is too large. We compressed it, but it still exceeded the upload limit — try a smaller photo or a screenshot of the poster."
                : `Upload failed (HTTP ${res.status}).`;
          setExtractionError(msg);
          setPhase({ kind: "review" });
          return;
        }
        setPosterImportId((data?.posterImportId as string | undefined) ?? null);
        if (data?.status === "extraction_failed") {
          setExtractionError(
            (data.message as string | undefined) ??
              "AI extraction unavailable — fill in manually."
          );
          setPhase({ kind: "review" });
          return;
        }

        const extracted = data?.extracted as PosterExtract | undefined;
        if (!extracted) {
          setExtractionError("No extraction data returned — try again.");
          setPhase({ kind: "review" });
          return;
        }
        setForm({
          name: extracted.name ?? "",
          activityType: extracted.category ?? "",
          description: extracted.description ?? "",
          location: extracted.location ?? "",
          ageMin: extracted.ageMin != null ? String(extracted.ageMin) : "",
          ageMax: extracted.ageMax != null ? String(extracted.ageMax) : "",
          priceValue: extracted.priceValue != null ? String(extracted.priceValue) : "",
          phone: extracted.phone ?? "",
          website: extracted.website ?? "",
          email: "",
          venue: extracted.venue ?? "",
          address: extracted.address ?? "",
          dateStart: extracted.dateStart ?? "",
          dateEnd: extracted.dateEnd ?? "",
          timeStart: extracted.timeStart ?? "",
          timeEnd: extracted.timeEnd ?? "",
          dayOfWeek: extracted.dayOfWeek ?? "",
          contactName: extracted.contactName ?? "",
          bookingInfo: extracted.bookingInfo ?? "",
          additionalInfo: extracted.additionalInfo ?? "",
          logoPath: "",
        });
        // Auto-crop the logo from the poster if AI located one.
        if (extracted.logoBox) {
          const cropped = await cropLogoFromPoster(extracted.logoBox);
          if (cropped) {
            setForm((f) => ({ ...f, logoPath: cropped }));
            setLogoAutoDetected(true);
          }
        }
        setPhase({ kind: "review" });
      } catch {
        setExtractionError("Network error while extracting the poster.");
        setPhase({ kind: "review" });
      }
    },
    []
  );

  const runEnrich = useCallback(async () => {
    if (!posterImportId) return;
    setBusyAction("enrich");
    setEnrichMessage(null);
    try {
      const res = await fetch(
        `/api/admin/poster-import/${posterImportId}/enrich`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
      );
      const data = await res.json();
      if (!res.ok) {
        setEnrichMessage(data.error ?? "Web search failed.");
        setSuggestions([]);
        setRejectedSuggestion(new Set());
        return;
      }
      const found = (data.suggestions ?? []) as EnrichmentSuggestion[];
      setSuggestions(found);
      setRejectedSuggestion(new Set());
      setEnrichMessage(
        found.length === 0
          ? "No extra info found online for this provider — the web search returned nothing usable."
          : null
      );
    } catch {
      setEnrichMessage("Web search failed — check the connection and try again.");
    } finally {
      setBusyAction(null);
    }
  }, [posterImportId]);

  const applySuggestion = useCallback(
    (index: number, suggestion: EnrichmentSuggestion) => {
      setRejectedSuggestion((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
      if (suggestion.field === "website") setForm((f) => ({ ...f, website: suggestion.value }));
      else if (suggestion.field === "phone") setForm((f) => ({ ...f, phone: suggestion.value }));
      else if (suggestion.field === "description") setForm((f) => ({ ...f, description: suggestion.value }));
      else if (suggestion.field === "priceValue") setForm((f) => ({ ...f, priceValue: suggestion.value }));
      else if (suggestion.field === "instagram" || suggestion.field === "facebook") {
        setForm((f) => ({ ...f, website: f.website || suggestion.value }));
      }
    },
    []
  );

  const rejectSuggestion = useCallback((index: number) => {
    setRejectedSuggestion((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
  }, []);

  const saveApplication = useCallback(async () => {
    if (!posterImportId) return;
    setBusyAction("save");
    try {
      const res = await fetch(
        `/api/admin/poster-import/${posterImportId}/save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: {
              name: form.name,
              activityType: form.activityType,
              description: form.description,
              location: form.location,
              ageMin: form.ageMin ? Number(form.ageMin) : null,
              ageMax: form.ageMax ? Number(form.ageMax) : null,
              priceValue: form.priceValue ? Number(form.priceValue) : null,
              phone: form.phone,
              email: form.email,
              venue: form.venue,
              address: form.address,
              dateStart: form.dateStart,
              dateEnd: form.dateEnd,
              timeStart: form.timeStart,
              timeEnd: form.timeEnd,
              dayOfWeek: form.dayOfWeek,
              contactName: form.contactName,
              bookingInfo: form.bookingInfo,
              additionalInfo: form.additionalInfo,
              logoPath: form.logoPath,
            },
          }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setApplicationId(data.applicationId);
        setNotifyResult(`✅ Application saved — you can now notify the provider.`);
      } else {
        setExtractionError(data.error ?? "Save failed.");
      }
    } catch {
      setExtractionError("Network error while saving.");
    } finally {
      setBusyAction(null);
    }
  }, [posterImportId, form]);

  const notifyProvider = useCallback(async () => {
    if (!applicationId) return;
    setBusyAction("notify");
    try {
      const res = await fetch(
        `/api/admin/applications/${applicationId}/notify`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }
      );
      const data = await res.json();
      if (res.ok && data.waUrl) {
        setNotifyResult("✅ WhatsApp message ready — open it and press send.");
        window.open(data.waUrl, "_blank", "noopener,noreferrer");
      } else if (res.ok && data.method === "email-draft") {
        setNotifyResult("📧 Email draft ready — copy and send manually.");
      } else {
        setExtractionError(data.error ?? "Notify failed.");
      }
    } catch {
      setExtractionError("Network error while notifying.");
    } finally {
      setBusyAction(null);
    }
  }, [applicationId]);

  const set = useCallback(
    (key: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value })),
    []
  );

  const handleLogo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setExtractionError("Logo is too large — keep it under 2MB.");
      return;
    }
    setExtractionError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, logoPath: String(reader.result) }));
      setLogoAutoDetected(false);
    };
    reader.readAsDataURL(file);
  }, []);

  const inputCls =
    "mt-1 block w-full rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ilali-500 focus:outline-none focus:ring-2 focus:ring-ilali-200";
  const labelCls = "block text-xs font-semibold uppercase tracking-wide text-ink-soft";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Poster Import</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Drop a poster from the Fun with Kids group — AI reads it, the web fills the gaps, you approve.
          </p>
        </div>
        <button
          onClick={() => {
            setShowRecent((s) => !s);
            if (!showRecent) void loadRecent();
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm font-medium text-ink-soft hover:bg-paper-warm hover:text-ink transition-colors"
        >
          <History className="h-4 w-4" />
          Recent imports
        </button>
      </div>

      {showRecent && (
        <div className="rounded-xl border border-ink/10 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-ink">Recent poster imports</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-ink-soft">No imports yet.</p>
          ) : (
            <ul className="divide-y divide-ink/5">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-ink">{r.extractedJson?.name ?? "Untitled"}</span>
                  <span className="flex items-center gap-2">
                    <span className="rounded-full bg-paper-warm px-2 py-0.5 text-xs font-medium text-ink-soft capitalize">
                      {r.status}
                    </span>
                    {r.contactedAt && (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        contacted
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Dropzone */}
      <div
        className="rounded-xl border-2 border-dashed border-ilali-300 bg-white p-8 text-center transition-colors hover:border-ilali-400 hover:bg-ilali-50/40"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex flex-col items-center gap-2 text-ilali-600 hover:text-ilali-700 transition-colors"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ilali-100">
            <Upload className="h-6 w-6" />
          </span>
          <span className="text-sm font-medium">
            {phase.kind === "idle" ? "Drop a poster here, or click to browse" : "Upload a different poster"}
          </span>
          <span className="text-xs text-ink-faint">JPG · PNG · WebP — max 10MB</span>
        </button>
      </div>

      {(phase.kind === "uploading" || phase.kind === "extracting") && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-ink/10 bg-white p-6 text-sm text-ink-soft shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-ilali-600" />
          {phase.kind === "uploading" ? "Uploading poster…" : "AI is reading the poster…"}
        </div>
      )}

      {/* Two-pane review desk */}
      {phase.kind === "review" && posterUrl && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          {/* Left: poster */}
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-ink/10 bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={posterUrl}
                alt="Uploaded activity poster"
                className="h-auto w-full object-contain"
              />
            </div>
            {extractionError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                {extractionError}
              </div>
            )}
          </div>

          {/* Right: editable form */}
          <div className="space-y-4">
            <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-ilali-600" />
                <h2 className="font-display text-lg font-semibold text-ink">
                  Profile review
                </h2>
                <span className="ml-auto rounded-full bg-paper-warm px-2 py-0.5 text-xs font-medium text-ink-soft">
                  {suggestions.length > 0 ? "AI + web" : "AI extracted"}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="f-name">Activity / business name</label>
                  <input id="f-name" className={inputCls} value={form.name} onChange={set("name")} placeholder="e.g. Little Stars Dance" />
                </div>

                <div>
                  <label className={labelCls} htmlFor="f-type">Category</label>
                  <select id="f-type" className={inputCls} value={form.activityType} onChange={set("activityType")}>
                    <option value="">Select…</option>
                    {["Arts & Culture", "Sports", "Music Lessons", "Education & Tutoring", "Holiday Programs", "Dance & Movement", "Emotional Intelligence", "Other"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelCls} htmlFor="f-location">Location / suburb</label>
                  <input id="f-location" className={inputCls} value={form.location} onChange={set("location")} placeholder="e.g. Claremont" />
                </div>

                <div>
                  <label className={labelCls} htmlFor="f-age-min">Age min</label>
                  <input id="f-age-min" type="number" min="0" max="18" className={inputCls} value={form.ageMin} onChange={set("ageMin")} />
                </div>

                <div>
                  <label className={labelCls} htmlFor="f-age-max">Age max</label>
                  <input id="f-age-max" type="number" min="0" max="18" className={inputCls} value={form.ageMax} onChange={set("ageMax")} />
                </div>

                <div>
                  <label className={labelCls} htmlFor="f-price">Price (R / session)</label>
                  <input id="f-price" type="number" min="0" className={inputCls} value={form.priceValue} onChange={set("priceValue")} placeholder="e.g. 150" />
                </div>

                <div>
                  <label className={labelCls} htmlFor="f-phone">Phone / WhatsApp</label>
                  <input id="f-phone" className={inputCls} value={form.phone} onChange={set("phone")} placeholder="+27XXXXXXXXX" />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="f-website">Website / socials</label>
                  <input id="f-website" className={inputCls} value={form.website} onChange={set("website")} placeholder="https://…" />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="f-email">Email (optional — placeholder used if blank)</label>
                  <input id="f-email" type="email" className={inputCls} value={form.email} onChange={set("email")} placeholder="provider@example.com" />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="f-desc">Description</label>
                  <textarea id="f-desc" rows={3} className={inputCls} value={form.description} onChange={set("description")} placeholder="What makes this activity special?" />
                </div>

                <div>
                  <label className={labelCls} htmlFor="f-venue">Venue</label>
                  <input id="f-venue" className={inputCls} value={form.venue} onChange={set("venue")} placeholder="e.g. Sea Point Community Hall" />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="f-address">Address</label>
                  <input id="f-address" className={inputCls} value={form.address} onChange={set("address")} placeholder="Full street address" />
                </div>

                <div>
                  <label className={labelCls} htmlFor="f-date-start">Date start</label>
                  <input id="f-date-start" className={inputCls} value={form.dateStart} onChange={set("dateStart")} placeholder="e.g. 12 July" />
                </div>

                <div>
                  <label className={labelCls} htmlFor="f-date-end">Date end</label>
                  <input id="f-date-end" className={inputCls} value={form.dateEnd} onChange={set("dateEnd")} placeholder="e.g. 14 July" />
                </div>

                <div>
                  <label className={labelCls} htmlFor="f-time-start">Time start</label>
                  <input id="f-time-start" className={inputCls} value={form.timeStart} onChange={set("timeStart")} placeholder="e.g. 14:00" />
                </div>

                <div>
                  <label className={labelCls} htmlFor="f-time-end">Time end</label>
                  <input id="f-time-end" className={inputCls} value={form.timeEnd} onChange={set("timeEnd")} placeholder="e.g. 15:30" />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="f-day">Day of week</label>
                  <input id="f-day" className={inputCls} value={form.dayOfWeek} onChange={set("dayOfWeek")} placeholder="e.g. Mon, Wed, Fri" />
                </div>

                <div>
                  <label className={labelCls} htmlFor="f-contact-name">Contact name</label>
                  <input id="f-contact-name" className={inputCls} value={form.contactName} onChange={set("contactName")} placeholder="Person to contact" />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="f-booking">Booking information</label>
                  <input id="f-booking" className={inputCls} value={form.bookingInfo} onChange={set("bookingInfo")} placeholder="e.g. WhatsApp to book" />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="f-additional">Additional info (all poster text)</label>
                  <textarea id="f-additional" rows={3} className={inputCls} value={form.additionalInfo} onChange={set("additionalInfo")} placeholder="Any other text on the poster not covered above" />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls} htmlFor="f-logo">Logo (optional)</label>
                  <input id="f-logo" type="file" accept="image/jpeg,image/png,image/webp" className={inputCls} onChange={handleLogo} />
                  {form.logoPath && (
                    <div className="mt-2 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.logoPath} alt="Provider logo" className="h-14 w-14 rounded-lg border border-ink/10 object-contain" />
                      <span className="text-xs text-ink-faint">
                        {logoAutoDetected
                          ? "Logo detected on the poster and cropped automatically — upload your own to replace it."
                          : "Logo attached — saved with the application."}
                      </span>
                    </div>
                  )}
                  {!form.logoPath && (
                    <p className="mt-1 text-xs text-ink-faint">
                      No logo found on the poster — upload one if you have it.
                    </p>
                  )}
                </div>
              </div>

              {/* Enrichment suggestions */}
              <div className="mt-5 border-t border-ink/5 pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Globe className="h-4 w-4 text-ilali-600" />
                    Web enrichment
                  </h3>
                  <button
                    onClick={() => void runEnrich()}
                    disabled={busyAction === "enrich"}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-ilali-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ilali-700 transition-colors disabled:opacity-50"
                  >
                    {busyAction === "enrich" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Globe className="h-3.5 w-3.5" />
                    )}
                    Search the web
                  </button>
                </div>

                {enrichMessage && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {enrichMessage}
                  </p>
                )}

                {suggestions.length === 0 ? (
                  <p className="mt-3 text-xs text-ink-faint">
                    Find the provider&apos;s website, socials, and pricing to fill gaps the poster left blank.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {suggestions.map((s, i) =>
                      rejectedSuggestion.has(i) ? null : (
                        <li key={`${s.field}-${i}`} className="flex items-start justify-between gap-3 rounded-lg bg-paper-warm p-3">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft capitalize">{s.field}</p>
                            <p className="mt-0.5 truncate text-sm text-ink">{s.value}</p>
                            {s.sourceUrl && (
                              <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-0.5 block truncate text-xs text-ilali-600 hover:underline">
                                {s.sourceUrl}
                              </a>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <button
                              onClick={() => applySuggestion(i, s)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                              aria-label={`Apply ${s.field}`}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => rejectSuggestion(i)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              aria-label={`Reject ${s.field}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      )
                    )}
                  </ul>
                )}
              </div>

              {notifyResult && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                  {notifyResult}
                </div>
              )}

              {/* Sticky action bar */}
              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink/5 pt-4">
                <button
                  onClick={() => void saveApplication()}
                  disabled={busyAction !== null || !form.name || !form.activityType}
                  className="inline-flex items-center gap-2 rounded-full bg-ilali-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ilali-700 transition-colors disabled:opacity-50"
                >
                  {busyAction === "save" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save application
                </button>
                <button
                  onClick={() => void notifyProvider()}
                  disabled={busyAction !== null || !applicationId}
                  className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {busyAction === "notify" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4" />
                  )}
                  Notify provider
                </button>
                <Link
                  href="/admin/applications"
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-paper-warm transition-colors"
                >
                  <ImageIcon className="h-4 w-4" />
                  View applications
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
