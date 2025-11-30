import Link from "next/link";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function HelpCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/help" className="text-xl font-bold">
              Help Center
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/portal"
                className="text-sm text-blue-100 hover:text-white"
              >
                Submit a Ticket
              </Link>
              <Link
                href="/portal/login"
                className="text-sm bg-white/10 px-3 py-1.5 rounded hover:bg-white/20"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <p>
              Need more help?{" "}
              <Link href="/portal" className="text-blue-600 hover:underline">
                Submit a support ticket
              </Link>
            </p>
            <div className="flex gap-4">
              <Link href="/help" className="hover:text-gray-700">
                Help Center
              </Link>
              <Link href="/portal" className="hover:text-gray-700">
                Customer Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
