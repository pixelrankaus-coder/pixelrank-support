import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getAISettings } from "@/lib/ai/ai-service";

// GET - Fetch AI settings
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await getAISettings();

    // Mask API keys - only show if they're set
    return NextResponse.json({
      ...settings,
      anthropicApiKey: settings.anthropicApiKey ? "••••••••" : null,
      openaiApiKey: settings.openaiApiKey ? "••••••••" : null,
      openrouterApiKey: settings.openrouterApiKey ? "••••••••" : null,
      // Also check env vars for display
      hasAnthropicEnv: !!process.env.ANTHROPIC_API_KEY,
      hasOpenaiEnv: !!process.env.OPENAI_API_KEY,
      hasOpenrouterEnv: !!process.env.OPENROUTER_API_KEY,
    });
  } catch (error) {
    console.error("Failed to fetch AI settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PATCH - Update AI settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Build update data - only include fields that are provided
    const updateData: Record<string, unknown> = {};

    // Provider settings
    if (body.activeProvider !== undefined) updateData.activeProvider = body.activeProvider;
    if (body.isEnabled !== undefined) updateData.isEnabled = body.isEnabled;
    if (body.useFallback !== undefined) updateData.useFallback = body.useFallback;
    if (body.fallbackOrder !== undefined) updateData.fallbackOrder = body.fallbackOrder;

    // Models per provider
    if (body.anthropicModel !== undefined) updateData.anthropicModel = body.anthropicModel;
    if (body.openaiModel !== undefined) updateData.openaiModel = body.openaiModel;
    if (body.openrouterModel !== undefined) updateData.openrouterModel = body.openrouterModel;

    // Task-specific overrides
    if (body.summaryProvider !== undefined) updateData.summaryProvider = body.summaryProvider || null;
    if (body.summaryModel !== undefined) updateData.summaryModel = body.summaryModel || null;
    if (body.replyProvider !== undefined) updateData.replyProvider = body.replyProvider || null;
    if (body.replyModel !== undefined) updateData.replyModel = body.replyModel || null;

    // API Keys - only update if a new value is provided (not masked)
    if (body.anthropicApiKey && !body.anthropicApiKey.includes("••••")) {
      updateData.anthropicApiKey = body.anthropicApiKey;
    }
    if (body.openaiApiKey && !body.openaiApiKey.includes("••••")) {
      updateData.openaiApiKey = body.openaiApiKey;
    }
    if (body.openrouterApiKey && !body.openrouterApiKey.includes("••••")) {
      updateData.openrouterApiKey = body.openrouterApiKey;
    }

    // Allow clearing API keys
    if (body.anthropicApiKey === "") {
      updateData.anthropicApiKey = null;
    }
    if (body.openaiApiKey === "") {
      updateData.openaiApiKey = null;
    }
    if (body.openrouterApiKey === "") {
      updateData.openrouterApiKey = null;
    }

    const settings = await prisma.aISettings.upsert({
      where: { id: "default" },
      update: updateData,
      create: { id: "default", ...updateData },
    });

    return NextResponse.json({
      ...settings,
      anthropicApiKey: settings.anthropicApiKey ? "••••••••" : null,
      openaiApiKey: settings.openaiApiKey ? "••••••••" : null,
      openrouterApiKey: settings.openrouterApiKey ? "••••••••" : null,
      hasAnthropicEnv: !!process.env.ANTHROPIC_API_KEY,
      hasOpenaiEnv: !!process.env.OPENAI_API_KEY,
      hasOpenrouterEnv: !!process.env.OPENROUTER_API_KEY,
    });
  } catch (error) {
    console.error("Failed to update AI settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
