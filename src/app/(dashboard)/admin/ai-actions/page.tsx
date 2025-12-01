import { prisma } from "@/lib/db";
import { AIActionsClient } from "./ai-actions-client";

export default async function AIActionsPage() {
  // Get AI action stats
  const [total, pending, approved, rejected, autoApproved] = await Promise.all([
    prisma.aIActionLog.count(),
    prisma.aIActionLog.count({ where: { approvalStatus: "PENDING" } }),
    prisma.aIActionLog.count({ where: { approvalStatus: "APPROVED" } }),
    prisma.aIActionLog.count({ where: { approvalStatus: "REJECTED" } }),
    prisma.aIActionLog.count({ where: { approvalStatus: "AUTO_APPROVED" } }),
  ]);

  const stats = {
    total,
    pending,
    approved,
    rejected,
    autoApproved,
    approvalRate: total > 0 ? ((approved + autoApproved) / total * 100).toFixed(1) : "0",
  };

  // Get recent AI actions with related data via separate queries
  const actions = await prisma.aIActionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Fetch related data
  const aiUserIds = Array.from(new Set(actions.map((a) => a.aiUserId)));
  const approverIds = Array.from(new Set(actions.map((a) => a.approvedById).filter(Boolean))) as string[];
  const ticketIds = Array.from(new Set(actions.map((a) => a.ticketId).filter(Boolean))) as string[];
  const taskIds = Array.from(new Set(actions.map((a) => a.taskId).filter(Boolean))) as string[];

  const [aiUsers, approvers, tickets, tasks] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: aiUserIds } },
      select: { id: true, name: true, email: true, isAiAgent: true },
    }),
    approverIds.length > 0
      ? prisma.user.findMany({
          where: { id: { in: approverIds } },
          select: { id: true, name: true, email: true },
        })
      : [],
    ticketIds.length > 0
      ? prisma.ticket.findMany({
          where: { id: { in: ticketIds } },
          select: { id: true, ticketNumber: true, subject: true },
        })
      : [],
    taskIds.length > 0
      ? prisma.task.findMany({
          where: { id: { in: taskIds } },
          select: { id: true, title: true },
        })
      : [],
  ]);

  // Create lookup maps
  const aiUserMap = new Map(aiUsers.map((u) => [u.id, u]));
  const approverMap = new Map(approvers.map((u) => [u.id, u]));
  const ticketMap = new Map(tickets.map((t) => [t.id, t]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Serialize actions with related data
  const serializedActions = actions.map((action) => ({
    ...action,
    createdAt: action.createdAt.toISOString(),
    approvedAt: action.approvedAt?.toISOString() || null,
    aiUser: aiUserMap.get(action.aiUserId) || { id: action.aiUserId, name: null, email: "unknown", isAiAgent: false },
    approvedBy: action.approvedById ? approverMap.get(action.approvedById) || null : null,
    ticket: action.ticketId ? ticketMap.get(action.ticketId) || null : null,
    task: action.taskId ? taskMap.get(action.taskId) || null : null,
  }));

  return <AIActionsClient stats={stats} initialActions={serializedActions} />;
}
