"use client";

import { useState } from "react";
import Link from "next/link";
import { PhoneIcon, UserCircleIcon, ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { getInitials } from "@/lib/utils";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

interface ContactCardProps {
  contact: {
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
  } | null;
}

export function ContactCard({ contact }: ContactCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!contact) {
    return (
      <div className="border-b border-[#eaecf0]">
        <div className="flex items-center justify-between px-4 py-3">
          <h3 className="text-sm font-medium text-[#344054]">Requester Details</h3>
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
          <Link
            href={`/contacts/${contact.id}/edit`}
            className="text-sm text-[#7e56d8] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Edit
          </Link>
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
