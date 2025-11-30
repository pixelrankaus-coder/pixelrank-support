"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { createTicket } from "@/lib/actions";
import Link from "next/link";
import {
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  UserIcon,
  XMarkIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

interface Contact {
  id: string;
  name: string | null;
  email: string;
  company: string | null;
  _count: { tickets: number };
}

export default function NewTicketPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Contact selection state
  const [requesterMode, setRequesterMode] = useState<"existing" | "new">("existing");
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // New contact fields
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");

  // Search contacts
  useEffect(() => {
    const searchContacts = async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setContacts(data);
        }
      } catch (err) {
        console.error("Failed to search contacts:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchContacts, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Load initial contacts
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const res = await fetch("/api/contacts/search?q=");
        if (res.ok) {
          const data = await res.json();
          setContacts(data);
        }
      } catch (err) {
        console.error("Failed to load contacts:", err);
      }
    };
    loadContacts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const subject = formData.get("subject") as string;
    const description = formData.get("description") as string;
    const priority = formData.get("priority") as string;

    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }

    // Determine contact info based on mode
    let contactEmail: string | undefined;
    let contactName: string | undefined;

    if (requesterMode === "existing" && selectedContact) {
      contactEmail = selectedContact.email;
      contactName = selectedContact.name || undefined;
    } else if (requesterMode === "new" && newContactEmail) {
      contactEmail = newContactEmail.trim();
      contactName = newContactName.trim() || undefined;
    }

    startTransition(async () => {
      try {
        await createTicket({
          subject: subject.trim(),
          description: description?.trim(),
          priority,
          contactEmail,
          contactName,
        });
      } catch {
        setError("Failed to create ticket");
      }
    });
  };

  return (
    <div className="p-6 overflow-auto h-full max-w-2xl">
      <Link
        href="/tickets"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to tickets
      </Link>

      <h1 className="text-2xl font-bold mb-6">Create New Ticket</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Subject *
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the issue"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detailed description of the issue"
            />
          </div>

          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              defaultValue="MEDIUM"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>

          {/* Requester Section */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Requester
            </h3>

            {/* Toggle between existing and new contact */}
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setRequesterMode("existing");
                  setNewContactName("");
                  setNewContactEmail("");
                }}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors ${
                  requesterMode === "existing"
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <UserIcon className="w-4 h-4" />
                Existing Contact
              </button>
              <button
                type="button"
                onClick={() => {
                  setRequesterMode("new");
                  setSelectedContact(null);
                  setSearchQuery("");
                }}
                className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md border transition-colors ${
                  requesterMode === "new"
                    ? "bg-blue-50 border-blue-300 text-blue-700"
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <UserPlusIcon className="w-4 h-4" />
                New Contact
              </button>
            </div>

            {requesterMode === "existing" ? (
              <div ref={searchRef} className="relative">
                {/* Selected Contact Display */}
                {selectedContact ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
                        {(selectedContact.name || selectedContact.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {selectedContact.name || selectedContact.email}
                        </p>
                        <p className="text-sm text-gray-500">{selectedContact.email}</p>
                        {selectedContact.company && (
                          <p className="text-xs text-gray-400">{selectedContact.company}</p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedContact(null)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Search Input */}
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Search contacts by name, email, or company..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Contact Dropdown */}
                    {showDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
                        {contacts.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            {searchQuery ? "No contacts found" : "No contacts yet"}
                          </div>
                        ) : (
                          contacts.map((contact) => (
                            <button
                              key={contact.id}
                              type="button"
                              onClick={() => {
                                setSelectedContact(contact);
                                setShowDropdown(false);
                                setSearchQuery("");
                              }}
                              className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-b-0"
                            >
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                {(contact.name || contact.email).charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {contact.name || contact.email}
                                </p>
                                <p className="text-sm text-gray-500 truncate">{contact.email}</p>
                              </div>
                              <div className="text-xs text-gray-400 flex-shrink-0">
                                {contact._count.tickets} ticket{contact._count.tickets !== 1 ? "s" : ""}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}

                {!selectedContact && (
                  <p className="mt-2 text-xs text-gray-500">
                    Select an existing contact or switch to &quot;New Contact&quot; to create one
                  </p>
                )}
              </div>
            ) : (
              /* New Contact Form */
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="newContactName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name
                  </label>
                  <input
                    id="newContactName"
                    type="text"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label
                    htmlFor="newContactEmail"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="newContactEmail"
                    type="email"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Link
            href="/tickets"
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      </form>
    </div>
  );
}
