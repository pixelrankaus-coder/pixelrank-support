import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { approveAIAction } from "@/lib/ai-agent";

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

    const result = await approveAIAction(id, session.user.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: "Action approved successfully",
    });
  } catch (error) {
    console.error("Failed to approve AI action:", error);
    return NextResponse.json(
      { error: "Failed to approve action" },
      { status: 500 }
    );
  }
}
