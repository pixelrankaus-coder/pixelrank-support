"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateTicket } from "@/lib/actions";
import { XMarkIcon, PlusIcon, ClockIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { formatDistanceToNow, isPast, differenceInMinutes } from "date-fns";

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

interface Group {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface TicketTag {
  tag: Tag;
}

interface PropertiesCardProps {
  ticket: {
    id: string;
    status: string;
    priority: string;
    assigneeId: string | null;
    groupId?: string | null;
    tags?: TicketTag[];
    firstResponseDue?: Date | null;
    resolutionDue?: Date | null;
    firstRespondedAt?: Date | null;
    resolvedAt?: Date | null;
  };
  agents: Agent[];
  groups?: Group[];
  availableTags?: Tag[];
  onStatusChange?: (newStatus: string) => void;
}

function SLAIndicator({
  label,
  dueDate,
  completedAt,
}: {
  label: string;
  dueDate: Date | null | undefined;
  completedAt: Date | null | undefined;
}) {
  if (!dueDate) return null;

  const isCompleted = !!completedAt;
  const isOverdue = !isCompleted && isPast(new Date(dueDate));
  const minutesRemaining = differenceInMinutes(new Date(dueDate), new Date());

  let statusColor = "text-green-600 bg-green-50";
  let statusText = formatDistanceToNow(new Date(dueDate), { addSuffix: true });

  if (isCompleted) {
    statusColor = "text-gray-500 bg-gray-50";
    statusText = "Completed";
  } else if (isOverdue) {
    statusColor = "text-red-600 bg-red-50";
    statusText = `Overdue by ${formatDistanceToNow(new Date(dueDate))}`;
  } else if (minutesRemaining <= 60) {
    statusColor = "text-orange-600 bg-orange-50";
  }

  return (
    <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md ${statusColor}`}>
      {isOverdue && !isCompleted ? (
        <ExclamationTriangleIcon className="w-4 h-4" />
      ) : (
        <ClockIcon className="w-4 h-4" />
      )}
      <div className="text-xs">
        <div className="font-medium">{label}</div>
        <div>{statusText}</div>
      </div>
    </div>
  );
}

export function PropertiesCard({
  ticket,
  agents,
  groups = [],
  availableTags = [],
  onStatusChange,
}: PropertiesCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showTagDropdown, setShowTagDropdown] = useState(false);

  const handleChange = (field: string, value: string) => {
    startTransition(async () => {
      await updateTicket(ticket.id, { [field]: value || null });
      if (field === "status" && onStatusChange) {
        onStatusChange(value);
      }
      router.refresh();
    });
  };

  const handleAddTag = async (tagId: string) => {
    setShowTagDropdown(false);
    startTransition(async () => {
      await fetch(`/api/tickets/${ticket.id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tagId }),
      });
      router.refresh();
    });
  };

  const handleRemoveTag = async (tagId: string) => {
    startTransition(async () => {
      await fetch(`/api/tickets/${ticket.id}/tags/${tagId}`, {
        method: "DELETE",
      });
      router.refresh();
    });
  };

  const currentTagIds = ticket.tags?.map((t) => t.tag.id) || [];
  const availableToAdd = availableTags.filter((t) => !currentTagIds.includes(t.id));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-900 text-sm">Properties</h3>
      </div>
      <div className="p-4 space-y-4">
        {/* SLA Indicators */}
        {(ticket.firstResponseDue || ticket.resolutionDue) && (
          <div className="space-y-2">
            <SLAIndicator
              label="First Response"
              dueDate={ticket.firstResponseDue}
              completedAt={ticket.firstRespondedAt}
            />
            <SLAIndicator
              label="Resolution"
              dueDate={ticket.resolutionDue}
              completedAt={ticket.resolvedAt}
            />
          </div>
        )}

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
            Status
          </label>
          <select
            value={ticket.status}
            onChange={(e) => handleChange("status", e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
          >
            <option value="OPEN">Open</option>
            <option value="PENDING">Pending</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
            Priority
          </label>
          <select
            value={ticket.priority}
            onChange={(e) => handleChange("priority", e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        {/* Group */}
        {groups.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
              Group
            </label>
            <select
              value={ticket.groupId || ""}
              onChange={(e) => handleChange("groupId", e.target.value)}
              disabled={isPending}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
            >
              <option value="">No group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Assignee */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
            Agent
          </label>
          <select
            value={ticket.assigneeId || ""}
            onChange={(e) => handleChange("assigneeId", e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
          >
            <option value="">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name || agent.email}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">
            Tags
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {ticket.tags?.map(({ tag }) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: tag.color || "#6B7280" }}
              >
                {tag.name}
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  className="hover:opacity-75"
                  disabled={isPending}
                >
                  <XMarkIcon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              disabled={isPending || availableToAdd.length === 0}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              <PlusIcon className="w-3 h-3" />
              Add tag
            </button>
            {showTagDropdown && availableToAdd.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto min-w-[150px]">
                {availableToAdd.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddTag(tag.id)}
                    className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color || "#6B7280" }}
                    />
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Loading indicator */}
        {isPending && (
          <div className="text-xs text-blue-600">Saving...</div>
        )}
      </div>
    </div>
  );
}
