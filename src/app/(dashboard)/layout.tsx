import Link from "next/link";
import PointsBadge from "@/components/rewards/PointsBadge";
import Footer from "@/components/Footer";

/**
 * Shared layout for the authenticated dashboard group.
 * Slim header: brand + subtle 🏆 PointsBadge (signed-in only).
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-90"
          >
            <img
              src="/images/brand/ilali-logo-38.png"
              alt="ILALI"
              width={30}
              height={30}
              className="rounded-md"
            />
            <span className="text-sm font-bold text-ink">
              Ubuntu Rewards
            </span>
          </Link>
          <PointsBadge />
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
