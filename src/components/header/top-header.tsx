"use client";

import { ProfileDropdown } from "./profile-dropdown";
import { NotificationBell } from "./notification-bell";
import { GlobalSearch } from "./global-search";
import { MagnifyingGlassIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface TopHeaderProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
}

const createMenuItems = [
  { label: "Ticket", href: "/tickets/new" },
  { label: "Article", href: "/admin/knowledge-base/articles?new=true" },
  { label: "Activity", href: "/tasks?new=true" },
];

export function TopHeader({ user }: TopHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Close create menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setCreateMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-40">
        {/* Left side - Page title dropdown (simplified) */}
        <div className="flex items-center gap-2">
          {/* Can add breadcrumb/page title here if needed */}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1">
          {/* Create dropdown button */}
          <div className="relative" ref={createMenuRef}>
            <button
              onClick={() => setCreateMenuOpen(!createMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#14b8a6] rounded hover:bg-[#0d9488] transition-colors"
            >
              Create
              <ChevronDownIcon className="w-4 h-4" />
            </button>

            {createMenuOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] z-50">
                {createMenuItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setCreateMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Search button */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            <span>Search</span>
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-200 mx-2" />

          {/* Notifications */}
          <NotificationBell userId={user.id} />

          {/* Profile dropdown */}
          <ProfileDropdown user={user} />
        </div>
      </header>

      {/* Global search modal */}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
