import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  UsersIcon,
  InboxIcon,
  CogIcon,
  BoltIcon,
  WrenchScrewdriverIcon,
  BuildingOfficeIcon,
  BookOpenIcon,
  SparklesIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";

const sidebarSections = [
  {
    name: "Team",
    icon: UsersIcon,
    description: "Define agents' access levels and working hours",
    href: "/admin/team/agents",
  },
  {
    name: "Channels",
    icon: InboxIcon,
    description: "Bring in customer queries from various sources",
    href: "/admin/channels",
  },
  {
    name: "Workflows",
    icon: BoltIcon,
    description: "Set up your ticket routing and resolution process",
    href: "/admin/workflows",
  },
  {
    name: "Agent Productivity",
    icon: CogIcon,
    description: "Pre-create responses and actions for reuse",
    href: "/admin/productivity",
  },
  {
    name: "Knowledge Base",
    icon: BookOpenIcon,
    description: "Create help articles for self-service support",
    href: "/admin/knowledge-base",
  },
  {
    name: "AI Settings",
    icon: SparklesIcon,
    description: "Configure AI assistant for ticket summaries and replies",
    href: "/admin/ai-settings",
  },
  {
    name: "AI Usage & Costs",
    icon: ChartBarIcon,
    description: "Monitor AI token usage, costs, and analytics",
    href: "/admin/ai-usage",
  },
  {
    name: "AI Actions",
    icon: ClipboardDocumentCheckIcon,
    description: "Review and approve Claude AI agent actions",
    href: "/admin/ai-actions",
  },
  {
    name: "Top Banner",
    icon: MegaphoneIcon,
    description: "Configure the announcement banner for all users",
    href: "/admin/top-banner",
  },
  {
    name: "Support Operations",
    icon: WrenchScrewdriverIcon,
    description: "Map out and manage your complete support structure",
    href: "/admin/operations",
  },
  {
    name: "Account",
    icon: BuildingOfficeIcon,
    description: "Manage your billing and account information",
    href: "/admin/account",
  },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-[#1a2332] text-white flex-shrink-0 overflow-y-auto">
        <div className="p-4">
          {sidebarSections.map((section) => (
            <Link
              key={section.name}
              href={section.href}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors mb-1"
            >
              <section.icon className="w-5 h-5 mt-0.5 text-gray-400" />
              <div>
                <div className="text-sm font-medium">{section.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {section.description}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50">{children}</div>
    </div>
  );
}
