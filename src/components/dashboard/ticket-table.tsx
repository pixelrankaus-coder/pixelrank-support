"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import type { DashboardTicket, TicketStatus } from "@/types/dashboard";

const statusStyles: Record<TicketStatus, { bg: string; text: string }> = {
  open: { bg: "bg-[#dcfce7]", text: "text-[#16a34a]" },
  pending: { bg: "bg-[#fef3c7]", text: "text-[#d97706]" },
  on_hold: { bg: "bg-[#fef3c7]", text: "text-[#d97706]" },
  closed: { bg: "bg-[#f3f4f6]", text: "text-[#6b7280]" },
};

const statusLabels: Record<TicketStatus, string> = {
  open: "Open",
  pending: "Pending",
  on_hold: "On Hold",
  closed: "Closed",
};

// Column definitions with labels and widths
const COLUMN_CONFIG: Record<string, { label: string; width?: string }> = {
  ticket_id: { label: "Ticket ID", width: "w-[100px]" },
  subject: { label: "Subject" },
  created_on: { label: "Created On", width: "w-[180px]" },
  status: { label: "Status", width: "w-[100px]" },
  brand: { label: "Brand", width: "w-[120px]" },
  contact: { label: "Contact", width: "w-[150px]" },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

interface TicketTableProps {
  tickets: DashboardTicket[];
  onRowClick?: (ticketId: number) => void;
  visibleColumns?: string[];
}

const DEFAULT_COLUMNS = ["ticket_id", "subject", "created_on", "status", "brand"];

export function TicketTable({ tickets, onRowClick, visibleColumns = DEFAULT_COLUMNS }: TicketTableProps) {
  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <UserCircleIcon className="w-12 h-12 text-[#cbd5e1] mb-4" />
        <h3 className="text-lg font-medium text-[#1e293b] mb-1">
          No pending tickets
        </h3>
        <p className="text-sm text-[#64748b] text-center">
          You&apos;re all caught up! Check other tabs for more tickets.
        </p>
      </div>
    );
  }

  // Render cell content based on column id
  const renderCell = (ticket: DashboardTicket, columnId: string) => {
    const style = statusStyles[ticket.status];

    switch (columnId) {
      case "ticket_id":
        return (
          <Link
            href={`/tickets/${ticket.id}`}
            className="text-sm font-medium text-[#6366f1] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {ticket.id}
          </Link>
        );
      case "subject":
        return (
          <span className="text-sm text-[#1e293b]">
            {ticket.subject}
          </span>
        );
      case "created_on":
        return (
          <span className="text-sm text-[#64748b]">
            {formatDate(ticket.createdAt)}
          </span>
        );
      case "status":
        return (
          <span
            className={cn(
              "inline-flex px-2 py-0.5 text-xs font-medium rounded",
              style.bg,
              style.text
            )}
          >
            {statusLabels[ticket.status]}
          </span>
        );
      case "brand":
        return (
          <span className="text-sm text-[#1e293b]">{ticket.brand}</span>
        );
      case "contact":
        return (
          <span className="text-sm text-[#1e293b]">{ticket.contact?.name || "-"}</span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
            {visibleColumns.map((columnId) => {
              const config = COLUMN_CONFIG[columnId];
              if (!config) return null;
              return (
                <th
                  key={columnId}
                  className={cn(
                    "text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider",
                    config.width
                  )}
                >
                  {config.label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-[#e2e8f0]">
          {tickets.map((ticket) => (
            <tr
              key={ticket.id}
              onClick={() => onRowClick?.(ticket.id)}
              className="hover:bg-[#f1f5f9] cursor-pointer transition-colors"
            >
              {visibleColumns.map((columnId) => (
                <td key={columnId} className="px-4 py-3">
                  {renderCell(ticket, columnId)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
