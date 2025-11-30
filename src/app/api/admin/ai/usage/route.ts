import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAIUsageStats } from "@/lib/ai/ai-service";

// GET - Fetch AI usage statistics
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const stats = await getAIUsageStats(days);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Failed to fetch AI usage stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage statistics" },
      { status: 500 }
    );
  }
}
