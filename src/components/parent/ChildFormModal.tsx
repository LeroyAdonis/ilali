"use client";

import { useState, useEffect, useCallback } from "react";
import ChildForm, { type ChildInput, emptyChild } from "@/components/parent/ChildForm";

// ── Types ──

interface ChildProfile {
  id: string;
  name: string;
  age: number;
  interests: string[] | null;
  availability: { days: string[]; timeSlots: string[] } | null;
  suburb: string | null;
}

export interface ChildFormModalProps {
  mode: "add" | "edit";
  childId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

// ── Component ──

export default function ChildFormModal({
  mode,
  childId,
  isOpen,
  onClose,
  onSaved,
}: ChildFormModalProps) {
  const [initialData, setInitialData] = useState<ChildInput | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");

  // ── Fetch child data for edit mode ──

  useEffect(() => {
    if (!isOpen || mode !== "edit" || !childId) {
      if (mode === "add") {
        setInitialData(undefined);
      }
      return;
    }

    let cancelled = false;
    async function fetchChild() {
      setFetching(true);
      setError("");
      try {
        const res = await fetch(`/api/children/${childId}`);
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Failed to fetch child" }));
          throw new Error(data.error || "Failed to fetch child data");
        }
        const child: ChildProfile = await res.json();
        if (!cancelled) {
          setInitialData({
            name: child.name,
            age: String(child.age),
            interests: child.interests ?? [],
            suburb: child.suburb ?? "",
            availability: child.availability ?? { days: [], timeSlots: [] },
          });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load child data");
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    }
    fetchChild();
    return () => { cancelled = true; };
  }, [isOpen, mode, childId]);

  // ── Escape key ──

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // ── Save handler ──

  const handleSave = useCallback(
    async (data: ChildInput) => {
      setError("");
      setLoading(true);
      try {
        const payload = {
          name: data.name.trim(),
          age: parseInt(data.age, 10),
          interests: data.interests,
          suburb: data.suburb.trim() || undefined,
          availability: data.availability,
        };

        const url =
          mode === "edit" && childId
            ? `/api/children/${childId}`
            : "/api/children";
        const method = mode === "edit" ? "PATCH" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: "Request failed" }));
          throw new Error(body.error || body.details?.[0]?.message || "Failed to save child");
        }

        onSaved();
        onClose();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [mode, childId, onSaved, onClose]
  );

  // ── Don't render if not open ──

  if (!isOpen) return null;

  // ── Render ──

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "edit" ? "Edit child" : "Add a child"}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* ── Mobile: Bottom sheet ── */}
      <div className="fixed inset-x-0 bottom-0 z-10 sm:hidden animate-slide-up">
        <div className="rounded-t-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 z-10 rounded-t-2xl bg-white border-b border-ink/10 px-5 py-4">
            <h2 className="font-display text-lg font-bold text-ink">
              {mode === "edit" ? "Edit Child" : "Add a Child"}
            </h2>
          </div>

          <div className="px-5 py-5">
            {fetching ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-ilali-600 border-t-transparent" />
              </div>
            ) : error && !fetching ? (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            ) : (
              <ChildForm
                initialData={initialData}
                onSave={handleSave}
                onCancel={onClose}
                saveLabel={mode === "edit" ? "Save Changes" : "Add Child"}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop: Centered modal ── */}
      <div className="hidden sm:flex fixed inset-0 items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl">
          <div className="sticky top-0 z-10 rounded-t-2xl bg-white border-b border-ink/10 px-6 py-4">
            <h2 className="font-display text-lg font-bold text-ink">
              {mode === "edit" ? "Edit Child" : "Add a Child"}
            </h2>
          </div>

          <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
            {fetching ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-ilali-600 border-t-transparent" />
              </div>
            ) : error && !fetching ? (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            ) : (
              <ChildForm
                initialData={initialData}
                onSave={handleSave}
                onCancel={onClose}
                saveLabel={mode === "edit" ? "Save Changes" : "Add Child"}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
