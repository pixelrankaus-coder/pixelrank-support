"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, cn } from "@/lib/utils";
import {
  PencilIcon,
  TrashIcon,
  ArrowsRightLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  BuildingOfficeIcon,
  FireIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  Cog6ToothIcon,
  ClockIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { EditCompanyModal } from "./edit-company-modal";

interface BlazeActivityLog {
  id: string;
  eventType: string;
  message: string;
  status: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  ticketNumber: number;
  subject: string;
  status: string;
  priority: string;
  createdAt: Date;
  contactName: string | null;
  contactEmail: string;
  assignee: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  messages: {
    authorType: string;
    createdAt: Date;
  }[];
}

interface Contact {
  id: string;
  name: string | null;
  email: string;
  title: string | null;
  workPhone: string | null;
}

interface Company {
  id: string;
  name: string;
  website: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Blaze integration
  isOnBlaze?: boolean;
  blazeApiKey?: string | null;
  blazeWorkspaceId?: string | null;
  blazeLastSync?: Date | null;
  blazeFacebook?: boolean;
  blazeInstagram?: boolean;
  blazeGoogle?: boolean;
  blazeLinkedIn?: boolean;
  blazeTikTok?: boolean;
  blazeWordPress?: boolean;
  blazeMailchimp?: boolean;
  blazeN8n?: boolean;
  blazeZapier?: boolean;
}

interface CompanyDetailClientProps {
  company: Company;
  contacts: Contact[];
  openTickets: Ticket[];
  closedTickets: Ticket[];
}

const statusColors: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  RESOLVED: "bg-blue-100 text-blue-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

function TicketRow({ ticket }: { ticket: Ticket }) {
  const lastMessage = ticket.messages[0];
  const responseTag =
    lastMessage?.authorType === "CONTACT"
      ? "Customer responded"
      : lastMessage?.authorType === "AGENT"
      ? "Agent responded"
      : null;

  return (
    <tr className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
      <td className="px-4 py-3 text-sm text-gray-500">
        {formatDate(ticket.createdAt)}
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/tickets/${ticket.id}`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {ticket.subject}{" "}
          <span className="text-gray-400">#{ticket.ticketNumber}</span>
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {ticket.contactName || ticket.contactEmail}
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex px-2 py-0.5 text-xs font-medium rounded",
            statusColors[ticket.status] || "bg-gray-100 text-gray-700"
          )}
        >
          {ticket.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <span
          className={cn(
            "inline-flex px-2 py-0.5 text-xs font-medium rounded",
            priorityColors[ticket.priority] || "bg-gray-100 text-gray-700"
          )}
        >
          {ticket.priority}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {ticket.assignee?.name || ticket.assignee?.email || "Unassigned"}
      </td>
      <td className="px-4 py-3">
        {responseTag && (
          <span
            className={cn(
              "inline-flex px-2 py-0.5 text-xs font-medium rounded",
              responseTag === "Customer responded"
                ? "bg-orange-100 text-orange-700"
                : "bg-green-100 text-green-700"
            )}
          >
            {responseTag}
          </span>
        )}
      </td>
    </tr>
  );
}

export function CompanyDetailClient({
  company,
  contacts,
  openTickets,
  closedTickets,
}: CompanyDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<
    "timeline" | "tickets" | "archived"
  >("timeline");
  const [showEditModal, setShowEditModal] = useState(false);
  const [todoExpanded, setTodoExpanded] = useState(true);
  const [contactsExpanded, setContactsExpanded] = useState(true);
  const [blazeExpanded, setBlazeExpanded] = useState(true);
  const [blazeTab, setBlazeTab] = useState<"settings" | "activity" | "channels">("settings");
  const [blazeApiKey, setBlazeApiKey] = useState(company.blazeApiKey || "");
  const [blazeStatus, setBlazeStatus] = useState<"idle" | "testing" | "valid" | "invalid">(
    company.blazeApiKey ? "valid" : "idle"
  );
  const [blazeSaving, setBlazeSaving] = useState(false);
  const [blazeActivityLogs, setBlazeActivityLogs] = useState<BlazeActivityLog[]>([]);
  const [blazeActivityLoading, setBlazeActivityLoading] = useState(false);
  const [blazeChannels, setBlazeChannels] = useState({
    facebook: company.blazeFacebook || false,
    instagram: company.blazeInstagram || false,
    google: company.blazeGoogle || false,
    linkedIn: company.blazeLinkedIn || false,
    tikTok: company.blazeTikTok || false,
    wordPress: company.blazeWordPress || false,
    mailchimp: company.blazeMailchimp || false,
    n8n: company.blazeN8n || false,
    zapier: company.blazeZapier || false,
  });

  const initial = company.name.charAt(0).toUpperCase();

  // Fetch activity logs when activity tab is selected
  useEffect(() => {
    if (blazeTab === "activity" && blazeExpanded) {
      fetchActivityLogs();
    }
  }, [blazeTab, blazeExpanded]);

  const fetchActivityLogs = async () => {
    setBlazeActivityLoading(true);
    try {
      const res = await fetch(`/api/companies/${company.id}/blaze/activity?limit=20`);
      if (res.ok) {
        const logs = await res.json();
        setBlazeActivityLogs(logs);
      }
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
    } finally {
      setBlazeActivityLoading(false);
    }
  };

  const allTickets = [...openTickets, ...closedTickets].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleTestBlazeApiKey = async () => {
    if (!blazeApiKey.trim()) return;

    setBlazeStatus("testing");
    try {
      const res = await fetch(`/api/companies/${company.id}/blaze/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: blazeApiKey }),
      });

      if (res.ok) {
        const data = await res.json();
        setBlazeStatus(data.valid ? "valid" : "invalid");
      } else {
        setBlazeStatus("invalid");
      }
    } catch {
      setBlazeStatus("invalid");
    }
  };

  const handleSaveBlazeApiKey = async () => {
    setBlazeSaving(true);
    try {
      const res = await fetch(`/api/companies/${company.id}/blaze`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blazeApiKey: blazeApiKey || null,
          isOnBlaze: !!blazeApiKey,
        }),
      });

      if (res.ok) {
        setBlazeStatus(blazeApiKey ? "valid" : "idle");
        router.refresh();
        // Refresh activity logs to show the save event
        if (blazeTab === "activity") {
          fetchActivityLogs();
        }
      } else {
        alert("Failed to save API key");
      }
    } catch {
      alert("Failed to save API key");
    } finally {
      setBlazeSaving(false);
    }
  };

  const handleToggleChannel = async (channelKey: string, value: boolean) => {
    const blazeKey = `blaze${channelKey.charAt(0).toUpperCase() + channelKey.slice(1)}`;
    try {
      const res = await fetch(`/api/companies/${company.id}/blaze`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [blazeKey]: value }),
      });

      if (res.ok) {
        setBlazeChannels(prev => ({ ...prev, [channelKey]: value }));
        router.refresh();
        // Refresh activity logs to show the channel change
        if (blazeTab === "activity") {
          fetchActivityLogs();
        }
      }
    } catch (error) {
      console.error("Failed to toggle channel:", error);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this company? This action cannot be undone."
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/companies/${company.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          router.push("/companies");
        } else {
          alert("Failed to delete company");
        }
      } catch {
        alert("Failed to delete company");
      }
    });
  };

  return (
    <div className="h-full overflow-auto">
      {/* Breadcrumb */}
      <div className="px-6 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center text-sm">
          <Link href="/companies" className="text-gray-500 hover:text-gray-700">
            Companies
          </Link>
          <span className="mx-2 text-gray-400">&gt;</span>
          <span className="text-gray-900">{company.name}</span>
        </div>
      </div>

      {/* Action bar */}
      <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center gap-2">
        <button
          onClick={() => setShowEditModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          <PencilIcon className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          <TrashIcon className="w-4 h-4" />
          Delete
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-md cursor-not-allowed"
          disabled
        >
          <ArrowsRightLeftIcon className="w-4 h-4" />
          Merge
        </button>
      </div>

      {/* Main content */}
      <div className="p-6">
        <div className="grid grid-cols-[1fr_320px] gap-6">
          {/* Left column */}
          <div>
            {/* Company header card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-medium">
                  {initial}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {company.name}
                  </h1>
                  {company.website && (
                    <a
                      href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 mt-1"
                    >
                      {company.website}
                    </a>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="mt-6 border-b border-gray-200">
                <nav className="flex gap-6">
                  <button
                    onClick={() => setActiveTab("timeline")}
                    className={cn(
                      "pb-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                      activeTab === "timeline"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                  >
                    TIMELINE
                  </button>
                  <button
                    onClick={() => setActiveTab("tickets")}
                    className={cn(
                      "pb-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                      activeTab === "tickets"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                  >
                    TICKETS ({openTickets.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("archived")}
                    className={cn(
                      "pb-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                      activeTab === "archived"
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    )}
                  >
                    ARCHIVED TICKETS ({closedTickets.length})
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab content */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {activeTab === "timeline" && (
                <>
                  {allTickets.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No tickets yet
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Agent
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Response
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {allTickets.map((ticket) => (
                          <TicketRow key={ticket.id} ticket={ticket} />
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}

              {activeTab === "tickets" && (
                <>
                  {openTickets.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No open tickets
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Agent
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Response
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {openTickets.map((ticket) => (
                          <TicketRow key={ticket.id} ticket={ticket} />
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}

              {activeTab === "archived" && (
                <>
                  {closedTickets.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No archived tickets
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Agent
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Response
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {closedTickets.map((ticket) => (
                          <TicketRow key={ticket.id} ticket={ticket} />
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Contacts panel */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => setContactsExpanded(!contactsExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-200"
              >
                <h3 className="font-medium text-gray-900">
                  Contacts ({contacts.length})
                </h3>
                {contactsExpanded ? (
                  <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {contactsExpanded && (
                <div className="p-4">
                  {contacts.length === 0 ? (
                    <p className="text-sm text-gray-500">No contacts linked</p>
                  ) : (
                    <ul className="space-y-3">
                      {contacts.map((contact) => {
                        const contactInitial = (contact.name || contact.email || "?")
                          .charAt(0)
                          .toUpperCase();
                        return (
                          <li key={contact.id}>
                            <Link
                              href={`/contacts/${contact.id}`}
                              className="flex items-center gap-3 group"
                            >
                              <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                {contactInitial}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
                                  {contact.name || "(No name)"}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {contact.email}
                                </div>
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* Details panel */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Details</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Website */}
                {company.website && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Website
                    </h4>
                    <a
                      href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {company.website}
                    </a>
                  </div>
                )}

                {/* Tags */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Tags
                  </h4>
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    Add tags
                  </button>
                </div>
              </div>
            </div>

            {/* Blaze Integration panel */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => setBlazeExpanded(!blazeExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-200"
              >
                <div className="flex items-center gap-2">
                  <FireIcon className="w-5 h-5 text-orange-500" />
                  <h3 className="font-medium text-gray-900">Blaze.ai</h3>
                  {company.blazeApiKey && (
                    <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                      Connected
                    </span>
                  )}
                </div>
                {blazeExpanded ? (
                  <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {blazeExpanded && (
                <div>
                  {/* Tabs */}
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setBlazeTab("settings")}
                      className={cn(
                        "flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 -mb-px transition-colors",
                        blazeTab === "settings"
                          ? "border-orange-500 text-orange-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <Cog6ToothIcon className="w-3.5 h-3.5" />
                      Settings
                    </button>
                    <button
                      onClick={() => setBlazeTab("activity")}
                      className={cn(
                        "flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 -mb-px transition-colors",
                        blazeTab === "activity"
                          ? "border-orange-500 text-orange-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <ClockIcon className="w-3.5 h-3.5" />
                      Activity
                    </button>
                    <button
                      onClick={() => setBlazeTab("channels")}
                      className={cn(
                        "flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 border-b-2 -mb-px transition-colors",
                        blazeTab === "channels"
                          ? "border-orange-500 text-orange-600"
                          : "border-transparent text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                      Channels
                    </button>
                  </div>

                  {/* Settings Tab */}
                  {blazeTab === "settings" && (
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                          API Key
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="password"
                              value={blazeApiKey}
                              onChange={(e) => {
                                setBlazeApiKey(e.target.value);
                                setBlazeStatus("idle");
                              }}
                              placeholder="Enter Blaze API key"
                              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Status indicator */}
                      {blazeStatus === "testing" && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <ArrowPathIcon className="w-4 h-4 animate-spin" />
                          Testing connection...
                        </div>
                      )}
                      {blazeStatus === "valid" && blazeApiKey && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircleIcon className="w-4 h-4" />
                          API key is valid
                        </div>
                      )}
                      {blazeStatus === "invalid" && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                          <ExclamationCircleIcon className="w-4 h-4" />
                          Invalid API key
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleTestBlazeApiKey}
                          disabled={!blazeApiKey.trim() || blazeStatus === "testing"}
                          className="flex-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Test
                        </button>
                        <button
                          onClick={handleSaveBlazeApiKey}
                          disabled={blazeSaving}
                          className="flex-1 px-3 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          {blazeSaving ? "Saving..." : "Save"}
                        </button>
                      </div>

                      {company.blazeLastSync && (
                        <p className="text-xs text-gray-500">
                          Last synced: {formatDate(company.blazeLastSync)}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Activity Tab */}
                  {blazeTab === "activity" && (
                    <div className="p-4">
                      {blazeActivityLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin" />
                        </div>
                      ) : blazeActivityLogs.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No activity yet</p>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {blazeActivityLogs.map((log) => (
                            <div key={log.id} className="flex items-start gap-2">
                              <div
                                className={cn(
                                  "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                                  log.status === "SUCCESS" && "bg-green-500",
                                  log.status === "ERROR" && "bg-red-500",
                                  log.status === "WARNING" && "bg-yellow-500",
                                  log.status === "INFO" && "bg-blue-500"
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">{log.message}</p>
                                <p className="text-xs text-gray-400">
                                  {new Date(log.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Channels Tab */}
                  {blazeTab === "channels" && (
                    <div className="p-4 space-y-3">
                      {[
                        { key: "facebook", label: "Facebook", icon: "📘" },
                        { key: "instagram", label: "Instagram", icon: "📷" },
                        { key: "google", label: "Google", icon: "🔍" },
                        { key: "linkedIn", label: "LinkedIn", icon: "💼" },
                        { key: "tikTok", label: "TikTok", icon: "🎵" },
                        { key: "wordPress", label: "WordPress", icon: "📝" },
                        { key: "mailchimp", label: "Mailchimp", icon: "🐵" },
                        { key: "n8n", label: "n8n", icon: "🔗" },
                        { key: "zapier", label: "Zapier", icon: "⚡" },
                      ].map((channel) => (
                        <label
                          key={channel.key}
                          className="flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{channel.icon}</span>
                            <span className="text-sm text-gray-700 group-hover:text-gray-900">
                              {channel.label}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              handleToggleChannel(
                                channel.key,
                                !blazeChannels[channel.key as keyof typeof blazeChannels]
                              )
                            }
                            className={cn(
                              "relative w-9 h-5 rounded-full transition-colors",
                              blazeChannels[channel.key as keyof typeof blazeChannels]
                                ? "bg-green-500"
                                : "bg-gray-200"
                            )}
                          >
                            <span
                              className={cn(
                                "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                                blazeChannels[channel.key as keyof typeof blazeChannels] && "translate-x-4"
                              )}
                            />
                          </button>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* To-Do panel */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => setTodoExpanded(!todoExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between border-b border-gray-200"
              >
                <h3 className="font-medium text-gray-900">To-Do</h3>
                {todoExpanded ? (
                  <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {todoExpanded && (
                <div className="p-4 text-sm text-gray-500">Coming soon</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {showEditModal && (
        <EditCompanyModal
          company={company}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
