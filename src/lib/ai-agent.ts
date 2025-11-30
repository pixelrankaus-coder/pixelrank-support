/**
 * AI Agent Helper Library
 *
 * Provides utilities for Claude AI agent operations including:
 * - Task creation with AI attribution
 * - Note creation with audit logging
 * - Approval status management
 * - Confidence-based auto-approval
 */

import { prisma } from './db'
import { ApprovalStatus, Priority } from '@prisma/client'

// Well-known Claude AI agent user ID (matches seed.ts)
export const CLAUDE_AI_USER_ID = 'claude-ai-agent-9999'
export const CLAUDE_AI_EMAIL = 'claude@ai.system'

// Types for AI agent operations
export interface AITaskInput {
  title: string
  description?: string
  priority?: Priority
  dueDate?: Date
  assigneeId?: string
  ticketId?: string
  contactId?: string
  companyId?: string
  projectId?: string
  // AI metadata
  aiReasoning: string
  aiConfidence: number
  aiModel?: string
  aiContext?: Record<string, unknown>
}

export interface AINoteInput {
  taskId: string
  content: string
  // AI metadata
  aiReasoning: string
  aiConfidence: number
  aiModel?: string
}

export interface AIActionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  approvalStatus: ApprovalStatus
  actionLogId?: string
}

/**
 * Get the Claude AI system user, creating if necessary
 */
export async function getOrCreateClaudeUser() {
  let claudeUser = await prisma.user.findUnique({
    where: { email: CLAUDE_AI_EMAIL }
  })

  if (!claudeUser) {
    // Create the Claude AI user if it doesn't exist
    const bcrypt = await import('bcryptjs')
    claudeUser = await prisma.user.create({
      data: {
        id: CLAUDE_AI_USER_ID,
        email: CLAUDE_AI_EMAIL,
        name: 'Claude AI',
        passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
        role: 'AGENT',
        isAiAgent: true,
        jobTitle: 'AI Assistant',
        agentType: 'AI_AGENT',
      }
    })
  }

  return claudeUser
}

/**
 * Get AI confidence configuration
 */
export async function getAIConfidenceConfig() {
  let config = await prisma.aIConfidenceConfig.findUnique({
    where: { id: 'default' }
  })

  if (!config) {
    // Create default config if it doesn't exist
    config = await prisma.aIConfidenceConfig.create({
      data: {
        id: 'default',
        taskAutoApprove: 0.85,
        taskDraft: 0.5,
        noteAutoApprove: 0.9,
        autoApproveEnabled: false,
        requireApprovalForNew: true,
      }
    })
  }

  return config
}

/**
 * Determine approval status based on confidence and config
 */
export async function determineApprovalStatus(
  confidence: number,
  entityType: 'task' | 'note'
): Promise<ApprovalStatus> {
  const config = await getAIConfidenceConfig()

  // If auto-approve is disabled, always return PENDING
  if (!config.autoApproveEnabled) {
    return 'PENDING'
  }

  const threshold = entityType === 'task'
    ? config.taskAutoApprove
    : config.noteAutoApprove

  if (confidence >= threshold) {
    return 'AUTO_APPROVED'
  }

  return 'PENDING'
}

/**
 * Log an AI action for audit trail
 */
export async function logAIAction(params: {
  action: string
  entityType: string
  entityId?: string
  aiUserId: string
  aiModel?: string
  aiReasoning?: string
  aiConfidence?: number
  inputContext?: Record<string, unknown>
  outputData?: Record<string, unknown>
  approvalStatus: ApprovalStatus
  ticketId?: string
  taskId?: string
  contactId?: string
  companyId?: string
  durationMs?: number
  success?: boolean
  errorMessage?: string
}) {
  return prisma.aIActionLog.create({
    data: {
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      aiUserId: params.aiUserId,
      aiModel: params.aiModel,
      aiReasoning: params.aiReasoning,
      aiConfidence: params.aiConfidence,
      inputContext: params.inputContext ? JSON.stringify(params.inputContext) : null,
      outputData: params.outputData ? JSON.stringify(params.outputData) : null,
      approvalStatus: params.approvalStatus,
      ticketId: params.ticketId,
      taskId: params.taskId,
      contactId: params.contactId,
      companyId: params.companyId,
      durationMs: params.durationMs,
      success: params.success ?? true,
      errorMessage: params.errorMessage,
    }
  })
}

/**
 * Create a task via AI agent
 */
export async function createAITask(input: AITaskInput): Promise<AIActionResult> {
  const startTime = Date.now()

  try {
    // Get or create Claude user
    const claudeUser = await getOrCreateClaudeUser()

    // Determine approval status based on confidence
    const approvalStatus = await determineApprovalStatus(input.aiConfidence, 'task')

    // Create the task
    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority || 'MEDIUM',
        status: approvalStatus === 'AUTO_APPROVED' ? 'TODO' : 'TODO',
        dueDate: input.dueDate,
        assigneeId: input.assigneeId,
        createdById: claudeUser.id,
        ticketId: input.ticketId,
        contactId: input.contactId,
        companyId: input.companyId,
        projectId: input.projectId,
        // AI fields
        aiGenerated: true,
        aiReasoning: input.aiReasoning,
        aiConfidence: input.aiConfidence,
        aiModel: input.aiModel,
        aiContext: input.aiContext ? JSON.stringify(input.aiContext) : null,
        approvalStatus: approvalStatus,
      },
      include: {
        assignee: true,
        ticket: true,
        contact: true,
        company: true,
        project: true,
      }
    })

    // Log the action
    const actionLog = await logAIAction({
      action: 'TASK_CREATED',
      entityType: 'task',
      entityId: task.id,
      aiUserId: claudeUser.id,
      aiModel: input.aiModel,
      aiReasoning: input.aiReasoning,
      aiConfidence: input.aiConfidence,
      inputContext: input as unknown as Record<string, unknown>,
      outputData: { taskId: task.id, title: task.title },
      approvalStatus,
      ticketId: input.ticketId,
      taskId: task.id,
      contactId: input.contactId,
      companyId: input.companyId,
      durationMs: Date.now() - startTime,
      success: true,
    })

    return {
      success: true,
      data: task,
      approvalStatus,
      actionLogId: actionLog.id,
    }
  } catch (error) {
    const claudeUser = await getOrCreateClaudeUser().catch(() => null)

    // Log failed action
    if (claudeUser) {
      await logAIAction({
        action: 'TASK_CREATED',
        entityType: 'task',
        aiUserId: claudeUser.id,
        aiModel: input.aiModel,
        aiReasoning: input.aiReasoning,
        aiConfidence: input.aiConfidence,
        inputContext: input as unknown as Record<string, unknown>,
        approvalStatus: 'PENDING',
        ticketId: input.ticketId,
        contactId: input.contactId,
        companyId: input.companyId,
        durationMs: Date.now() - startTime,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }).catch(console.error)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      approvalStatus: 'PENDING',
    }
  }
}

/**
 * Create a note on a task via AI agent
 */
export async function createAITaskNote(input: AINoteInput): Promise<AIActionResult> {
  const startTime = Date.now()

  try {
    // Get or create Claude user
    const claudeUser = await getOrCreateClaudeUser()

    // Determine approval status based on confidence
    const approvalStatus = await determineApprovalStatus(input.aiConfidence, 'note')

    // Get the task to include related entities
    const task = await prisma.task.findUnique({
      where: { id: input.taskId },
      select: { ticketId: true, contactId: true, companyId: true }
    })

    if (!task) {
      throw new Error(`Task not found: ${input.taskId}`)
    }

    // Create the note
    const note = await prisma.taskNote.create({
      data: {
        taskId: input.taskId,
        content: input.content,
        authorId: claudeUser.id,
      },
      include: {
        author: true,
        task: true,
      }
    })

    // Log the action
    const actionLog = await logAIAction({
      action: 'NOTE_ADDED',
      entityType: 'task_note',
      entityId: note.id,
      aiUserId: claudeUser.id,
      aiModel: input.aiModel,
      aiReasoning: input.aiReasoning,
      aiConfidence: input.aiConfidence,
      inputContext: input as unknown as Record<string, unknown>,
      outputData: { noteId: note.id, taskId: input.taskId },
      approvalStatus,
      taskId: input.taskId,
      ticketId: task.ticketId || undefined,
      contactId: task.contactId || undefined,
      companyId: task.companyId || undefined,
      durationMs: Date.now() - startTime,
      success: true,
    })

    return {
      success: true,
      data: note,
      approvalStatus,
      actionLogId: actionLog.id,
    }
  } catch (error) {
    const claudeUser = await getOrCreateClaudeUser().catch(() => null)

    if (claudeUser) {
      await logAIAction({
        action: 'NOTE_ADDED',
        entityType: 'task_note',
        aiUserId: claudeUser.id,
        aiModel: input.aiModel,
        aiReasoning: input.aiReasoning,
        aiConfidence: input.aiConfidence,
        inputContext: input as unknown as Record<string, unknown>,
        approvalStatus: 'PENDING',
        taskId: input.taskId,
        durationMs: Date.now() - startTime,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      }).catch(console.error)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      approvalStatus: 'PENDING',
    }
  }
}

/**
 * Approve an AI-generated action
 */
export async function approveAIAction(
  actionLogId: string,
  approvedById: string
): Promise<AIActionResult> {
  try {
    const actionLog = await prisma.aIActionLog.findUnique({
      where: { id: actionLogId }
    })

    if (!actionLog) {
      throw new Error(`Action log not found: ${actionLogId}`)
    }

    // Update the action log
    const updatedLog = await prisma.aIActionLog.update({
      where: { id: actionLogId },
      data: {
        approvalStatus: 'APPROVED',
        approvedById,
        approvedAt: new Date(),
      }
    })

    // If it's a task, also update the task's approval status
    if (actionLog.entityType === 'task' && actionLog.entityId) {
      await prisma.task.update({
        where: { id: actionLog.entityId },
        data: {
          approvalStatus: 'APPROVED',
          approvedById,
          approvedAt: new Date(),
        }
      })
    }

    return {
      success: true,
      data: updatedLog,
      approvalStatus: 'APPROVED',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      approvalStatus: 'PENDING',
    }
  }
}

/**
 * Reject an AI-generated action
 */
export async function rejectAIAction(
  actionLogId: string,
  rejectedById: string,
  rejectionReason?: string
): Promise<AIActionResult> {
  try {
    const actionLog = await prisma.aIActionLog.findUnique({
      where: { id: actionLogId }
    })

    if (!actionLog) {
      throw new Error(`Action log not found: ${actionLogId}`)
    }

    // Update the action log
    const updatedLog = await prisma.aIActionLog.update({
      where: { id: actionLogId },
      data: {
        approvalStatus: 'REJECTED',
        approvedById: rejectedById,
        approvedAt: new Date(),
        rejectionReason,
      }
    })

    // If it's a task, update the task's approval status and optionally cancel it
    if (actionLog.entityType === 'task' && actionLog.entityId) {
      await prisma.task.update({
        where: { id: actionLog.entityId },
        data: {
          approvalStatus: 'REJECTED',
          approvedById: rejectedById,
          approvedAt: new Date(),
          status: 'CANCELLED',
        }
      })
    }

    return {
      success: true,
      data: updatedLog,
      approvalStatus: 'REJECTED',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      approvalStatus: 'PENDING',
    }
  }
}

/**
 * Get pending AI actions for approval
 */
export async function getPendingAIActions(options?: {
  entityType?: string
  limit?: number
}) {
  return prisma.aIActionLog.findMany({
    where: {
      approvalStatus: 'PENDING',
      ...(options?.entityType && { entityType: options.entityType }),
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
  })
}

/**
 * Get AI action statistics
 */
export async function getAIActionStats(options?: {
  startDate?: Date
  endDate?: Date
}) {
  const where = {
    createdAt: {
      ...(options?.startDate && { gte: options.startDate }),
      ...(options?.endDate && { lte: options.endDate }),
    }
  }

  const [total, pending, approved, rejected, autoApproved] = await Promise.all([
    prisma.aIActionLog.count({ where }),
    prisma.aIActionLog.count({ where: { ...where, approvalStatus: 'PENDING' } }),
    prisma.aIActionLog.count({ where: { ...where, approvalStatus: 'APPROVED' } }),
    prisma.aIActionLog.count({ where: { ...where, approvalStatus: 'REJECTED' } }),
    prisma.aIActionLog.count({ where: { ...where, approvalStatus: 'AUTO_APPROVED' } }),
  ])

  return {
    total,
    pending,
    approved,
    rejected,
    autoApproved,
    approvalRate: total > 0 ? ((approved + autoApproved) / total * 100).toFixed(1) : '0',
  }
}
