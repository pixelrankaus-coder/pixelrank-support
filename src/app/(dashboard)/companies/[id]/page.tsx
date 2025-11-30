import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { CompanyDetailClient } from "@/components/companies/company-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;

  const company = await prisma.company.findUnique({
    where: { id },
    include: {
      contacts: {
        include: {
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
      },
    },
  });

  if (!company) {
    notFound();
  }

  // Collect all tickets from all contacts
  const allTickets = company.contacts.flatMap((contact) =>
    contact.tickets.map((ticket) => ({
      ...ticket,
      contactName: contact.name,
      contactEmail: contact.email,
    }))
  );

  // Separate open and closed tickets
  const openTickets = allTickets.filter((t) => t.status !== "CLOSED");
  const closedTickets = allTickets.filter((t) => t.status === "CLOSED");

  return (
    <CompanyDetailClient
      company={company}
      contacts={company.contacts}
      openTickets={openTickets}
      closedTickets={closedTickets}
    />
  );
}
