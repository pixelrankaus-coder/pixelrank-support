import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/projects - List projects with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const companyId = searchParams.get("companyId");
    const managerId = searchParams.get("managerId");

    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (companyId) {
      where.companyId = companyId;
    }
    if (managerId) {
      where.managerId = managerId;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        company: {
          select: { id: true, name: true },
        },
        manager: {
          select: { id: true, name: true, email: true },
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
    });

    // Add task stats for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const taskStats = await prisma.task.groupBy({
          by: ["status"],
          where: { projectId: project.id },
          _count: true,
        });

        const stats = {
          total: project._count.tasks,
          todo: 0,
          inProgress: 0,
          done: 0,
        };

        taskStats.forEach((stat) => {
          if (stat.status === "TODO") stats.todo = stat._count;
          if (stat.status === "IN_PROGRESS") stats.inProgress = stat._count;
          if (stat.status === "DONE") stats.done = stat._count;
        });

        return {
          ...project,
          taskStats: stats,
        };
      })
    );

    return NextResponse.json(projectsWithStats);
  } catch (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      status,
      startDate,
      dueDate,
      companyId,
      managerId,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        status: status || "ACTIVE",
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        companyId,
        managerId,
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
        manager: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
