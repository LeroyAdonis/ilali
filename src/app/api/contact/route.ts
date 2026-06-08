import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: "Message received. We typically respond within 24 hours during business days.",
      data: {
        id: `msg_${Date.now()}`,
        ...body,
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
