import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-auth";
import { runTicketCreatedAutomations } from "@/lib/automation-engine";

// Helper to get next ticket number
async function getNextTicketNumber(): Promise<number> {
  const counter = await prisma.counter.upsert({
    where: { id: "ticket_number" },
    update: { value: { increment: 1 } },
    create: { id: "ticket_number", value: 1 },
  });
  return counter.value;
}

// GET /api/portal/tickets - List customer's tickets
export async function GET(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { contactId: session.id };
    if (status && status !== "all") {
      where.status = status;
    }

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Failed to fetch tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

// POST /api/portal/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subject, description, priority } = body;

    if (!subject) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 }
      );
    }

    const ticketNumber = await getNextTicketNumber();

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject,
        description,
        priority: priority || "MEDIUM",
        status: "OPEN",
        source: "PORTAL",
        contactId: session.id,
      },
    });

    // Add the description as the first message if provided
    if (description) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          body: description,
          internal: false,
          authorType: "CONTACT",
          authorId: session.id,
          authorName: session.name || session.email,
          contactAuthorId: session.id,
        },
      });
    }

    // Run ticket created automations
    runTicketCreatedAutomations(ticket.id).catch((err) =>
      console.error("Failed to run ticket created automations:", err)
    );

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Failed to create ticket:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
