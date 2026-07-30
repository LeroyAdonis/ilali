import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db/index";
import { providerApplications } from "@/lib/db/schema";

export const GET = withAdmin(async () => {
  const applications = await db
    .select()
    .from(providerApplications)
    .orderBy(providerApplications.createdAt);
  return NextResponse.json(applications);
});
