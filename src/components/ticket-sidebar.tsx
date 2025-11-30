"use client";

import { formatDate } from "@/lib/utils";
import { updateTicket } from "@/lib/actions";
import { useTransition } from "react";

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

interface TicketSidebarProps {
  ticket: {
    id: string;
    status: string;
    priority: string;
    assigneeId: string | null;
    contact: {
      id: string;
      name: string | null;
      email: string | null;
      company: string | null;
      phone: string | null;
    } | null;
    createdBy: {
      name: string | null;
      email: string;
    } | null;
    createdAt: Date;
    updatedAt: Date;
  };
  agents: Agent[];
}

export function TicketSidebar({ ticket, agents }: TicketSidebarProps) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (field: string, value: string) => {
    startTransition(async () => {
      await updateTicket(ticket.id, { [field]: value || null });
    });
  };

  return (
    <div className="w-80 flex-shrink-0">
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        <h3 className="font-semibold text-gray-900">Properties</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={ticket.status}
            onChange={(e) => handleChange("status", e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="OPEN">Open</option>
            <option value="PENDING">Pending</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priority
          </label>
          <select
            value={ticket.priority}
            onChange={(e) => handleChange("priority", e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assignee
          </label>
          <select
            value={ticket.assigneeId || ""}
            onChange={(e) => handleChange("assigneeId", e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">Unassigned</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name || agent.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      {ticket.contact && (
        <div className="bg-white rounded-lg shadow p-4 mt-4 space-y-2">
          <h3 className="font-semibold text-gray-900">Requester</h3>
          {ticket.contact.name && (
            <p className="text-sm text-gray-600">{ticket.contact.name}</p>
          )}
          {ticket.contact.email && (
            <p className="text-sm text-gray-600">{ticket.contact.email}</p>
          )}
          {ticket.contact.company && (
            <p className="text-sm text-gray-500">{ticket.contact.company}</p>
          )}
          {ticket.contact.phone && (
            <p className="text-sm text-gray-500">{ticket.contact.phone}</p>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mt-4 space-y-2">
        <h3 className="font-semibold text-gray-900">Details</h3>
        <p className="text-sm text-gray-600">
          <span className="text-gray-500">Created:</span>{" "}
          {formatDate(ticket.createdAt)}
        </p>
        <p className="text-sm text-gray-600">
          <span className="text-gray-500">Updated:</span>{" "}
          {formatDate(ticket.updatedAt)}
        </p>
        {ticket.createdBy && (
          <p className="text-sm text-gray-600">
            <span className="text-gray-500">Created by:</span>{" "}
            {ticket.createdBy.name || ticket.createdBy.email}
          </p>
        )}
      </div>
    </div>
  );
}
