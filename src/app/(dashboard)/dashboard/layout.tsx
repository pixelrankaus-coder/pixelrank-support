export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Content area */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50">{children}</main>
    </div>
  );
}
