"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  StarIcon as StarOutline,
  ArrowUturnLeftIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  BoltIcon,
  EllipsisVerticalIcon,
  ChevronDownIcon,
  PlusIcon,
  ChevronLeftIcon,
  EllipsisHorizontalIcon,
  ChevronRightIcon,
  ArrowsPointingOutIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

interface TicketActionBarProps {
  ticketId: string;
  ticketNumber: number;
  subject: string;
  status: string;
  contactId?: string | null;
  companyId?: string | null;
  onSelectAction?: (action: "reply" | "note") => void;
  onClose?: () => void;
  onDelete?: () => void;
  onCreateTask?: () => void;
  isPending?: boolean;
}

// Shared button styles
const buttonBase =
  "inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const buttonWithLabel = "px-3 py-1.5";
const buttonIconOnly = "p-1.5";

export function TicketActionBar({
  ticketId,
  ticketNumber,
  subject,
  status,
  contactId,
  companyId,
  onSelectAction,
  onClose,
  onDelete,
  onCreateTask,
  isPending,
}: TicketActionBarProps) {
  const router = useRouter();
  const [isStarred, setIsStarred] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const isClosed = status === "CLOSED" || status === "RESOLVED";

  const handleStar = () => {
    setIsStarred(!isStarred);
    // TODO: Persist star/watch status to backend
    console.log("Toggle star:", !isStarred);
  };

  const handleForward = () => {
    // TODO: Implement forward functionality
    console.log("Forward clicked");
  };

  const handleMerge = () => {
    // TODO: Implement merge functionality
    console.log("Merge clicked");
  };

  const handleApp = () => {
    // TODO: Implement app/plugin functionality
    console.log("App/Plugin clicked");
  };

  return (
    <div className="bg-slate-50 border-b border-slate-200">
      {/* Breadcrumb */}
      <div className="px-4 py-2 border-b border-slate-100">
        <nav className="flex items-center text-sm">
          <Link
            href="/tickets?view=all"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            All tickets
          </Link>
          <span className="mx-2 text-slate-400">&gt;</span>
          <span className="text-slate-600 font-medium">#{ticketNumber}</span>
        </nav>
      </div>

      {/* Action bar */}
      <div className="px-4 py-2 flex items-center gap-1">
        {/* Left group - Action buttons */}
        <div className="flex items-center gap-1">
          {/* Star/Watch */}
          <button
            onClick={handleStar}
            className={cn(buttonBase, buttonIconOnly)}
            title={isStarred ? "Unwatch" : "Watch"}
          >
            {isStarred ? (
              <StarSolid className="w-4 h-4 text-yellow-500" />
            ) : (
              <StarOutline className="w-4 h-4" />
            )}
          </button>

          {/* Reply */}
          <button
            onClick={() => onSelectAction?.("reply")}
            className={cn(buttonBase, buttonWithLabel)}
          >
            <ArrowUturnLeftIcon className="w-4 h-4" />
            Reply
          </button>

          {/* Add note */}
          <button
            onClick={() => onSelectAction?.("note")}
            className={cn(buttonBase, buttonWithLabel)}
          >
            <DocumentTextIcon className="w-4 h-4" />
            Add note
          </button>

          {/* Create Task */}
          <button
            onClick={onCreateTask}
            className={cn(buttonBase, buttonWithLabel)}
            title="Create a task from this ticket"
          >
            <ClipboardDocumentListIcon className="w-4 h-4" />
            Task
          </button>

          {/* Forward */}
          <button
            onClick={handleForward}
            className={cn(buttonBase, buttonWithLabel, "text-slate-400")}
            title="Coming soon"
          >
            <ArrowRightIcon className="w-4 h-4" />
            Forward
          </button>

          {/* Close */}
          {!isClosed && (
            <button
              onClick={onClose}
              disabled={isPending}
              className={cn(
                buttonBase,
                buttonWithLabel,
                "text-green-700 border-green-200 hover:bg-green-50"
              )}
            >
              <CheckCircleIcon className="w-4 h-4" />
              Close
            </button>
          )}

          {/* Merge */}
          <button
            onClick={handleMerge}
            className={cn(buttonBase, buttonWithLabel, "text-slate-400")}
            title="Coming soon"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Merge
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            disabled={isPending}
            className={cn(
              buttonBase,
              buttonWithLabel,
              "text-red-600 border-red-200 hover:bg-red-50"
            )}
          >
            <TrashIcon className="w-4 h-4" />
            Delete
          </button>

          {/* App/Plugin */}
          <button
            onClick={handleApp}
            className={cn(buttonBase, buttonIconOnly, "text-slate-400")}
            title="Apps"
          >
            <BoltIcon className="w-4 h-4" />
          </button>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={cn(buttonBase, buttonIconOnly)}
            >
              <EllipsisVerticalIcon className="w-4 h-4" />
            </button>

            {showMoreMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMoreMenu(false)}
                />
                {/* Dropdown menu */}
                <div className="absolute left-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg z-20">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        console.log("Execute scenarios");
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-50"
                    >
                      Execute scenarios
                    </button>
                    <button
                      onClick={() => {
                        console.log("Log time");
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-50"
                    >
                      Log time
                    </button>
                    <button
                      onClick={() => {
                        console.log("Edit ticket details");
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-50"
                    >
                      Edit ticket details
                    </button>
                    <button
                      onClick={() => {
                        window.print();
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-slate-700 hover:bg-slate-50"
                    >
                      Print
                    </button>
                    <hr className="my-1 border-slate-100" />
                    <button
                      onClick={() => {
                        console.log("Mark as spam");
                        setShowMoreMenu(false);
                      }}
                      className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                    >
                      Spam
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Flexible spacer */}
        <div className="flex-1" />

        {/* Right group - Thread/Activity/Navigation controls */}
        <div className="flex items-center gap-1">
          {/* Threads dropdown */}
          <button
            onClick={() => console.log("Threads clicked")}
            className={cn(buttonBase, buttonWithLabel)}
          >
            Threads
            <ChevronDownIcon className="w-3 h-3" />
          </button>

          {/* New thread */}
          <button
            onClick={() => console.log("New thread clicked")}
            className={cn(buttonBase, buttonIconOnly)}
            title="New thread"
          >
            <PlusIcon className="w-4 h-4" />
          </button>

          {/* Show activities */}
          <button
            onClick={() => console.log("Show activities clicked")}
            className={cn(buttonBase, buttonWithLabel)}
          >
            Show activities
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* Navigation: Prev */}
          <button
            onClick={() => console.log("Previous ticket")}
            className={cn(buttonBase, buttonIconOnly)}
            title="Previous ticket"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>

          {/* Navigation: More */}
          <button
            onClick={() => console.log("Ticket navigation menu")}
            className={cn(buttonBase, buttonIconOnly)}
            title="More options"
          >
            <EllipsisHorizontalIcon className="w-4 h-4" />
          </button>

          {/* Navigation: Next */}
          <button
            onClick={() => console.log("Next ticket")}
            className={cn(buttonBase, buttonIconOnly)}
            title="Next ticket"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>

          {/* Separator */}
          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* Expand/Fullscreen */}
          <button
            onClick={() => console.log("Toggle fullscreen")}
            className={cn(buttonBase, buttonIconOnly)}
            title="Expand"
          >
            <ArrowsPointingOutIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
