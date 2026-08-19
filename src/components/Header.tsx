"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X, LogOut, User, Heart, ChevronDown } from "lucide-react";
import { navLinks, desktopMoreLinks } from "@/lib/constants";
import { useSession, signOut } from "@/lib/auth-client";

export default function Header({
  rightSlot,
}: {
  /** Optional extra element in the desktop right cluster (e.g. PointsBadge). */
  rightSlot?: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close the desktop "More" dropdown on outside-click or Escape (main-navigation spec).
  useEffect(() => {
    if (!moreOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [moreOpen]);
  const { data: session } = useSession();
  const user = session?.user as { role?: string; name?: string; email?: string } | undefined;
  const isSignedIn = !!session;
  const role = user?.role;
  const displayName = user?.name?.split(" ")[0] || "You";

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-ink/10 bg-paper/92 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center hover:opacity-90 transition-opacity shrink-0">
          <img
            src="/images/brand/ilali-logo-76-t.png"
            alt="ILALI"
            width={40}
            height={40}
            className="h-10 w-10"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.slice(0, 5).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-[13px] font-medium text-ink-soft hover:text-teal-deep transition-colors"
            >
              {link.label}
            </Link>
          ))}
          {/* More dropdown — absorbs How It Works + audience info pages (main-navigation spec) */}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-[13px] font-medium text-ink-soft hover:text-teal-deep transition-colors"
            >
              More
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {moreOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full mt-1 w-56 rounded-xl border border-ink/10 bg-paper p-1.5 shadow-lg"
              >
                {desktopMoreLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className="block rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft hover:bg-ink/5 hover:text-teal-deep transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          {/* Conditional: Parent / Provider profile entries */}
          {role === "parent" && (
            <Link
              href="/home"
              className="ml-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-gold-deep-2 bg-gold/10 hover:bg-gold/20 transition-colors"
            >
              🏠 Parent Profile
            </Link>
          )}
          {role === "provider" && (
            <Link
              href="/provider"
              className="ml-2 rounded-lg px-3.5 py-2 text-[13px] font-semibold text-teal-deep bg-teal/10 hover:bg-teal/20 transition-colors"
            >
              📋 Provider Portal
            </Link>
          )}
        </nav>

        {/* Desktop Search + Auth */}
        <div className="hidden md:flex items-center gap-3">
          {rightSlot}
          <Link
            href="/saved"
            aria-label="Saved activities"
            className="inline-flex items-center justify-center rounded-lg p-2 text-ink-soft hover:text-ilali-600 hover:bg-ilali-50 transition-colors"
          >
            <Heart className="h-5 w-5" />
          </Link>
          {isSignedIn ? (
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-ink-faint hidden lg:inline">
                {displayName}
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 rounded-[10px] border border-ink/15 px-4 py-2 text-sm font-medium text-ink-soft hover:bg-ink/5 hover:text-ink transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="rounded-[10px] bg-teal-deep px-5 py-2 text-sm font-semibold text-white hover:bg-teal transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-ink-soft hover:bg-ink/5 transition-colors md:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-ink/10 bg-paper px-4 pb-5 pt-3">
          <nav className="flex flex-col gap-3 mb-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-ink-soft hover:text-teal-deep transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {/* More links not already in navLinks (parity with desktop More dropdown) */}
            {desktopMoreLinks
              .filter((link) => !navLinks.some((nl) => nl.href === link.href))
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-medium text-ink-soft hover:text-teal-deep transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            {/* Conditional: Parent / Provider profile entries */}
            {role === "parent" && (
              <Link
                href="/home"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-semibold text-gold-deep-2"
              >
                🏠 Parent Profile
              </Link>
            )}
            {role === "provider" && (
              <Link
                href="/provider"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-semibold text-teal-deep"
              >
                📋 Provider Portal
              </Link>
            )}
            <Link
              href="/saved"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ilali-600 transition-colors"
            >
              <Heart className="h-4 w-4" aria-hidden="true" />
              Saved
            </Link>
          </nav>
          {isSignedIn ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-ink-faint mb-1">
                <User className="h-4 w-4" />
                <span>{user?.name || user?.email}</span>
              </div>
              <button
                onClick={() => { handleSignOut(); setMobileOpen(false); }}
                className="flex items-center justify-center gap-2 w-full rounded-[10px] border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink-soft hover:bg-ink/5 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              onClick={() => setMobileOpen(false)}
              className="block w-full rounded-[10px] bg-teal-deep px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
