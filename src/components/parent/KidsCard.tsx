"use client";

import { useState } from "react";
import ChildFormModal from "@/components/parent/ChildFormModal";
import NudgeCard from "@/components/parent/NudgeCard";

// ── Types ──

export interface ChildProfile {
  id: string;
  name: string;
  age: number;
  interests: string[] | null;
  availability: { days: string[]; timeSlots: string[] } | null;
  suburb: string | null;
}

export interface KidsCardProps {
  children: ChildProfile[];
}

// ── Helpers ──

const ACCENT_COLORS = ["teal", "gold", "purple", "orange"] as const;

function accentBarClass(accent: string): string {
  switch (accent) {
    case "teal": return "bg-ilali-500";
    case "gold": return "bg-gold";
    case "purple": return "bg-purple";
    case "orange": return "bg-sunset-500";
    default: return "bg-ilali-500";
  }
}

function availabilitySummary(availability: ChildProfile["availability"]): string {
  if (!availability) return "No availability set";

  const dayMap: Record<string, string> = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };
  const days = availability.days.map((d) => dayMap[d] ?? d);
  const times = availability.timeSlots.map((t) => t.toLowerCase()).join("/");

  if (days.length === 0) return "No days selected";
  if (times.length === 0) return days.join(", ");
  return `${days.join(", ")} ${times}`;
}

// ── Component ──

export default function KidsCard({ children }: KidsCardProps) {
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingChildId, setEditingChildId] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function openAddModal() {
    setModalMode("add");
    setEditingChildId(undefined);
    setIsModalOpen(true);
  }

  function openEditModal(childId: string) {
    setModalMode("edit");
    setEditingChildId(childId);
    setIsModalOpen(true);
  }

  function handleClose() {
    setIsModalOpen(false);
    setEditingChildId(undefined);
  }

  function handleSaved() {
    // Parent page should revalidate via server action or router.refresh
    // The page that renders KidsCard is responsible for refreshing data
  }

  // ── Empty state ──

  if (children.length === 0) {
    return (
      <div>
        <NudgeCard onAddChild={openAddModal} />
        <ChildFormModal
          mode={modalMode}
          childId={editingChildId}
          isOpen={isModalOpen}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      </div>
    );
  }

  // ── Render ──

  return (
    <div>
      <div className="rounded-xl border border-ink/10 bg-white shadow-sm">
        <div className="border-b border-ink/10 px-5 py-4">
          <h3 className="font-display text-sm font-semibold text-ink">
            👤 Your Kids
          </h3>
        </div>

        <div className="divide-y divide-ink/5">
          {children.map((child, i) => {
            const accent = ACCENT_COLORS[i % ACCENT_COLORS.length];
            const interests = child.interests ?? [];
            const maxShown = 4;
            const extraCount = interests.length - maxShown;

            return (
              <div
                key={child.id}
                className="flex items-center gap-3 px-5 py-4"
              >
                {/* Accent bar */}
                <div
                  className={`h-10 w-1 shrink-0 rounded-full ${accentBarClass(accent)}`}
                />

                {/* Child info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-sm font-semibold text-ink truncate">
                      {child.name}
                    </span>
                    <span className="text-xs font-medium text-ink-faint">
                      {child.age}
                    </span>
                  </div>

                  {/* Interest chips */}
                  {interests.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {interests.slice(0, maxShown).map((interest) => (
                        <span
                          key={interest}
                          className="inline-block rounded-full border border-ink/10 bg-paper-warm px-2 py-0.5 text-[11px] font-medium text-ink-soft"
                        >
                          {interest}
                        </span>
                      ))}
                      {extraCount > 0 && (
                        <span className="inline-block rounded-full bg-ilali-50 text-ilali-700 px-2 py-0.5 text-[11px] font-medium">
                          +{extraCount} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Availability summary */}
                  <p className="mt-1 text-xs text-ink-faint">
                    {availabilitySummary(child.availability)}
                  </p>
                </div>

                {/* Edit button */}
                <button
                  type="button"
                  onClick={() => openEditModal(child.id)}
                  className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-ink-faint transition-colors hover:bg-paper-warm hover:text-ink-soft"
                  aria-label={`Edit ${child.name}`}
                >
                  Edit ✏️
                </button>
              </div>
            );
          })}
        </div>

        {/* Add another child */}
        <div className="border-t border-ink/10 px-5 py-3">
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 rounded-full border border-sunset-300 bg-white px-4 py-2 text-xs font-medium text-sunset-600 transition-colors hover:bg-sunset-50"
          >
            <span className="text-base leading-none">+</span>
            Add another child
          </button>
        </div>
      </div>

      <ChildFormModal
        mode={modalMode}
        childId={editingChildId}
        isOpen={isModalOpen}
        onClose={handleClose}
        onSaved={handleSaved}
      />
    </div>
  );
}
