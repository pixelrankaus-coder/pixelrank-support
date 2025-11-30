import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getContactTickets } from "@/lib/actions";
import { TicketDetailClient } from "@/components/ticket-detail/ticket-detail-client";

// Ensure fresh data on every request (no caching)
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();

  const [ticket, agents, currentAgent, groups, availableTags] = await Promise.all([
    prisma.ticket.findUnique({
      where: { id },
      include: {
        contact: true,
        assignee: true,
        createdBy: true,
        group: true,
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            agentAuthor: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            contactAuthor: true,
            attachments: {
              select: {
                id: true,
                filename: true,
                originalName: true,
                mimeType: true,
                size: true,
                url: true,
              },
            },
          },
        },
        tags: {
          include: { tag: true },
        },
      },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, avatar: true },
    }),
    prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { id: true, name: true, email: true, avatar: true },
    }),
    prisma.group.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.tag.findMany({
      select: { id: true, name: true, color: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!ticket) {
    notFound();
  }

  // Get other tickets from the same contact for the timeline
  const contactTickets = ticket.contactId
    ? await getContactTickets(ticket.contactId)
    : [];

  return (
    <TicketDetailClient
      ticket={ticket}
      agents={agents}
      groups={groups}
      availableTags={availableTags}
      contactTickets={contactTickets}
      userId={session!.user.id}
      currentAgent={currentAgent}
    />
  );
}
