import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-auth";
import {
  TicketIcon,
  PlusCircleIcon,
  ClockIcon,
  CheckCircleIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

export default async function PortalDashboardPage() {
  const session = await getCustomerSession();
  if (!session) return null;

  const [tickets, recentTickets] = await Promise.all([
    prisma.ticket.groupBy({
      by: ["status"],
      where: { contactId: session.id },
      _count: true,
    }),
    prisma.ticket.findMany({
      where: { contactId: session.id },
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        priority: true,
        updatedAt: true,
        _count: { select: { messages: true } },
      },
    }),
  ]);

  const statusCounts = tickets.reduce(
    (acc, t) => {
      acc[t.status] = t._count;
      return acc;
    },
    {} as Record<string, number>
  );

  const openCount = statusCounts["OPEN"] || 0;
  const pendingCount = statusCounts["PENDING"] || 0;
  const resolvedCount = statusCounts["RESOLVED"] || 0;
  const closedCount = statusCounts["CLOSED"] || 0;
  const totalCount = openCount + pendingCount + resolvedCount + closedCount;
  const activeCount = openCount + pendingCount;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "PENDING":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "RESOLVED":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "CLOSED":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === "URGENT" || priority === "HIGH") {
      return <ExclamationCircleIcon className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 md:p-8 mb-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {getGreeting()}{session.name ? `, ${session.name.split(" ")[0]}` : ""}!
            </h1>
            <p className="mt-2 text-blue-100">
              {activeCount > 0
                ? `You have ${activeCount} active ticket${activeCount !== 1 ? "s" : ""}`
                : "How can we help you today?"}
            </p>
          </div>
          <Link
            href="/portal/tickets/new"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-sm"
          >
            <PlusCircleIcon className="w-5 h-5" />
            New Ticket
          </Link>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link
          href="/portal/tickets/new"
          className="group flex items-center gap-4 p-5 bg-white rounded-xl border shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
            <PlusCircleIcon className="w-6 h-6 text-blue-600 group-hover:text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Submit a Ticket</h3>
            <p className="text-sm text-gray-500">Get help from our team</p>
          </div>
        </Link>

        <Link
          href="/portal/tickets"
          className="group flex items-center gap-4 p-5 bg-white rounded-xl border shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-600 transition-colors">
            <TicketIcon className="w-6 h-6 text-purple-600 group-hover:text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">My Tickets</h3>
            <p className="text-sm text-gray-500">{totalCount} total tickets</p>
          </div>
        </Link>

        <Link
          href="/help"
          className="group flex items-center gap-4 p-5 bg-white rounded-xl border shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-600 transition-colors">
            <BookOpenIcon className="w-6 h-6 text-green-600 group-hover:text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Knowledge Base</h3>
            <p className="text-sm text-gray-500">Browse help articles</p>
          </div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <TicketIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{totalCount}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Total</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{openCount}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Open</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Pending</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">{resolvedCount + closedCount}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Resolved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-5 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
          <Link
            href="/portal/tickets"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
        {recentTickets.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TicketIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tickets yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Submit your first support ticket and we&apos;ll get back to you as soon as possible
            </p>
            <Link
              href="/portal/tickets/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <PlusCircleIcon className="w-5 h-5" />
              New Ticket
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/portal/tickets/${ticket.id}`}
                className="flex items-center justify-between p-4 hover:bg-blue-50/50 transition-colors group"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="hidden sm:flex w-10 h-10 bg-gray-100 rounded-lg items-center justify-center shrink-0 group-hover:bg-blue-100">
                    <TicketIcon className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm text-gray-500 font-mono">
                        #{ticket.ticketNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(
                          ticket.status
                        )}`}
                      >
                        {ticket.status}
                      </span>
                      {getPriorityIcon(ticket.priority)}
                    </div>
                    <h3 className="font-medium text-gray-900 truncate group-hover:text-blue-600">
                      {ticket.subject}
                    </h3>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className="text-sm text-gray-600">
                    {new Date(ticket.updatedAt).toLocaleDateString()}
                  </div>
                  {ticket._count.messages > 0 && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {ticket._count.messages} message{ticket._count.messages !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
