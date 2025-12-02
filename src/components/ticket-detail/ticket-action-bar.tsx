"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ArrowLeftIcon,
  ArrowUturnLeftIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  BoltIcon,
  ClockIcon,
  EyeIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";

interface TicketActionBarProps {
  ticketId: string;
  ticketNumber: number;
  subject: string;
  status: string;
  contactId?: string | null;
  onSelectAction?: (action: "reply" | "note") => void;
  onClose?: () => void;
  onDelete?: () => void;
  onCreateTask?: () => void;
  isPending?: boolean;
}

// Button styles matching the design spec - h-9 (36px) to match back button
const actionButtonClass =
  "inline-flex items-center gap-1.5 px-3 h-9 text-sm font-medium text-[#344054] bg-white border border-[#d0d5dd] rounded-md hover:bg-[#f9fafb] transition-colors";

const iconButtonClass =
  "inline-flex items-center justify-center w-9 h-9 text-[#667085] bg-white border border-[#d0d5dd] rounded-md hover:bg-[#f9fafb] transition-colors";

export function TicketActionBar({
  ticketNumber,
  onSelectAction,
  onCreateTask,
}: TicketActionBarProps) {
  const router = useRouter();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="h-14 bg-white border-b border-[#eaecf0] px-4 flex items-center gap-2">
      {/* Back button - 32px circle to visually align with 36px rectangular buttons */}
      <button
        onClick={handleBack}
        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#d0d5dd] text-[#344054] hover:bg-[#f9fafb] transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
      </button>

      {/* Action buttons - all use h-9 (36px) for consistent alignment */}
      <button
        onClick={() => onSelectAction?.("reply")}
        className={actionButtonClass}
      >
        <ArrowUturnLeftIcon className="w-4 h-4 text-[#667085]" />
        Reply
      </button>

      <button
        onClick={() => onSelectAction?.("note")}
        className={actionButtonClass}
      >
        <DocumentTextIcon className="w-4 h-4 text-[#667085]" />
        Add Note
      </button>

      <button className={actionButtonClass}>
        <ArrowRightIcon className="w-4 h-4 text-[#667085]" />
        Forward
      </button>

      <button className={actionButtonClass}>
        <BoltIcon className="w-4 h-4 text-[#667085]" />
        Macros
      </button>

      <button className={actionButtonClass}>
        <ClockIcon className="w-4 h-4 text-[#667085]" />
        Log Work
      </button>

      <button className={actionButtonClass}>
        <EyeIcon className="w-4 h-4 text-[#667085]" />
        Watchers
      </button>

      {/* More button - icon only */}
      <div className="relative">
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className={iconButtonClass}
        >
          <EllipsisHorizontalIcon className="w-4 h-4" />
        </button>

        {showMoreMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMoreMenu(false)}
            />
            <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-[#d0d5dd] rounded-lg shadow-lg z-20 py-1">
              <button
                onClick={() => setShowMoreMenu(false)}
                className="w-full px-4 py-2 text-sm text-left text-[#344054] hover:bg-[#f9fafb]"
              >
                Print
              </button>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="w-full px-4 py-2 text-sm text-left text-[#344054] hover:bg-[#f9fafb]"
              >
                Export
              </button>
              <hr className="my-1 border-[#eaecf0]" />
              <button
                onClick={() => setShowMoreMenu(false)}
                className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Create dropdown button - green */}
      <div className="relative">
        <button
          onClick={() => setShowCreateMenu(!showCreateMenu)}
          className="inline-flex items-center gap-1.5 px-3 h-9 text-sm font-medium text-white bg-[#16a34a] border border-[#16a34a] rounded-md hover:bg-[#15803d] transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Create
          <ChevronDownIcon className="w-3.5 h-3.5" />
        </button>

        {showCreateMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowCreateMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#d0d5dd] rounded-lg shadow-lg z-20 py-1">
              <button
                onClick={() => {
                  setShowCreateMenu(false);
                  onCreateTask?.();
                }}
                className="w-full px-4 py-2 text-sm text-left text-[#344054] hover:bg-[#f9fafb]"
              >
                Task
              </button>
              <button
                onClick={() => setShowCreateMenu(false)}
                className="w-full px-4 py-2 text-sm text-left text-[#344054] hover:bg-[#f9fafb]"
              >
                Child Ticket
              </button>
              <button
                onClick={() => setShowCreateMenu(false)}
                className="w-full px-4 py-2 text-sm text-left text-[#344054] hover:bg-[#f9fafb]"
              >
                Linked Ticket
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
