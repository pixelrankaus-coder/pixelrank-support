import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { trackAIUsage } from "@/lib/ai-usage";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Simple decryption for API keys (must match encryption in ai-settings route)
const ENCRYPTION_KEY = process.env.NEXTAUTH_SECRET || "default-key";

function decryptApiKey(encrypted: string): string {
  try {
    const decoded = Buffer.from(encrypted, "base64").toString("utf-8");
    const parts = decoded.split(":");
    return parts.slice(1).join(":");
  } catch {
    return "";
  }
}

interface AISettings {
  provider: string;
  apiKey: string | null;
  model: string | null;
  isEnabled: boolean;
}

interface AIResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

async function getAISettings(): Promise<AISettings | null> {
  const settings = await prisma.aISettings.findUnique({
    where: { id: "default" },
  });

  if (!settings || !settings.isEnabled || !settings.apiKey) {
    return null;
  }

  return {
    provider: settings.provider,
    apiKey: decryptApiKey(settings.apiKey),
    model: settings.model,
    isEnabled: settings.isEnabled,
  };
}

async function callAnthropic(
  systemPrompt: string,
  userContent: string,
  model: string,
  apiKey: string
): Promise<AIResponse> {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userContent }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();
  return {
    text: data.content[0]?.text || "",
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0,
  };
}

async function callOpenAI(
  systemPrompt: string,
  userContent: string,
  model: string,
  apiKey: string
): Promise<AIResponse> {
  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return {
    text: data.choices[0]?.message?.content || "",
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
  };
}

async function callAI(
  systemPrompt: string,
  userContent: string,
  settings: AISettings
): Promise<AIResponse> {
  if (settings.provider === "openai") {
    return callOpenAI(
      systemPrompt,
      userContent,
      settings.model || "gpt-4o-mini",
      settings.apiKey!
    );
  } else {
    return callAnthropic(
      systemPrompt,
      userContent,
      settings.model || "claude-3-5-haiku-20241022",
      settings.apiKey!
    );
  }
}

function buildConversationContext(ticket: {
  ticketNumber: number;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  contact: { name: string | null; email: string | null } | null;
  messages: {
    authorType: string;
    authorName: string | null;
    body: string;
    internal: boolean;
    createdAt: Date;
  }[];
}): string {
  let context = `Ticket #${ticket.ticketNumber}: ${ticket.subject}\n`;
  context += `Status: ${ticket.status} | Priority: ${ticket.priority}\n`;
  context += `Customer: ${ticket.contact?.name || "Unknown"} (${ticket.contact?.email || "No email"})\n\n`;

  if (ticket.description) {
    context += `Initial Request:\n${ticket.description}\n\n`;
  }

  if (ticket.messages.length > 0) {
    context += "Conversation:\n";
    for (const msg of ticket.messages) {
      if (msg.internal) continue; // Skip internal notes for AI context
      const author = msg.authorType === "CONTACT" ? "Customer" : "Agent";
      const time = new Date(msg.createdAt).toLocaleString();
      context += `[${time}] ${author} (${msg.authorName || "Unknown"}):\n${msg.body}\n\n`;
    }
  }

  return context;
}

// POST /api/tickets/[id]/ai-assist
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const regenerate = searchParams.get("regenerate") === "1";

    // Get current user for tracking
    const session = await auth();
    const userId = session?.user?.id;

    // Get AI settings from database
    const aiSettings = await getAISettings();

    if (!aiSettings) {
      return NextResponse.json(
        {
          error: "AI is not configured. Please configure AI settings in Admin > AI Settings.",
          configError: true,
        },
        { status: 503 }
      );
    }

    // Fetch ticket with messages
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        contact: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // If not regenerating and AI data exists, return cached data
    if (!regenerate && ticket.aiSummary && ticket.aiReply) {
      // Track as cached request (no tokens used)
      await trackAIUsage({
        provider: aiSettings.provider,
        model: ticket.aiModel || aiSettings.model || "unknown",
        feature: "ai_assist",
        inputTokens: 0,
        outputTokens: 0,
        ticketId: id,
        userId,
        cached: true,
      });

      return NextResponse.json({
        summary: ticket.aiSummary,
        reply: ticket.aiReply,
        generatedAt: ticket.aiGeneratedAt,
        model: ticket.aiModel,
        cached: true,
      });
    }

    const startTime = Date.now();

    // Build conversation context
    const conversationContext = buildConversationContext(ticket);

    // Generate summary
    const summaryPrompt = `You are a helpful assistant for customer support agents. Analyze the support ticket and provide a brief, actionable summary.

Focus on:
- The core issue or request
- Key details the agent needs to know
- Any urgency indicators
- Current status of the conversation

Keep the summary concise (2-4 sentences max).`;

    const summaryResponse = await callAI(summaryPrompt, conversationContext, aiSettings);

    // Generate suggested reply
    const replyPrompt = `You are a helpful assistant for customer support agents. Based on the support ticket conversation, draft a professional and helpful reply for the agent to send to the customer.

Guidelines:
- Be professional but friendly
- Address the customer's concerns directly
- Provide clear next steps if applicable
- Keep the response concise but complete
- Do NOT include greeting like "Dear [Name]" or signature - the agent will add those
- Do NOT make up information you don't have`;

    const replyResponse = await callAI(replyPrompt, conversationContext, aiSettings);

    const responseTime = Date.now() - startTime;

    // Calculate total tokens
    const totalInputTokens = summaryResponse.inputTokens + replyResponse.inputTokens;
    const totalOutputTokens = summaryResponse.outputTokens + replyResponse.outputTokens;

    // Store the generated data
    const modelUsed = aiSettings.model || (aiSettings.provider === "openai" ? "gpt-4o-mini" : "claude-3-5-haiku-20241022");
    const now = new Date();
    await prisma.ticket.update({
      where: { id },
      data: {
        aiSummary: summaryResponse.text,
        aiReply: replyResponse.text,
        aiGeneratedAt: now,
        aiModel: modelUsed,
      },
    });

    // Track AI usage
    await trackAIUsage({
      provider: aiSettings.provider,
      model: modelUsed,
      feature: "ai_assist",
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      ticketId: id,
      userId,
      responseTime,
      cached: false,
    });

    return NextResponse.json({
      summary: summaryResponse.text,
      reply: replyResponse.text,
      generatedAt: now,
      model: modelUsed,
      cached: false,
      usage: {
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        responseTime,
      },
    });
  } catch (error) {
    console.error("AI assist error:", error);

    const message = error instanceof Error ? error.message : "Failed to generate AI assist";
    const isConfigError = message.includes("not configured") || message.includes("API key");

    return NextResponse.json(
      {
        error: message,
        configError: isConfigError,
      },
      { status: isConfigError ? 503 : 500 }
    );
  }
}
