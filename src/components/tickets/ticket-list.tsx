"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  StarIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { TicketCard } from "./ticket-card";
import { BulkActionsToolbar } from "./bulk-actions-toolbar";
import { FiltersSidebar } from "./filters-sidebar";
import { updateTicket } from "@/lib/actions";

interface Ticket {
  id: string;
  ticketNumber: number;
  subject: string;
  status: string;
  priority: string;
  createdAt: Date;
  contact: {
    id: string;
    name: string | null;
    email: string;
    companyRef?: { name: string } | null;
  } | null;
  assignee: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

interface TicketListProps {
  tickets: Ticket[];
  agents: Agent[];
  viewName: string;
  totalCount: number;
}

export function TicketList({
  tickets,
  agents,
  viewName,
  totalCount,
}: TicketListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [sortBy, setSortBy] = useState("created");

  const handleSelectTicket = (id: string, selected: boolean) => {
    setSelectedTickets((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTickets(new Set(tickets.map((t) => t.id)));
    } else {
      setSelectedTickets(new Set());
    }
  };

  const handleUpdateTicket = async (
    id: string,
    data: { status?: string; priority?: string; assigneeId?: string | null }
  ) => {
    startTransition(async () => {
      try {
        await updateTicket(id, data);
        router.refresh();
      } catch (error) {
        console.error("Failed to update ticket:", error);
      }
    });
  };

  const handleBulkClose = () => {
    selectedTickets.forEach((id) => {
      handleUpdateTicket(id, { status: "CLOSED" });
    });
    setSelectedTickets(new Set());
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTickets.size} ticket(s)?`)) {
      return;
    }
    // Would need a bulk delete API
    alert("Bulk delete not implemented yet");
  };

  const handleBulkAssign = () => {
    // Would open an assign modal
    alert("Bulk assign not implemented yet");
  };

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <h1 className="text-lg font-semibold text-gray-900">{viewName}</h1>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="text-gray-400 hover:text-yellow-500"
            >
              {isFavorite ? (
                <StarIconSolid className="w-5 h-5 text-yellow-500" />
              ) : (
                <StarIcon className="w-5 h-5" />
              )}
            </button>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-sm rounded-full">
              {totalCount}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Sort dropdown */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border-none bg-transparent text-gray-900 font-medium focus:outline-none cursor-pointer"
              >
                <option value="created">Date created</option>
                <option value="updated">Last updated</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
              </select>
            </div>

            {/* View toggle */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-md p-0.5">
              <button
                onClick={() => setViewMode("card")}
                className={`p-1.5 rounded ${
                  viewMode === "card"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title="Card view"
              >
                <Squares2X2Icon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded ${
                  viewMode === "table"
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title="Table view"
              >
                <ListBulletIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Export */}
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export
            </button>

            {/* Pagination */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                1-{tickets.length} of {totalCount}
              </span>
              <button className="p-1 hover:bg-gray-100 rounded disabled:opacity-50" disabled>
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button className="p-1 hover:bg-gray-100 rounded disabled:opacity-50" disabled>
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md transition-colors ${
                showFilters
                  ? "bg-blue-50 border-blue-200 text-blue-600"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FunnelIcon className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Bulk actions toolbar */}
        <BulkActionsToolbar
          selectedCount={selectedTickets.size}
          onAssign={handleBulkAssign}
          onClose={handleBulkClose}
          onMerge={() => alert("Merge not implemented")}
          onSpam={() => alert("Mark as spam not implemented")}
          onDelete={handleBulkDelete}
        />

        {/* Ticket list */}
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Select all row */}
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={selectedTickets.size === tickets.length && tickets.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              Select all
            </label>
          </div>

          {/* Tickets */}
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <FunnelIcon className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No tickets found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                agents={agents}
                isSelected={selectedTickets.has(ticket.id)}
                onSelect={handleSelectTicket}
                onUpdateTicket={handleUpdateTicket}
              />
            ))
          )}
        </div>
      </div>

      {/* Filters sidebar */}
      <FiltersSidebar
        agents={agents}
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />
    </div>
  );
}
