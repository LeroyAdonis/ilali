import Header from "@/components/Header";
import PointsBadge from "@/components/rewards/PointsBadge";
import Footer from "@/components/Footer";

/**
 * Shared layout for the authenticated dashboard group (/rewards, /provider).
 * Full site Header (main nav + search + auth) with the 🏆 PointsBadge in the
 * right cluster — so navigating to /rewards keeps all nav links visible.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header rightSlot={<PointsBadge />} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
