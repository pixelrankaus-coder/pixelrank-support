import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/groups/[id] - Get a single group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            tickets: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Failed to fetch group:", error);
    return NextResponse.json(
      { error: "Failed to fetch group" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/groups/[id] - Update a group
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, memberIds } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate name (excluding current group)
    const existing = await prisma.group.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A group with this name already exists" },
        { status: 400 }
      );
    }

    // Delete existing members
    await prisma.groupMember.deleteMany({
      where: { groupId: id },
    });

    // Update group with new members
    const group = await prisma.group.update({
      where: { id },
      data: {
        name,
        description,
        members: {
          create: memberIds?.map((userId: string) => ({
            userId,
          })) || [],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(group);
  } catch (error) {
    console.error("Failed to update group:", error);
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/groups/[id] - Delete a group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete members first
    await prisma.groupMember.deleteMany({
      where: { groupId: id },
    });

    // Unassign tickets from this group
    await prisma.ticket.updateMany({
      where: { groupId: id },
      data: { groupId: null },
    });

    // Delete the group
    await prisma.group.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete group:", error);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}
