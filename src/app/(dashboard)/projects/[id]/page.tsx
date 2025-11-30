import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { ProjectDetailClient } from "./project-detail-client";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      company: {
        select: { id: true, name: true },
      },
      manager: {
        select: { id: true, name: true, email: true },
      },
      tasks: {
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { notes: true },
          },
        },
        orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      },
      deliverables: {
        orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Fetch agents and contacts for task creation
  const [agents, contacts] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.contact.findMany({
      where: project.companyId ? { companyId: project.companyId } : undefined,
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Calculate task stats
  const taskStats = {
    total: project.tasks.length,
    todo: project.tasks.filter((t) => t.status === "TODO").length,
    inProgress: project.tasks.filter((t) => t.status === "IN_PROGRESS").length,
    done: project.tasks.filter((t) => t.status === "DONE").length,
  };

  return (
    <ProjectDetailClient
      project={project}
      taskStats={taskStats}
      agents={agents}
      contacts={contacts}
      currentUserId={session.user.id}
    />
  );
}
