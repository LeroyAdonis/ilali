"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
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

  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [pendingIntent, setPendingIntent] = useState<IntentPayload | null>(null);
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
      if (!res.ok) return;
      const data = await res.json();
      const ids = (data.saved ?? []).map((s: { provider: { id: string } }) => s.provider.id);
      setSavedIds(new Set(ids));
    } catch {
      // keep whatever we have; next save/unsave reconciles
    }
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (user) Promise.resolve().then(() => refreshSaved());
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
        } else if (intent.action === "contact") {
          const phone = intent.phone ?? process.env.NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER ?? "";
          window.open(
            buildWhatsAppUrl(phone, intent.providerName, process.env.NEXT_PUBLIC_WHATSAPP_CONTACT_NUMBER),
            "_blank",
            "noopener"
          );
          showToast(`Opening WhatsApp to chat about ${intent.providerName}…`, "info");
        }
      } catch {
        showToast("Couldn't finish that just yet — try again?", "info");
        return;
      } finally {
        clearIntent();
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
        setIntent({ action: "save", providerId, providerName });
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
        setIntent({ action: "notify", providerId, providerName, notifyWhenOpen: true });
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
        setIntent({ action: "contact", providerId, providerName, phone });
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

  return (
    <SavedContext.Provider
      value={{ savedIds, isSaved, requestSave, requestNotify, requestContact, toggleSave }}
    >
      {children}

      {pendingIntent && (
        <IntentCaptureModal
          action={pendingIntent.action}
          providerName={pendingIntent.providerName}
          notifyWhenOpen={pendingIntent.notifyWhenOpen}
          onClose={() => setPendingIntent(null)}
        />
      )}

      {showWhoFor && <WhoIsThisForModal onClose={() => setShowWhoFor(false)} />}

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
