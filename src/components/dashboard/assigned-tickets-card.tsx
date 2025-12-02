"use client";

import { InformationCircleIcon } from "@heroicons/react/24/outline";
import type { DashboardStats } from "@/types/dashboard";

interface StatItemProps {
  label: string;
  value: number;
  hasInfo?: boolean;
}

function StatItem({ label, value, hasInfo }: StatItemProps) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1">
        <span className="text-xs font-normal text-[#667085]">{label}</span>
        {hasInfo && (
          <InformationCircleIcon className="w-3.5 h-3.5 text-[#98a1b2]" />
        )}
      </div>
      <span className="text-[36px] font-bold text-[#101828] leading-tight mt-2">
        {value}
      </span>
    </div>
  );
}

interface AssignedTicketsCardProps {
  stats: DashboardStats;
}

export function AssignedTicketsCard({ stats }: AssignedTicketsCardProps) {
  return (
    <div className="bg-white border border-[#eaecf0] rounded-lg p-6">
      <div className="grid grid-cols-4">
        <div className="flex justify-center">
          <StatItem label="Pending" value={stats.pending} />
        </div>
        <div className="flex justify-center">
          <StatItem label="On Hold" value={stats.onHold} />
        </div>
        <div className="flex justify-center">
          <StatItem label="Resolution Due" value={stats.resolutionDue} hasInfo />
        </div>
        <div className="flex justify-center">
          <StatItem label="Response Due" value={stats.responseDue} hasInfo />
        </div>
      </div>
    </div>
  );
}
