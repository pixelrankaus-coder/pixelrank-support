/**
 * AI Agent Actions API Routes
 *
 * GET /api/ai-agent/actions - List AI action logs
 * GET /api/ai-agent/actions?pending=true - List pending actions
 *
 * These endpoints are for viewing and managing AI agent action history.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getPendingAIActions, getAIActionStats } from "@/lib/ai-agent"
import { auth } from "@/lib/auth"

// GET /api/ai-agent/actions - List AI action logs
export async function GET(request: NextRequest) {
  try {
    // This endpoint requires session auth (for admin UI)
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const pending = searchParams.get("pending") === "true"
    const stats = searchParams.get("stats") === "true"
    const limit = parseInt(searchParams.get("limit") || "50")
    const entityType = searchParams.get("entityType") || undefined

    // If requesting stats
    if (stats) {
      const startDate = searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : undefined
      const endDate = searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : undefined

      const actionStats = await getAIActionStats({ startDate, endDate })
      return NextResponse.json(actionStats)
    }

    // If requesting pending actions only
    if (pending) {
      const actions = await getPendingAIActions({ entityType, limit })
      return NextResponse.json({
        actions,
        count: actions.length,
      })
    }

    // Otherwise, list all actions
    const where: Record<string, unknown> = {}
    if (entityType) {
      where.entityType = entityType
    }

    const actions = await prisma.aIActionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json({
      actions,
      count: actions.length,
    })
  } catch (error) {
    console.error("Failed to fetch AI actions:", error)
    return NextResponse.json(
      { error: "Failed to fetch actions" },
      { status: 500 }
    )
  }
}
