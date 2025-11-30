import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// POST - Perform bulk operations on tasks
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { taskIds, action, data } = body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: "Task IDs are required" }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    let result;

    switch (action) {
      case "updateStatus":
        if (!data?.status) {
          return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }
        result = await prisma.task.updateMany({
          where: { id: { in: taskIds } },
          data: {
            status: data.status,
            completedAt: data.status === "DONE" ? new Date() : null,
          },
        });
        break;

      case "updatePriority":
        if (!data?.priority) {
          return NextResponse.json({ error: "Priority is required" }, { status: 400 });
        }
        result = await prisma.task.updateMany({
          where: { id: { in: taskIds } },
          data: { priority: data.priority },
        });
        break;

      case "assignTo":
        result = await prisma.task.updateMany({
          where: { id: { in: taskIds } },
          data: { assigneeId: data?.assigneeId || null },
        });
        break;

      case "moveToProject":
        result = await prisma.task.updateMany({
          where: { id: { in: taskIds } },
          data: { projectId: data?.projectId || null },
        });
        break;

      case "setDueDate":
        result = await prisma.task.updateMany({
          where: { id: { in: taskIds } },
          data: { dueDate: data?.dueDate ? new Date(data.dueDate) : null },
        });
        break;

      case "delete":
        result = await prisma.task.deleteMany({
          where: { id: { in: taskIds } },
        });
        break;

      case "archive":
        // Archive = mark as CANCELLED
        result = await prisma.task.updateMany({
          where: { id: { in: taskIds } },
          data: { status: "CANCELLED" },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      count: result.count,
    });
  } catch (error) {
    console.error("Error performing bulk operation:", error);
    return NextResponse.json({ error: "Failed to perform bulk operation" }, { status: 500 });
  }
}
