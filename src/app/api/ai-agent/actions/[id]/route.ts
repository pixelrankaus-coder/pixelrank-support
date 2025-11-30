/**
 * AI Agent Actions API Routes - Single Action
 *
 * GET /api/ai-agent/actions/[id] - Get single action details
 * POST /api/ai-agent/actions/[id]/approve - Approve an action
 * POST /api/ai-agent/actions/[id]/reject - Reject an action
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { approveAIAction, rejectAIAction } from "@/lib/ai-agent"
import { auth } from "@/lib/auth"

// GET /api/ai-agent/actions/[id] - Get action details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const action = await prisma.aIActionLog.findUnique({
      where: { id },
    })

    if (!action) {
      return NextResponse.json(
        { error: "Action not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(action)
  } catch (error) {
    console.error("Failed to fetch action:", error)
    return NextResponse.json(
      { error: "Failed to fetch action" },
      { status: 500 }
    )
  }
}

// PATCH /api/ai-agent/actions/[id] - Update action (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action: actionType, rejectionReason } = body

    if (!actionType || !["approve", "reject"].includes(actionType)) {
      return NextResponse.json(
        { error: "action must be 'approve' or 'reject'" },
        { status: 400 }
      )
    }

    let result
    if (actionType === "approve") {
      result = await approveAIAction(id, session.user.id)
    } else {
      result = await rejectAIAction(id, session.user.id, rejectionReason)
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      action: result.data,
      approvalStatus: result.approvalStatus,
      message: actionType === "approve"
        ? "Action approved successfully"
        : "Action rejected successfully",
    })
  } catch (error) {
    console.error("Failed to update action:", error)
    return NextResponse.json(
      { error: "Failed to update action" },
      { status: 500 }
    )
  }
}
