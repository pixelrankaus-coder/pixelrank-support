"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

const tabs = [
  { name: "Categories", href: "/admin/knowledge-base", icon: FolderIcon },
  {
    name: "Articles",
    href: "/admin/knowledge-base/articles",
    icon: DocumentTextIcon,
  },
];

export default function KnowledgeBaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white border-b">
        <div className="px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Knowledge Base</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage help articles for your customers
          </p>
        </div>
        <div className="px-6 flex gap-6 border-t">
          {tabs.map((tab) => {
            const isActive =
              tab.href === "/admin/knowledge-base"
                ? pathname === "/admin/knowledge-base"
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex items-center gap-2 py-3 border-b-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
