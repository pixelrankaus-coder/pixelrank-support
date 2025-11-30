import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { StatCards } from "@/components/dashboard/stat-cards";
import { TrendsChart } from "@/components/dashboard/trends-chart";
import { UnresolvedTickets } from "@/components/dashboard/unresolved-tickets";
import { MyTasksWidget } from "@/components/dashboard/my-tasks-widget";
import { Leaderboard } from "@/components/dashboard/leaderboard";
import { TaskRemindersWidget } from "@/components/dashboard/task-reminders-widget";

// Force dynamic rendering - always fetch fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getDashboardStats() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  const [
    unresolvedCount,
    openCount,
    pendingCount,
    unassignedCount,
    createdTodayCount,
    totalTickets,
    resolvedThisWeek,
    overdueCount,
  ] = await Promise.all([
    // Unresolved = OPEN + PENDING
    prisma.ticket.count({
      where: { status: { in: ["OPEN", "PENDING"] } },
    }),
    // Open
    prisma.ticket.count({
      where: { status: "OPEN" },
    }),
    // On hold (PENDING)
    prisma.ticket.count({
      where: { status: "PENDING" },
    }),
    // Unassigned
    prisma.ticket.count({
      where: { assigneeId: null, status: { in: ["OPEN", "PENDING"] } },
    }),
    // Tickets created today
    prisma.ticket.count({
      where: {
        createdAt: { gte: startOfToday },
      },
    }),
    // Total tickets
    prisma.ticket.count(),
    // Resolved this week
    prisma.ticket.count({
      where: {
        status: { in: ["RESOLVED", "CLOSED"] },
        resolvedAt: { gte: startOfWeek },
      },
    }),
    // Overdue - tickets past their resolution due date
    prisma.ticket.count({
      where: {
        status: { in: ["OPEN", "PENDING"] },
        resolutionDue: { lt: now },
      },
    }),
  ]);

  return {
    unresolved: unresolvedCount,
    overdue: overdueCount,
    dueToday: createdTodayCount,
    open: openCount,
    onHold: pendingCount,
    unassigned: unassignedCount,
    total: totalTickets,
    resolvedThisWeek,
  };
}

async function getTrendsData() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const [todayTickets, yesterdayTickets] = await Promise.all([
    prisma.ticket.findMany({
      where: { createdAt: { gte: startOfToday } },
      select: { createdAt: true },
    }),
    prisma.ticket.findMany({
      where: {
        createdAt: {
          gte: startOfYesterday,
          lt: startOfToday,
        },
      },
      select: { createdAt: true },
    }),
  ]);

  // Group by hour
  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    today: todayTickets.filter((t) => new Date(t.createdAt).getHours() === hour)
      .length,
    yesterday: yesterdayTickets.filter(
      (t) => new Date(t.createdAt).getHours() === hour
    ).length,
  }));

  return hourlyData;
}

async function getUnresolvedByGroup() {
  // Since we don't have groups, we'll show by assignee status
  const [unassigned, assigned] = await Promise.all([
    prisma.ticket.count({
      where: { assigneeId: null, status: { in: ["OPEN", "PENDING"] } },
    }),
    prisma.ticket.count({
      where: { assigneeId: { not: null }, status: { in: ["OPEN", "PENDING"] } },
    }),
  ]);

  return [
    { name: "Unassigned", count: unassigned },
    { name: "Assigned", count: assigned },
  ].filter((g) => g.count > 0);
}

async function getLeaderboardData() {
  // Get agents with their resolved ticket counts
  const agents = await prisma.user.findMany({
    where: { role: "AGENT" },
    select: {
      id: true,
      name: true,
      email: true,
      _count: {
        select: {
          ticketsAssigned: {
            where: { status: { in: ["RESOLVED", "CLOSED"] } },
          },
        },
      },
    },
  });

  return agents
    .map((agent, index) => ({
      id: agent.id,
      name: agent.name || agent.email,
      ticketsResolved: agent._count.ticketsAssigned,
      rank: index + 1,
    }))
    .sort((a, b) => b.ticketsResolved - a.ticketsResolved)
    .map((agent, index) => ({ ...agent, rank: index + 1 }));
}

async function getMyTasks(userId: string) {
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
    },
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueDate: true,
      project: {
        select: { id: true, name: true },
      },
    },
    orderBy: [
      { status: "asc" },
      { priority: "desc" },
      { dueDate: "asc" },
    ],
    take: 10,
  });

  // Serialize dates to strings for client component
  return tasks.map((task) => ({
    ...task,
    dueDate: task.dueDate?.toISOString() || null,
  }));
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id || "";

  const [stats, trendsData, unresolvedGroups, leaderboard, myTasks] = await Promise.all([
    getDashboardStats(),
    getTrendsData(),
    getUnresolvedByGroup(),
    getLeaderboardData(),
    userId ? getMyTasks(userId) : Promise.resolve([]),
  ]);

  return (
    <div className="p-6 space-y-6 overflow-auto h-full">
      {/* Stats Cards */}
      <StatCards stats={stats} />

      {/* Trends Chart */}
      <TrendsChart data={trendsData} />

      {/* Bottom Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UnresolvedTickets groups={unresolvedGroups} />
        <MyTasksWidget initialTasks={myTasks} userId={userId} />
        <TaskRemindersWidget />
        <Leaderboard agents={leaderboard} />
      </div>
    </div>
  );
}
