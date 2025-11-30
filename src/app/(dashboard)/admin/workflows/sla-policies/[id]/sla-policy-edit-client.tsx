"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, PencilIcon, PlusIcon } from "@heroicons/react/24/outline";

interface SLATarget {
  id: string;
  priority: string;
  firstResponseTime: number;
  resolutionTime: number;
  operationalHours: string;
  escalationEnabled: boolean;
}

interface SLAPolicy {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  targets: SLATarget[];
}

interface SLAPolicyEditClientProps {
  policy: SLAPolicy;
}

const priorityOrder = ["URGENT", "HIGH", "MEDIUM", "LOW"];
const priorityColors: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-blue-500",
  LOW: "bg-green-500",
};

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  if (minutes < 1440) {
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  }
  const days = Math.floor(minutes / 1440);
  return `${days}d`;
}

function parseTimeInput(value: string): number {
  // Parse inputs like "6h", "1d", "30m"
  const match = value.match(/^(\d+)(h|d|m)?$/i);
  if (!match) return 0;

  const num = parseInt(match[1]);
  const unit = (match[2] || "h").toLowerCase();

  switch (unit) {
    case "m":
      return num;
    case "h":
      return num * 60;
    case "d":
      return num * 1440;
    default:
      return num * 60;
  }
}

export function SLAPolicyEditClient({ policy }: SLAPolicyEditClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(policy.name);
  const [description, setDescription] = useState(policy.description || "");
  const [targets, setTargets] = useState<Record<string, { firstResponse: string; resolution: string; operationalHours: string; escalation: boolean }>>(
    () => {
      const initial: Record<string, { firstResponse: string; resolution: string; operationalHours: string; escalation: boolean }> = {};
      for (const target of policy.targets) {
        initial[target.priority] = {
          firstResponse: formatTime(target.firstResponseTime),
          resolution: formatTime(target.resolutionTime),
          operationalHours: target.operationalHours,
          escalation: target.escalationEnabled,
        };
      }
      // Ensure all priorities have values
      for (const p of priorityOrder) {
        if (!initial[p]) {
          initial[p] = {
            firstResponse: "8h",
            resolution: "5d",
            operationalHours: "BUSINESS",
            escalation: true,
          };
        }
      }
      return initial;
    }
  );

  const handleSave = async () => {
    startTransition(async () => {
      try {
        const targetData = priorityOrder.map((priority) => ({
          priority,
          firstResponseTime: parseTimeInput(targets[priority].firstResponse),
          resolutionTime: parseTimeInput(targets[priority].resolution),
          operationalHours: targets[priority].operationalHours,
          escalationEnabled: targets[priority].escalation,
        }));

        const res = await fetch(`/api/admin/sla-policies/${policy.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description,
            targets: targetData,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to save policy");
        }

        router.push("/admin/workflows/sla-policies");
        router.refresh();
      } catch (error) {
        console.error("Failed to save policy:", error);
        alert("Failed to save policy");
      }
    });
  };

  const updateTarget = (
    priority: string,
    field: "firstResponse" | "resolution" | "operationalHours" | "escalation",
    value: string | boolean
  ) => {
    setTargets((prev) => ({
      ...prev,
      [priority]: {
        ...prev[priority],
        [field]: value,
      },
    }));
  };

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/workflows/sla-policies"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <div className="text-sm text-gray-500">
              Admin &gt; SLA Policies &gt; Edit
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Edit SLA policy</h1>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main content */}
        <div className="flex-1 p-6">
          {/* Policy name */}
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
              <button className="text-gray-400 hover:text-gray-600">
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-gray-500">{description || "default policy"}</p>
          </div>

          {/* SLA Targets Table */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Set SLA target as:</h3>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Priority
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      First response time
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Resolution time
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Operational hours
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Escalation
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {priorityOrder.map((priority) => (
                    <tr key={priority}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${priorityColors[priority]}`} />
                          <span className="font-medium text-gray-900">{priority}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={targets[priority]?.firstResponse || ""}
                          onChange={(e) => updateTarget(priority, "firstResponse", e.target.value)}
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. 4h"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={targets[priority]?.resolution || ""}
                          onChange={(e) => updateTarget(priority, "resolution", e.target.value)}
                          className="w-24 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g. 5d"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={targets[priority]?.operationalHours || "BUSINESS"}
                          onChange={(e) => updateTarget(priority, "operationalHours", e.target.value)}
                          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="BUSINESS">Business hours</option>
                          <option value="CALENDAR">Calendar hours</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => updateTarget(priority, "escalation", !targets[priority]?.escalation)}
                          className={`relative w-10 h-5 rounded-full transition-colors ${
                            targets[priority]?.escalation ? "bg-blue-600" : "bg-gray-300"
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                              targets[priority]?.escalation ? "translate-x-5" : ""
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reminders section */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">
              Remind agents when the SLA due time approaches
            </h3>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">
                  Set reminder to agents when the SLA due time approaches.
                </span>
              </div>
              <button className="mt-3 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                <PlusIcon className="w-4 h-4" />
                Add new reminders
              </button>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Update"}
            </button>
          </div>
        </div>

        {/* Right sidebar - Help content */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">SLA policy</h3>
          <p className="text-sm text-gray-600 mb-4">
            A service level agreement (SLA) policy lets you set standards of performance
            for your support team. You can set SLA policies for the time within which agents
            should respond to, and resolve tickets based on ticket priorities.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            You can choose whether you want each SLA rule to be calculated over calendar hours or
            your business hours. Your SLA Policies will be used in Freshdesk to determine
            the &quot;Due By&quot; time for each ticket.
          </p>

          <h4 className="font-semibold text-gray-900 mt-6 mb-2">SLA reminders</h4>
          <p className="text-sm text-gray-600 mb-4">
            You can set up reminders to make sure that agents are notified about the
            approaching due by time for tickets. The reminders can be for ticket response
            and resolution.
          </p>

          <h4 className="font-semibold text-gray-900 mt-6 mb-2">SLA violation notifications</h4>
          <p className="text-sm text-gray-600">
            You can also set up escalation rules that notify agents or managers when SLAs
            have been violated. You can set multiple levels of escalation for
            resolution SLA.
          </p>
        </div>
      </div>
    </div>
  );
}
