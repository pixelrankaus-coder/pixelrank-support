import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rejectAIAction } from "@/lib/ai-agent";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    const result = await rejectAIAction(id, session.user.id, reason);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Action rejected successfully",
    });
  } catch (error) {
    console.error("Failed to reject AI action:", error);
    return NextResponse.json(
      { error: "Failed to reject action" },
      { status: 500 }
    );
  }
}
