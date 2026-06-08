"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Menu, X } from "lucide-react";
import { navLinks } from "@/lib/constants";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerQuery, setHeaderQuery] = useState("");
  const [mobileQuery, setMobileQuery] = useState("");
  const router = useRouter();

  const handleHeaderSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && headerQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(headerQuery.trim())}`);
      setHeaderQuery("");
    }
  };

  const handleMobileSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && mobileQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(mobileQuery.trim())}`);
      setMobileQuery("");
      setMobileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-slate-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity shrink-0">
          <img
            src="/images/brand/ilali-logo-38.png"
            alt="ILALI"
            width={38}
            height={38}
            className="rounded-md"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-ilali-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Search + Sign In */}
        <div className="hidden md:flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={headerQuery}
              onChange={(e) => setHeaderQuery(e.target.value)}
              onKeyDown={handleHeaderSearch}
              placeholder="Search activities..."
              className="w-52 rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
            />
          </div>
          <Link
            href="/auth/signin"
            className="rounded-full bg-ilali-600 px-5 py-2 text-sm font-semibold text-white hover:bg-ilali-700 transition-colors"
          >
            Sign In
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pb-5 pt-3">
          <nav className="flex flex-col gap-3 mb-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-slate-700 hover:text-ilali-600 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={mobileQuery}
              onChange={(e) => setMobileQuery(e.target.value)}
              onKeyDown={handleMobileSearch}
              placeholder="Search activities..."
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm text-slate-700 placeholder-slate-400 focus:border-ilali-400 focus:outline-none focus:ring-2 focus:ring-ilali-100 transition-colors"
            />
          </div>
          <Link
            href="/auth/signin"
            onClick={() => setMobileOpen(false)}
            className="block w-full rounded-full bg-ilali-600 px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-ilali-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      )}
    </header>
  );
}
