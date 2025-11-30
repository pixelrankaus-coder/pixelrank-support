import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { NewMenu } from "@/components/layout/new-menu";

export default async function ContactsLayout({
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
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-end px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <NewMenu />
          <span className="text-sm text-gray-600">
            {session.user.name || session.user.email}
          </span>
          <SignOutButton />
        </div>
      </header>

      {/* Content area */}
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
    </div>
  );
}
