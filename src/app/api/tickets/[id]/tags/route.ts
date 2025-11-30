import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/tickets/[id]/tags - Add a tag to a ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tagId } = body;

    if (!tagId) {
      return NextResponse.json(
        { error: "Tag ID is required" },
        { status: 400 }
      );
    }

    // Check if the ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Check if the tag exists
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!tag) {
      return NextResponse.json(
        { error: "Tag not found" },
        { status: 404 }
      );
    }

    // Create the ticket-tag association
    const ticketTag = await prisma.ticketTag.create({
      data: {
        ticketId: id,
        tagId,
      },
    });

    return NextResponse.json(ticketTag);
  } catch (error) {
    // Handle duplicate key error
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Tag already added to this ticket" },
        { status: 400 }
      );
    }

    console.error("Failed to add tag to ticket:", error);
    return NextResponse.json(
      { error: "Failed to add tag to ticket" },
      { status: 500 }
    );
  }
}

// GET /api/tickets/[id]/tags - Get all tags for a ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tags = await prisma.ticketTag.findMany({
      where: { ticketId: id },
      include: {
        tag: true,
      },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Failed to fetch ticket tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket tags" },
      { status: 500 }
    );
  }
}
