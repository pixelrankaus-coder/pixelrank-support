import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// DELETE /api/tickets/[id]/tags/[tagId] - Remove a tag from a ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    const { id, tagId } = await params;

    await prisma.ticketTag.delete({
      where: {
        ticketId_tagId: {
          ticketId: id,
          tagId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove tag from ticket:", error);
    return NextResponse.json(
      { error: "Failed to remove tag from ticket" },
      { status: 500 }
    );
  }
}
