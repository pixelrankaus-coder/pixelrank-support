"use client";

import { ProfileDropdown } from "./profile-dropdown";
import { NotificationBell } from "./notification-bell";
import { GlobalSearch } from "./global-search";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import Link from "next/link";

interface TopHeaderProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
}

export function TopHeader({ user }: TopHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-40">
        {/* Left side - Page title dropdown (simplified) */}
        <div className="flex items-center gap-2">
          {/* Can add breadcrumb/page title here if needed */}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-1">
          {/* New button */}
          <div className="relative group">
            <Link
              href="/tickets/new"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              New
            </Link>
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
