import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-auth";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { TicketMessages } from "./ticket-messages";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCustomerSession();
  if (!session) return null;

  const { id } = await params;

  const ticket = await prisma.ticket.findFirst({
    where: {
      id,
      contactId: session.id,
    },
    include: {
      messages: {
        where: { internal: false },
        orderBy: { createdAt: "asc" },
      },
      assignee: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  // Serialize messages for client component
  const serializedMessages = ticket.messages.map((msg) => ({
    ...msg,
    createdAt: msg.createdAt.toISOString(),
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "LOW":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link
          href="/portal/tickets"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to tickets
        </Link>
      </div>

      {/* Ticket Header */}
      <div className="bg-white rounded-lg border mb-6">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm text-gray-500">
                  Ticket #{ticket.ticketNumber}
                </span>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(
                    ticket.status
                  )}`}
                >
                  {ticket.status}
                </span>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(
                    ticket.priority
                  )}`}
                >
                  {ticket.priority}
                </span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                {ticket.subject}
              </h1>
            </div>
          </div>

          {ticket.description && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>
          )}

          <div className="mt-4 pt-4 border-t flex items-center gap-6 text-sm text-gray-500">
            <div>
              <span className="font-medium">Created:</span>{" "}
              {new Date(ticket.createdAt).toLocaleString()}
            </div>
            {ticket.assignee && (
              <div>
                <span className="font-medium">Agent:</span>{" "}
                {ticket.assignee.name || ticket.assignee.email}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <TicketMessages
        ticketId={ticket.id}
        initialMessages={serializedMessages}
        customerName={session.name || session.email}
        isClosed={ticket.status === "CLOSED"}
      />
    </div>
  );
}
