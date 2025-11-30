import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Fetch deliverables (optionally filtered by projectId)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where = projectId ? { projectId } : {};

    const deliverables = await prisma.deliverable.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: [
        { status: "asc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(deliverables);
  } catch (error) {
    console.error("Error fetching deliverables:", error);
    return NextResponse.json({ error: "Failed to fetch deliverables" }, { status: 500 });
  }
}

// POST - Create a new deliverable
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, type, status, dueDate, projectId, fileUrl } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const deliverable = await prisma.deliverable.create({
      data: {
        name,
        description: description || null,
        type: type || "OTHER",
        status: status || "PENDING",
        dueDate: dueDate ? new Date(dueDate) : null,
        fileUrl: fileUrl || null,
        projectId,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(deliverable, { status: 201 });
  } catch (error) {
    console.error("Error creating deliverable:", error);
    return NextResponse.json({ error: "Failed to create deliverable" }, { status: 500 });
  }
}
