import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-auth";
import {
  TicketIcon,
  PlusCircleIcon,
  ChatBubbleLeftIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { TicketFilters } from "./ticket-filters";

export default async function TicketsListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; priority?: string; search?: string; sort?: string }>;
}) {
  const session = await getCustomerSession();
  if (!session) return null;

  const params = await searchParams;
  const statusFilter = params.status;
  const priorityFilter = params.priority;
  const searchQuery = params.search;
  const sortOrder = params.sort || "newest";

  // Build where clause
  const where: any = { contactId: session.id };

  if (statusFilter && statusFilter !== "all") {
    where.status = statusFilter;
  }

  if (priorityFilter && priorityFilter !== "all") {
    where.priority = priorityFilter;
  }

  if (searchQuery) {
    where.OR = [
      { subject: { contains: searchQuery, mode: "insensitive" } },
      { ticketNumber: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  // Build order by
  let orderBy: any = { updatedAt: "desc" };
  switch (sortOrder) {
    case "oldest":
      orderBy = { createdAt: "asc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
    case "updated":
      orderBy = { updatedAt: "desc" };
      break;
    case "priority":
      orderBy = [
        { priority: "desc" },
        { updatedAt: "desc" },
      ];
      break;
  }

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy,
    include: {
      _count: {
        select: { messages: true },
      },
    },
  });

  // Get counts for each status
  const statusCounts = await prisma.ticket.groupBy({
    by: ["status"],
    where: { contactId: session.id },
    _count: true,
  });

  const counts = statusCounts.reduce((acc, item) => {
    acc[item.status] = item._count;
    return acc;
  }, {} as Record<string, number>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "RESOLVED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "CLOSED":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "text-red-600 bg-red-50";
      case "HIGH":
        return "text-orange-600 bg-orange-50";
      case "MEDIUM":
        return "text-amber-600 bg-amber-50";
      case "LOW":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const totalTickets = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
          <p className="text-gray-500 mt-1">
            {totalTickets} {totalTickets === 1 ? "ticket" : "tickets"} total
          </p>
        </div>
        <Link
          href="/portal/tickets/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <PlusCircleIcon className="w-5 h-5" />
          New Ticket
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Link
          href="/portal/tickets"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !statusFilter || statusFilter === "all"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100 border"
          }`}
        >
          All ({totalTickets})
        </Link>
        <Link
          href="/portal/tickets?status=OPEN"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "OPEN"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100 border"
          }`}
        >
          Open ({counts["OPEN"] || 0})
        </Link>
        <Link
          href="/portal/tickets?status=PENDING"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "PENDING"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100 border"
          }`}
        >
          Pending ({counts["PENDING"] || 0})
        </Link>
        <Link
          href="/portal/tickets?status=RESOLVED"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "RESOLVED"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100 border"
          }`}
        >
          Resolved ({counts["RESOLVED"] || 0})
        </Link>
        <Link
          href="/portal/tickets?status=CLOSED"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            statusFilter === "CLOSED"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100 border"
          }`}
        >
          Closed ({counts["CLOSED"] || 0})
        </Link>
      </div>

      {/* Filters */}
      <TicketFilters
        currentStatus={statusFilter}
        currentPriority={priorityFilter}
        currentSearch={searchQuery}
        currentSort={sortOrder}
      />

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center shadow-sm">
          <TicketIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery || statusFilter ? "No tickets found" : "No tickets yet"}
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            {searchQuery || statusFilter
              ? "Try adjusting your filters or search terms"
              : "Submit your first support ticket and we'll get back to you soon"}
          </p>
          {!searchQuery && !statusFilter && (
            <Link
              href="/portal/tickets/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <PlusCircleIcon className="w-5 h-5" />
              Submit a Ticket
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last Updated
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/portal/tickets/${ticket.id}`}
                        className="block group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-500 font-mono">
                            #{ticket.ticketNumber}
                          </span>
                          {ticket._count.messages > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                              <ChatBubbleLeftIcon className="w-3 h-3" />
                              {ticket._count.messages}
                            </span>
                          )}
                        </div>
                        <div className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                          {ticket.subject}
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-lg ${getPriorityColor(
                          ticket.priority
                        )}`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        {new Date(ticket.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List */}
          <div className="md:hidden divide-y divide-gray-100">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/portal/tickets/${ticket.id}`}
                className="block p-4 hover:bg-blue-50/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm text-gray-500 font-mono">
                        #{ticket.ticketNumber}
                      </span>
                      <span
                        className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 truncate">
                      {ticket.subject}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                      {ticket._count.messages > 0 && (
                        <span className="flex items-center gap-1">
                          <ChatBubbleLeftIcon className="w-3 h-3" />
                          {ticket._count.messages}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
