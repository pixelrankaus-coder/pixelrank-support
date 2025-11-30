import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET - Fetch a single deliverable
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const deliverable = await prisma.deliverable.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    if (!deliverable) {
      return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
    }

    return NextResponse.json(deliverable);
  } catch (error) {
    console.error("Error fetching deliverable:", error);
    return NextResponse.json({ error: "Failed to fetch deliverable" }, { status: 500 });
  }
}

// PATCH - Update a deliverable
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, type, status, dueDate, fileUrl } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) {
      updateData.status = status;
      // Set deliveredAt when status changes to DELIVERED
      if (status === "DELIVERED") {
        updateData.deliveredAt = new Date();
      } else if (status === "PENDING" || status === "IN_PROGRESS") {
        updateData.deliveredAt = null;
      }
    }
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl;

    const deliverable = await prisma.deliverable.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(deliverable);
  } catch (error) {
    console.error("Error updating deliverable:", error);
    return NextResponse.json({ error: "Failed to update deliverable" }, { status: 500 });
  }
}

// DELETE - Delete a deliverable
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.deliverable.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting deliverable:", error);
    return NextResponse.json({ error: "Failed to delete deliverable" }, { status: 500 });
  }
}
