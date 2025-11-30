import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/admin/groups - List all groups
export async function GET() {
  try {
    const groups = await prisma.group.findMany({
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
      orderBy: { name: "asc" },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error("Failed to fetch groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

// POST /api/admin/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, memberIds } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await prisma.group.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A group with this name already exists" },
        { status: 400 }
      );
    }

    const group = await prisma.group.create({
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
    console.error("Failed to create group:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
