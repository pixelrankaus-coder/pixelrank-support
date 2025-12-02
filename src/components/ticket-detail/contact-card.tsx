"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PhoneIcon, UserCircleIcon, ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { getInitials } from "@/lib/utils";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { updateTicket } from "@/lib/actions";

interface Contact {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  workPhone: string | null;
  mobilePhone?: string | null;
  companyRef?: {
    name: string;
    timezone?: string | null;
  } | null;
}

interface ContactCardProps {
  contact: Contact | null;
  ticketId?: string;
  allContacts?: { id: string; name: string | null; email: string | null }[];
}

export function ContactCard({ contact, ticketId, allContacts = [] }: ContactCardProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter contacts based on search
  const filteredContacts = allContacts.filter(c => {
    const query = searchQuery.toLowerCase();
    return (
      (c.name?.toLowerCase().includes(query) || false) ||
      (c.email?.toLowerCase().includes(query) || false)
    );
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsEditing(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSelectContact = (newContactId: string) => {
    if (!ticketId) return;

    startTransition(async () => {
      await updateTicket(ticketId, { contactId: newContactId });
      setIsEditing(false);
      setSearchQuery("");
      router.refresh();
    });
  };

  if (!contact) {
    return (
      <div className="border-b border-[#eaecf0]">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-medium text-[#344054]">Requester Details</h3>
          {ticketId && allContacts.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(!isEditing);
                }}
                className="text-sm text-[#7e56d8] hover:underline"
              >
                Add
              </button>
              {isEditing && (
                <div className="absolute right-0 top-6 z-50 w-72 bg-white rounded-lg shadow-lg border border-[#eaecf0] overflow-hidden">
                  <div className="p-2 border-b border-[#eaecf0]">
                    <div className="relative">
                      <MagnifyingGlassIcon className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#667085]" />
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-[#d0d5dd] rounded focus:outline-none focus:ring-2 focus:ring-[#7e56d8] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredContacts.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-[#667085] text-center">
                        No contacts found
                      </div>
                    ) : (
                      filteredContacts.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectContact(c.id)}
                          disabled={isPending}
                          className="w-full px-3 py-2 flex items-center gap-2 hover:bg-[#f9fafb] transition-colors text-left disabled:opacity-50"
                        >
                          <div className="w-7 h-7 rounded-full bg-[#16a34a] flex items-center justify-center text-white font-medium text-xs flex-shrink-0">
                            {getInitials(c.name || c.email || "?")}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-[#101828] truncate">
                              {c.name || "Unknown"}
                            </div>
                            {c.email && (
                              <div className="text-xs text-[#667085] truncate">{c.email}</div>
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-4 pb-4 text-center">
          <UserCircleIcon className="w-10 h-10 mx-auto text-[#d0d5dd] mb-2" />
          <p className="text-sm text-[#667085]">No contact associated</p>
        </div>
      </div>
    );
  }

  const displayName = contact.name || "Unknown";
  const companyName = contact.companyRef?.name || contact.company;
  const timezone = contact.companyRef?.timezone;

  return (
    <div className="border-b border-[#eaecf0]">
      {/* Header with collapse toggle */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#f9fafb]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-sm font-medium text-[#344054]">Requester Details</h3>
        <div className="flex items-center gap-2">
          {ticketId && allContacts.length > 0 ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(!isEditing);
                }}
                className="text-sm text-[#7e56d8] hover:underline"
              >
                Edit
              </button>
              {isEditing && (
                <div className="absolute right-0 top-6 z-50 w-72 bg-white rounded-lg shadow-lg border border-[#eaecf0] overflow-hidden">
                  <div className="p-2 border-b border-[#eaecf0]">
                    <div className="relative">
                      <MagnifyingGlassIcon className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#667085]" />
                      <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search contacts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-sm border border-[#d0d5dd] rounded focus:outline-none focus:ring-2 focus:ring-[#7e56d8] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredContacts.length === 0 ? (
                      <div className="px-3 py-4 text-sm text-[#667085] text-center">
                        No contacts found
                      </div>
                    ) : (
                      filteredContacts.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectContact(c.id)}
                          disabled={isPending}
                          className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-[#f9fafb] transition-colors text-left disabled:opacity-50 ${
                            c.id === contact.id ? "bg-[#f3f0ff]" : ""
                          }`}
                        >
                          <div className="w-7 h-7 rounded-full bg-[#16a34a] flex items-center justify-center text-white font-medium text-xs flex-shrink-0">
                            {getInitials(c.name || c.email || "?")}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-[#101828] truncate">
                              {c.name || "Unknown"}
                            </div>
                            {c.email && (
                              <div className="text-xs text-[#667085] truncate">{c.email}</div>
                            )}
                          </div>
                          {c.id === contact.id && (
                            <CheckCircleIcon className="w-4 h-4 text-[#7e56d8] flex-shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={`/contacts/${contact.id}/edit`}
              className="text-sm text-[#7e56d8] hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Edit
            </Link>
          )}
          {isExpanded ? (
            <ChevronUpIcon className="w-4 h-4 text-[#667085]" />
          ) : (
            <ChevronDownIcon className="w-4 h-4 text-[#667085]" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Contact avatar and name */}
          <Link href={`/contacts/${contact.id}`} className="flex items-center gap-2.5 mb-3 group">
            <div className="w-8 h-8 rounded-full bg-[#16a34a] flex items-center justify-center text-white font-medium text-xs">
              {getInitials(displayName)}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-medium text-[#101828] group-hover:text-[#7e56d8]">
                  {displayName}
                </span>
                <CheckCircleIcon className="w-3.5 h-3.5 text-[#16a34a]" />
              </div>
              {contact.email && (
                <div className="text-xs text-[#667085]">{contact.email}</div>
              )}
            </div>
          </Link>

          {/* Contact details in two columns */}
          <div className="space-y-2 text-xs">
            {/* Contact Group / Company */}
            <div className="flex">
              <span className="text-[#667085] w-28 flex-shrink-0">Contact Group</span>
              <span className="text-[#344054] truncate">{companyName || "--"}</span>
            </div>

            {/* Phone Number */}
            <div className="flex">
              <span className="text-[#667085] w-28 flex-shrink-0">Phone Number</span>
              {contact.workPhone ? (
                <a
                  href={`tel:${contact.workPhone}`}
                  className="flex items-center gap-1 text-[#7e56d8] hover:underline"
                >
                  <PhoneIcon className="w-3 h-3" />
                  {contact.workPhone}
                </a>
              ) : (
                <span className="text-[#344054]">--</span>
              )}
            </div>

            {/* Mobile Number */}
            <div className="flex">
              <span className="text-[#667085] w-28 flex-shrink-0">Mobile Number</span>
              <span className="text-[#344054]">{contact.mobilePhone || "--"}</span>
            </div>

            {/* Time Zone */}
            <div className="flex">
              <span className="text-[#667085] w-28 flex-shrink-0">Time Zone</span>
              <span className="text-[#344054]">{timezone || "Eastern Standard Time"}</span>
            </div>

            {/* Links */}
            <div className="flex pt-1">
              <Link
                href={`/contacts/${contact.id}`}
                className="text-[#7e56d8] hover:underline w-28 flex-shrink-0"
              >
                View Profile
              </Link>
              <Link
                href={`/contacts/${contact.id}/tickets`}
                className="text-[#7e56d8] hover:underline"
              >
                Recent Tickets
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
