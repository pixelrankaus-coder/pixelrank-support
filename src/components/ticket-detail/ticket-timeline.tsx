import Link from "next/link";
import { cn, formatDate, getStatusColor } from "@/lib/utils";
import { TicketIcon } from "@heroicons/react/24/outline";

interface TimelineTicket {
  id: string;
  ticketNumber: number;
  subject: string;
  status: string;
  createdAt: Date;
}

interface TicketTimelineProps {
  tickets: TimelineTicket[];
  currentTicketId: string;
}

export function TicketTimeline({ tickets, currentTicketId }: TicketTimelineProps) {
  // Filter out current ticket and limit to 5
  const otherTickets = tickets
    .filter((t) => t.id !== currentTicketId)
    .slice(0, 5);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-900 text-sm">Recent tickets</h3>
      </div>
      <div className="p-2">
        {otherTickets.length === 0 ? (
          <div className="p-4 text-center">
            <TicketIcon className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No other tickets</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {otherTickets.map((ticket) => (
              <li key={ticket.id}>
                <Link
                  href={`/tickets/${ticket.id}`}
                  className="block px-3 py-2.5 hover:bg-gray-50 rounded transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {ticket.subject}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          #{ticket.ticketNumber}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0",
                        getStatusColor(ticket.status)
                      )}
                    >
                      {ticket.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
