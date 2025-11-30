"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";

interface TicketFiltersProps {
  currentStatus?: string;
  currentPriority?: string;
  currentSearch?: string;
  currentSort?: string;
}

export function TicketFilters({
  currentStatus,
  currentPriority,
  currentSearch,
  currentSort,
}: TicketFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch || "");
  const [showFilters, setShowFilters] = useState(false);

  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/portal/tickets?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams("search", search || null);
  };

  const clearSearch = () => {
    setSearch("");
    updateParams("search", null);
  };

  const clearAllFilters = () => {
    setSearch("");
    router.push("/portal/tickets");
  };

  const hasActiveFilters = currentStatus || currentPriority || currentSearch;

  return (
    <div className="mb-6 space-y-3">
      {/* Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets by subject or number..."
            className="w-full pl-10 pr-10 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </form>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-lg font-medium text-sm transition-colors ${
            showFilters || hasActiveFilters
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <FunnelIcon className="w-5 h-5" />
          Filters
          {hasActiveFilters && (
            <span className="w-5 h-5 bg-blue-600 text-white rounded-full text-xs flex items-center justify-center">
              {[currentStatus, currentPriority, currentSearch].filter(Boolean).length}
            </span>
          )}
        </button>

        {/* Sort Dropdown */}
        <div className="relative">
          <select
            value={currentSort || "newest"}
            onChange={(e) => updateParams("sort", e.target.value)}
            className="appearance-none pl-10 pr-8 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 font-medium text-sm cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="updated">Recently Updated</option>
            <option value="priority">Priority</option>
          </select>
          <ArrowsUpDownIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <div className="flex flex-wrap gap-4">
            {/* Priority Filter */}
            <div className="flex-1 min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Priority
              </label>
              <select
                value={currentPriority || "all"}
                onChange={(e) => updateParams("priority", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Priorities</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Active filters:</span>
          {currentSearch && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Search: {currentSearch}
              <button
                onClick={() => {
                  setSearch("");
                  updateParams("search", null);
                }}
                className="hover:text-blue-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </span>
          )}
          {currentPriority && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              Priority: {currentPriority}
              <button
                onClick={() => updateParams("priority", null)}
                className="hover:text-blue-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
