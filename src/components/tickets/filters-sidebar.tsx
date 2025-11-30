"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

interface FiltersSidebarProps {
  agents: Agent[];
  isOpen: boolean;
  onClose: () => void;
}

export function FiltersSidebar({ agents, isOpen, onClose }: FiltersSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [localFilters, setLocalFilters] = useState({
    search: searchParams.get("search") || "",
    agent: searchParams.get("assignee") || "",
    status: searchParams.get("status") || "",
    priority: searchParams.get("priority") || "",
    created: searchParams.get("created") || "",
  });

  const statusTags = searchParams.get("status")?.split(",").filter(Boolean) || [];

  const applyFilters = () => {
    const params = new URLSearchParams();

    if (localFilters.search) params.set("search", localFilters.search);
    if (localFilters.agent) params.set("assignee", localFilters.agent);
    if (localFilters.status) params.set("status", localFilters.status);
    if (localFilters.priority) params.set("priority", localFilters.priority);
    if (localFilters.created) params.set("created", localFilters.created);

    router.push(`/tickets?${params.toString()}`);
  };

  const removeStatusTag = (status: string) => {
    const newTags = statusTags.filter((s) => s !== status);
    const params = new URLSearchParams(searchParams.toString());
    if (newTags.length > 0) {
      params.set("status", newTags.join(","));
    } else {
      params.delete("status");
    }
    router.push(`/tickets?${params.toString()}`);
  };

  const showAppliedFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view");
    return params.toString().length > 0;
  };

  if (!isOpen) return null;

  return (
    <div className="w-72 border-l border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">FILTERS</h3>
        <button
          onClick={onClose}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Show applied filters
        </button>
      </div>

      {/* Filters */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Search fields */}
        <div>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search fields"
              value={localFilters.search}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, search: e.target.value })
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Agents Include */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Agents Include
          </label>
          <select
            value={localFilters.agent}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, agent: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any agent</option>
            <option value="UNASSIGNED">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name || agent.email}
              </option>
            ))}
          </select>
        </div>

        {/* Groups Include - placeholder */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Groups Include
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled
          >
            <option value="">Any group</option>
          </select>
        </div>

        {/* Created */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Created
          </label>
          <select
            value={localFilters.created}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, created: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any time</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last7days">Last 7 days</option>
            <option value="last30days">Last 30 days</option>
          </select>
        </div>

        {/* Status Include */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status Include
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {statusTags.map((status) => (
              <span
                key={status}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
              >
                {status === "OPEN,PENDING" ? "All unresolved" : status}
                <button
                  onClick={() => removeStatusTag(status)}
                  className="hover:text-blue-600"
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <select
            value={localFilters.status}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, status: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any status</option>
            <option value="OPEN">Open</option>
            <option value="PENDING">Pending</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="OPEN,PENDING">All unresolved</option>
          </select>
        </div>

        {/* Priorities Include */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priorities Include
          </label>
          <select
            value={localFilters.priority}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, priority: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Apply button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={applyFilters}
          className="w-full py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
