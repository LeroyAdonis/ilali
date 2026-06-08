import { NextRequest, NextResponse } from "next/server";
import { venues } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const location = searchParams.get("location") || "";

  let result = [...venues];

  if (location) {
    result = result.filter((v) =>
      v.location.toLowerCase().includes(location.toLowerCase())
    );
  }

  return NextResponse.json({
    data: result,
    total: result.length,
  });
}
