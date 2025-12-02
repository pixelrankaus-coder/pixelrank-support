"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type TabId = "messages" | "notes" | "activities";

interface TicketTabBarProps {
  messageCount: number;
  noteCount: number;
  activeTab?: TabId;
  onTabChange?: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; countKey: "messageCount" | "noteCount" | null }[] = [
  { id: "messages", label: "Messages", countKey: "messageCount" },
  { id: "notes", label: "Notes", countKey: "noteCount" },
  { id: "activities", label: "Activities", countKey: null },
];

export function TicketTabBar({
  messageCount,
  noteCount,
  activeTab = "messages",
  onTabChange,
}: TicketTabBarProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<TabId>(activeTab);

  const currentTab = onTabChange ? activeTab : internalActiveTab;

  const handleTabClick = (tabId: TabId) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };

  const getCount = (countKey: "messageCount" | "noteCount" | null): number | null => {
    if (!countKey) return null;
    if (countKey === "messageCount") return messageCount;
    if (countKey === "noteCount") return noteCount;
    return null;
  };

  return (
    <div className="bg-white border-b border-[#eaecf0]">
      <div className="flex items-center gap-0 px-4">
        {tabs.map((tab) => {
          const count = getCount(tab.countKey);
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                "relative px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "text-[#7e56d8]"
                  : "text-[#667085] hover:text-[#344054]"
              )}
            >
              <span className="flex items-center gap-1.5">
                {tab.label}
                {count !== null && count > 0 && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 text-xs rounded-full min-w-[20px] text-center",
                      isActive
                        ? "bg-[#f9f5ff] text-[#7e56d8]"
                        : "bg-[#f2f4f7] text-[#667085]"
                    )}
                  >
                    {count}
                  </span>
                )}
              </span>
              {/* Active indicator line */}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7e56d8]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
