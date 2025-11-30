import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { emailLogger } from "@/lib/email-activity-logger";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId") || undefined;
  const type = searchParams.get("type") as "CONNECTION" | "FETCH" | "SEND" | "ERROR" | "INFO" | undefined;
  const level = searchParams.get("level") as "DEBUG" | "INFO" | "WARN" | "ERROR" | undefined;
  const limit = parseInt(searchParams.get("limit") || "100");

  try {
    const logs = await emailLogger.getRecent({
      channelId,
      type,
      level,
      limit: Math.min(limit, 500), // Cap at 500
    });

    // Parse JSON details back
    const logsWithParsedDetails = logs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
      details: log.details ? JSON.parse(log.details) : null,
    }));

    return NextResponse.json({ logs: logsWithParsedDetails });
  } catch (error) {
    console.error("Failed to fetch email activity logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const daysToKeep = parseInt(searchParams.get("daysToKeep") || "7");

  try {
    const deletedCount = await emailLogger.cleanup(daysToKeep);
    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} old log entries`,
    });
  } catch (error) {
    console.error("Failed to cleanup email activity logs:", error);
    return NextResponse.json(
      { error: "Failed to cleanup logs" },
      { status: 500 }
    );
  }
}
