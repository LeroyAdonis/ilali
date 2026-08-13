import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { setIntent, getIntent, clearIntent, INTENT_COOKIE } from "@/lib/intent-cookie";

/** Minimal document.cookie shim so the helpers behave in the node test env. */
function installFakeDocument() {
  const store = new Map<string, string>();
  const fakeDocument = {
    cookie: "",
  };

  Object.defineProperty(fakeDocument, "cookie", {
    get: () =>
      Array.from(store.entries())
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("; "),
    set: (value: string) => {
      const [pair, ...rest] = value.split("; ");
      const [rawKey, rawValue] = pair.split("=");
      const key = rawKey;
      const maxAge = rest.find((p) => p.startsWith("max-age="));
      if (maxAge === "max-age=0") {
        store.delete(key);
      } else {
        store.set(key, decodeURIComponent(rawValue));
      }
    },
  });

  vi.stubGlobal("document", fakeDocument);
  return () => vi.unstubAllGlobals();
}

const NOW = 1_750_000_000_000;

describe("intent cookie helpers", () => {
  let cleanup: () => void;

  beforeEach(() => {
    cleanup = installFakeDocument();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("returns null when no cookie is set", () => {
    expect(getIntent()).toBeNull();
  });

  it("round-trips an intent payload", () => {
    setIntent({
      action: "save",
      providerId: "a1b2c3d4-0001-4000-8000-000000000001",
      providerName: "Sea Point Football",
    });

    const intent = getIntent();
    expect(intent).not.toBeNull();
    expect(intent?.action).toBe("save");
    expect(intent?.providerName).toBe("Sea Point Football");
    expect(intent?.createdAt).toBe(NOW);
  });

  it("stores the notifyWhenOpen flag and phone for contact", () => {
    setIntent({
      action: "contact",
      providerId: "a1b2c3d4-0001-4000-8000-000000000001",
      providerName: "Ballet Co",
      phone: "+27821234567",
    });
    const intent = getIntent();
    expect(intent?.action).toBe("contact");
    expect(intent?.phone).toBe("+27821234567");
  });

  it("ignores a corrupt cookie value", () => {
    document.cookie = `${INTENT_COOKIE}=not-json`;
    expect(getIntent()).toBeNull();
  });

  it("clears the intent", () => {
    setIntent({
      action: "notify",
      providerId: "a1b2c3d4-0001-4000-8000-000000000001",
      providerName: "Art Club",
      notifyWhenOpen: true,
    });
    expect(getIntent()).not.toBeNull();
    clearIntent();
    expect(getIntent()).toBeNull();
  });
});
