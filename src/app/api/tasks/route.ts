import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/tasks - List tasks with filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const assigneeId = searchParams.get("assigneeId");
    const projectId = searchParams.get("projectId");
    const companyId = searchParams.get("companyId");
    const contactId = searchParams.get("contactId");
    const ticketId = searchParams.get("ticketId");
    const myTasks = searchParams.get("myTasks") === "true";

    const where: any = {};

    if (status) {
      where.status = status;
    }
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }
    if (projectId) {
      where.projectId = projectId;
    }
    if (companyId) {
      where.companyId = companyId;
    }
    if (contactId) {
      where.contactId = contactId;
    }
    if (ticketId) {
      where.ticketId = ticketId;
    }
    if (myTasks) {
      where.assigneeId = session.user.id;
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
        ticket: {
          select: { id: true, ticketNumber: true, subject: true },
        },
        company: {
          select: { id: true, name: true },
        },
        contact: {
          select: { id: true, name: true, email: true },
        },
        subtasks: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: { notes: true, subtasks: true },
        },
      },
      orderBy: [
        { status: "asc" },
        { dueDate: "asc" },
        { priority: "desc" },
        { sortOrder: "asc" },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeId,
      projectId,
      ticketId,
      companyId,
      contactId,
      isRecurring,
      recurrence,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId,
        createdById: session.user.id,
        projectId,
        ticketId,
        companyId,
        contactId,
        isRecurring: isRecurring || false,
        recurrence,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
