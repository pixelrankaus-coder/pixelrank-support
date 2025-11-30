import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Get tasks with upcoming/overdue due dates for current user
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Get user's tasks that have due dates
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: session.user.id,
        status: { notIn: ["DONE", "CANCELLED"] },
        dueDate: { not: null },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        status: true,
        priority: true,
        project: { select: { id: true, name: true } },
      },
      orderBy: { dueDate: "asc" },
    });

    // Categorize tasks
    const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now);
    const dueToday = tasks.filter(t => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due >= now && due.toDateString() === now.toDateString();
    });
    const dueTomorrow = tasks.filter(t => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due.toDateString() === tomorrow.toDateString();
    });
    const dueThisWeek = tasks.filter(t => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate);
      return due > tomorrow && due <= nextWeek;
    });

    return NextResponse.json({
      overdue,
      dueToday,
      dueTomorrow,
      dueThisWeek,
      summary: {
        overdue: overdue.length,
        dueToday: dueToday.length,
        dueTomorrow: dueTomorrow.length,
        dueThisWeek: dueThisWeek.length,
        total: overdue.length + dueToday.length + dueTomorrow.length + dueThisWeek.length,
      },
    });
  } catch (error) {
    console.error("Error fetching task reminders:", error);
    return NextResponse.json({ error: "Failed to fetch reminders" }, { status: 500 });
  }
}

// POST - Create notifications for overdue/due-soon tasks
// This can be called by a cron job
export async function POST(request: NextRequest) {
  // Allow both authenticated users and API key for cron
  const session = await auth();
  const apiKey = request.headers.get("x-api-key");

  if (!session?.user?.id && apiKey !== process.env.CRON_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find all tasks that are overdue or due today with assignees
    const tasksNeedingReminder = await prisma.task.findMany({
      where: {
        assigneeId: { not: null },
        status: { notIn: ["DONE", "CANCELLED"] },
        dueDate: {
          lte: tomorrow,
        },
      },
      include: {
        assignee: { select: { id: true } },
      },
    });

    // Create notifications (avoiding duplicates for today)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const notifications = [];
    for (const task of tasksNeedingReminder) {
      if (!task.assigneeId || !task.dueDate) continue;

      const isOverdue = new Date(task.dueDate) < now;
      const isDueToday = new Date(task.dueDate).toDateString() === now.toDateString();

      // Check if we already sent a notification for this task today
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: task.assigneeId,
          type: "TASK_REMINDER",
          message: { contains: task.id },
          createdAt: { gte: startOfToday },
        },
      });

      if (!existingNotification) {
        let title: string;
        let message: string;

        if (isOverdue) {
          title = "Task Overdue";
          message = `Task "${task.title}" is overdue. ${task.id}`;
        } else if (isDueToday) {
          title = "Task Due Today";
          message = `Task "${task.title}" is due today. ${task.id}`;
        } else {
          title = "Task Due Tomorrow";
          message = `Task "${task.title}" is due tomorrow. ${task.id}`;
        }

        notifications.push({
          userId: task.assigneeId,
          type: "TASK_REMINDER",
          title,
          message,
        });
      }
    }

    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications,
      });
    }

    return NextResponse.json({
      success: true,
      notificationsCreated: notifications.length,
      tasksChecked: tasksNeedingReminder.length,
    });
  } catch (error) {
    console.error("Error creating task reminders:", error);
    return NextResponse.json({ error: "Failed to create reminders" }, { status: 500 });
  }
}
