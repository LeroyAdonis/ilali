"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  /** Whether to render in compact (header) or large (browse page) mode */
  variant?: "compact" | "large";
  placeholder?: string;
}

export default function SearchBar({
  variant = "large",
  placeholder = "Search activities, providers, venues...",
}: SearchBarProps) {
  if (variant === "compact") {
    return (
      <div className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search activities..."
          className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full rounded-full border border-slate-200 bg-white py-4 pl-14 pr-6 text-base text-slate-700 placeholder-slate-400 shadow-md focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
      />
    </div>
  );
}
