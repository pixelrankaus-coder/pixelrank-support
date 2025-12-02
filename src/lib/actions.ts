"use server";

import { prisma } from "./db";
import { revalidatePath } from "next/cache";
import { auth } from "./auth";
import { redirect } from "next/navigation";
import {
  sendTicketCreatedEmail,
  sendAgentReplyEmail,
  sendTicketResolvedEmail,
  sendTicketClosedEmail,
} from "./email";
import {
  runTicketCreatedAutomations,
  runTicketUpdatedAutomations,
} from "./automation-engine";

export async function getNextTicketNumber(): Promise<number> {
  // First, get the current max ticket number from tickets table
  const maxTicket = await prisma.ticket.findFirst({
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });
  const currentMax = maxTicket?.ticketNumber || 0;

  // Update counter to be at least currentMax + 1 and increment
  const counter = await prisma.counter.upsert({
    where: { id: "ticket_number" },
    update: {
      value: {
        increment: 1
      }
    },
    create: { id: "ticket_number", value: currentMax + 1 },
  });

  // If counter is behind the actual max, sync it
  if (counter.value <= currentMax) {
    const synced = await prisma.counter.update({
      where: { id: "ticket_number" },
      data: { value: currentMax + 1 },
    });
    return synced.value;
  }

  return counter.value;
}

export async function createTicket(data: {
  subject: string;
  description?: string;
  priority?: string;
  contactEmail?: string;
  contactName?: string;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const ticketNumber = await getNextTicketNumber();

  let contactId: string | undefined;

  if (data.contactEmail) {
    const contact = await prisma.contact.upsert({
      where: { email: data.contactEmail },
      update: { name: data.contactName || undefined },
      create: {
        email: data.contactEmail,
        name: data.contactName,
      },
    });
    contactId = contact.id;
  }

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber,
      subject: data.subject,
      description: data.description,
      priority: data.priority || "MEDIUM",
      contactId,
      createdById: session.user.id,
    },
    include: {
      contact: true,
    },
  });

  // Send ticket created email notification
  if (ticket.contact?.email) {
    sendTicketCreatedEmail(ticket).catch((err) =>
      console.error("Failed to send ticket created email:", err)
    );
  }

  // Run ticket created automations
  runTicketCreatedAutomations(ticket.id).catch((err) =>
    console.error("Failed to run ticket created automations:", err)
  );

  revalidatePath("/tickets");
  redirect(`/tickets/${ticket.id}`);
}

export async function updateTicket(
  ticketId: string,
  data: {
    status?: string;
    priority?: string;
    assigneeId?: string | null;
    contactId?: string | null;
  }
) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  // Get current ticket to check for changes and run automations
  const currentTicket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      status: true,
      priority: true,
      assigneeId: true,
      groupId: true,
      contactId: true
    },
  });

  const ticket = await prisma.ticket.update({
    where: { id: ticketId },
    data,
    include: {
      contact: true,
    },
  });

  // Send email notifications on status change
  if (data.status && currentTicket?.status !== data.status) {
    if (data.status === "RESOLVED" && ticket.contact?.email) {
      sendTicketResolvedEmail(ticket).catch((err) =>
        console.error("Failed to send ticket resolved email:", err)
      );
    } else if (data.status === "CLOSED" && ticket.contact?.email) {
      sendTicketClosedEmail(ticket).catch((err) =>
        console.error("Failed to send ticket closed email:", err)
      );
    }
  }

  // Run ticket updated automations
  runTicketUpdatedAutomations(ticketId, currentTicket || undefined).catch((err) =>
    console.error("Failed to run ticket updated automations:", err)
  );

  revalidatePath(`/tickets/${ticketId}`);
  revalidatePath("/tickets");
}

export async function addMessage(data: {
  ticketId: string;
  body: string;
  internal: boolean;
  authorType: string;
  authorId: string;
  attachmentIds?: string[];
}) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id: data.authorId },
    select: { name: true, email: true },
  });

  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: data.ticketId,
      body: data.body,
      internal: data.internal,
      authorType: data.authorType,
      authorId: data.authorId,
      authorName: user?.name || user?.email || "Agent",
      agentAuthorId: data.authorType === "AGENT" ? data.authorId : undefined,
    },
  });

  // Link attachments to the message
  if (data.attachmentIds && data.attachmentIds.length > 0) {
    await prisma.attachment.updateMany({
      where: { id: { in: data.attachmentIds } },
      data: { messageId: message.id },
    });
  }

  // Update ticket's updatedAt
  const ticket = await prisma.ticket.update({
    where: { id: data.ticketId },
    data: { updatedAt: new Date() },
    include: {
      contact: true,
    },
  });

  // Send email notification for agent replies (non-internal only)
  if (data.authorType === "AGENT" && !data.internal && ticket.contact?.email) {
    const agentName = user?.name || user?.email || "Support Agent";
    sendAgentReplyEmail(ticket, agentName, data.body).catch((err) =>
      console.error("Failed to send agent reply email:", err)
    );
  }

  revalidatePath(`/tickets/${data.ticketId}`);
}

export async function deleteTicket(ticketId: string) {
  const session = await auth();
  if (!session) {
    throw new Error("Unauthorized");
  }

  await prisma.ticket.delete({
    where: { id: ticketId },
  });

  revalidatePath("/tickets");
  redirect("/tickets");
}

export async function getContactTickets(contactId: string, limit: number = 6) {
  return prisma.ticket.findMany({
    where: { contactId },
    select: {
      id: true,
      ticketNumber: true,
      subject: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function createContact(data: {
  email: string;
  name?: string;
  title?: string;
  company?: string;
  workPhone?: string;
  facebook?: string;
  twitter?: string;
  companyId?: string;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const contact = await prisma.contact.create({
    data: {
      email: data.email,
      name: data.name || undefined,
      title: data.title || undefined,
      company: data.company || undefined,
      workPhone: data.workPhone || undefined,
      facebook: data.facebook || undefined,
      twitter: data.twitter || undefined,
      companyId: data.companyId || undefined,
    },
  });

  revalidatePath("/contacts");
  redirect(`/contacts/${contact.id}`);
}

export async function createCompany(data: { name: string; website?: string }) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const company = await prisma.company.create({
    data: {
      name: data.name,
      website: data.website || undefined,
    },
  });

  revalidatePath("/companies");
  redirect(`/companies/${company.id}`);
}
