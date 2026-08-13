/**
 * Guest intent capture cookie (`ilali_intent`).
 *
 * When a guest hits a moment of intent (Save / Contact / Notify me) we can't
 * write to the DB yet — they have no account. Instead we stash the intent in
 * a short-lived, plain (non-HttpOnly) cookie, send them through the magic
 * link, and resolve the intent client-side after sign-in (see SavedProvider).
 *
 * Plain cookie on purpose: it must be readable by browser JS. 10-minute TTL —
 * enough for a magic link round-trip (links expire in 5 min) without lingering.
 */

export type IntentAction = "save" | "contact" | "notify";

export interface IntentPayload {
  action: IntentAction;
  providerId: string;
  providerName: string;
  /** Only set for the "notify me when booking opens" action. */
  notifyWhenOpen?: boolean;
  /** Contact number for the WhatsApp action (business override applied). */
  phone?: string;
  createdAt: number;
}

export const INTENT_COOKIE = "ilali_intent";
const INTENT_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function getIntent(): IntentPayload | null {
  const raw = readCookie(INTENT_COOKIE);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as IntentPayload;
    if (
      !parsed ||
      typeof parsed.action !== "string" ||
      typeof parsed.providerId !== "string" ||
      typeof parsed.createdAt !== "number"
    ) {
      return null;
    }
    if (Date.now() - parsed.createdAt > INTENT_MAX_AGE_MS) {
      clearIntent();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setIntent(payload: Omit<IntentPayload, "createdAt">): void {
  if (typeof document === "undefined") return;
  const data: IntentPayload = { ...payload, createdAt: Date.now() };
  document.cookie = `${INTENT_COOKIE}=${encodeURIComponent(
    JSON.stringify(data)
  )}; path=/; max-age=600; SameSite=Lax`;
}

export function clearIntent(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${INTENT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
