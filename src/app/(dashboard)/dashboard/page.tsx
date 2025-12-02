"use client";

import { useState, useMemo } from "react";
import { ViewToggle } from "@/components/dashboard/view-toggle";
import { AssignedTicketsCard } from "@/components/dashboard/assigned-tickets-card";
import { CSATCard } from "@/components/dashboard/csat-card";
import { TicketTabs } from "@/components/dashboard/ticket-tabs";
import { DashboardToolbar } from "@/components/dashboard/dashboard-toolbar";
import { TicketTable } from "@/components/dashboard/ticket-table";
import { Pagination } from "@/components/dashboard/pagination";
import type {
  ViewType,
  TicketTab,
  DashboardStats,
  CSATData,
  DashboardTicket,
  TabConfig,
  PaginationInfo,
} from "@/types/dashboard";

// Mock data
const mockStats: DashboardStats = {
  pending: 12,
  onHold: 5,
  resolutionDue: 3,
  responseDue: 8,
};

const mockCSAT: CSATData = {
  positive: { percentage: 75, count: 45 },
  neutral: { percentage: 15, count: 9 },
  negative: { percentage: 10, count: 6 },
  overall: 75,
};

const mockTickets: DashboardTicket[] = [
  {
    id: 1001,
    subject: "Unable to access dashboard after password reset",
    createdAt: "2024-01-15T09:30:00Z",
    status: "open",
    brand: "PixelRank",
    contact: { name: "John Smith", email: "john@example.com" },
  },
  {
    id: 1002,
    subject: "Integration with Slack not working properly",
    createdAt: "2024-01-15T10:15:00Z",
    status: "pending",
    brand: "PixelRank",
    contact: { name: "Sarah Johnson", email: "sarah@example.com" },
  },
  {
    id: 1003,
    subject: "Feature request: Dark mode support",
    createdAt: "2024-01-14T14:45:00Z",
    status: "on_hold",
    brand: "PixelRank",
    contact: { name: "Mike Wilson", email: "mike@example.com" },
  },
  {
    id: 1004,
    subject: "Billing discrepancy on last invoice",
    createdAt: "2024-01-14T16:20:00Z",
    status: "open",
    brand: "PixelRank",
    contact: { name: "Emily Brown", email: "emily@example.com" },
  },
  {
    id: 1005,
    subject: "API rate limiting issues",
    createdAt: "2024-01-13T11:00:00Z",
    status: "pending",
    brand: "PixelRank",
    contact: { name: "David Lee", email: "david@example.com" },
  },
  {
    id: 1006,
    subject: "Mobile app crashes on startup",
    createdAt: "2024-01-13T08:30:00Z",
    status: "open",
    brand: "PixelRank",
    contact: { name: "Lisa Chen", email: "lisa@example.com" },
  },
  {
    id: 1007,
    subject: "Export functionality not generating CSV correctly",
    createdAt: "2024-01-12T15:45:00Z",
    status: "closed",
    brand: "PixelRank",
    contact: { name: "Tom Anderson", email: "tom@example.com" },
  },
  {
    id: 1008,
    subject: "Need help with bulk import of contacts",
    createdAt: "2024-01-12T12:00:00Z",
    status: "pending",
    brand: "PixelRank",
    contact: { name: "Amy Taylor", email: "amy@example.com" },
  },
];

const mockTabs: TabConfig[] = [
  { id: "pending", label: "Pending", count: 12 },
  { id: "response_due", label: "Response Due", count: 8, hasInfo: true },
  { id: "resolution_due", label: "Resolution Due", count: 3, hasInfo: true },
  { id: "hold", label: "On Hold", count: 5 },
  { id: "all_tickets", label: "All Tickets", count: 156 },
  { id: "created", label: "Created", count: 24 },
  { id: "requested", label: "Requested", count: 18 },
  { id: "participated", label: "Participated", count: 42 },
  { id: "mentioned", label: "Mentioned", count: 7 },
  { id: "shared_with_me", label: "Shared With Me", count: 15 },
  { id: "shared_with_groups", label: "Shared With My Groups", count: 9 },
  { id: "watching", label: "Watching", count: 31 },
  { id: "ccd", label: "CC'd", count: 12 },
  { id: "closed", label: "Closed", count: 89 },
];

const DEFAULT_COLUMNS = ["ticket_id", "subject", "created_on", "status", "brand"];

export default function DashboardPage() {
  const [activeView, setActiveView] = useState<ViewType>("my_tickets");
  const [activeTab, setActiveTab] = useState<TicketTab>("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"pending" | "hold" | null>(null);
  const [sortOption, setSortOption] = useState<"created_desc" | "created_asc" | "updated_desc" | "updated_asc">("created_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const itemsPerPage = 10;

  // Filter and sort tickets
  const filteredTickets = useMemo(() => {
    let result = [...mockTickets];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (ticket) =>
          ticket.subject.toLowerCase().includes(query) ||
          ticket.id.toString().includes(query)
      );
    }

    // Apply status filter from pills
    if (statusFilter === "pending") {
      result = result.filter((ticket) => ticket.status === "pending");
    } else if (statusFilter === "hold") {
      result = result.filter((ticket) => ticket.status === "on_hold");
    }

    // Apply tab filter
    if (activeTab === "pending") {
      result = result.filter((ticket) => ticket.status === "pending");
    } else if (activeTab === "hold") {
      result = result.filter((ticket) => ticket.status === "on_hold");
    }

    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      if (sortOption === "created_desc") return dateB - dateA;
      if (sortOption === "created_asc") return dateA - dateB;
      // For updated, we'll use createdAt as placeholder since we don't have updatedAt in mock data
      if (sortOption === "updated_desc") return dateB - dateA;
      if (sortOption === "updated_asc") return dateA - dateB;
      return 0;
    });

    return result;
  }, [searchQuery, statusFilter, activeTab, sortOption]);

  // Pagination
  const paginationInfo: PaginationInfo = {
    page: currentPage,
    totalPages: Math.ceil(filteredTickets.length / itemsPerPage),
    totalItems: filteredTickets.length,
  };

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRowClick = (ticketId: number) => {
    window.location.href = `/tickets/${ticketId}`;
  };

  return (
    <div className="h-full flex flex-col bg-[#f8fafc]">
      {/* Header Bar */}
      <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
        <h1 className="text-xl font-semibold text-[#1e293b]">My Dashboard</h1>
      </div>

      {/* View Toggle */}
      <ViewToggle value={activeView} onChange={setActiveView} />

      {/* Stats Cards Row */}
      <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AssignedTicketsCard stats={mockStats} />
        <CSATCard data={mockCSAT} />
      </div>

      {/* Tickets Section */}
      <div className="flex-1 mx-6 mb-6 bg-white border border-[#e2e8f0] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
        {/* Tabs */}
        <TicketTabs
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setCurrentPage(1);
          }}
          tabs={mockTabs}
        />

        {/* Toolbar */}
        <DashboardToolbar
          onSearch={(query) => {
            setSearchQuery(query);
            setCurrentPage(1);
          }}
          onStatusFilter={(status) => {
            setStatusFilter(status);
            setCurrentPage(1);
          }}
          onSortChange={setSortOption}
          activeStatus={statusFilter}
          currentSort={sortOption}
          visibleColumns={visibleColumns}
          onColumnsChange={setVisibleColumns}
        />

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <TicketTable tickets={paginatedTickets} onRowClick={handleRowClick} visibleColumns={visibleColumns} />
        </div>

        {/* Pagination */}
        <Pagination
          pagination={paginationInfo}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
