import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateAIResponse } from "@/lib/ai/ai-service";
import { createAITask, createAITicket, CLAUDE_AI_USER_ID } from "@/lib/ai-agent";

/**
 * Claude Chat API - Conversational interface for interacting with Claude
 *
 * Supports natural language commands like:
 * - "Create a task to fix the database issue, assign to me, due tomorrow"
 * - "Create a ticket for the billing problem from john@example.com"
 * - General questions about the helpdesk
 */

// System prompt for Claude to understand the helpdesk context
const SYSTEM_PROMPT = `You are Claude, an AI assistant integrated into a helpdesk support system. You help agents manage their work by:

1. Creating tasks when asked (use the CREATE_TASK action)
2. Creating tickets when asked (use the CREATE_TICKET action)
3. Answering questions about support best practices
4. Helping draft responses to customers

When the user asks you to create a task or ticket, you MUST respond with a JSON action in this exact format:

For tasks:
{"action": "CREATE_TASK", "data": {"title": "Task title", "description": "Optional description", "priority": "LOW|MEDIUM|HIGH|URGENT", "dueDate": "YYYY-MM-DD or relative like 'tomorrow'", "assigneeName": "Name of person to assign to or 'me'"}}

For tickets:
{"action": "CREATE_TICKET", "data": {"subject": "Ticket subject", "description": "Ticket description", "priority": "LOW|MEDIUM|HIGH|URGENT", "contactEmail": "customer@email.com", "contactName": "Customer name if known"}}

If you're not creating an action, just respond conversationally as a helpful assistant.

Important context about the current user will be provided in each message. Use this to properly assign tasks when they say "assign to me".

Be concise but helpful. You can use markdown formatting.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Parse relative dates like "tomorrow", "next week", etc.
function parseRelativeDate(input: string): Date | null {
  const now = new Date();
  const lower = input.toLowerCase().trim();

  if (lower === "today") {
    return now;
  }
  if (lower === "tomorrow") {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    return date;
  }
  if (lower === "next week") {
    const date = new Date(now);
    date.setDate(date.getDate() + 7);
    return date;
  }
  if (lower.match(/in (\d+) days?/)) {
    const match = lower.match(/in (\d+) days?/);
    if (match) {
      const days = parseInt(match[1]);
      const date = new Date(now);
      date.setDate(date.getDate() + days);
      return date;
    }
  }

  // Try parsing as a date string
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return null;
}

// Handle task creation action
async function handleCreateTask(
  data: Record<string, string>,
  userId: string,
  conversationId: string
): Promise<{ success: boolean; message: string; actionLogId?: string }> {
  // Find assignee
  let assigneeId: string | undefined;

  if (data.assigneeName) {
    const assigneeName = data.assigneeName.toLowerCase();

    if (assigneeName === "me" || assigneeName === "myself") {
      assigneeId = userId;
    } else if (assigneeName === "claude" || assigneeName === "you") {
      assigneeId = CLAUDE_AI_USER_ID;
    } else {
      // Search for user by name
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { name: { contains: data.assigneeName, mode: "insensitive" } },
            { email: { contains: data.assigneeName, mode: "insensitive" } },
          ],
        },
      });
      if (user) {
        assigneeId = user.id;
      }
    }
  }

  // Parse due date
  let dueDate: Date | undefined;
  if (data.dueDate) {
    const parsed = parseRelativeDate(data.dueDate);
    if (parsed) {
      dueDate = parsed;
    }
  }

  // Create the task
  const result = await createAITask({
    title: data.title,
    description: data.description,
    priority: (data.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT") || "MEDIUM",
    dueDate,
    assigneeId,
    aiReasoning: `Task created via Claude Chat conversation (${conversationId})`,
    aiConfidence: 0.9,
    aiModel: "claude-chat",
  });

  if (result.success) {
    const task = result.data as { id: string; title: string };
    return {
      success: true,
      message: `Task "${task.title}" created successfully! ${result.approvalStatus === "AUTO_APPROVED" ? "It has been auto-approved." : "It is pending approval."}`,
      actionLogId: result.actionLogId,
    };
  }

  return {
    success: false,
    message: `Failed to create task: ${result.error}`,
  };
}

// Handle ticket creation action
async function handleCreateTicket(
  data: Record<string, string>,
  userId: string,
  conversationId: string
): Promise<{ success: boolean; message: string; actionLogId?: string }> {
  const result = await createAITicket({
    subject: data.subject,
    description: data.description,
    priority: (data.priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT") || "MEDIUM",
    contactEmail: data.contactEmail,
    contactName: data.contactName,
    aiReasoning: `Ticket created via Claude Chat conversation (${conversationId})`,
    aiConfidence: 0.9,
    aiModel: "claude-chat",
  });

  if (result.success) {
    const ticket = result.data as { ticketNumber: number; subject: string };
    return {
      success: true,
      message: `Ticket #${ticket.ticketNumber} "${ticket.subject}" created successfully! ${result.approvalStatus === "AUTO_APPROVED" ? "It has been auto-approved." : "It is pending approval."}`,
      actionLogId: result.actionLogId,
    };
  }

  return {
    success: false,
    message: `Failed to create ticket: ${result.error}`,
  };
}

// Parse Claude's response for action JSON
function parseActionFromResponse(content: string): { action: string; data: Record<string, string> } | null {
  // Look for JSON in the response
  const jsonMatch = content.match(/\{[\s\S]*?"action"[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.action && parsed.data) {
        return parsed;
      }
    } catch {
      // Not valid JSON
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.chatConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 20, // Last 20 messages for context
          },
        },
      });

      if (!conversation || conversation.userId !== session.user.id) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }
    } else {
      // Create new conversation
      conversation = await prisma.chatConversation.create({
        data: {
          type: "CLAUDE_CHAT",
          userId: session.user.id,
          title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        },
        include: {
          messages: true,
        },
      });
    }

    // Get current user info for context
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, role: true },
    });

    // Build message history for AI
    // Note: DB stores roles as uppercase (USER, ASSISTANT), but AI APIs require lowercase
    const messageHistory: ChatMessage[] = conversation.messages.map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant",
      content: m.content,
    }));

    // Add current user context to the message
    const contextualMessage = `[Context: Current user is ${currentUser?.name || currentUser?.email} (ID: ${currentUser?.id}). Today is ${new Date().toLocaleDateString()}.]

User message: ${message}`;

    // Save user message
    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "USER",
        content: message,
      },
    });

    // Generate AI response
    const aiResponse = await generateAIResponse({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messageHistory.map((m) => ({
          role: m.role as "system" | "user" | "assistant",
          content: m.content,
        })),
        { role: "user", content: contextualMessage },
      ],
      maxTokens: 1024,
      taskType: "other",
      userId: session.user.id,
    });

    if (aiResponse.error) {
      return NextResponse.json({ error: aiResponse.error }, { status: 500 });
    }

    let responseContent = aiResponse.content;
    let actionResult: { success: boolean; message: string; actionLogId?: string } | null = null;

    // Check if the response contains an action
    const parsedAction = parseActionFromResponse(aiResponse.content);
    if (parsedAction) {
      if (parsedAction.action === "CREATE_TASK") {
        actionResult = await handleCreateTask(
          parsedAction.data,
          session.user.id,
          conversation.id
        );
        // Replace the JSON with a friendly message
        responseContent = actionResult.message;
      } else if (parsedAction.action === "CREATE_TICKET") {
        actionResult = await handleCreateTicket(
          parsedAction.data,
          session.user.id,
          conversation.id
        );
        responseContent = actionResult.message;
      }
    }

    // Save assistant message
    const assistantMessage = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "ASSISTANT",
        content: responseContent,
        aiModel: aiResponse.model,
        tokensUsed: (aiResponse.inputTokens || 0) + (aiResponse.outputTokens || 0),
        actionType: actionResult ? parsedAction?.action : null,
        actionData: actionResult ? JSON.stringify(parsedAction?.data) : null,
        actionLogId: actionResult?.actionLogId || null,
      },
    });

    // Update conversation title if this is the first message
    if (conversation.messages.length === 0) {
      await prisma.chatConversation.update({
        where: { id: conversation.id },
        data: {
          title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        },
      });
    }

    return NextResponse.json({
      success: true,
      conversationId: conversation.id,
      message: {
        id: assistantMessage.id,
        role: "assistant",
        content: responseContent,
        actionType: actionResult ? parsedAction?.action : null,
        actionSuccess: actionResult?.success,
        createdAt: assistantMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("Claude chat error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

// GET - Fetch conversation history
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      // Get specific conversation
      const conversation = await prisma.chatConversation.findUnique({
        where: { id: conversationId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!conversation || conversation.userId !== session.user.id) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      return NextResponse.json({ conversation });
    }

    // Get all conversations for the user
    const conversations = await prisma.chatConversation.findMany({
      where: {
        userId: session.user.id,
        type: "CLAUDE_CHAT",
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // Just the last message for preview
        },
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Claude chat GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
