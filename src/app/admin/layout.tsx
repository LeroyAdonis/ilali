import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { AdminShell } from "./AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/signin");
  }

  const user = session.user as { name?: string; email?: string; role?: string };

  if (user.role !== "admin") {
    redirect("/");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
