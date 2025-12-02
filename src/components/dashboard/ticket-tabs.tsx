"use client";

import { cn } from "@/lib/utils";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import type { TicketTab, TabConfig } from "@/types/dashboard";

interface TicketTabsProps {
  activeTab: TicketTab;
  onTabChange: (tab: TicketTab) => void;
  tabs: TabConfig[];
}

export function TicketTabs({ activeTab, onTabChange, tabs }: TicketTabsProps) {
  return (
    <div className="border-b border-[#e2e8f0] overflow-x-auto">
      <div className="flex min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-[#6366f1] text-[#6366f1]"
                : "border-transparent text-[#64748b] hover:text-[#1e293b] hover:border-[#e2e8f0]"
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-1.5 py-0.5 text-xs rounded",
                  activeTab === tab.id
                    ? "bg-[#eef2ff] text-[#6366f1]"
                    : "bg-[#f1f5f9] text-[#64748b]"
                )}
              >
                {tab.count}
              </span>
            )}
            {tab.hasInfo && (
              <InformationCircleIcon className="w-3.5 h-3.5 text-[#94a3b8]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
