"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  TicketIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  UserIcon,
  HandRaisedIcon,
  EyeIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { getViewsBySection, TicketViewId } from "@/app/(dashboard)/tickets/views";

// Pin icon SVG component - pushpin style
function PinIcon({ className, filled }: { className?: string; filled?: boolean }) {
  if (filled) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
      >
        <path d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z"
      />
    </svg>
  );
}

// Icon mapping for each view
const VIEW_ICONS: Record<TicketViewId, React.ComponentType<{ className?: string }>> = {
  all: TicketIcon,
  undelivered: EnvelopeIcon,
  unresolved: ExclamationCircleIcon,
  my_open: UserIcon,
  raised: HandRaisedIcon,
  watching: EyeIcon,
  archive: ArchiveBoxIcon,
  spam: ExclamationTriangleIcon,
  trash: TrashIcon,
};

export function TicketViewsSidebar() {
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view") || "all";
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const viewsSection = getViewsBySection("views");
  const otherSection = getViewsBySection("other");

  // Collapsed state - fully hidden, just show expand button
  if (isCollapsed) {
    return (
      <aside className="w-7 bg-white border-r border-gray-200 flex flex-col h-full">
        {/* Header with expand button only - no border-b to avoid misalignment */}
        <div className="h-14 flex items-center justify-center">
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1 text-[#667085] hover:text-[#344054] hover:bg-[#f9fafb] rounded"
            title="Expand sidebar"
          >
            <span className="text-sm font-medium">&raquo;</span>
          </button>
        </div>
      </aside>
    );
  }

  // Expanded state
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header - no border-b to avoid misalignment with main content */}
      <div className="h-14 px-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Tickets</h2>
        <button
          onClick={() => {
            if (isPinned) {
              setIsPinned(false);
              setIsCollapsed(true);
            } else {
              setIsPinned(true);
            }
          }}
          className={cn(
            "p-1.5 rounded transition-colors",
            isPinned
              ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              : "text-[#667085] hover:text-[#344054] hover:bg-[#f9fafb]"
          )}
          title={isPinned ? "Unpin sidebar" : "Pin sidebar open"}
        >
          <PinIcon className="w-4 h-4" filled={isPinned} />
        </button>
      </div>

      {/* Views list */}
      <nav className="flex-1 overflow-y-auto py-2">
        {/* Views Section */}
        <div className="px-3 py-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-3">
            Views
          </p>
          <ul className="space-y-0.5">
            {viewsSection.map((view) => {
              const Icon = VIEW_ICONS[view.id];
              const isActive = currentView === view.id;

              return (
                <li key={view.id}>
                  <Link
                    href={`/tickets?view=${view.id}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0",
                        isActive ? "text-blue-600" : "text-gray-400"
                      )}
                    />
                    <span className="truncate">{view.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Other Section */}
        <div className="px-3 py-2 mt-2 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-3 pt-2">
            Other
          </p>
          <ul className="space-y-0.5">
            {otherSection.map((view) => {
              const Icon = VIEW_ICONS[view.id];
              const isActive = currentView === view.id;

              return (
                <li key={view.id}>
                  <Link
                    href={`/tickets?view=${view.id}`}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0",
                        isActive ? "text-blue-600" : "text-gray-400"
                      )}
                    />
                    <span className="truncate">{view.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </aside>
  );
}
