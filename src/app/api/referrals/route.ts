import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: "Referral submitted successfully. You'll earn Ubuntu Rewards once the provider completes their first booking.",
      data: {
        id: `ref_${Date.now()}`,
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
