"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  EllipsisVerticalIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

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

interface SLAPoliciesClientProps {
  policies: SLAPolicy[];
}

export function SLAPoliciesClient({ policies }: SLAPoliciesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggleActive = async (policyId: string, isActive: boolean) => {
    startTransition(async () => {
      try {
        await fetch(`/api/admin/sla-policies/${policyId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive }),
        });
        router.refresh();
      } catch (error) {
        console.error("Failed to update policy:", error);
      }
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">SLA Policies</h1>
        <p className="text-gray-600">
          Service Level Agreement(SLA) policies determine the time duration within which your teams
          should respond to, and resolve tickets.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <span className="font-medium">ℹ️</span> The first matching SLA policy will be applied to a ticket.
        </p>
      </div>

      {/* Policies list */}
      <div className="bg-white rounded-lg border border-gray-200">
        {policies.map((policy, index) => (
          <div
            key={policy.id}
            className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0"
          >
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{policy.name}</span>
                  {policy.isDefault && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                      Default
                    </span>
                  )}
                </div>
                {policy.description && (
                  <p className="text-sm text-gray-500">{policy.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Active toggle */}
              <button
                onClick={() => handleToggleActive(policy.id, !policy.isActive)}
                disabled={isPending}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  policy.isActive ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    policy.isActive ? "translate-x-5" : ""
                  }`}
                />
              </button>

              {/* Edit link */}
              <Link
                href={`/admin/workflows/sla-policies/${policy.id}`}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <PencilIcon className="w-4 h-4" />
              </Link>

              {/* More menu */}
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <EllipsisVerticalIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {policies.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No SLA policies found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
