import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// Presence is considered stale after 30 seconds
const PRESENCE_TIMEOUT_MS = 30 * 1000;

// GET /api/tickets/[id]/presence - Get current viewers of a ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ticketId } = await params;

    // Get all active presence records (updated within timeout period)
    const cutoffTime = new Date(Date.now() - PRESENCE_TIMEOUT_MS);

    const presenceRecords = await prisma.ticketPresence.findMany({
      where: {
        ticketId,
        lastSeen: { gte: cutoffTime },
      },
      select: {
        userId: true,
        userName: true,
        isTyping: true,
        lastSeen: true,
      },
    });

    // Clean up old presence records (older than 5 minutes)
    const cleanupTime = new Date(Date.now() - 5 * 60 * 1000);
    prisma.ticketPresence
      .deleteMany({
        where: { lastSeen: { lt: cleanupTime } },
      })
      .catch(() => {}); // Fire and forget

    return NextResponse.json({
      viewers: presenceRecords,
      currentUserId: session.user.id,
    });
  } catch (error) {
    console.error("Failed to fetch presence:", error);
    return NextResponse.json(
      { error: "Failed to fetch presence" },
      { status: 500 }
    );
  }
}

// POST /api/tickets/[id]/presence - Update agent's presence on a ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ticketId } = await params;
    const body = await request.json().catch(() => ({}));
    const { isTyping = false } = body;

    // Upsert presence record
    await prisma.ticketPresence.upsert({
      where: {
        ticketId_userId: {
          ticketId,
          userId: session.user.id,
        },
      },
      update: {
        lastSeen: new Date(),
        isTyping,
        userName: session.user.name || session.user.email,
      },
      create: {
        ticketId,
        userId: session.user.id,
        userName: session.user.name || session.user.email,
        isTyping,
      },
    });

    // Get all active viewers
    const cutoffTime = new Date(Date.now() - PRESENCE_TIMEOUT_MS);
    const presenceRecords = await prisma.ticketPresence.findMany({
      where: {
        ticketId,
        lastSeen: { gte: cutoffTime },
      },
      select: {
        userId: true,
        userName: true,
        isTyping: true,
        lastSeen: true,
      },
    });

    return NextResponse.json({
      viewers: presenceRecords,
      currentUserId: session.user.id,
    });
  } catch (error) {
    console.error("Failed to update presence:", error);
    return NextResponse.json(
      { error: "Failed to update presence" },
      { status: 500 }
    );
  }
}

// DELETE /api/tickets/[id]/presence - Remove agent's presence from a ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: ticketId } = await params;

    await prisma.ticketPresence.deleteMany({
      where: {
        ticketId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to remove presence:", error);
    return NextResponse.json(
      { error: "Failed to remove presence" },
      { status: 500 }
    );
  }
}
