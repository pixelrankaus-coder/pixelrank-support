"use client";

import { useState } from "react";
import Link from "next/link";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { getInitials } from "@/lib/utils";

interface TicketCardProps {
  ticket: {
    id: string;
    ticketNumber: number;
    subject: string;
    status: string;
    priority: string;
    createdAt: Date;
    contact: {
      id: string;
      name: string | null;
      email: string;
      companyRef?: { name: string } | null;
    } | null;
    assignee: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  };
  agents: { id: string; name: string | null; email: string }[];
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onUpdateTicket: (id: string, data: { status?: string; priority?: string; assigneeId?: string | null }) => void;
}

const statusOptions = [
  { value: "OPEN", label: "Open" },
  { value: "PENDING", label: "Pending" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const priorityOptions = [
  { value: "LOW", label: "Low", color: "bg-green-500" },
  { value: "MEDIUM", label: "Medium", color: "bg-blue-500" },
  { value: "HIGH", label: "High", color: "bg-orange-500" },
  { value: "URGENT", label: "Urgent", color: "bg-red-500" },
];

const avatarColors = [
  "bg-orange-400",
  "bg-blue-400",
  "bg-green-400",
  "bg-purple-400",
  "bg-pink-400",
  "bg-yellow-400",
  "bg-teal-400",
];

function getAvatarColor(name: string): string {
  const index = name.charCodeAt(0) % avatarColors.length;
  return avatarColors[index];
}


function getRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  if (days === 1) return "a day ago";
  return `${days} days ago`;
}

function isNewTicket(date: Date): boolean {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / 3600000);
  return hours < 24;
}

export function TicketCard({
  ticket,
  agents,
  isSelected,
  onSelect,
  onUpdateTicket,
}: TicketCardProps) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);

  const contactName = ticket.contact?.name || ticket.contact?.email || "Unknown";
  const companyName = ticket.contact?.companyRef?.name;
  const avatarColor = getAvatarColor(contactName);
  const initials = getInitials(ticket.contact?.name || ticket.contact?.email || "U");
  const isNew = isNewTicket(ticket.createdAt);

  const currentPriority = priorityOptions.find((p) => p.value === ticket.priority);
  const currentStatus = statusOptions.find((s) => s.value === ticket.status);

  return (
    <div
      className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${
        isSelected ? "bg-blue-50" : ""
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Checkbox */}
        <div className="pt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(ticket.id, e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
        </div>

        {/* Avatar */}
        <div
          className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-medium text-sm flex-shrink-0`}
        >
          {initials}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Status badge and subject */}
          <div className="flex items-center gap-2 mb-1">
            {isNew && (
              <span className="px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded">
                New
              </span>
            )}
            <Link
              href={`/tickets/${ticket.id}`}
              className="font-medium text-gray-900 hover:text-blue-600 truncate"
            >
              {ticket.subject}
            </Link>
            <span className="text-gray-400 text-sm">#{ticket.ticketNumber}</span>
          </div>

          {/* Contact info */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <EnvelopeIcon className="w-3.5 h-3.5" />
            <span className="font-medium text-gray-700">{contactName}</span>
            {companyName && (
              <span className="text-gray-400">({companyName})</span>
            )}
            <span className="text-gray-300">•</span>
            <span>Created: {getRelativeTime(ticket.createdAt)}</span>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-6 flex-shrink-0">
          {/* Priority dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
              onBlur={() => setTimeout(() => setShowPriorityDropdown(false), 150)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <span
                className={`w-2 h-2 rounded-full ${currentPriority?.color || "bg-gray-400"}`}
              />
              {currentPriority?.label || ticket.priority}
              <ChevronDownIcon className="w-3 h-3" />
            </button>
            {showPriorityDropdown && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onUpdateTicket(ticket.id, { priority: option.value });
                      setShowPriorityDropdown(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className={`w-2 h-2 rounded-full ${option.color}`} />
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Assignee dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
              onBlur={() => setTimeout(() => setShowAssigneeDropdown(false), 150)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 min-w-[100px]"
            >
              <span className="text-gray-400">👤</span>
              <span className="truncate max-w-[80px]">
                {ticket.assignee
                  ? ticket.assignee.name || ticket.assignee.email.split("@")[0]
                  : "--"}
              </span>
              <ChevronDownIcon className="w-3 h-3" />
            </button>
            {showAssigneeDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20 max-h-48 overflow-y-auto">
                <button
                  onClick={() => {
                    onUpdateTicket(ticket.id, { assigneeId: null });
                    setShowAssigneeDropdown(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Unassigned
                </button>
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      onUpdateTicket(ticket.id, { assigneeId: agent.id });
                      setShowAssigneeDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 truncate"
                  >
                    {agent.name || agent.email}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              onBlur={() => setTimeout(() => setShowStatusDropdown(false), 150)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <span className="text-blue-500">↗</span>
              {currentStatus?.label || ticket.status}
              <ChevronDownIcon className="w-3 h-3" />
            </button>
            {showStatusDropdown && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onUpdateTicket(ticket.id, { status: option.value });
                      setShowStatusDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
