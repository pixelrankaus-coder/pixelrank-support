"use client";

import { cn } from "@/lib/utils";
import type { ViewType } from "@/types/dashboard";

interface ViewToggleProps {
  value: ViewType;
  onChange: (value: ViewType) => void;
}

const viewOptions: { value: ViewType; label: string }[] = [
  { value: "my_tickets", label: "My Tickets" },
  { value: "my_groups", label: "My Groups" },
  { value: "agent", label: "Agent" },
];

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-[#f8fafc]">
      <div className="flex items-center gap-4">
        {viewOptions.map((option) => (
          <label
            key={option.value}
            className="flex items-center gap-2 cursor-pointer"
          >
            <input
              type="radio"
              name="view-toggle"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="w-4 h-4 text-[#6366f1] border-[#cbd5e1] focus:ring-[#6366f1] focus:ring-offset-0"
            />
            <span className="text-sm font-medium text-[#1e293b]">
              {option.label}
            </span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button className="text-sm text-[#6366f1] hover:underline">
          Requested Approvals (0)
        </button>
        <button className="text-sm text-[#6366f1] hover:underline">
          Pending Approvals (0)
        </button>
        <button className="text-sm text-[#6366f1] hover:underline">
          Pending Activities (0)
        </button>
      </div>
    </div>
  );
}
