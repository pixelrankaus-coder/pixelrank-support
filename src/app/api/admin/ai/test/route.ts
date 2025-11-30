import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { testProvider, AIProvider } from "@/lib/ai/ai-service";

// POST - Test a specific AI provider
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider } = await request.json();

    if (!["anthropic", "openai", "openrouter"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const result = await testProvider(provider as AIProvider);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to test provider:", error);
    return NextResponse.json(
      { success: false, error: "Test failed" },
      { status: 500 }
    );
  }
}
