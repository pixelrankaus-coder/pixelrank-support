import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Get a single time entry
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const entry = await prisma.timeEntry.findUnique({
      where: { id: params.id },
      include: {
        task: {
          select: { id: true, title: true, project: { select: { id: true, name: true } } },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error fetching time entry:", error);
    return NextResponse.json({ error: "Failed to fetch time entry" }, { status: 500 });
  }
}

// PUT - Update a time entry
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if entry exists and belongs to user
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id: params.id },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    // Only allow the user who created the entry or admins to edit
    if (existingEntry.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { description, duration, date, isBillable, hourlyRate, startTime, endTime } = body;

    const entry = await prisma.timeEntry.update({
      where: { id: params.id },
      data: {
        description: description !== undefined ? description : undefined,
        duration: duration !== undefined ? duration : undefined,
        date: date !== undefined ? new Date(date) : undefined,
        isBillable: isBillable !== undefined ? isBillable : undefined,
        hourlyRate: hourlyRate !== undefined ? hourlyRate : undefined,
        startTime: startTime !== undefined ? (startTime ? new Date(startTime) : null) : undefined,
        endTime: endTime !== undefined ? (endTime ? new Date(endTime) : null) : undefined,
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

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error updating time entry:", error);
    return NextResponse.json({ error: "Failed to update time entry" }, { status: 500 });
  }
}

// DELETE - Delete a time entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if entry exists and belongs to user
    const existingEntry = await prisma.timeEntry.findUnique({
      where: { id: params.id },
    });

    if (!existingEntry) {
      return NextResponse.json({ error: "Time entry not found" }, { status: 404 });
    }

    // Only allow the user who created the entry or admins to delete
    if (existingEntry.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.timeEntry.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return NextResponse.json({ error: "Failed to delete time entry" }, { status: 500 });
  }
}
