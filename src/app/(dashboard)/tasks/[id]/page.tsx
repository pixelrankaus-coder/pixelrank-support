import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { TaskDetailClient } from "./task-detail-client";

export default async function TaskDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const [task, agents] = await Promise.all([
    prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
        ticket: {
          select: { id: true, ticketNumber: true, subject: true },
        },
        company: {
          select: { id: true, name: true },
        },
        contact: {
          select: { id: true, name: true, email: true },
        },
        notes: {
          include: {
            author: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        subtasks: {
          orderBy: { sortOrder: "asc" },
        },
        timeEntries: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { date: "desc" },
        },
      },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!task) {
    notFound();
  }

  return (
    <TaskDetailClient
      task={task}
      agents={agents}
      currentUserId={session.user.id}
    />
  );
}
