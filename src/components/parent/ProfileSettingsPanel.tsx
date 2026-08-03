"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Settings, X, Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { SUBURB_COORDS } from "@/lib/map/suburbs";

// Alphabetically sorted suburb names for the autocomplete
const SUBURBS = Object.keys(SUBURB_COORDS).sort();

interface NotificationPrefs {
  notifyNewProviders: boolean;
  notifyCommunity: boolean;
  notifyRewards: boolean;
}

export default function ProfileSettingsPanel() {
  const { data: session, isPending } = useSession();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [suburb, setSuburb] = useState("");
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    notifyNewProviders: true,
    notifyCommunity: true,
    notifyRewards: true,
  });
  const [suburbSuggestions, setSuburbSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const suburbRef = useRef<HTMLDivElement>(null);

  // Pre-fill from session when available
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? "");
      setSuburb((session.user as Record<string, unknown>).suburb as string ?? "");
    }
  }, [session]);

  // Fetch notification preferences when panel opens
  const fetchPrefs = useCallback(async () => {
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setPrefs({
            notifyNewProviders: data.preferences.notifyNewProviders ?? true,
            notifyCommunity: data.preferences.notifyCommunity ?? true,
            notifyRewards: data.preferences.notifyRewards ?? true,
          });
        }
      }
    } catch {
      // Use defaults
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchPrefs();
    }
  }, [open, fetchPrefs]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Suburb autocomplete
  const handleSuburbChange = (value: string) => {
    setSuburb(value);
    if (value.trim().length > 0) {
      const matches = SUBURBS.filter((s) =>
        s.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setSuburbSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuburbSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Close suburb suggestions on outside click
  useEffect(() => {
    if (!showSuggestions) return;
    const handleClick = (e: MouseEvent) => {
      if (suburbRef.current && !suburbRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSuggestions]);

  const togglePref = (key: keyof NotificationPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    setFeedback(null);

    try {
      const body: Record<string, unknown> = {};

      if (name.trim() !== (session.user.name ?? "")) {
        body.name = name.trim();
      }
      if (suburb.trim() !== ((session.user as Record<string, unknown>).suburb as string ?? "")) {
        body.suburb = suburb.trim();
      }
      body.notifyNewProviders = prefs.notifyNewProviders;
      body.notifyCommunity = prefs.notifyCommunity;
      body.notifyRewards = prefs.notifyRewards;

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to save" }));
        throw new Error(err.error ?? "Failed to save");
      }

      setFeedback({ type: "success", message: "Saved ✓" });
      setTimeout(() => setOpen(false), 1000);
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "An unexpected error occurred",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isPending || !session) return null;

  const toggleStyles =
    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2";

  const toggleKnob =
    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out";

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open profile settings"
        className="inline-flex items-center justify-center rounded-xl border border-ink/10 bg-white p-2 text-ink-soft transition-colors hover:bg-paper-warm hover:text-ink"
      >
        <Settings className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-sm transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Panel: Desktop slide-out, Mobile bottom sheet */}
      <div
        ref={panelRef}
        className={`fixed z-50 bg-white shadow-lg transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0 md:translate-x-0 translate-y-0" : "translate-x-full md:translate-x-full translate-y-full"
        } ${
          // Mobile: bottom sheet
          "inset-x-0 bottom-0 rounded-t-2xl max-h-[80vh] overflow-y-auto md:overflow-y-auto"
        } ${
          // Desktop: slide-out from right
          "md:inset-y-0 md:left-auto md:right-0 md:top-0 md:h-full md:w-80 md:max-h-none md:rounded-none md:rounded-l-2xl"
        }`}
        role="dialog"
        aria-label="Profile settings"
        aria-modal="true"
      >
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          aria-label="Close settings"
          className="absolute right-3 top-3 rounded-lg p-1.5 text-ink-faint hover:bg-paper-warm hover:text-ink transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 pt-12 md:pt-6">
          {/* Heading */}
          <h3 className="font-display text-lg font-semibold text-ink mb-6">
            Profile Settings
          </h3>

          {/* Display Name */}
          <label className="block mb-4">
            <span className="text-sm font-medium text-ink-soft">Display name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 transition-colors"
              placeholder="Your name"
            />
          </label>

          {/* Suburb */}
          <label className="block mb-6">
            <span className="text-sm font-medium text-ink-soft">Suburb</span>
            <div ref={suburbRef} className="relative mt-1.5">
              <input
                type="text"
                value={suburb}
                onChange={(e) => handleSuburbChange(e.target.value)}
                onFocus={() => {
                  if (suburb.trim().length > 0) {
                    const matches = SUBURBS.filter((s) =>
                      s.toLowerCase().includes(suburb.toLowerCase())
                    ).slice(0, 5);
                    setSuburbSuggestions(matches);
                    setShowSuggestions(matches.length > 0);
                  }
                }}
                className="block w-full rounded-xl border border-ink/10 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 transition-colors"
                placeholder="e.g. Rondebosch"
              />
              {showSuggestions && suburbSuggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full rounded-xl border border-ink/10 bg-white shadow-lg max-h-40 overflow-y-auto py-1">
                  {suburbSuggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => {
                          setSuburb(s);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-sm text-ink hover:bg-paper-warm transition-colors capitalize"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </label>

          {/* Notification Preferences */}
          <h4 className="font-display text-base font-semibold text-ink mb-3">
            Notification Preferences
          </h4>

          <div className="space-y-3 mb-6">
            {/* Notify New Providers */}
            <label className="flex items-center justify-between gap-3 cursor-pointer group">
              <span className="text-sm text-ink-soft group-hover:text-ink transition-colors">
                New providers in your area
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.notifyNewProviders}
                aria-label="Toggle new providers notification"
                onClick={() => togglePref("notifyNewProviders")}
                className={`${toggleStyles} ${
                  prefs.notifyNewProviders ? "bg-teal" : "bg-ink/15"
                }`}
              >
                <span
                  className={`${toggleKnob} ${
                    prefs.notifyNewProviders ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </label>

            {/* Notify Community */}
            <label className="flex items-center justify-between gap-3 cursor-pointer group">
              <span className="text-sm text-ink-soft group-hover:text-ink transition-colors">
                Community updates
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.notifyCommunity}
                aria-label="Toggle community updates notification"
                onClick={() => togglePref("notifyCommunity")}
                className={`${toggleStyles} ${
                  prefs.notifyCommunity ? "bg-teal" : "bg-ink/15"
                }`}
              >
                <span
                  className={`${toggleKnob} ${
                    prefs.notifyCommunity ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </label>

            {/* Notify Rewards */}
            <label className="flex items-center justify-between gap-3 cursor-pointer group">
              <span className="text-sm text-ink-soft group-hover:text-ink transition-colors">
                Rewards &amp; points
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.notifyRewards}
                aria-label="Toggle rewards & points notification"
                onClick={() => togglePref("notifyRewards")}
                className={`${toggleStyles} ${
                  prefs.notifyRewards ? "bg-teal" : "bg-ink/15"
                }`}
              >
                <span
                  className={`${toggleKnob} ${
                    prefs.notifyRewards ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`mb-4 rounded-lg px-3 py-2 text-sm font-medium ${
                feedback.type === "success"
                  ? "bg-teal-50 text-teal-deep-2"
                  : "bg-red-50 text-red-700"
              }`}
              role="alert"
            >
              {feedback.message}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-[10px] bg-gold px-6 py-3 text-[15px] font-semibold text-[#3A2402] transition-colors hover:bg-gold-deep disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}
