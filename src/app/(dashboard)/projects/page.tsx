import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProjectsClient } from "./projects-client";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  // Fetch initial data
  const [projects, agents, companies] = await Promise.all([
    prisma.project.findMany({
      include: {
        company: {
          select: { id: true, name: true },
        },
        manager: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: [
        { status: "asc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
    prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Get task stats and team members for each project
  const projectsWithStats = await Promise.all(
    projects.map(async (project) => {
      const [taskStats, teamMembers, overdueCount] = await Promise.all([
        prisma.task.groupBy({
          by: ["status"],
          where: { projectId: project.id },
          _count: true,
        }),
        // Get unique assignees for this project's tasks
        prisma.task.findMany({
          where: {
            projectId: project.id,
            assigneeId: { not: null }
          },
          select: {
            assignee: {
              select: { id: true, name: true, email: true, avatar: true }
            }
          },
          distinct: ['assigneeId'],
        }),
        // Count overdue tasks (not done, past due date)
        prisma.task.count({
          where: {
            projectId: project.id,
            status: { not: "DONE" },
            dueDate: { lt: new Date() },
          },
        }),
      ]);

      const stats = {
        total: project._count.tasks,
        todo: 0,
        inProgress: 0,
        done: 0,
        overdue: overdueCount,
      };

      taskStats.forEach((stat) => {
        if (stat.status === "TODO") stats.todo = stat._count;
        if (stat.status === "IN_PROGRESS") stats.inProgress = stat._count;
        if (stat.status === "DONE") stats.done = stat._count;
      });

      // Build team array with unique members
      const teamMap = new Map<string, { id: string; name: string | null; email: string; image: string | null }>();

      // Add manager first if exists
      if (project.manager) {
        teamMap.set(project.manager.id, {
          id: project.manager.id,
          name: project.manager.name,
          email: project.manager.email,
          image: project.manager.avatar,
        });
      }

      // Add task assignees
      teamMembers.forEach((t) => {
        if (t.assignee && !teamMap.has(t.assignee.id)) {
          teamMap.set(t.assignee.id, {
            id: t.assignee.id,
            name: t.assignee.name,
            email: t.assignee.email,
            image: t.assignee.avatar,
          });
        }
      });

      return {
        ...project,
        taskStats: stats,
        team: Array.from(teamMap.values()),
      };
    })
  );

  return (
    <ProjectsClient
      initialProjects={projectsWithStats}
      agents={agents}
      companies={companies}
    />
  );
}
