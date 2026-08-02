"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/browse?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/browse");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative mt-8">
      <svg
        className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
        />
      </svg>
      <input
        type="text"
        placeholder="Search by activity, provider, or location..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-full border border-ink/10 bg-white py-4 pl-14 pr-4 text-base text-ink-soft shadow-sm placeholder:text-ink-faint focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-all"
      />
    </form>
  );
}
