"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ViewColumnsIcon,
} from "@heroicons/react/24/outline";

type StatusFilter = "pending" | "hold" | null;
type SortOption = "created_desc" | "created_asc" | "updated_desc" | "updated_asc";

// Available columns for the ticket table (only columns we have data for)
const ALL_COLUMNS = [
  { id: "ticket_id", label: "Ticket ID" },
  { id: "subject", label: "Subject" },
  { id: "created_on", label: "Created On" },
  { id: "status", label: "Status" },
  { id: "brand", label: "Brand" },
  { id: "contact", label: "Contact" },
];

const DEFAULT_COLUMNS = ["subject", "created_on", "status", "brand"];
const MAX_COLUMNS = 15;

interface DashboardToolbarProps {
  onSearch: (query: string) => void;
  onStatusFilter: (status: StatusFilter) => void;
  onSortChange: (sort: SortOption) => void;
  activeStatus: StatusFilter;
  currentSort: SortOption;
  visibleColumns?: string[];
  onColumnsChange?: (columns: string[]) => void;
}

const sortLabels: Record<SortOption, string> = {
  created_desc: "Created - Desc",
  created_asc: "Created - Asc",
  updated_desc: "Updated - Desc",
  updated_asc: "Updated - Asc",
};

export function DashboardToolbar({
  onSearch,
  onStatusFilter,
  onSortChange,
  activeStatus,
  currentSort,
  visibleColumns = DEFAULT_COLUMNS,
  onColumnsChange,
}: DashboardToolbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [showColumnsDropdown, setShowColumnsDropdown] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState("");
  const [tempSelectedColumns, setTempSelectedColumns] = useState<string[]>(visibleColumns);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  // Filter columns based on search
  const filteredColumns = useMemo(() => {
    if (!columnSearchQuery) return ALL_COLUMNS;
    return ALL_COLUMNS.filter((col) =>
      col.label.toLowerCase().includes(columnSearchQuery.toLowerCase())
    );
  }, [columnSearchQuery]);

  const handleColumnToggle = (columnId: string) => {
    setTempSelectedColumns((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      } else if (prev.length < MAX_COLUMNS) {
        return [...prev, columnId];
      }
      return prev;
    });
  };

  const handleApplyColumns = () => {
    onColumnsChange?.(tempSelectedColumns);
    setShowColumnsDropdown(false);
  };

  const handleCancelColumns = () => {
    setTempSelectedColumns(visibleColumns);
    setColumnSearchQuery("");
    setShowColumnsDropdown(false);
  };

  const openColumnsDropdown = () => {
    setTempSelectedColumns(visibleColumns);
    setColumnSearchQuery("");
    setShowColumnsDropdown(true);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[#f8fafc] border-b border-[#e2e8f0]">
      {/* Left: Search and Status Pills */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Search by Title or ID"
            value={searchQuery}
            onChange={handleSearch}
            className="pl-9 pr-3 py-2 text-sm border border-[#cbd5e1] rounded-md w-[200px] focus:outline-none focus:border-[#6366f1] focus:ring-[3px] focus:ring-[#eef2ff]"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onStatusFilter(activeStatus === "pending" ? null : "pending")
            }
            className={cn(
              "px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors",
              activeStatus === "pending"
                ? "bg-[#eef2ff] text-[#6366f1]"
                : "bg-white border border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1]"
            )}
          >
            Pending
          </button>
          <button
            onClick={() =>
              onStatusFilter(activeStatus === "hold" ? null : "hold")
            }
            className={cn(
              "px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors",
              activeStatus === "hold"
                ? "bg-[#eef2ff] text-[#6366f1]"
                : "bg-white border border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1]"
            )}
          >
            Hold
          </button>
        </div>
      </div>

      {/* Right: Sort and Columns */}
      <div className="flex items-center gap-2">
        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSortDropdown(!showSortDropdown)}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-white border border-[#e2e8f0] rounded-md text-[#1e293b] hover:border-[#cbd5e1]"
          >
            <span>{sortLabels[currentSort]}</span>
            <ChevronDownIcon className="w-4 h-4 text-[#64748b]" />
          </button>

          {showSortDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSortDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg py-1 min-w-[160px] z-20">
                {Object.entries(sortLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      onSortChange(key as SortOption);
                      setShowSortDropdown(false);
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-sm text-left hover:bg-[#f1f5f9]",
                      currentSort === key
                        ? "text-[#6366f1] font-medium"
                        : "text-[#1e293b]"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Columns Dropdown */}
        <div className="relative">
          <button
            onClick={openColumnsDropdown}
            className="flex items-center gap-1 px-3 py-2 text-sm bg-white border border-[#e2e8f0] rounded-md text-[#1e293b] hover:border-[#cbd5e1]"
          >
            <ViewColumnsIcon className="w-4 h-4" />
            <span>Columns</span>
            <ChevronDownIcon className="w-4 h-4 text-[#64748b]" />
          </button>

          {showColumnsDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={handleCancelColumns}
              />
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg z-20 w-[280px]">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e8f0]">
                  <div>
                    <h3 className="text-sm font-semibold text-[#101828]">Choose Columns</h3>
                    <p className="text-xs text-[#667085] mt-0.5">
                      Maximum {tempSelectedColumns.length}/{MAX_COLUMNS} fields
                    </p>
                  </div>
                  <button className="text-sm text-[#6366f1] hover:underline font-medium">
                    Reorder
                  </button>
                </div>

                {/* Search */}
                <div className="px-4 py-3 border-b border-[#e2e8f0]">
                  <input
                    type="text"
                    placeholder="Search Column"
                    value={columnSearchQuery}
                    onChange={(e) => setColumnSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[#d0d5dd] rounded-md focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]"
                  />
                </div>

                {/* Column list - scrollable */}
                <div className="max-h-[320px] overflow-y-auto py-1">
                  {filteredColumns.map((col) => {
                    const isSelected = tempSelectedColumns.includes(col.id);
                    const isDisabled = !isSelected && tempSelectedColumns.length >= MAX_COLUMNS;
                    return (
                      <div
                        key={col.id}
                        onClick={() => !isDisabled && handleColumnToggle(col.id)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 text-sm",
                          isDisabled
                            ? "text-[#98a2b3] cursor-not-allowed"
                            : "text-[#344054] hover:bg-[#f9fafb] cursor-pointer"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => {}}
                          className="w-4 h-4 rounded border-[#d0d5dd] text-[#6366f1] focus:ring-[#6366f1] disabled:opacity-50 pointer-events-none"
                        />
                        <span>{col.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Footer with buttons */}
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#e2e8f0]">
                  <button
                    onClick={handleCancelColumns}
                    className="px-4 py-2 text-sm font-medium text-[#344054] bg-white border border-[#d0d5dd] rounded-lg hover:bg-[#f9fafb]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyColumns}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#6366f1] rounded-lg hover:bg-[#4f46e5]"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
