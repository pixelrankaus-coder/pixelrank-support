"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { TicketViewId } from "@/app/(dashboard)/tickets/views";

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

interface TicketFiltersProps {
  agents: Agent[];
  currentView?: TicketViewId;
}

export function TicketFilters({ agents, currentView = "all" }: TicketFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      // Always preserve the view parameter
      if (currentView && currentView !== "all") {
        params.set("view", currentView);
      }
      if (value && value !== "ALL") {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams, currentView]
  );

  const handleFilterChange = (name: string, value: string) => {
    router.push(`/tickets?${createQueryString(name, value)}`);
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    if (currentView && currentView !== "all") {
      params.set("view", currentView);
    }
    router.push(`/tickets?${params.toString()}`);
  };

  const hasActiveFilters =
    searchParams.get("status") ||
    searchParams.get("priority") ||
    searchParams.get("assignee") ||
    searchParams.get("search");

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={searchParams.get("status") || "ALL"}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="PENDING">Pending</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={searchParams.get("priority") || "ALL"}
            onChange={(e) => handleFilterChange("priority", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assignee
          </label>
          <select
            value={searchParams.get("assignee") || "ALL"}
            onChange={(e) => handleFilterChange("assignee", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Assignees</option>
            <option value="UNASSIGNED">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name || agent.email}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            placeholder="Search by subject, description, or #"
            defaultValue={searchParams.get("search") || ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleFilterChange("search", e.currentTarget.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
