"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  TicketIcon,
  EnvelopeIcon,
  UserIcon,
  BuildingOfficeIcon,
  ChevronDownIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

const menuItems = [
  {
    label: "Ticket",
    href: "/tickets/new",
    icon: TicketIcon,
  },
  {
    label: "Email",
    href: "/tickets/new?channel=email",
    icon: EnvelopeIcon,
  },
  {
    label: "Contact",
    href: "/contacts/new",
    icon: UserIcon,
  },
  {
    label: "Company",
    href: "/companies/new",
    icon: BuildingOfficeIcon,
  },
];

export function NewMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <PlusIcon className="w-4 h-4" />
        New
        <ChevronDownIcon className="w-3 h-3 ml-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <item.icon className="w-4 h-4 text-gray-400" />
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
