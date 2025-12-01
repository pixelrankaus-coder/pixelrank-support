/**
 * AI Agent Ticket Reply API Routes
 *
 * POST /api/ai-agent/ticket-replies - Create a ticket reply via AI agent
 * GET /api/ai-agent/ticket-replies - List AI-generated ticket replies
 *
 * These endpoints are designed to be called by Claude via MCP tools.
 * They use API key authentication instead of session-based auth.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createAITicketReply, type AITicketReplyInput } from "@/lib/ai-agent"

// API key for Claude agent (set in environment)
const AI_AGENT_API_KEY = process.env.AI_AGENT_API_KEY

/**
 * Validate API key for AI agent requests
 */
function validateApiKey(request: NextRequest): boolean {
  // If no API key is configured, allow requests (for development)
  if (!AI_AGENT_API_KEY) {
    console.warn("AI_AGENT_API_KEY not configured - allowing all AI agent requests")
    return true
  }

  const authHeader = request.headers.get("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false
  }

  const token = authHeader.split(" ")[1]
  return token === AI_AGENT_API_KEY
}

// POST /api/ai-agent/ticket-replies - Create a ticket reply via AI agent
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid or missing API key" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      ticketId,
      body: messageBody,
      internal,
      aiReasoning,
      aiConfidence,
      aiModel,
      aiContext,
    } = body

    // Validate required fields
    if (!ticketId) {
      return NextResponse.json(
        { error: "ticketId is required" },
        { status: 400 }
      )
    }

    if (!messageBody || !messageBody.trim()) {
      return NextResponse.json(
        { error: "body (message content) is required" },
        { status: 400 }
      )
    }

    if (!aiReasoning) {
      return NextResponse.json(
        { error: "aiReasoning is required - explain why this reply is being sent" },
        { status: 400 }
      )
    }

    if (aiConfidence === undefined || aiConfidence === null) {
      return NextResponse.json(
        { error: "aiConfidence is required (0.0-1.0)" },
        { status: 400 }
      )
    }

    if (aiConfidence < 0 || aiConfidence > 1) {
      return NextResponse.json(
        { error: "aiConfidence must be between 0.0 and 1.0" },
        { status: 400 }
      )
    }

    // Create reply input
    const replyInput: AITicketReplyInput = {
      ticketId,
      body: messageBody.trim(),
      internal: internal ?? false,
      aiReasoning,
      aiConfidence,
      aiModel: aiModel || "claude-unknown",
      aiContext,
    }

    // Create the reply
    const result = await createAITicketReply(replyInput)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.data,
      approvalStatus: result.approvalStatus,
      actionLogId: result.actionLogId,
      statusMessage: result.approvalStatus === "AUTO_APPROVED"
        ? `${internal ? "Internal note" : "Reply"} created and auto-approved`
        : `${internal ? "Internal note" : "Reply"} created and pending approval`,
    }, { status: 201 })
  } catch (error) {
    console.error("Failed to create AI ticket reply:", error)
    return NextResponse.json(
      { error: "Failed to create ticket reply" },
      { status: 500 }
    )
  }
}

// GET /api/ai-agent/ticket-replies - List AI-generated ticket replies
export async function GET(request: NextRequest) {
  try {
    // Validate API key
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid or missing API key" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get("ticketId")
    const internal = searchParams.get("internal")
    const limit = parseInt(searchParams.get("limit") || "50")

    // Get the Claude AI user to filter by
    const claudeUser = await prisma.user.findFirst({
      where: { isAiAgent: true }
    })

    if (!claudeUser) {
      return NextResponse.json({
        messages: [],
        count: 0,
        message: "No AI agent user found"
      })
    }

    const where: Record<string, unknown> = {
      agentAuthorId: claudeUser.id,
    }

    if (ticketId) {
      where.ticketId = ticketId
    }
    if (internal !== null) {
      where.internal = internal === "true"
    }

    const messages = await prisma.ticketMessage.findMany({
      where,
      include: {
        agentAuthor: {
          select: { id: true, name: true, email: true, isAiAgent: true },
        },
        ticket: {
          select: { id: true, ticketNumber: true, subject: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json({
      messages,
      count: messages.length,
    })
  } catch (error) {
    console.error("Failed to fetch AI ticket replies:", error)
    return NextResponse.json(
      { error: "Failed to fetch ticket replies" },
      { status: 500 }
    )
  }
}
