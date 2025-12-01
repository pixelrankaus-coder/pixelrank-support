"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  SparklesIcon,
  ChartBarIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ApprovalStatus } from "@prisma/client";

// Claude AI Avatar component
function ClaudeAvatar({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} rounded-full bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-sm`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-5 h-5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 2L13.09 8.26L18 5L14.74 10.91L21 12L14.74 13.09L18 19L13.09 15.74L12 22L10.91 15.74L6 19L9.26 13.09L3 12L9.26 10.91L6 5L10.91 8.26L12 2Z"
          fill="white"
          stroke="white"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

interface AIUser {
  id: string;
  name: string | null;
  email: string;
  isAiAgent: boolean;
}

interface ApprovedBy {
  id: string;
  name: string | null;
  email: string;
}

interface TicketRef {
  id: string;
  ticketNumber: number;
  subject: string;
}

interface TaskRef {
  id: string;
  title: string;
}

interface AIAction {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  aiUserId: string;
  aiModel: string | null;
  aiReasoning: string | null;
  aiConfidence: number | null;
  inputContext: string | null;
  outputData: string | null;
  approvalStatus: ApprovalStatus;
  approvedById: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  ticketId: string | null;
  taskId: string | null;
  contactId: string | null;
  companyId: string | null;
  durationMs: number | null;
  success: boolean;
  errorMessage: string | null;
  createdAt: string;
  aiUser: AIUser;
  approvedBy: ApprovedBy | null;
  ticket: TicketRef | null;
  task: TaskRef | null;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  autoApproved: number;
  approvalRate: string;
}

interface AIActionsClientProps {
  stats: Stats;
  initialActions: AIAction[];
}

export function AIActionsClient({ stats, initialActions }: AIActionsClientProps) {
  const router = useRouter();
  const [actions, setActions] = useState(initialActions);
  const [filter, setFilter] = useState<ApprovalStatus | "ALL">("ALL");
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredActions = filter === "ALL"
    ? actions
    : actions.filter((a) => a.approvalStatus === filter);

  const handleApprove = async (actionId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/ai-actions/${actionId}/approve`, {
          method: "POST",
        });

        if (res.ok) {
          router.refresh();
          // Update local state
          setActions((prev) =>
            prev.map((a) =>
              a.id === actionId
                ? { ...a, approvalStatus: "APPROVED" as ApprovalStatus }
                : a
            )
          );
        }
      } catch (error) {
        console.error("Failed to approve action:", error);
      }
    });
  };

  const handleReject = async (actionId: string) => {
    const reason = prompt("Enter rejection reason (optional):");

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/ai-actions/${actionId}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        });

        if (res.ok) {
          router.refresh();
          // Update local state
          setActions((prev) =>
            prev.map((a) =>
              a.id === actionId
                ? { ...a, approvalStatus: "REJECTED" as ApprovalStatus }
                : a
            )
          );
        }
      } catch (error) {
        console.error("Failed to reject action:", error);
      }
    });
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircleIcon className="w-3 h-3" />
            Approved
          </span>
        );
      case "AUTO_APPROVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
            <SparklesIcon className="w-3 h-3" />
            Auto-Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <XCircleIcon className="w-3 h-3" />
            Rejected
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
            <ClockIcon className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      TASK_CREATED: "Task Created",
      NOTE_ADDED: "Note Added",
      TICKET_REPLY_SENT: "Ticket Reply",
      INTERNAL_NOTE_ADDED: "Internal Note",
      TICKET_CREATED: "Ticket Created",
    };
    return labels[action] || action.replace(/_/g, " ");
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClaudeAvatar className="w-10 h-10" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Actions</h1>
            <p className="text-sm text-gray-500">Monitor and approve Claude AI actions</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
            <ChartBarIcon className="w-4 h-4" />
            Total Actions
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white rounded-lg border border-amber-200 p-4 bg-amber-50">
          <div className="flex items-center gap-2 text-amber-600 text-sm mb-1">
            <ClockIcon className="w-4 h-4" />
            Pending
          </div>
          <div className="text-2xl font-bold text-amber-700">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-lg border border-green-200 p-4 bg-green-50">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
            <CheckCircleIcon className="w-4 h-4" />
            Approved
          </div>
          <div className="text-2xl font-bold text-green-700">{stats.approved}</div>
        </div>
        <div className="bg-white rounded-lg border border-emerald-200 p-4 bg-emerald-50">
          <div className="flex items-center gap-2 text-emerald-600 text-sm mb-1">
            <SparklesIcon className="w-4 h-4" />
            Auto-Approved
          </div>
          <div className="text-2xl font-bold text-emerald-700">{stats.autoApproved}</div>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-4 bg-red-50">
          <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
            <XCircleIcon className="w-4 h-4" />
            Rejected
          </div>
          <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 p-1 inline-flex">
        {[
          { value: "ALL", label: "All" },
          { value: "PENDING", label: "Pending" },
          { value: "APPROVED", label: "Approved" },
          { value: "AUTO_APPROVED", label: "Auto-Approved" },
          { value: "REJECTED", label: "Rejected" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as ApprovalStatus | "ALL")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === tab.value
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
            {tab.value === "PENDING" && stats.pending > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs bg-amber-500 text-white rounded-full">
                {stats.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Actions List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Related To
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredActions.map((action) => (
              <>
                <tr
                  key={action.id}
                  className={`hover:bg-gray-50 ${
                    action.approvalStatus === "PENDING" ? "bg-amber-50/30" : ""
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <ClaudeAvatar className="w-6 h-6" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {getActionLabel(action.action)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {action.entityType}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {action.ticket && (
                      <Link
                        href={`/tickets/${action.ticket.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        #{action.ticket.ticketNumber}: {action.ticket.subject.substring(0, 30)}...
                      </Link>
                    )}
                    {action.task && (
                      <Link
                        href={`/tasks/${action.task.id}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Task: {action.task.title.substring(0, 30)}...
                      </Link>
                    )}
                    {!action.ticket && !action.task && (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {action.aiConfidence != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              action.aiConfidence >= 0.8
                                ? "bg-green-500"
                                : action.aiConfidence >= 0.5
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${action.aiConfidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">
                          {Math.round(action.aiConfidence * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(action.approvalStatus)}</td>
                  <td className="py-3 px-4">
                    <div className="text-sm text-gray-600">
                      {formatDate(action.createdAt)}
                    </div>
                    {action.durationMs && (
                      <div className="text-xs text-gray-400">
                        {action.durationMs}ms
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === action.id ? null : action.id)
                        }
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {action.approvalStatus === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApprove(action.id)}
                            disabled={isPending}
                            className="p-1.5 text-gray-400 hover:text-green-600 disabled:opacity-50 transition-colors"
                            title="Approve"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(action.id)}
                            disabled={isPending}
                            className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                            title="Reject"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {/* Expanded Details Row */}
                {expandedId === action.id && (
                  <tr key={`${action.id}-details`} className="bg-gray-50">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">AI Reasoning</h4>
                          <p className="text-gray-600 bg-white p-3 rounded border border-gray-200">
                            {action.aiReasoning || "No reasoning provided"}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Details</h4>
                          <dl className="grid grid-cols-2 gap-2 text-sm">
                            <dt className="text-gray-500">Model:</dt>
                            <dd className="text-gray-900">{action.aiModel || "Unknown"}</dd>
                            <dt className="text-gray-500">Success:</dt>
                            <dd className="text-gray-900">{action.success ? "Yes" : "No"}</dd>
                            {action.errorMessage && (
                              <>
                                <dt className="text-gray-500">Error:</dt>
                                <dd className="text-red-600">{action.errorMessage}</dd>
                              </>
                            )}
                            {action.approvedBy && (
                              <>
                                <dt className="text-gray-500">Reviewed by:</dt>
                                <dd className="text-gray-900">
                                  {action.approvedBy.name || action.approvedBy.email}
                                </dd>
                              </>
                            )}
                            {action.rejectionReason && (
                              <>
                                <dt className="text-gray-500">Rejection reason:</dt>
                                <dd className="text-red-600">{action.rejectionReason}</dd>
                              </>
                            )}
                          </dl>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {filteredActions.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-500">
                  <SparklesIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No AI actions found</p>
                  <p className="text-sm">AI actions will appear here once Claude starts working</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
