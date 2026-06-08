"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { categories } from "@/lib/constants";

interface DropdownOption {
  value: string;
  label: string;
}

interface FilterConfig {
  param: string;
  label: string;
  options: DropdownOption[];
  multi?: boolean;
}

const filterConfigs: FilterConfig[] = [
  {
    param: "category",
    label: "Category",
    options: categories.map((c) => ({ value: c.slug, label: c.name })),
    multi: true,
  },
  {
    param: "age",
    label: "Any age",
    options: [
      { value: "0-3", label: "Toddlers (0-3)" },
      { value: "4-7", label: "Early Childhood (4-7)" },
      { value: "8-12", label: "Middle Childhood (8-12)" },
      { value: "13-17", label: "Teens (13-17)" },
    ],
  },
  {
    param: "date",
    label: "Any date",
    options: [
      { value: "today", label: "Today" },
      { value: "this-week", label: "This week" },
      { value: "this-month", label: "This month" },
      { value: "next-month", label: "Next month" },
    ],
  },
  {
    param: "distance",
    label: "Distance",
    options: [
      { value: "1", label: "Within 1 km" },
      { value: "2", label: "Within 2 km" },
      { value: "5", label: "Within 5 km" },
      { value: "10", label: "Within 10 km" },
      { value: "20", label: "Within 20 km" },
    ],
  },
  {
    param: "price",
    label: "Any price",
    options: [
      { value: "free", label: "Free" },
      { value: "under-100", label: "Under R100" },
      { value: "100-250", label: "R100 - R250" },
      { value: "250-500", label: "R250 - R500" },
      { value: "over-500", label: "Over R500" },
    ],
  },
  {
    param: "level",
    label: "All levels",
    options: [
      { value: "beginner", label: "Beginner" },
      { value: "intermediate", label: "Intermediate" },
      { value: "advanced", label: "Advanced" },
      { value: "all-levels", label: "All levels welcome" },
    ],
  },
  {
    param: "disability",
    label: "Disability/Neurodivergence",
    options: [
      { value: "friendly", label: "Neurodivergent-friendly" },
      { value: "physical-access", label: "Physical accessibility" },
      { value: "sensory-friendly", label: "Sensory-friendly" },
      { value: "inclusive", label: "Fully inclusive" },
    ],
    multi: true,
  },
];

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handler();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, handler]);
}

function FilterDropdown({ config }: { config: FilterConfig }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useOutsideClick(ref, () => setOpen(false));

  const selectedValues = searchParams.getAll(config.param);
  const activeCount = selectedValues.length;

  const toggle = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    // Remove all existing values for this param
    params.delete(config.param);
    // If it's a multi filter, re-add all existing except the toggled one
    if (config.multi) {
      const current = selectedValues.filter((v) => v !== value);
      // If the value wasn't in current, add it
      if (selectedValues.includes(value)) {
        // Removing it — current already has everything except value
        current.forEach((v) => params.append(config.param, v));
      } else {
        // Adding it — add current + value
        current.forEach((v) => params.append(config.param, v));
        params.append(config.param, value);
      }
    } else {
      // Single select — toggle on/off
      if (selectedValues[0] === value) {
        // Deselect
      } else {
        params.set(config.param, value);
      }
    }
    router.push(`/browse?${params.toString()}`);
    if (!config.multi) setOpen(false);
  };

  const label = activeCount > 0 ? `${config.label} (${activeCount})` : config.label;

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium shadow-sm whitespace-nowrap transition-colors ${
          activeCount > 0
            ? "border-ilali-400 bg-ilali-50 text-ilali-700"
            : "border-slate-200 bg-white text-slate-700 hover:border-ilali-300 hover:text-ilali-600 hover:bg-ilali-50"
        }`}
      >
        {label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${
            open ? "rotate-180" : ""
          } ${activeCount > 0 ? "text-ilali-500" : "text-slate-400"}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 z-40 w-56 rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5">
          <div className="max-h-64 overflow-y-auto p-2">
            {config.options.map((opt) => {
              const isSelected = config.multi
                ? selectedValues.includes(opt.value)
                : selectedValues[0] === opt.value;

              return (
                <button
                  key={opt.value}
                  onClick={() => toggle(opt.value)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-ilali-50 text-ilali-700 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      isSelected
                        ? "bg-ilali-500 border-ilali-500 text-white"
                        : "border-slate-300"
                    }`}
                  >
                    {isSelected && "✓"}
                  </span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {activeCount > 0 && (
            <div className="border-t border-slate-100 p-2">
              <button
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete(config.param);
                  router.push(`/browse?${params.toString()}`);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FilterBar() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");

  return (
    <div className="w-full">
      {/* Filter pill dropdowns */}
      <div className="relative flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {filterConfigs.map((config) => (
          <FilterDropdown key={config.param} config={config} />
        ))}
      </div>

      {/* Category icon links */}
      <div className="relative mt-4 flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className={`flex shrink-0 flex-col items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${
                isActive ? "bg-ilali-50" : "hover:bg-slate-50"
              }`}
            >
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                  isActive ? "ring-2 ring-ilali-400 ring-offset-2" : ""
                } ${cat.color}`}
              >
                {cat.icon}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  isActive ? "text-ilali-700" : "text-slate-600"
                }`}
              >
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
