import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Top header */}
      <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
        <h2 className="font-semibold text-gray-900">Settings</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {session.user.name || session.user.email}
          </span>
          <SignOutButton />
        </div>
      </header>

      {/* Content area */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">{children}</main>
    </div>
  );
}
