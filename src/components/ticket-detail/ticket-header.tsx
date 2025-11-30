"use client";

import Link from "next/link";
import { cn, getStatusColor, getPriorityColor } from "@/lib/utils";
import {
  ChatBubbleLeftIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/24/outline";

interface TicketHeaderProps {
  ticket: {
    id: string;
    ticketNumber: number;
    subject: string;
    status: string;
    priority: string;
  };
  onReplyClick: () => void;
  onNoteClick: () => void;
  onCloseClick: () => void;
  onDeleteClick?: () => void;
  isPending?: boolean;
}

export function TicketHeader({
  ticket,
  onReplyClick,
  onNoteClick,
  onCloseClick,
  onDeleteClick,
  isPending,
}: TicketHeaderProps) {
  const isClosed = ticket.status === "CLOSED" || ticket.status === "RESOLVED";

  return (
    <div className="bg-white border-b border-gray-200">
      {/* Breadcrumb */}
      <div className="px-6 py-3 border-b border-gray-100">
        <nav className="flex items-center text-sm">
          <Link
            href="/tickets"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            All tickets
          </Link>
          <span className="mx-2 text-gray-400">&gt;</span>
          <span className="text-gray-600">#{ticket.ticketNumber}</span>
        </nav>
      </div>

      {/* Subject and badges */}
      <div className="px-6 py-4">
        <div className="flex items-start justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            {ticket.subject}
          </h1>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <span
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-full",
                getStatusColor(ticket.status)
              )}
            >
              {ticket.status}
            </span>
            <span
              className={cn(
                "px-3 py-1 text-sm font-medium rounded-full",
                getPriorityColor(ticket.priority)
              )}
            >
              {ticket.priority}
            </span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="px-6 py-2 bg-gray-50 border-t border-gray-100 flex items-center gap-1">
        <button
          onClick={onReplyClick}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <ChatBubbleLeftIcon className="w-4 h-4" />
          Reply
        </button>
        <button
          onClick={onNoteClick}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <PencilSquareIcon className="w-4 h-4" />
          Add note
        </button>
        <button
          disabled
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed"
          title="Coming soon"
        >
          <ArrowUturnLeftIcon className="w-4 h-4" />
          Forward
        </button>

        <div className="flex-1" />

        {!isClosed && (
          <button
            onClick={onCloseClick}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            <CheckCircleIcon className="w-4 h-4" />
            Close
          </button>
        )}

        <button
          disabled
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed"
          title="Coming soon"
        >
          <ArrowsRightLeftIcon className="w-4 h-4" />
          Merge
        </button>

        {onDeleteClick && (
          <button
            onClick={onDeleteClick}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
