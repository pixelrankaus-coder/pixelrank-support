import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET /api/admin/agents/[id] - Get single agent details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const agent = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        mobile: true,
        jobTitle: true,
        timezone: true,
        signature: true,
        avatar: true,
        agentType: true,
        ticketScope: true,
        level: true,
        points: true,
        channels: true,
        createdAt: true,
        groups: {
          include: {
            group: {
              select: { id: true, name: true },
            },
          },
        },
        badges: true,
        _count: {
          select: {
            ticketsAssigned: {
              where: {
                status: { in: ["OPEN", "PENDING"] },
              },
            },
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error("Failed to fetch agent:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      email,
      password,
      role,
      phone,
      mobile,
      jobTitle,
      timezone,
      signature,
      avatar,
      agentType,
      ticketScope,
      level,
      channels,
      groupIds,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if email is taken by another user
    const existing = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An agent with this email already exists" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      name: name || null,
      email,
      role: role || "AGENT",
      phone: phone || null,
      mobile: mobile || null,
      jobTitle: jobTitle || null,
      timezone: timezone || "UTC",
      signature: signature || null,
      avatar: avatar || null,
      agentType: agentType || "FULL_TIME",
      ticketScope: ticketScope || "ALL",
      level: level || "Beginner",
      channels: channels || null,
    };

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    // Update user
    const agent = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        mobile: true,
        jobTitle: true,
        timezone: true,
        signature: true,
        avatar: true,
        agentType: true,
        ticketScope: true,
        level: true,
        points: true,
        channels: true,
        createdAt: true,
      },
    });

    // Update group memberships if provided
    if (Array.isArray(groupIds)) {
      // Remove existing memberships
      await prisma.groupMember.deleteMany({
        where: { userId: id },
      });

      // Add new memberships
      if (groupIds.length > 0) {
        await prisma.groupMember.createMany({
          data: groupIds.map((groupId: string) => ({
            groupId,
            userId: id,
          })),
        });
      }
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error("Failed to update agent:", error);
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Prevent deleting yourself
    if (session.user.id === id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Check if user has assigned tickets
    const ticketCount = await prisma.ticket.count({
      where: { assigneeId: id },
    });

    if (ticketCount > 0) {
      return NextResponse.json(
        {
          error: `This agent has ${ticketCount} assigned tickets. Reassign them first.`,
        },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete agent:", error);
    return NextResponse.json(
      { error: "Failed to delete agent" },
      { status: 500 }
    );
  }
}
