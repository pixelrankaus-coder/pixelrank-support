import { prisma } from "@/lib/db";
import { ReportsClient } from "./reports-client";
import { subDays, startOfDay, endOfDay } from "date-fns";

export default async function ReportsPage() {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const sevenDaysAgo = subDays(now, 7);

  // Get ticket statistics
  const [
    totalTickets,
    openTickets,
    pendingTickets,
    resolvedTickets,
    closedTickets,
    urgentTickets,
    ticketsLast30Days,
    ticketsLast7Days,
    ticketsByPriority,
    ticketsByAgent,
    ticketsByDay,
    avgResponseTime,
  ] = await Promise.all([
    // Total tickets
    prisma.ticket.count(),
    // Open tickets
    prisma.ticket.count({ where: { status: "OPEN" } }),
    // Pending tickets
    prisma.ticket.count({ where: { status: "PENDING" } }),
    // Resolved tickets
    prisma.ticket.count({ where: { status: "RESOLVED" } }),
    // Closed tickets
    prisma.ticket.count({ where: { status: "CLOSED" } }),
    // Urgent tickets
    prisma.ticket.count({ where: { priority: "URGENT", status: { in: ["OPEN", "PENDING"] } } }),
    // Tickets created in last 30 days
    prisma.ticket.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    // Tickets created in last 7 days
    prisma.ticket.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    }),
    // Group by priority
    prisma.ticket.groupBy({
      by: ["priority"],
      _count: { priority: true },
    }),
    // Tickets by agent (top 10)
    prisma.ticket.groupBy({
      by: ["assigneeId"],
      _count: { assigneeId: true },
      where: { assigneeId: { not: null } },
      orderBy: { _count: { assigneeId: "desc" } },
      take: 10,
    }),
    // Tickets by day (last 7 days)
    Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const day = subDays(now, 6 - i);
        return prisma.ticket.count({
          where: {
            createdAt: {
              gte: startOfDay(day),
              lte: endOfDay(day),
            },
          },
        }).then((count) => ({
          date: day.toISOString().split("T")[0],
          count,
        }));
      })
    ),
    // Average first response time (for resolved tickets with response)
    prisma.ticket.findMany({
      where: {
        firstRespondedAt: { not: null },
      },
      select: {
        createdAt: true,
        firstRespondedAt: true,
      },
      take: 100,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Get agent names for the agent stats
  const agentIds = ticketsByAgent
    .map((t) => t.assigneeId)
    .filter((id): id is string => id !== null);

  const agents = await prisma.user.findMany({
    where: { id: { in: agentIds } },
    select: { id: true, name: true, email: true },
  });

  const agentMap = new Map(agents.map((a) => [a.id, a.name || a.email]));

  // Calculate average response time in hours
  let avgResponseHours = 0;
  if (avgResponseTime.length > 0) {
    const totalMinutes = avgResponseTime.reduce((sum, ticket) => {
      if (ticket.firstRespondedAt) {
        const diff = new Date(ticket.firstRespondedAt).getTime() - new Date(ticket.createdAt).getTime();
        return sum + diff / (1000 * 60);
      }
      return sum;
    }, 0);
    avgResponseHours = Math.round((totalMinutes / avgResponseTime.length / 60) * 10) / 10;
  }

  // Format data for the client
  const stats = {
    totalTickets,
    openTickets,
    pendingTickets,
    resolvedTickets,
    closedTickets,
    urgentTickets,
    ticketsLast30Days,
    ticketsLast7Days,
    avgResponseHours,
  };

  const priorityData = ticketsByPriority.map((p) => ({
    priority: p.priority,
    count: p._count.priority,
  }));

  const agentData = ticketsByAgent.map((a) => ({
    agent: agentMap.get(a.assigneeId || "") || "Unknown",
    count: a._count.assigneeId,
  }));

  return (
    <ReportsClient
      stats={stats}
      priorityData={priorityData}
      agentData={agentData}
      dailyData={ticketsByDay}
    />
  );
}
