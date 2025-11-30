import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/projects/[id] - Get a single project with tasks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
          },
          orderBy: [
            { status: "asc" },
            { dueDate: "asc" },
            { sortOrder: "asc" },
          ],
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to fetch project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
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

    // Get current project to check status change
    const currentProject = await prisma.project.findUnique({
      where: { id },
      select: { status: true, completedAt: true },
    });

    if (!currentProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Set completedAt when project is marked as COMPLETED
    let completedAt = currentProject.completedAt;
    if (status === "COMPLETED" && currentProject.status !== "COMPLETED") {
      completedAt = new Date();
    } else if (status !== "COMPLETED" && currentProject.status === "COMPLETED") {
      completedAt = null;
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        status,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        companyId,
        managerId,
        completedAt,
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

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if project has tasks
    const taskCount = await prisma.task.count({
      where: { projectId: id },
    });

    if (taskCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete project with existing tasks. Delete or reassign tasks first." },
        { status: 400 }
      );
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
