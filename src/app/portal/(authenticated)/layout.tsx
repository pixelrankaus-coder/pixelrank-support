import { redirect } from "next/navigation";
import Link from "next/link";
import { getCustomerSession } from "@/lib/customer-auth";
import {
  HomeIcon,
  TicketIcon,
  PlusCircleIcon,
  BookOpenIcon,
  UserCircleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { PortalHeader } from "./portal-header";

const navigation = [
  { name: "Home", href: "/portal", icon: HomeIcon },
  { name: "My Tickets", href: "/portal/tickets", icon: TicketIcon },
  { name: "New Ticket", href: "/portal/tickets/new", icon: PlusCircleIcon },
  { name: "Knowledge Base", href: "/help", icon: BookOpenIcon },
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCustomerSession();

  if (!session) {
    redirect("/portal/login");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50">
      {/* Header */}
      <PortalHeader user={session} />

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="w-64 bg-white border-r min-h-[calc(100vh-64px)] hidden lg:block shadow-sm">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all duration-150 group"
              >
                <item.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Quick Help Box */}
          <div className="mx-4 mt-6 p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-blue-100 mb-3">
              Search our knowledge base or contact support.
            </p>
            <Link
              href="/help"
              className="inline-flex items-center gap-2 text-sm font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              Browse Articles
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
