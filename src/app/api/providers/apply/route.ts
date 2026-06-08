import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: "Application submitted successfully. We'll review it and get back to you within 2 business days.",
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
