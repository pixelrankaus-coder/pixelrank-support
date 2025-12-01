import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { IconBar } from "@/components/icon-bar";
import { HeaderWrapper } from "@/components/header";
import { ClaudeChatWrapper } from "@/components/ai/claude-chat-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global icon bar */}
      <IconBar />

      {/* Main content area (shifted right of icon bar) */}
      <div className="pl-16 min-h-screen flex flex-col">
        {/* Top header with search, notifications, profile */}
        <HeaderWrapper />

        {/* Page content */}
        <div className="flex-1">{children}</div>
      </div>

      {/* Claude AI Chat - Floating button and panel */}
      <ClaudeChatWrapper />
    </div>
  );
}
