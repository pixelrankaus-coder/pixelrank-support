/**
 * AI Agent Notes API Routes
 *
 * POST /api/ai-agent/notes - Create a task note via AI agent
 *
 * These endpoints are designed to be called by Claude via MCP tools.
 */

import { NextRequest, NextResponse } from "next/server"
import { createAITaskNote, type AINoteInput } from "@/lib/ai-agent"

// API key for Claude agent (set in environment)
const AI_AGENT_API_KEY = process.env.AI_AGENT_API_KEY

/**
 * Validate API key for AI agent requests
 */
function validateApiKey(request: NextRequest): boolean {
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

// POST /api/ai-agent/notes - Create a note on a task via AI agent
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
      taskId,
      content,
      aiReasoning,
      aiConfidence,
      aiModel,
    } = body

    // Validate required fields
    if (!taskId) {
      return NextResponse.json(
        { error: "taskId is required" },
        { status: 400 }
      )
    }

    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      )
    }

    if (!aiReasoning) {
      return NextResponse.json(
        { error: "aiReasoning is required - explain why this note is being added" },
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

    // Create note input
    const noteInput: AINoteInput = {
      taskId,
      content,
      aiReasoning,
      aiConfidence,
      aiModel: aiModel || "claude-unknown",
    }

    // Create the note
    const result = await createAITaskNote(noteInput)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      note: result.data,
      approvalStatus: result.approvalStatus,
      actionLogId: result.actionLogId,
      message: result.approvalStatus === "AUTO_APPROVED"
        ? "Note added and auto-approved"
        : "Note added and pending approval",
    }, { status: 201 })
  } catch (error) {
    console.error("Failed to create AI note:", error)
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    )
  }
}
