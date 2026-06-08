"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { categories } from "@/lib/constants";

const filterButtons = [
  "All filters",
  "Any age",
  "Any date",
  "Distance",
  "Any price",
  "Any language",
  "All levels",
  "Disability/Neurodivergence",
];

export default function FilterBar() {
  return (
    <div className="w-full">
      {/* Filter pill buttons */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
        {filterButtons.map((label) => (
          <button
            key={label}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 shadow-sm hover:border-ilali-300 hover:text-ilali-600 hover:bg-ilali-50 transition-colors whitespace-nowrap"
          >
            {label}
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>
        ))}
      </div>

      {/* Category icon buttons */}
      <div className="mt-4 flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/browse?category=${cat.slug}`}
            className="flex shrink-0 flex-col items-center gap-1.5 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
          >
            <div
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-lg ${cat.color}`}
            >
              {cat.icon}
            </div>
            <span className="text-[10px] font-medium text-slate-600 whitespace-nowrap">
              {cat.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
