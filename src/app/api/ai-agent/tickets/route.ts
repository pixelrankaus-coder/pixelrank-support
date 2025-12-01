/**
 * AI Agent Ticket API Routes
 *
 * POST /api/ai-agent/tickets - Create a ticket via AI agent
 * GET /api/ai-agent/tickets - List AI-generated tickets
 *
 * These endpoints are designed to be called by Claude via MCP tools.
 * They use API key authentication instead of session-based auth.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createAITicket, type AITicketCreateInput } from "@/lib/ai-agent"

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

// POST /api/ai-agent/tickets - Create a ticket via AI agent
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
      subject,
      description,
      priority,
      contactEmail,
      contactName,
      assigneeId,
      groupId,
      source,
      aiReasoning,
      aiConfidence,
      aiModel,
      aiContext,
    } = body

    // Validate required fields
    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: "subject is required" },
        { status: 400 }
      )
    }

    if (!aiReasoning) {
      return NextResponse.json(
        { error: "aiReasoning is required - explain why this ticket is being created" },
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

    // Validate priority if provided
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
    if (priority && !validPriorities.includes(priority.toUpperCase())) {
      return NextResponse.json(
        { error: `priority must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      )
    }

    // Create ticket input
    const ticketInput: AITicketCreateInput = {
      subject: subject.trim(),
      description,
      priority: priority?.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' || undefined,
      contactEmail,
      contactName,
      assigneeId,
      groupId,
      source: source || 'AI_GENERATED',
      aiReasoning,
      aiConfidence,
      aiModel: aiModel || "claude-unknown",
      aiContext,
    }

    // Create the ticket
    const result = await createAITicket(ticketInput)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      ticket: result.data,
      approvalStatus: result.approvalStatus,
      actionLogId: result.actionLogId,
      statusMessage: result.approvalStatus === "AUTO_APPROVED"
        ? "Ticket created and auto-approved"
        : "Ticket created and pending approval",
    }, { status: 201 })
  } catch (error) {
    console.error("Failed to create AI ticket:", error)
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    )
  }
}

// GET /api/ai-agent/tickets - List AI-generated tickets
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
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const contactId = searchParams.get("contactId")
    const limit = parseInt(searchParams.get("limit") || "50")

    // Get the Claude AI user to filter by
    const claudeUser = await prisma.user.findFirst({
      where: { isAiAgent: true }
    })

    if (!claudeUser) {
      return NextResponse.json({
        tickets: [],
        count: 0,
        message: "No AI agent user found"
      })
    }

    const where: Record<string, unknown> = {
      createdById: claudeUser.id,
    }

    if (status) {
      where.status = status.toUpperCase()
    }
    if (priority) {
      where.priority = priority.toUpperCase()
    }
    if (contactId) {
      where.contactId = contactId
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        contact: {
          select: { id: true, name: true, email: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        group: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, isAiAgent: true },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json({
      tickets,
      count: tickets.length,
    })
  } catch (error) {
    console.error("Failed to fetch AI tickets:", error)
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    )
  }
}
