"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "", label: "About", match: "exact" },
  { href: "/events", label: "Schedule", match: "prefix" },
  { href: "/members", label: "Members", match: "prefix" },
  { href: "/chat", label: "Chat", match: "prefix" },
] as const;

interface ClubTabsProps {
  slug: string;
}

/**
 * Club section tab nav — About | Schedule | Members | Chat.
 * Active state is derived from the current pathname (client-side).
 */
export default function ClubTabs({ slug }: ClubTabsProps) {
  const pathname = usePathname();
  const base = `/clubs/${slug}`;

  const isActive = (href: string, match: "exact" | "prefix") => {
    if (match === "exact") return pathname === `${base}${href}`;
    return pathname.startsWith(`${base}${href}`);
  };

  return (
    <nav
      aria-label="Club sections"
      className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <div className="flex gap-1 overflow-x-auto scrollbar-hide rounded-full border border-ink/10 bg-paper-warm p-1">
        {TABS.map((tab) => {
          const active = isActive(tab.href, tab.match);
          return (
            <Link
              key={tab.label}
              href={`${base}${tab.href}`}
              aria-current={active ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? "bg-ilali-600 text-white shadow-sm"
                  : "text-ink-soft hover:bg-white hover:text-ilali-700"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
