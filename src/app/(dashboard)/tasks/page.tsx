import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TasksClient } from "./tasks-client";

export default async function TasksPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  // Fetch initial data
  const [tasks, agents, projects, companies, contacts] = await Promise.all([
    prisma.task.findMany({
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
        subtasks: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { notes: true, subtasks: true },
        },
      },
      orderBy: [
        { status: "asc" },
        { dueDate: "asc" },
        { priority: "desc" },
      ],
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Serialize dates to strings for client component
  const serializedTasks = tasks.map((task) => ({
    ...task,
    dueDate: task.dueDate?.toISOString() || null,
    completedAt: task.completedAt?.toISOString() || null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    subtasks: task.subtasks.map((subtask) => ({
      ...subtask,
      createdAt: subtask.createdAt.toISOString(),
      updatedAt: subtask.updatedAt.toISOString(),
      completedAt: subtask.completedAt?.toISOString() || null,
    })),
  }));

  return (
    <TasksClient
      initialTasks={serializedTasks}
      agents={agents}
      projects={projects}
      companies={companies}
      contacts={contacts}
      currentUserId={session.user.id}
    />
  );
}
