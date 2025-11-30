/**
 * AI Agent Task API Routes
 *
 * POST /api/ai-agent/tasks - Create a task via AI agent
 * GET /api/ai-agent/tasks - List AI-generated tasks
 *
 * These endpoints are designed to be called by Claude via MCP tools.
 * They use API key authentication instead of session-based auth.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createAITask, type AITaskInput } from "@/lib/ai-agent"

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

// POST /api/ai-agent/tasks - Create a task via AI agent
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
      title,
      description,
      priority,
      dueDate,
      assigneeId,
      ticketId,
      contactId,
      companyId,
      projectId,
      aiReasoning,
      aiConfidence,
      aiModel,
      aiContext,
    } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    if (!aiReasoning) {
      return NextResponse.json(
        { error: "aiReasoning is required - explain why this task is being created" },
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

    // Create task input
    const taskInput: AITaskInput = {
      title,
      description,
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assigneeId,
      ticketId,
      contactId,
      companyId,
      projectId,
      aiReasoning,
      aiConfidence,
      aiModel: aiModel || "claude-unknown",
      aiContext,
    }

    // Create the task
    const result = await createAITask(taskInput)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      task: result.data,
      approvalStatus: result.approvalStatus,
      actionLogId: result.actionLogId,
      message: result.approvalStatus === "AUTO_APPROVED"
        ? "Task created and auto-approved"
        : "Task created and pending approval",
    }, { status: 201 })
  } catch (error) {
    console.error("Failed to create AI task:", error)
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    )
  }
}

// GET /api/ai-agent/tasks - List AI-generated tasks
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
    const approvalStatus = searchParams.get("approvalStatus")
    const ticketId = searchParams.get("ticketId")
    const contactId = searchParams.get("contactId")
    const companyId = searchParams.get("companyId")
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: Record<string, unknown> = {
      aiGenerated: true,
    }

    if (approvalStatus) {
      where.approvalStatus = approvalStatus
    }
    if (ticketId) {
      where.ticketId = ticketId
    }
    if (contactId) {
      where.contactId = contactId
    }
    if (companyId) {
      where.companyId = companyId
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, isAiAgent: true },
        },
        ticket: {
          select: { id: true, ticketNumber: true, subject: true },
        },
        company: {
          select: { id: true, name: true },
        },
        contact: {
          select: { id: true, name: true, email: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json({
      tasks,
      count: tasks.length,
    })
  } catch (error) {
    console.error("Failed to fetch AI tasks:", error)
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    )
  }
}
