import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getNextTicketNumber } from "@/lib/actions";
import { runTicketCreatedAutomations, runTicketUpdatedAutomations } from "@/lib/automation-engine";

interface InboundEmail {
  from: string;
  fromName?: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
}

/**
 * POST /api/webhooks/email
 * Webhook endpoint for receiving inbound emails (from services like SendGrid, Mailgun, etc.)
 * This creates a new ticket or adds a reply to an existing ticket
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the incoming email data
    const contentType = request.headers.get("content-type") || "";
    let emailData: InboundEmail;

    console.log("[Email Webhook] Received request with content-type:", contentType);

    if (contentType.includes("application/json")) {
      emailData = await request.json();
      console.log("[Email Webhook] Parsed as JSON");
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      // Handle form data (common for email webhooks like Mailgun)
      const formData = await request.formData();

      // Log all form fields for debugging
      const formFields: Record<string, string> = {};
      formData.forEach((value, key) => {
        formFields[key] = typeof value === 'string' ? value.substring(0, 100) : '[File]';
      });
      console.log("[Email Webhook] Form fields received:", Object.keys(formFields).join(", "));

      emailData = {
        from: formData.get("from") as string || formData.get("sender") as string || "",
        fromName: formData.get("from_name") as string || undefined,
        to: formData.get("to") as string || formData.get("recipient") as string || "",
        subject: formData.get("subject") as string || "",
        text: formData.get("text") as string || formData.get("body-plain") as string || undefined,
        html: formData.get("html") as string || formData.get("body-html") as string || undefined,
      };
      console.log("[Email Webhook] Parsed form data - from:", emailData.from, "subject:", emailData.subject);
    } else {
      // Try to parse as form data first (Mailgun default), then JSON
      console.log("[Email Webhook] Unknown content-type, trying form data first");
      try {
        const formData = await request.formData();
        emailData = {
          from: formData.get("from") as string || formData.get("sender") as string || "",
          fromName: formData.get("from_name") as string || undefined,
          to: formData.get("to") as string || formData.get("recipient") as string || "",
          subject: formData.get("subject") as string || "",
          text: formData.get("text") as string || formData.get("body-plain") as string || undefined,
          html: formData.get("html") as string || formData.get("body-html") as string || undefined,
        };
        console.log("[Email Webhook] Successfully parsed as form data");
      } catch {
        // If form data parsing fails, try JSON
        console.log("[Email Webhook] Form data failed, trying JSON");
        emailData = await request.json();
      }
    }

    // Validate required fields
    if (!emailData.from || !emailData.subject) {
      return NextResponse.json(
        { error: "Missing required fields: from and subject" },
        { status: 400 }
      );
    }

    // Extract email address from "Name <email@example.com>" format
    const emailMatch = emailData.from.match(/<([^>]+)>/) || [null, emailData.from];
    const senderEmail = emailMatch[1]?.trim().toLowerCase() || emailData.from.toLowerCase();
    const senderName = emailData.fromName || emailData.from.replace(/<[^>]+>/, "").trim() || undefined;

    // Check if this is a reply to an existing ticket by looking for ticket number in subject
    // Format: Re: [Ticket #123] Original Subject
    const ticketNumberMatch = emailData.subject.match(/\[Ticket #(\d+)\]/i);

    if (ticketNumberMatch) {
      // This is a reply to an existing ticket
      const ticketNumber = parseInt(ticketNumberMatch[1], 10);

      const existingTicket = await prisma.ticket.findFirst({
        where: { ticketNumber },
        include: { contact: true },
      });

      if (existingTicket) {
        // Add reply as a message - prefer HTML for rich formatting and images
        const messageBody = emailData.html || emailData.text || "";
        await prisma.ticketMessage.create({
          data: {
            ticketId: existingTicket.id,
            body: messageBody,
            internal: false,
            authorType: "CONTACT",
            authorId: existingTicket.contactId || "unknown",
            authorName: senderName || senderEmail,
          },
        });

        // Update ticket's updatedAt and potentially reopen if closed
        const previousStatus = existingTicket.status;
        const newStatus = existingTicket.status === "CLOSED" ? "OPEN" : existingTicket.status;

        await prisma.ticket.update({
          where: { id: existingTicket.id },
          data: {
            updatedAt: new Date(),
            status: newStatus,
          },
        });

        // Run ticket updated automations if status changed
        if (previousStatus !== newStatus) {
          runTicketUpdatedAutomations(existingTicket.id, { status: previousStatus }).catch((err) =>
            console.error("Failed to run ticket updated automations:", err)
          );
        }

        return NextResponse.json({
          success: true,
          action: "reply_added",
          ticketId: existingTicket.id,
          ticketNumber: existingTicket.ticketNumber,
        });
      }
    }

    // Create or find the contact
    const contact = await prisma.contact.upsert({
      where: { email: senderEmail },
      update: { name: senderName || undefined },
      create: {
        email: senderEmail,
        name: senderName,
      },
    });

    // Get the next ticket number
    const ticketNumber = await getNextTicketNumber();

    // Prefer HTML for rich formatting and images
    const emailBody = emailData.html || emailData.text || "";

    // Create a new ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject: emailData.subject.replace(/^(Re:|Fwd?:)\s*/i, "").trim(),
        description: emailBody,
        priority: "MEDIUM",
        status: "OPEN",
        source: "EMAIL",
        contactId: contact.id,
      },
    });

    // Add the initial message
    await prisma.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        body: emailBody,
        internal: false,
        authorType: "CONTACT",
        authorId: contact.id,
        authorName: senderName || senderEmail,
      },
    });

    // Run ticket created automations
    runTicketCreatedAutomations(ticket.id).catch((err) =>
      console.error("Failed to run ticket created automations:", err)
    );

    return NextResponse.json({
      success: true,
      action: "ticket_created",
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
    });
  } catch (error) {
    console.error("Failed to process inbound email:", error);
    return NextResponse.json(
      { error: "Failed to process email" },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification (some services require this)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Handle different verification methods
  // SendGrid webhook verification
  const challenge = searchParams.get("challenge");
  if (challenge) {
    return NextResponse.json({ challenge });
  }

  // Mailgun webhook verification
  const timestamp = searchParams.get("timestamp");
  const token = searchParams.get("token");
  if (timestamp && token) {
    return new NextResponse("OK", { status: 200 });
  }

  return NextResponse.json({
    status: "Email webhook endpoint is active",
    usage: "POST emails to this endpoint to create tickets automatically"
  });
}
