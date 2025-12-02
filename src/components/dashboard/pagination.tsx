"use client";

import { cn } from "@/lib/utils";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
import type { PaginationInfo } from "@/types/dashboard";

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

export function Pagination({ pagination, onPageChange }: PaginationProps) {
  const { page, totalPages, totalItems } = pagination;

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-[#e2e8f0]">
      {/* Left: Page buttons */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={!canGoPrev}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-md border border-[#e2e8f0] transition-colors",
            canGoPrev
              ? "hover:bg-[#f1f5f9] text-[#1e293b]"
              : "text-[#cbd5e1] cursor-not-allowed"
          )}
        >
          <ChevronDoubleLeftIcon className="w-4 h-4" />
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoPrev}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-md border border-[#e2e8f0] transition-colors",
            canGoPrev
              ? "hover:bg-[#f1f5f9] text-[#1e293b]"
              : "text-[#cbd5e1] cursor-not-allowed"
          )}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (page <= 3) {
            pageNum = i + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = page - 2 + i;
          }

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors",
                page === pageNum
                  ? "bg-[#6366f1] text-white border border-[#6366f1]"
                  : "border border-[#e2e8f0] text-[#1e293b] hover:bg-[#f1f5f9]"
              )}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next page */}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoNext}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-md border border-[#e2e8f0] transition-colors",
            canGoNext
              ? "hover:bg-[#f1f5f9] text-[#1e293b]"
              : "text-[#cbd5e1] cursor-not-allowed"
          )}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={!canGoNext}
          className={cn(
            "w-8 h-8 flex items-center justify-center rounded-md border border-[#e2e8f0] transition-colors",
            canGoNext
              ? "hover:bg-[#f1f5f9] text-[#1e293b]"
              : "text-[#cbd5e1] cursor-not-allowed"
          )}
        >
          <ChevronDoubleRightIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Page info */}
      <div className="text-sm text-[#64748b]">
        {page} of {totalPages} pages ({totalItems} item{totalItems !== 1 ? "s" : ""})
      </div>
    </div>
  );
}
