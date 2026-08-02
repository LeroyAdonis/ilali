"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Sparkles } from "lucide-react";

interface SearchBarProps {
  variant?: "compact" | "large";
  placeholder?: string;
}

export default function SearchBar({
  variant = "large",
  placeholder = "Search activities, providers, venues...",
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive query from search params synchronously (no effect needed)
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);

  // If search params change externally, reset with key from parent
  // We use initialQuery pattern — parent Suspense boundary handles re-mount

  // Detect natural language mode: contains spaces AND >20 chars
  const isNlMode = query.trim().includes(" ") && query.trim().length > 20;

  const handleSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        // Natural language search: always use `nl` param
        if (value.trim().includes(" ") && value.trim().length > 20) {
          params.set("nl", value.trim());
          params.delete("q");
        } else {
          params.set("q", value.trim());
          params.delete("nl");
        }
      } else {
        params.delete("q");
        params.delete("nl");
      }
      router.push(`/browse?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const dynamicPlaceholder =
    isNlMode
      ? "Describe what you're looking for..."
      : variant === "compact"
        ? "Search activities..."
        : placeholder;

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} className="relative w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dynamicPlaceholder}
          aria-label="Search activities"
          className="w-full rounded-full border border-ink/10 bg-paper-warm py-2 pl-9 pr-10 text-sm text-ink-soft placeholder-ink-faint focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
        />
        {isNlMode && (
          <Sparkles
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ilali-400"
            aria-hidden="true"
          />
        )}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={dynamicPlaceholder}
        aria-label={dynamicPlaceholder}
        className={`w-full rounded-full border bg-white py-4 pl-14 pr-12 text-base text-ink-soft placeholder-ink-faint shadow-md focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors ${
          isNlMode ? "border-ilali-300" : "border-ink/10"
        }`}
      />
      {isNlMode && (
        <Sparkles
          className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ilali-400"
          aria-hidden="true"
        />
      )}
    </form>
  );
}
