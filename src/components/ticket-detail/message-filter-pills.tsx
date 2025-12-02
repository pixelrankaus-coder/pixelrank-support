"use client";

import { cn } from "@/lib/utils";

type FilterType = "all" | "replies" | "notes";

interface MessageFilterPillsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  replyCount: number;
  noteCount: number;
}

export function MessageFilterPills({
  activeFilter,
  onFilterChange,
  replyCount,
  noteCount,
}: MessageFilterPillsProps) {
  const totalCount = replyCount + noteCount;

  const filters: { id: FilterType; label: string; count: number }[] = [
    { id: "all", label: "All", count: totalCount },
    { id: "replies", label: "Replies", count: replyCount },
    { id: "notes", label: "Notes", count: noteCount },
  ];

  return (
    <div className="flex items-center gap-2 mb-4">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-colors",
            activeFilter === filter.id
              ? "bg-[#f9f5ff] text-[#7e56d8] border border-[#7e56d8]"
              : "bg-white text-[#667085] border border-[#d0d5dd] hover:bg-[#f9fafb]"
          )}
        >
          {filter.label}
          {filter.count > 0 && (
            <span
              className={cn(
                "px-1.5 py-0.5 text-xs rounded-full min-w-[20px] text-center",
                activeFilter === filter.id
                  ? "bg-[#7e56d8] text-white"
                  : "bg-[#f2f4f7] text-[#667085]"
              )}
            >
              {filter.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
