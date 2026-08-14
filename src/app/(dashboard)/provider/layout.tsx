"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Pencil,
  Star,
  Calendar,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useSession, signOut } from "@/lib/auth-client";
import { IlaliSpinner } from "@/components/IlaliSpinner";

const NAV_ITEMS = [
  { href: "/provider", label: "Dashboard", icon: LayoutDashboard },
  { href: "/provider/edit", label: "Edit Listing", icon: Pencil },
  { href: "/provider/reviews", label: "Reviews", icon: Star },
  { href: "/provider/events", label: "Events", icon: Calendar },
  { href: "/provider/club", label: "Club", icon: Users },
] as const;

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = useSession();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/auth/signin");
      return;
    }
    // Note: NO role check here. A wizard user's role flips to 'provider' in
    // the DB on submit, but the Better Auth session cookie still carries the
    // old 'parent' claim until the next sign-in — gating on it would bounce
    // a just-submitted provider off their own status tracker. The dashboard
    // page + /api/provider handle pre-live vs live themselves.
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper-warm">
        <IlaliSpinner size="sm" />
      </div>
    );
  }

  if (!session) return null;

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/signin");
  };

  return (
    <div className="flex min-h-screen bg-paper-warm">
      {/* Mobile overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Sidebar / Mobile nav */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-ink/10 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/10">
          <Link
            href="/provider"
            className="flex items-center gap-2"
            onClick={() => setMobileNavOpen(false)}
          >
            <img
              src="/images/brand/ilali-logo-38.png"
              alt="ILALI"
              width={30}
              height={30}
              className="rounded-md"
            />
            <span className="font-display text-sm font-bold text-ink">
              Provider Portal
            </span>
          </Link>
          <button
            className="lg:hidden p-1 text-ink-faint hover:text-ink"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/provider" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-ilali-50 text-ilali-700"
                    : "text-ink-soft hover:bg-paper-warm hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="border-t border-ink/10 px-3 py-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-faint hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar (mobile hamburger) */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink/10 bg-white/90 backdrop-blur px-5 py-3 lg:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-1 text-ink-faint hover:text-ink"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/provider" className="flex items-center gap-2">
            <img
              src="/images/brand/ilali-logo-38.png"
              alt="ILALI"
              width={24}
              height={24}
              className="rounded-md"
            />
            <span className="font-display text-sm font-bold text-ink">
              Provider Portal
            </span>
          </Link>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
