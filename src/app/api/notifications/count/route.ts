import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET /api/notifications/count - Get unread notification count
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    const count = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to fetch notification count:", error);
    return NextResponse.json({ count: 0 });
  }
}
