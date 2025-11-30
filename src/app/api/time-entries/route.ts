import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - List time entries (with optional filters)
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");
  const userId = searchParams.get("userId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  const where: Record<string, unknown> = {};

  if (taskId) where.taskId = taskId;
  if (userId) where.userId = userId;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate);
  }

  try {
    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        task: {
          select: { id: true, title: true, project: { select: { id: true, name: true } } },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return NextResponse.json({ error: "Failed to fetch time entries" }, { status: 500 });
  }
}

// POST - Create a new time entry
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { taskId, description, duration, date, isBillable, hourlyRate, startTime, endTime } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    if (!duration || duration <= 0) {
      return NextResponse.json({ error: "Duration must be greater than 0" }, { status: 400 });
    }

    // Verify task exists
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const entry = await prisma.timeEntry.create({
      data: {
        taskId,
        userId: session.user.id,
        description: description || null,
        duration,
        date: date ? new Date(date) : new Date(),
        isBillable: isBillable ?? true,
        hourlyRate: hourlyRate || null,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
      },
      include: {
        task: {
          select: { id: true, title: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Error creating time entry:", error);
    return NextResponse.json({ error: "Failed to create time entry" }, { status: 500 });
  }
}
