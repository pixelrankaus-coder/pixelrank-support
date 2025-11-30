"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Squares2X2Icon,
  TicketIcon,
  UserGroupIcon,
  LightBulbIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  FireIcon,
} from "@heroicons/react/24/outline";

interface SubMenuItem {
  name: string;
  href: string;
}

interface MenuItem {
  id: string;
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  submenu?: SubMenuItem[];
  matchPaths?: string[]; // Additional paths that should highlight this item
}

const mainMenuItems: MenuItem[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    href: "/dashboard",
    icon: Squares2X2Icon,
  },
  {
    id: "tickets",
    name: "Tickets",
    href: "/tickets",
    icon: TicketIcon,
  },
  {
    id: "tasks",
    name: "Tasks",
    href: "/tasks",
    icon: ClipboardDocumentListIcon,
  },
  {
    id: "projects",
    name: "Projects",
    href: "/projects",
    icon: FolderIcon,
  },
  {
    id: "contacts",
    name: "Contacts",
    icon: UserGroupIcon,
    matchPaths: ["/contacts", "/companies"],
    submenu: [
      { name: "Contacts", href: "/contacts" },
      { name: "Companies", href: "/companies" },
    ],
  },
  {
    id: "solutions",
    name: "Solutions",
    href: "/solutions",
    icon: LightBulbIcon,
  },
  {
    id: "reports",
    name: "Reports",
    href: "/reports",
    icon: ChartBarIcon,
  },
  {
    id: "blaze",
    name: "Blaze",
    href: "/blaze",
    icon: FireIcon,
  },
];

const bottomMenuItems: MenuItem[] = [
  {
    id: "admin",
    name: "Admin",
    href: "/admin",
    icon: Cog6ToothIcon,
  },
];

export function IconBar() {
  const pathname = usePathname();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const submenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine which menu item is active based on current path
  const getActiveModule = (): string => {
    const allItems = [...mainMenuItems, ...bottomMenuItems];
    for (const item of allItems) {
      // Check direct href match
      if (item.href && pathname.startsWith(item.href)) {
        return item.id;
      }
      // Check matchPaths for items with submenus
      if (item.matchPaths) {
        for (const path of item.matchPaths) {
          if (pathname.startsWith(path)) {
            return item.id;
          }
        }
      }
    }
    return "dashboard";
  };

  const activeModule = getActiveModule();

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (submenuRef.current && !submenuRef.current.contains(event.target as Node)) {
        setOpenSubmenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMouseEnter = (itemId: string, hasSubmenu: boolean) => {
    if (submenuTimeoutRef.current) {
      clearTimeout(submenuTimeoutRef.current);
    }
    if (hasSubmenu) {
      setOpenSubmenu(itemId);
    }
  };

  const handleMouseLeave = () => {
    submenuTimeoutRef.current = setTimeout(() => {
      setOpenSubmenu(null);
    }, 150);
  };

  const renderMenuItem = (item: MenuItem) => {
    const isActive = activeModule === item.id;
    const hasSubmenu = !!item.submenu;
    const isSubmenuOpen = openSubmenu === item.id;

    const iconButton = (
      <div
        className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center transition-colors relative",
          isActive
            ? "bg-slate-700 text-white"
            : "text-slate-400 hover:bg-slate-800 hover:text-white",
          hasSubmenu && "cursor-pointer"
        )}
      >
        <item.icon className="w-6 h-6" />
        {/* Active indicator */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r" />
        )}
      </div>
    );

    if (hasSubmenu) {
      return (
        <div
          key={item.id}
          className="relative"
          onMouseEnter={() => handleMouseEnter(item.id, true)}
          onMouseLeave={handleMouseLeave}
          ref={isSubmenuOpen ? submenuRef : undefined}
        >
          <button
            type="button"
            title={item.name}
            aria-label={item.name}
            className="focus:outline-none"
            onClick={() => setOpenSubmenu(isSubmenuOpen ? null : item.id)}
          >
            {iconButton}
          </button>

          {/* Flyout submenu */}
          {isSubmenuOpen && (
            <div
              className="absolute left-full top-0 ml-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[160px] z-50"
              onMouseEnter={() => handleMouseEnter(item.id, true)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 mb-1">
                {item.name}
              </div>
              {item.submenu!.map((subItem) => {
                const isSubActive = pathname.startsWith(subItem.href);
                return (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    className={cn(
                      "block px-3 py-2 text-sm transition-colors",
                      isSubActive
                        ? "text-blue-600 bg-blue-50 border-l-2 border-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    onClick={() => setOpenSubmenu(null)}
                  >
                    {subItem.name}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Tooltip (only show when submenu is closed) */}
          {!isSubmenuOpen && (
            <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-40">
              {item.name}
            </span>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href!}
        title={item.name}
        aria-label={item.name}
        className="relative group"
      >
        {iconButton}
        {/* Tooltip */}
        <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-40">
          {item.name}
        </span>
      </Link>
    );
  };

  return (
    <aside className="fixed inset-y-0 left-0 w-16 bg-slate-900 flex flex-col z-50">
      {/* Logo */}
      <div className="h-16 flex items-center justify-center border-b border-slate-700">
        <Link
          href="/dashboard"
          className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg"
          title="Helpdesk"
        >
          H
        </Link>
      </div>

      {/* Main menu items */}
      <nav className="flex-1 py-4 flex flex-col items-center gap-2">
        {mainMenuItems.map(renderMenuItem)}
      </nav>

      {/* Bottom menu items */}
      <div className="py-4 flex flex-col items-center gap-2 border-t border-slate-700">
        {bottomMenuItems.map(renderMenuItem)}

        {/* User avatar */}
        <div className="mt-2 w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 text-sm cursor-pointer hover:bg-slate-600 transition-colors">
          A
        </div>
      </div>
    </aside>
  );
}
