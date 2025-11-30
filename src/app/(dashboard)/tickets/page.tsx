import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { TicketList } from "@/components/tickets/ticket-list";
import {
  getFiltersForView,
  isValidView,
  getViewById,
  TicketViewId,
} from "./views";

interface PageProps {
  searchParams: Promise<{
    view?: string;
    status?: string;
    priority?: string;
    assignee?: string;
    search?: string;
  }>;
}

export default async function TicketsPage({ searchParams }: PageProps) {
  const session = await auth();
  const params = await searchParams;
  const { view, status, priority, assignee, search } = params;

  // Determine the current view
  const currentView: TicketViewId = isValidView(view) ? view : "all";
  const viewConfig = getViewById(currentView);

  // Start with view-based filters
  const where: Record<string, unknown> = getFiltersForView(
    currentView,
    session?.user.id
  );

  // Apply additional manual filters (these override view filters)
  if (status && status !== "ALL") {
    // Handle comma-separated statuses
    if (status.includes(",")) {
      where.status = { in: status.split(",") };
    } else {
      where.status = status;
    }
  }

  if (priority && priority !== "ALL") {
    where.priority = priority;
  }

  if (assignee && assignee !== "ALL") {
    if (assignee === "UNASSIGNED") {
      where.assigneeId = null;
    } else {
      where.assigneeId = assignee;
    }
  }

  if (search) {
    where.OR = [
      { subject: { contains: search } },
      { description: { contains: search } },
      { ticketNumber: { equals: parseInt(search) || -1 } },
    ];
  }

  const [tickets, agents, totalCount] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        contact: {
          include: {
            companyRef: true,
          },
        },
        assignee: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
    }),
    prisma.ticket.count({ where }),
  ]);

  return (
    <TicketList
      tickets={tickets}
      agents={agents}
      viewName={viewConfig?.name || "All tickets"}
      totalCount={totalCount}
    />
  );
}
