import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-auth";
import { runTicketUpdatedAutomations } from "@/lib/automation-engine";

// POST /api/portal/tickets/[id]/messages - Add a message to a ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { body: messageBody } = body;

    if (!messageBody || !messageBody.trim()) {
      return NextResponse.json(
        { error: "Message body is required" },
        { status: 400 }
      );
    }

    // Verify the ticket belongs to this customer
    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        contactId: session.id,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Create the message
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        body: messageBody,
        internal: false,
        authorType: "CONTACT",
        authorId: session.id,
        authorName: session.name || session.email,
        contactAuthorId: session.id,
      },
    });

    // Update ticket's updatedAt and status if closed
    const previousStatus = ticket.status;
    const newStatus = ticket.status === "CLOSED" ? "OPEN" : ticket.status;

    await prisma.ticket.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        status: newStatus,
      },
    });

    // Run ticket updated automations if status changed
    if (previousStatus !== newStatus) {
      runTicketUpdatedAutomations(id, { status: previousStatus }).catch((err) =>
        console.error("Failed to run ticket updated automations:", err)
      );
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Failed to add message:", error);
    return NextResponse.json(
      { error: "Failed to add message" },
      { status: 500 }
    );
  }
}

// GET /api/portal/tickets/[id]/messages - Get ticket messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify the ticket belongs to this customer
    const ticket = await prisma.ticket.findFirst({
      where: {
        id,
        contactId: session.id,
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const messages = await prisma.ticketMessage.findMany({
      where: {
        ticketId: id,
        internal: false, // Only show public messages
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
