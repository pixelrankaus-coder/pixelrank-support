import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import { uploadAttachment, getTicketAttachments } from "@/lib/storage";
import { prisma } from "@/lib/db";

// POST /api/portal/attachments - Upload a file (customer)
export async function POST(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const ticketId = formData.get("ticketId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Verify ticket belongs to customer
    if (ticketId) {
      const ticket = await prisma.ticket.findFirst({
        where: { id: ticketId, contactId: session.id },
      });

      if (!ticket) {
        return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
      }
    }

    const result = await uploadAttachment(file, {
      ticketId: ticketId || undefined,
      uploadedById: session.id,
      uploadedByType: "CONTACT",
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.attachment);
  } catch (error) {
    console.error("Failed to upload attachment:", error);
    return NextResponse.json(
      { error: "Failed to upload attachment" },
      { status: 500 }
    );
  }
}

// GET /api/portal/attachments?ticketId=xxx - Get attachments for a ticket
export async function GET(request: NextRequest) {
  try {
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json(
        { error: "ticketId is required" },
        { status: 400 }
      );
    }

    // Verify ticket belongs to customer
    const ticket = await prisma.ticket.findFirst({
      where: { id: ticketId, contactId: session.id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const attachments = await getTicketAttachments(ticketId);
    return NextResponse.json(attachments);
  } catch (error) {
    console.error("Failed to get attachments:", error);
    return NextResponse.json(
      { error: "Failed to get attachments" },
      { status: 500 }
    );
  }
}
