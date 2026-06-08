import { NextRequest, NextResponse } from "next/server";
import { providers } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";
  const location = searchParams.get("location") || "";

  let result = [...providers];

  if (category) {
    const slugs = category.split(",");
    result = result.filter((p) => slugs.includes(p.categorySlug));
  }

  if (location) {
    result = result.filter((p) =>
      p.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  return NextResponse.json({
    data: result,
    total: result.length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: "Provider application received. We'll be in touch soon.",
      data: {
        id: `app_${Date.now()}`,
        ...body,
        status: "pending",
        created_at: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 }
    );
  }
}
