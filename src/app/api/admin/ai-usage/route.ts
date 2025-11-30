import { NextRequest, NextResponse } from "next/server";
import { getUsageStats } from "@/lib/ai-usage";

// GET /api/admin/ai-usage
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    const data = await getUsageStats(days);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch AI usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI usage data" },
      { status: 500 }
    );
  }
}
