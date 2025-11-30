"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDate, cn } from "@/lib/utils";
import {
  PencilIcon,
  TrashIcon,
  ArrowsRightLeftIcon,
  UserPlusIcon,
  EnvelopeIcon,
  KeyIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/24/outline";
import { EditContactModal } from "./edit-contact-modal";

interface Ticket {
  id: string;
  ticketNumber: number;
  subject: string;
  status: string;
  priority: string;
  createdAt: Date;
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
  company: string | null;
  companyId: string | null;
  companyRef?: { id: string; name: string } | null;
  workPhone: string | null;
  facebook: string | null;
  twitter: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ContactDetailClientProps {
  contact: Contact;
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

export function ContactDetailClient({
  contact,
  openTickets,
  closedTickets,
}: ContactDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<
    "timeline" | "tickets" | "archived"
  >("timeline");
  const [showEditModal, setShowEditModal] = useState(false);
  const [todoExpanded, setTodoExpanded] = useState(true);

  const initial = (contact.name || contact.email || "?")
    .charAt(0)
    .toUpperCase();

  const allTickets = [...openTickets, ...closedTickets].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this contact? This action cannot be undone."
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/contacts/${contact.id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          router.push("/contacts");
        } else {
          alert("Failed to delete contact");
        }
      } catch {
        alert("Failed to delete contact");
      }
    });
  };

  return (
    <div className="h-full overflow-auto">
      {/* Breadcrumb */}
      <div className="px-6 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center text-sm">
          <Link href="/contacts" className="text-gray-500 hover:text-gray-700">
            Contacts
          </Link>
          <span className="mx-2 text-gray-400">&gt;</span>
          <span className="text-gray-900">{contact.name || contact.email}</span>
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
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-md cursor-not-allowed"
          disabled
        >
          <UserPlusIcon className="w-4 h-4" />
          Convert to agent
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-md cursor-not-allowed"
          disabled
        >
          <EnvelopeIcon className="w-4 h-4" />
          Send activation email
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-md cursor-not-allowed"
          disabled
        >
          <KeyIcon className="w-4 h-4" />
          Change password
        </button>
      </div>

      {/* Main content */}
      <div className="p-6">
        <div className="grid grid-cols-[1fr_320px] gap-6">
          {/* Left column */}
          <div>
            {/* Contact header card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center text-white text-2xl font-medium">
                  {initial}
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">
                    {contact.name || "(No name)"}
                  </h1>
                  <button className="text-sm text-blue-600 hover:text-blue-800 mt-1">
                    Upload photo
                  </button>
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
            {/* Details panel */}
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">Details</h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Email */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Emails
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span className="text-sm text-gray-700">
                      {contact.email}
                    </span>
                  </div>
                </div>

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
        <EditContactModal
          contact={contact}
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
