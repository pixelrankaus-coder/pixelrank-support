import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ContactDetailClient } from "@/components/contacts/contact-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ContactDetailPage({ params }: PageProps) {
  const { id } = await params;

  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      companyRef: {
        select: { id: true, name: true },
      },
      tickets: {
        orderBy: { createdAt: "desc" },
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: {
              authorType: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  if (!contact) {
    notFound();
  }

  // Separate open and closed tickets
  const openTickets = contact.tickets.filter(
    (t) => t.status !== "CLOSED"
  );
  const closedTickets = contact.tickets.filter(
    (t) => t.status === "CLOSED"
  );

  return (
    <ContactDetailClient
      contact={contact}
      openTickets={openTickets}
      closedTickets={closedTickets}
    />
  );
}
