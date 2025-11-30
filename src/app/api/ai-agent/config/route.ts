/**
 * AI Agent Configuration API Routes
 *
 * GET /api/ai-agent/config - Get AI confidence config
 * PATCH /api/ai-agent/config - Update AI confidence config
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getAIConfidenceConfig } from "@/lib/ai-agent"

// GET /api/ai-agent/config - Get AI confidence configuration
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const config = await getAIConfidenceConfig()
    return NextResponse.json(config)
  } catch (error) {
    console.error("Failed to fetch AI config:", error)
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    )
  }
}

// PATCH /api/ai-agent/config - Update AI confidence configuration
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can update config
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only admins can update AI configuration" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      taskAutoApprove,
      taskDraft,
      noteAutoApprove,
      autoApproveEnabled,
      requireApprovalForNew,
    } = body

    // Validate thresholds
    const validateThreshold = (value: unknown, name: string) => {
      if (value !== undefined) {
        if (typeof value !== "number" || value < 0 || value > 1) {
          throw new Error(`${name} must be a number between 0.0 and 1.0`)
        }
      }
    }

    validateThreshold(taskAutoApprove, "taskAutoApprove")
    validateThreshold(taskDraft, "taskDraft")
    validateThreshold(noteAutoApprove, "noteAutoApprove")

    const config = await prisma.aIConfidenceConfig.upsert({
      where: { id: "default" },
      update: {
        ...(taskAutoApprove !== undefined && { taskAutoApprove }),
        ...(taskDraft !== undefined && { taskDraft }),
        ...(noteAutoApprove !== undefined && { noteAutoApprove }),
        ...(autoApproveEnabled !== undefined && { autoApproveEnabled }),
        ...(requireApprovalForNew !== undefined && { requireApprovalForNew }),
      },
      create: {
        id: "default",
        taskAutoApprove: taskAutoApprove ?? 0.85,
        taskDraft: taskDraft ?? 0.5,
        noteAutoApprove: noteAutoApprove ?? 0.9,
        autoApproveEnabled: autoApproveEnabled ?? false,
        requireApprovalForNew: requireApprovalForNew ?? true,
      },
    })

    return NextResponse.json({
      success: true,
      config,
      message: "AI configuration updated successfully",
    })
  } catch (error) {
    console.error("Failed to update AI config:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update config" },
      { status: 500 }
    )
  }
}
