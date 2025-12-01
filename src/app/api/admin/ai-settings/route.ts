import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Simple encryption/decryption for API keys (in production, use proper encryption)
const ENCRYPTION_KEY = process.env.NEXTAUTH_SECRET || "default-key";

function encryptApiKey(apiKey: string): string {
  // Simple base64 encoding with key prefix - in production use proper encryption
  const combined = `${ENCRYPTION_KEY.slice(0, 8)}:${apiKey}`;
  return Buffer.from(combined).toString("base64");
}

function decryptApiKey(encrypted: string): string {
  try {
    const decoded = Buffer.from(encrypted, "base64").toString("utf-8");
    const parts = decoded.split(":");
    return parts.slice(1).join(":");
  } catch {
    return "";
  }
}

function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 12) return "••••••••";
  return apiKey.slice(0, 8) + "••••••••" + apiKey.slice(-4);
}

// GET /api/admin/ai-settings - Legacy endpoint for backward compatibility
export async function GET() {
  try {
    let settings = await prisma.aISettings.findUnique({
      where: { id: "default" },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.aISettings.create({
        data: {
          id: "default",
          activeProvider: "anthropic",
          anthropicModel: "claude-3-5-haiku-20241022",
          isEnabled: false,
        },
      });
    }

    // Get the active provider's API key
    const activeApiKey = settings.activeProvider === "anthropic"
      ? settings.anthropicApiKey
      : settings.activeProvider === "openai"
        ? settings.openaiApiKey
        : settings.openrouterApiKey;

    const activeModel = settings.activeProvider === "anthropic"
      ? settings.anthropicModel
      : settings.activeProvider === "openai"
        ? settings.openaiModel
        : settings.openrouterModel;

    // Return settings with masked API key (legacy format for backward compatibility)
    return NextResponse.json({
      id: settings.id,
      provider: settings.activeProvider,
      model: activeModel,
      isEnabled: settings.isEnabled,
      apiKey: activeApiKey ? maskApiKey(decryptApiKey(activeApiKey)) : null,
      hasApiKey: !!activeApiKey,
      // Also include new multi-provider fields
      activeProvider: settings.activeProvider,
      anthropicModel: settings.anthropicModel,
      openaiModel: settings.openaiModel,
      openrouterModel: settings.openrouterModel,
      useFallback: settings.useFallback,
      fallbackOrder: settings.fallbackOrder,
      hasAnthropicKey: !!settings.anthropicApiKey || !!process.env.ANTHROPIC_API_KEY,
      hasOpenaiKey: !!settings.openaiApiKey || !!process.env.OPENAI_API_KEY,
      hasOpenrouterKey: !!settings.openrouterApiKey || !!process.env.OPENROUTER_API_KEY,
      // Per-provider enable/disable toggles
      anthropicEnabled: settings.anthropicEnabled ?? true,
      openaiEnabled: settings.openaiEnabled ?? true,
      openrouterEnabled: settings.openrouterEnabled ?? true,
    });
  } catch (error) {
    console.error("Failed to fetch AI settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI settings" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/ai-settings - Legacy endpoint for backward compatibility
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      provider,
      apiKey,
      model,
      isEnabled,
      // New multi-provider fields
      activeProvider,
      anthropicApiKey,
      openaiApiKey,
      openrouterApiKey,
      anthropicModel,
      openaiModel,
      openrouterModel,
      useFallback,
      fallbackOrder,
      // Per-provider enable/disable toggles
      anthropicEnabled,
      openaiEnabled,
      openrouterEnabled,
    } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Handle legacy provider field
    if (provider !== undefined || activeProvider !== undefined) {
      updateData.activeProvider = activeProvider || provider;
    }

    // Handle legacy model field - update the appropriate provider's model
    if (model !== undefined) {
      const currentProvider = activeProvider || provider;
      if (currentProvider === "anthropic") {
        updateData.anthropicModel = model;
      } else if (currentProvider === "openai") {
        updateData.openaiModel = model;
      } else if (currentProvider === "openrouter") {
        updateData.openrouterModel = model;
      }
    }

    // Handle new per-provider models
    if (anthropicModel !== undefined) updateData.anthropicModel = anthropicModel;
    if (openaiModel !== undefined) updateData.openaiModel = openaiModel;
    if (openrouterModel !== undefined) updateData.openrouterModel = openrouterModel;

    if (typeof isEnabled === "boolean") {
      updateData.isEnabled = isEnabled;
    }

    if (typeof useFallback === "boolean") {
      updateData.useFallback = useFallback;
    }

    if (fallbackOrder !== undefined) {
      updateData.fallbackOrder = fallbackOrder;
    }

    // Handle per-provider enable/disable toggles
    if (typeof anthropicEnabled === "boolean") {
      updateData.anthropicEnabled = anthropicEnabled;
    }
    if (typeof openaiEnabled === "boolean") {
      updateData.openaiEnabled = openaiEnabled;
    }
    if (typeof openrouterEnabled === "boolean") {
      updateData.openrouterEnabled = openrouterEnabled;
    }

    // Handle legacy apiKey - store it for the active provider
    if (apiKey && apiKey.trim()) {
      const currentProvider = activeProvider || provider || "anthropic";
      if (currentProvider === "anthropic") {
        updateData.anthropicApiKey = encryptApiKey(apiKey.trim());
      } else if (currentProvider === "openai") {
        updateData.openaiApiKey = encryptApiKey(apiKey.trim());
      } else if (currentProvider === "openrouter") {
        updateData.openrouterApiKey = encryptApiKey(apiKey.trim());
      }
    }

    // Handle new per-provider API keys
    if (anthropicApiKey && anthropicApiKey.trim()) {
      updateData.anthropicApiKey = encryptApiKey(anthropicApiKey.trim());
    }
    if (openaiApiKey && openaiApiKey.trim()) {
      updateData.openaiApiKey = encryptApiKey(openaiApiKey.trim());
    }
    if (openrouterApiKey && openrouterApiKey.trim()) {
      updateData.openrouterApiKey = encryptApiKey(openrouterApiKey.trim());
    }

    // Upsert settings
    const settings = await prisma.aISettings.upsert({
      where: { id: "default" },
      update: updateData,
      create: {
        id: "default",
        activeProvider: activeProvider || provider || "anthropic",
        anthropicModel: anthropicModel || model || "claude-3-5-haiku-20241022",
        openaiModel: openaiModel || "gpt-4o-mini",
        openrouterModel: openrouterModel || "meta-llama/llama-3.1-8b-instruct:free",
        anthropicApiKey: apiKey && (activeProvider || provider) === "anthropic" ? encryptApiKey(apiKey.trim()) : anthropicApiKey ? encryptApiKey(anthropicApiKey.trim()) : null,
        openaiApiKey: apiKey && (activeProvider || provider) === "openai" ? encryptApiKey(apiKey.trim()) : openaiApiKey ? encryptApiKey(openaiApiKey.trim()) : null,
        openrouterApiKey: apiKey && (activeProvider || provider) === "openrouter" ? encryptApiKey(apiKey.trim()) : openrouterApiKey ? encryptApiKey(openrouterApiKey.trim()) : null,
        isEnabled: isEnabled ?? false,
        useFallback: useFallback ?? true,
        fallbackOrder: fallbackOrder || "openai,openrouter",
      },
    });

    // Get the active provider's API key for response
    const activeApiKey = settings.activeProvider === "anthropic"
      ? settings.anthropicApiKey
      : settings.activeProvider === "openai"
        ? settings.openaiApiKey
        : settings.openrouterApiKey;

    const activeModel = settings.activeProvider === "anthropic"
      ? settings.anthropicModel
      : settings.activeProvider === "openai"
        ? settings.openaiModel
        : settings.openrouterModel;

    return NextResponse.json({
      id: settings.id,
      provider: settings.activeProvider,
      model: activeModel,
      isEnabled: settings.isEnabled,
      apiKey: activeApiKey ? maskApiKey(decryptApiKey(activeApiKey)) : null,
      hasApiKey: !!activeApiKey,
      activeProvider: settings.activeProvider,
      anthropicModel: settings.anthropicModel,
      openaiModel: settings.openaiModel,
      openrouterModel: settings.openrouterModel,
      useFallback: settings.useFallback,
      fallbackOrder: settings.fallbackOrder,
      hasAnthropicKey: !!settings.anthropicApiKey || !!process.env.ANTHROPIC_API_KEY,
      hasOpenaiKey: !!settings.openaiApiKey || !!process.env.OPENAI_API_KEY,
      hasOpenrouterKey: !!settings.openrouterApiKey || !!process.env.OPENROUTER_API_KEY,
    });
  } catch (error) {
    console.error("Failed to update AI settings:", error);
    return NextResponse.json(
      { error: "Failed to update AI settings" },
      { status: 500 }
    );
  }
}

// POST /api/admin/ai-settings/test - Test API connection
export async function POST() {
  try {
    const settings = await prisma.aISettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      return NextResponse.json(
        { success: false, error: "No AI settings configured" },
        { status: 400 }
      );
    }

    // Get API key for active provider
    let apiKey: string | null = null;
    let model: string;

    if (settings.activeProvider === "anthropic") {
      apiKey = settings.anthropicApiKey ? decryptApiKey(settings.anthropicApiKey) : process.env.ANTHROPIC_API_KEY || null;
      model = settings.anthropicModel;
    } else if (settings.activeProvider === "openai") {
      apiKey = settings.openaiApiKey ? decryptApiKey(settings.openaiApiKey) : process.env.OPENAI_API_KEY || null;
      model = settings.openaiModel;
    } else {
      apiKey = settings.openrouterApiKey ? decryptApiKey(settings.openrouterApiKey) : process.env.OPENROUTER_API_KEY || null;
      model = settings.openrouterModel;
    }

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: `No API key configured for ${settings.activeProvider}` },
        { status: 400 }
      );
    }

    if (settings.activeProvider === "anthropic") {
      // Test Anthropic API
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 10,
          messages: [{ role: "user", content: "Hi" }],
        }),
      });

      if (response.ok) {
        return NextResponse.json({ success: true, message: "Anthropic API connection successful" });
      } else {
        const error = await response.json();
        return NextResponse.json({
          success: false,
          error: error.error?.message || "Failed to connect to Anthropic API"
        });
      }
    } else if (settings.activeProvider === "openai") {
      // Test OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 10,
          messages: [{ role: "user", content: "Hi" }],
        }),
      });

      if (response.ok) {
        return NextResponse.json({ success: true, message: "OpenAI API connection successful" });
      } else {
        const error = await response.json();
        return NextResponse.json({
          success: false,
          error: error.error?.message || "Failed to connect to OpenAI API"
        });
      }
    } else if (settings.activeProvider === "openrouter") {
      // Test OpenRouter API
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 10,
          messages: [{ role: "user", content: "Hi" }],
        }),
      });

      if (response.ok) {
        return NextResponse.json({ success: true, message: "OpenRouter API connection successful" });
      } else {
        const error = await response.json();
        return NextResponse.json({
          success: false,
          error: error.error?.message || "Failed to connect to OpenRouter API"
        });
      }
    }

    return NextResponse.json({ success: false, error: "Unknown provider" });
  } catch (error) {
    console.error("API test failed:", error);
    return NextResponse.json(
      { success: false, error: "Connection test failed" },
      { status: 500 }
    );
  }
}
