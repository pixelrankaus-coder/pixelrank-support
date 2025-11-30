import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// PATCH /api/tasks/[id]/subtasks/[subtaskId] - Update a subtask
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, subtaskId } = await params;
    const body = await request.json();
    const { title, isCompleted, sortOrder } = body;

    // Verify subtask exists and belongs to the task
    const existingSubtask = await prisma.subtask.findFirst({
      where: { id: subtaskId, taskId: id },
    });

    if (!existingSubtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    const updateData: {
      title?: string;
      isCompleted?: boolean;
      sortOrder?: number;
      completedAt?: Date | null;
    } = {};

    if (title !== undefined) updateData.title = title;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      updateData.completedAt = isCompleted ? new Date() : null;
    }

    const subtask = await prisma.subtask.update({
      where: { id: subtaskId },
      data: updateData,
    });

    return NextResponse.json(subtask);
  } catch (error) {
    console.error("Failed to update subtask:", error);
    return NextResponse.json(
      { error: "Failed to update subtask" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]/subtasks/[subtaskId] - Delete a subtask
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, subtaskId } = await params;

    // Verify subtask exists and belongs to the task
    const existingSubtask = await prisma.subtask.findFirst({
      where: { id: subtaskId, taskId: id },
    });

    if (!existingSubtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    await prisma.subtask.delete({
      where: { id: subtaskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete subtask:", error);
    return NextResponse.json(
      { error: "Failed to delete subtask" },
      { status: 500 }
    );
  }
}
