"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  Building2,
  Menu,
  X,
} from "lucide-react";
import { SignOutButton, SignOutButtonFull } from "@/components/admin/SignOutButton";

interface AdminShellProps {
  children: React.ReactNode;
  user: {
    name?: string;
    email?: string;
    role?: string;
  };
}

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Applications", icon: ClipboardList },
  { href: "/admin/providers", label: "Providers", icon: Building2 },
] as const;

const navLinkClasses =
  "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors";

export function AdminShell({ children, user }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ============================================
          MOBILE TOP BAR (< 768px)
          ============================================ */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-3 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/admin" className="text-lg font-bold text-ilali-600">
          ILALI Admin
        </Link>

        <SignOutButton className="flex h-11 w-11 items-center justify-center rounded-lg text-red-600 hover:bg-red-50" />
      </header>

      {/* ============================================
          MOBILE SIDEBAR OVERLAY + DRAWER (< 768px)
          ============================================ */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden ${
          sidebarOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white shadow-lg transition-transform duration-200 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
          <Link
            href="/admin"
            className="text-lg font-bold text-ilali-600"
            onClick={() => setSidebarOpen(false)}
          >
            ILALI Admin
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <p className="px-3 pt-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Manage
          </p>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={navLinkClasses}
              onClick={() => setSidebarOpen(false)}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user.name || "Admin"}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <SignOutButtonFull className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors" />
        </div>
      </aside>

      {/* ============================================
          DESKTOP SIDEBAR (≥ 768px)
          ============================================ */}
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col md:border-r md:border-slate-200 md:bg-white md:h-screen md:sticky md:top-0 md:overflow-y-auto">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <Link href="/admin" className="text-xl font-bold text-ilali-600">
            ILALI Admin
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <p className="px-3 pt-4 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Manage
          </p>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClasses}>
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-slate-900 truncate">
              {user.name || "Admin"}
            </p>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>
          <SignOutButtonFull className="flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors" />
        </div>
      </aside>

      {/* ============================================
          MAIN CONTENT AREA
          ============================================ */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="p-4 py-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
