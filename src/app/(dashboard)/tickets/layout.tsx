import { TicketViewsSidebar } from "@/components/ticket-views-sidebar";

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Ticket views sidebar */}
      <TicketViewsSidebar />

      {/* Main content area - child pages control their own layout */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
