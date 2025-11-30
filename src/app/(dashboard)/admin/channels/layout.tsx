"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  EnvelopeIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  GlobeAltIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const channelSections = [
  {
    name: "Email",
    description: "Convert emails from customers into tickets and send replies via email",
    icon: EnvelopeIcon,
    href: "/admin/channels/email",
    configured: false,
  },
  {
    name: "Chat Widget",
    description: "Add a chat widget to your website for real-time customer support",
    icon: ChatBubbleLeftRightIcon,
    href: "/admin/channels/chat",
    configured: false,
  },
  {
    name: "Phone",
    description: "Integrate phone support for voice-based customer service",
    icon: PhoneIcon,
    href: "/admin/channels/phone",
    configured: false,
  },
  {
    name: "Web Portal",
    description: "Allow customers to submit and track tickets via a self-service portal",
    icon: GlobeAltIcon,
    href: "/admin/channels/portal",
    configured: false,
  },
];

export default function ChannelsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Check if we're at the root channels page
  const isRootPage = pathname === "/admin/channels";

  if (isRootPage) {
    return (
      <div className="p-6">
        {/* Search bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search settings"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Channels</h2>
          <span className="text-sm text-gray-500">
            {channelSections.filter((s) => s.configured).length} of {channelSections.length}{" "}
            Configured
          </span>
        </div>

        {/* Section Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channelSections.map((section) => (
            <Link
              key={section.name}
              href={section.href}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <section.icon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-600">
                      {section.name}
                    </span>
                    {section.configured && (
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{section.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
