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

export interface AITicketReplyInput {
  ticketId: string
  body: string
  internal?: boolean // True for private/internal notes
  // AI metadata
  aiReasoning: string
  aiConfidence: number
  aiModel?: string
  aiContext?: Record<string, unknown>
}

export interface AITicketCreateInput {
  subject: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  contactEmail?: string // Email of existing contact, or will create new
  contactName?: string  // Name for new contact
  assigneeId?: string
  groupId?: string
  source?: string
  // AI metadata
  aiReasoning: string
  aiConfidence: number
  aiModel?: string
  aiContext?: Record<string, unknown>
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

/**
 * Create a ticket reply/message via AI agent
 * Supports both public replies and internal notes
 */
export async function createAITicketReply(input: AITicketReplyInput): Promise<AIActionResult> {
  const startTime = Date.now()

  try {
    // Get or create Claude user
    const claudeUser = await getOrCreateClaudeUser()

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: input.ticketId },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        contactId: true,
        assigneeId: true,
      }
    })

    if (!ticket) {
      throw new Error(`Ticket not found: ${input.ticketId}`)
    }

    // Determine approval status based on confidence
    // Use 'note' threshold for replies (similar sensitivity)
    const approvalStatus = await determineApprovalStatus(input.aiConfidence, 'note')

    // Create the message
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId: input.ticketId,
        body: input.body,
        internal: input.internal ?? false,
        authorType: 'AGENT',
        authorId: claudeUser.id,
        authorName: claudeUser.name || 'Claude AI',
        agentAuthorId: claudeUser.id,
      },
      include: {
        agentAuthor: {
          select: { id: true, name: true, email: true, isAiAgent: true }
        },
        ticket: {
          select: { id: true, ticketNumber: true, subject: true }
        }
      }
    })

    // Update ticket's updatedAt timestamp
    await prisma.ticket.update({
      where: { id: input.ticketId },
      data: { updatedAt: new Date() }
    })

    // Log the action
    const actionLog = await logAIAction({
      action: input.internal ? 'INTERNAL_NOTE_ADDED' : 'TICKET_REPLY_SENT',
      entityType: 'ticket_message',
      entityId: message.id,
      aiUserId: claudeUser.id,
      aiModel: input.aiModel,
      aiReasoning: input.aiReasoning,
      aiConfidence: input.aiConfidence,
      inputContext: input as unknown as Record<string, unknown>,
      outputData: {
        messageId: message.id,
        ticketId: input.ticketId,
        ticketNumber: ticket.ticketNumber,
        internal: input.internal ?? false,
      },
      approvalStatus,
      ticketId: input.ticketId,
      contactId: ticket.contactId || undefined,
      durationMs: Date.now() - startTime,
      success: true,
    })

    return {
      success: true,
      data: message,
      approvalStatus,
      actionLogId: actionLog.id,
    }
  } catch (error) {
    const claudeUser = await getOrCreateClaudeUser().catch(() => null)

    // Log failed action
    if (claudeUser) {
      await logAIAction({
        action: input.internal ? 'INTERNAL_NOTE_ADDED' : 'TICKET_REPLY_SENT',
        entityType: 'ticket_message',
        aiUserId: claudeUser.id,
        aiModel: input.aiModel,
        aiReasoning: input.aiReasoning,
        aiConfidence: input.aiConfidence,
        inputContext: input as unknown as Record<string, unknown>,
        approvalStatus: 'PENDING',
        ticketId: input.ticketId,
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
 * Helper to get next ticket number
 */
async function getNextTicketNumber(): Promise<number> {
  const counter = await prisma.counter.upsert({
    where: { id: 'ticket_number' },
    update: { value: { increment: 1 } },
    create: { id: 'ticket_number', value: 1 },
  })
  return counter.value
}

/**
 * Create a new ticket via AI agent
 * Can optionally link to existing contact or create new one
 */
export async function createAITicket(input: AITicketCreateInput): Promise<AIActionResult> {
  const startTime = Date.now()

  try {
    // Get or create Claude user
    const claudeUser = await getOrCreateClaudeUser()

    // Determine approval status based on confidence
    const approvalStatus = await determineApprovalStatus(input.aiConfidence, 'task')

    // Find or create contact if email provided
    let contactId: string | undefined
    if (input.contactEmail) {
      let contact = await prisma.contact.findUnique({
        where: { email: input.contactEmail }
      })

      if (!contact) {
        // Create new contact
        contact = await prisma.contact.create({
          data: {
            email: input.contactEmail,
            name: input.contactName || null,
          }
        })
      }
      contactId = contact.id
    }

    // Get next ticket number
    const ticketNumber = await getNextTicketNumber()

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject: input.subject,
        description: input.description,
        priority: input.priority || 'MEDIUM',
        status: 'OPEN',
        source: input.source || 'AI_GENERATED',
        contactId,
        assigneeId: input.assigneeId,
        groupId: input.groupId,
        createdById: claudeUser.id,
      },
      include: {
        contact: {
          select: { id: true, name: true, email: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        },
        group: {
          select: { id: true, name: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true, isAiAgent: true }
        }
      }
    })

    // Add the description as the first message if provided
    if (input.description) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          body: input.description,
          internal: false,
          authorType: 'AGENT',
          authorId: claudeUser.id,
          authorName: claudeUser.name || 'Claude AI',
          agentAuthorId: claudeUser.id,
        }
      })
    }

    // Log the action
    const actionLog = await logAIAction({
      action: 'TICKET_CREATED',
      entityType: 'ticket',
      entityId: ticket.id,
      aiUserId: claudeUser.id,
      aiModel: input.aiModel,
      aiReasoning: input.aiReasoning,
      aiConfidence: input.aiConfidence,
      inputContext: input as unknown as Record<string, unknown>,
      outputData: {
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
      },
      approvalStatus,
      ticketId: ticket.id,
      contactId: contactId,
      durationMs: Date.now() - startTime,
      success: true,
    })

    return {
      success: true,
      data: ticket,
      approvalStatus,
      actionLogId: actionLog.id,
    }
  } catch (error) {
    const claudeUser = await getOrCreateClaudeUser().catch(() => null)

    // Log failed action
    if (claudeUser) {
      await logAIAction({
        action: 'TICKET_CREATED',
        entityType: 'ticket',
        aiUserId: claudeUser.id,
        aiModel: input.aiModel,
        aiReasoning: input.aiReasoning,
        aiConfidence: input.aiConfidence,
        inputContext: input as unknown as Record<string, unknown>,
        approvalStatus: 'PENDING',
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
