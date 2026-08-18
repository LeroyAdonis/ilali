"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { CheckCircle2, Info } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import {
  clearIntent,
  getIntent,
  setIntent,
  type IntentPayload,
} from "@/lib/intent-cookie";
import { buildWhatsAppUrl } from "@/components/WhatsAppButton";
import IntentCaptureModal from "./IntentCaptureModal";
import WhoIsThisForModal from "./WhoIsThisForModal";

interface SavedContextValue {
  savedIds: Set<string>;
  isSaved: (providerId: string) => boolean;
  requestSave: (providerId: string, providerName: string) => void;
  requestNotify: (providerId: string, providerName: string) => void;
  requestContact: (providerId: string, providerName: string, phone: string) => void;
  toggleSave: (providerId: string, providerName: string) => Promise<void>;
}

const SavedContext = createContext<SavedContextValue | null>(null);

export function useSaved() {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSaved must be used within <SavedProvider>");
  return ctx;
}

interface ToastState {
  message: string;
  tone: "success" | "info";
}

export default function SavedProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const user = session?.user;

  // Pre-populate saved state from pending intent cookie so the SaveButton
  // immediately reflects "Saved" while the magic-link is being resolved.
  const initialSavedIds = (() => {
    const intent = getIntent();
    if (intent && (intent.action === "save" || intent.action === "notify")) {
      return new Set<string>([intent.providerId]);
    }
    return new Set<string>();
  })();

  const [savedIds, setSavedIds] = useState<Set<string>>(initialSavedIds);
  const [pendingIntent, setPendingIntent] = useState<IntentPayload | null>(null);
  const [contactReady, setContactReady] = useState<string | null>(null);
  const [showWhoFor, setShowWhoFor] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resumedRef = useRef(false);

  const showToast = useCallback((message: string, tone: ToastState["tone"] = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, tone });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // Load the signed-in parent's saved ids.
  const refreshSaved = useCallback(async () => {
    try {
      const res = await fetch("/api/saved", { cache: "no-store" });
      if (!res.ok) {
        console.warn(`[saved] refresh failed: ${res.status}`);
        return;
      }
      const data = await res.json();
      const ids: string[] = Array.isArray(data.ids)
        ? data.ids
        : (data.saved ?? []).map((s: { provider: { id: string } }) => s.provider.id);
      setSavedIds(new Set(ids));
    } catch (e) {
      // keep whatever we have; next save/unsave reconciles
      console.warn("[saved] refresh error:", e);
    }
  }, []);

  useEffect(() => {
    if (isPending) return;
    // Skip the mount refresh when an intent is waiting to resolve — its POST
    // is the fresher source of truth, and a race could wipe a just-saved heart.
    if (user && !getIntent()) Promise.resolve().then(() => refreshSaved());
  }, [isPending, user, refreshSaved]);

  const performSave = useCallback(
    async (providerId: string, notifyWhenOpen = false) => {
      const res = await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId, notifyWhenOpen }),
      });
      if (!res.ok) throw new Error("save failed");
      setSavedIds((prev) => new Set(prev).add(providerId));
    },
    []
  );

  const performUnsave = useCallback(async (providerId: string) => {
    const res = await fetch(`/api/saved?providerId=${encodeURIComponent(providerId)}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("unsave failed");
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(providerId);
      return next;
    });
  }, []);

  // ── Intent resume after magic-link sign-in ──
  const resolveIntent = useCallback(
    async (intent: IntentPayload) => {
      try {
        if (intent.action === "save" || intent.action === "notify") {
          await performSave(intent.providerId, intent.notifyWhenOpen ?? false);
          showToast(
            intent.action === "notify"
              ? `We'll let you know when booking opens for ${intent.providerName}.`
              : `Saved ${intent.providerName}.`
          );
          clearIntent();
        } else if (intent.action === "contact") {
          // window.open outside a user gesture gets popup-blocked — surface a
          // real link the parent can tap instead (P2 cleanup).
          const phone = intent.phone ?? process.env.NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER ?? "";
          setContactReady(
            buildWhatsAppUrl(phone, intent.providerName, process.env.NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER)
          );
          clearIntent();
        }
      } catch (e) {
        // Keep the intent cookie so the action isn't lost — it re-resolves on
        // the next mount. Never clear intent on failure.
        console.warn("[saved] intent resolution failed:", e);
        resumedRef.current = false;
        showToast("Couldn't finish that just yet — we'll pick it up on your next visit.", "info");
        return;
      }

      // Post-signup, not at signup: if the parent has no children yet, ask
      // who the activity is for so recommendations land from the start.
      try {
        const res = await fetch("/api/rides/children", { cache: "no-store" });
        if (res.ok) {
          const children = await res.json();
          if (Array.isArray(children) && children.length === 0) setShowWhoFor(true);
        }
      } catch {
        // non-fatal — the prompt can appear next time
      }
    },
    [performSave, showToast]
  );

  useEffect(() => {
    if (isPending || resumedRef.current || !user) return;
    const intent = getIntent();
    if (intent) {
      resumedRef.current = true;
      Promise.resolve().then(() => resolveIntent(intent));
    }
  }, [isPending, user, resolveIntent]);

  // ── Public actions ──

  const requestSave = useCallback(
    (providerId: string, providerName: string) => {
      if (user) {
        void performSave(providerId).catch(() =>
          showToast("Couldn't save just yet — please try again.", "info")
        );
      } else {
        // Cookie is written only after the magic link actually sends
        // (onLinkSent) — an abandoned modal must not leave orphaned intent.
        setPendingIntent({ action: "save", providerId, providerName, createdAt: Date.now() });
      }
    },
    [user, performSave, showToast]
  );

  const requestNotify = useCallback(
    (providerId: string, providerName: string) => {
      if (user) {
        void performSave(providerId, true).catch(() =>
          showToast("Couldn't set that up — please try again.", "info")
        );
      } else {
        setPendingIntent({
          action: "notify",
          providerId,
          providerName,
          notifyWhenOpen: true,
          createdAt: Date.now(),
        });
      }
    },
    [user, performSave, showToast]
  );

  const requestContact = useCallback(
    (providerId: string, providerName: string, phone: string) => {
      if (user) {
        window.open(
          buildWhatsAppUrl(phone, providerName, process.env.NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER),
          "_blank",
          "noopener"
        );
      } else {
        setPendingIntent({
          action: "contact",
          providerId,
          providerName,
          phone,
          createdAt: Date.now(),
        });
      }
    },
    [user]
  );

  const toggleSave = useCallback(
    async (providerId: string, providerName: string) => {
      if (savedIds.has(providerId)) {
        try {
          await performUnsave(providerId);
        } catch {
          showToast("Couldn't unsave just yet — please try again.", "info");
        }
      } else {
        requestSave(providerId, providerName);
      }
    },
    [savedIds, performUnsave, requestSave, showToast]
  );

  const isSaved = useCallback((providerId: string) => savedIds.has(providerId), [savedIds]);

  const contextValue = useMemo(
    () => ({ savedIds, isSaved, requestSave, requestNotify, requestContact, toggleSave }),
    [savedIds, isSaved, requestSave, requestNotify, requestContact, toggleSave]
  );

  return (
    <SavedContext.Provider value={contextValue}>
      {children}

      {pendingIntent && (
        <IntentCaptureModal
          action={pendingIntent.action}
          providerName={pendingIntent.providerName}
          notifyWhenOpen={pendingIntent.notifyWhenOpen}
          onClose={() => setPendingIntent(null)}
          onLinkSent={() => setIntent(pendingIntent)}
        />
      )}

      {showWhoFor && <WhoIsThisForModal onClose={() => setShowWhoFor(false)} />}

      {contactReady && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Open WhatsApp"
          onClick={() => setContactReady(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-ink/10 bg-white p-6 shadow-xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 text-center">
              <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
                Open WhatsApp
              </h2>
              <p className="mt-2 text-sm text-ink-faint">
                Tap below to chat — we&apos;ve pre-filled a message for you.
              </p>
            </div>
            <a
              href={contactReady}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:shadow-md"
              style={{ backgroundColor: "#25D366" }}
            >
              Chat on WhatsApp
            </a>
            <button
              type="button"
              onClick={() => setContactReady(null)}
              className="mt-3 w-full rounded-full border border-ink/10 bg-white px-6 py-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-paper-warm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full border border-ink/10 bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lg"
        >
          {toast.tone === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-ilali-300" aria-hidden="true" />
          ) : (
            <Info className="h-4 w-4 text-sunset-300" aria-hidden="true" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </SavedContext.Provider>
  );
}
