import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/tasks/[id]/subtasks - Get all subtasks for a task
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

    const subtasks = await prisma.subtask.findMany({
      where: { taskId: id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(subtasks);
  } catch (error) {
    console.error("Failed to fetch subtasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch subtasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/subtasks - Create a new subtask
export async function POST(
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
    const { title } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Get the highest sortOrder for this task
    const lastSubtask = await prisma.subtask.findFirst({
      where: { taskId: id },
      orderBy: { sortOrder: "desc" },
    });

    const subtask = await prisma.subtask.create({
      data: {
        title,
        taskId: id,
        sortOrder: lastSubtask ? lastSubtask.sortOrder + 1 : 0,
      },
    });

    return NextResponse.json(subtask, { status: 201 });
  } catch (error) {
    console.error("Failed to create subtask:", error);
    return NextResponse.json(
      { error: "Failed to create subtask" },
      { status: 500 }
    );
  }
}
