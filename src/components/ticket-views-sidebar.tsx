"use client";

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

  const viewsSection = getViewsBySection("views");
  const otherSection = getViewsBySection("other");

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="h-16 px-4 flex items-center border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Tickets</h2>
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
