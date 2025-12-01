import { prisma } from "./db";
import { createAITicketReply, getOrCreateClaudeUser } from "./ai-agent";

interface Condition {
  field: string;
  operator: string;
  value: string;
}

interface Action {
  type: string;
  value: string;
}

interface TicketData {
  id: string;
  subject: string;
  description?: string | null;
  status: string;
  priority: string;
  assigneeId?: string | null;
  groupId?: string | null;
  contactId?: string | null;
  source?: string;
}

type TriggerType = "TICKET_CREATED" | "TICKET_UPDATED";

/**
 * Run all active automations for a specific trigger
 */
export async function runAutomations(
  trigger: TriggerType,
  ticket: TicketData,
  previousTicket?: Partial<TicketData>
): Promise<{ executedCount: number; actions: string[] }> {
  const executedActions: string[] = [];

  try {
    // Get all active automations for this trigger, ordered by priority
    const automations = await prisma.automation.findMany({
      where: {
        isActive: true,
        trigger,
      },
      orderBy: { priority: "asc" },
    });

    if (automations.length === 0) {
      return { executedCount: 0, actions: [] };
    }

    let updatedTicket = { ...ticket };

    for (const automation of automations) {
      const conditions: Condition[] = JSON.parse(automation.conditions || "[]");
      const actions: Action[] = JSON.parse(automation.actions || "[]");

      // Check if all conditions match
      const conditionsMatch = evaluateConditions(conditions, updatedTicket, previousTicket);

      if (conditionsMatch) {
        console.log(`[Automation] Running "${automation.name}" on ticket ${ticket.id}`);

        // Execute all actions
        const actionResults = await executeActions(actions, updatedTicket);

        // Update the ticket data for subsequent automations
        if (actionResults.updates) {
          updatedTicket = { ...updatedTicket, ...actionResults.updates };
        }

        executedActions.push(
          ...actionResults.executed.map((a) => `${automation.name}: ${a}`)
        );
      }
    }

    return { executedCount: executedActions.length, actions: executedActions };
  } catch (error) {
    console.error("[Automation] Error running automations:", error);
    return { executedCount: 0, actions: [] };
  }
}

/**
 * Evaluate all conditions against a ticket
 */
function evaluateConditions(
  conditions: Condition[],
  ticket: TicketData,
  previousTicket?: Partial<TicketData>
): boolean {
  // No conditions means always match
  if (conditions.length === 0) {
    return true;
  }

  // All conditions must match (AND logic)
  return conditions.every((condition) =>
    evaluateCondition(condition, ticket, previousTicket)
  );
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(
  condition: Condition,
  ticket: TicketData,
  previousTicket?: Partial<TicketData>
): boolean {
  const { field, operator, value } = condition;

  // Get the current value of the field
  let currentValue: string | null | undefined;

  switch (field) {
    case "status":
      currentValue = ticket.status;
      break;
    case "priority":
      currentValue = ticket.priority;
      break;
    case "assigneeId":
      currentValue = ticket.assigneeId;
      break;
    case "groupId":
      currentValue = ticket.groupId;
      break;
    case "subject":
      currentValue = ticket.subject;
      break;
    case "description":
      currentValue = ticket.description;
      break;
    case "source":
      currentValue = ticket.source;
      break;
    case "contactId":
      currentValue = ticket.contactId;
      break;
    // Special: check if field changed
    case "status_changed":
      return previousTicket?.status !== ticket.status;
    case "priority_changed":
      return previousTicket?.priority !== ticket.priority;
    case "assignee_changed":
      return previousTicket?.assigneeId !== ticket.assigneeId;
    default:
      console.warn(`[Automation] Unknown condition field: ${field}`);
      return false;
  }

  // Evaluate based on operator
  switch (operator) {
    case "equals":
      return currentValue === value;
    case "not_equals":
      return currentValue !== value;
    case "contains":
      return currentValue?.toLowerCase().includes(value.toLowerCase()) ?? false;
    case "not_contains":
      return !(currentValue?.toLowerCase().includes(value.toLowerCase()) ?? false);
    case "starts_with":
      return currentValue?.toLowerCase().startsWith(value.toLowerCase()) ?? false;
    case "ends_with":
      return currentValue?.toLowerCase().endsWith(value.toLowerCase()) ?? false;
    case "is_empty":
      return !currentValue || currentValue.trim() === "";
    case "is_not_empty":
      return !!currentValue && currentValue.trim() !== "";
    default:
      console.warn(`[Automation] Unknown operator: ${operator}`);
      return false;
  }
}

/**
 * Execute all actions for a ticket
 */
async function executeActions(
  actions: Action[],
  ticket: TicketData
): Promise<{ executed: string[]; updates: Partial<TicketData> }> {
  const executed: string[] = [];
  const updates: Partial<TicketData> = {};

  for (const action of actions) {
    try {
      const result = await executeAction(action, ticket);
      if (result.success) {
        executed.push(result.description);
        if (result.update) {
          Object.assign(updates, result.update);
        }
      }
    } catch (error) {
      console.error(`[Automation] Error executing action ${action.type}:`, error);
    }
  }

  return { executed, updates };
}

/**
 * Execute a single action
 */
async function executeAction(
  action: Action,
  ticket: TicketData
): Promise<{ success: boolean; description: string; update?: Partial<TicketData> }> {
  const { type, value } = action;

  switch (type) {
    case "SET_STATUS": {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: value },
      });
      return {
        success: true,
        description: `Set status to ${value}`,
        update: { status: value },
      };
    }

    case "SET_PRIORITY": {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { priority: value },
      });
      return {
        success: true,
        description: `Set priority to ${value}`,
        update: { priority: value },
      };
    }

    case "ASSIGN_AGENT": {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { assigneeId: value || null },
      });
      const agent = value
        ? await prisma.user.findUnique({
            where: { id: value },
            select: { name: true, email: true },
          })
        : null;
      return {
        success: true,
        description: `Assigned to ${agent?.name || agent?.email || "Unassigned"}`,
        update: { assigneeId: value || null },
      };
    }

    case "ASSIGN_GROUP": {
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { groupId: value || null },
      });
      const group = value
        ? await prisma.group.findUnique({
            where: { id: value },
            select: { name: true },
          })
        : null;
      return {
        success: true,
        description: `Assigned to group ${group?.name || "None"}`,
        update: { groupId: value || null },
      };
    }

    case "ADD_TAG": {
      // First, find or create the tag
      let tag = await prisma.tag.findUnique({
        where: { name: value },
      });

      if (!tag) {
        tag = await prisma.tag.create({
          data: { name: value },
        });
      }

      // Add tag to ticket (ignore if already exists)
      await prisma.ticketTag.upsert({
        where: {
          ticketId_tagId: {
            ticketId: ticket.id,
            tagId: tag.id,
          },
        },
        update: {},
        create: {
          ticketId: ticket.id,
          tagId: tag.id,
        },
      });

      return {
        success: true,
        description: `Added tag "${value}"`,
      };
    }

    case "REMOVE_TAG": {
      const tagToRemove = await prisma.tag.findUnique({
        where: { name: value },
      });

      if (tagToRemove) {
        await prisma.ticketTag.deleteMany({
          where: {
            ticketId: ticket.id,
            tagId: tagToRemove.id,
          },
        });
      }

      return {
        success: true,
        description: `Removed tag "${value}"`,
      };
    }

    case "ADD_NOTE": {
      // Add an internal note to the ticket
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          body: value,
          internal: true,
          authorType: "SYSTEM",
          authorName: "Automation",
        },
      });

      return {
        success: true,
        description: `Added internal note`,
      };
    }

    case "SEND_EMAIL": {
      // TODO: Implement email sending
      console.log(`[Automation] Would send email: ${value}`);
      return {
        success: true,
        description: `Email notification queued`,
      };
    }

    case "TRIGGER_AI_ANALYSIS": {
      // Trigger Claude AI to analyze the ticket and create an internal note
      try {
        // Get full ticket data including messages for context
        const fullTicket = await prisma.ticket.findUnique({
          where: { id: ticket.id },
          include: {
            contact: true,
            messages: {
              orderBy: { createdAt: "asc" },
              take: 10,
            },
          },
        });

        if (!fullTicket) {
          return {
            success: false,
            description: "Ticket not found for AI analysis",
          };
        }

        // Build context for AI analysis
        const ticketContext = {
          subject: fullTicket.subject,
          description: fullTicket.description,
          priority: fullTicket.priority,
          status: fullTicket.status,
          source: fullTicket.source,
          contactName: fullTicket.contact?.name,
          contactEmail: fullTicket.contact?.email,
          messageCount: fullTicket.messages.length,
          latestMessages: fullTicket.messages.slice(-3).map((m) => ({
            body: m.body.substring(0, 500),
            authorType: m.authorType,
            createdAt: m.createdAt,
          })),
        };

        // Create an AI-generated internal note with analysis
        const analysisResult = await createAITicketReply({
          ticketId: ticket.id,
          body: `**AI Analysis - Auto-triggered on ticket creation**\n\n` +
            `**Subject:** ${fullTicket.subject}\n\n` +
            `**Summary:** This ticket was automatically flagged for AI analysis. ` +
            `The ticket is from ${fullTicket.contact?.name || fullTicket.contact?.email || "Unknown contact"} ` +
            `with ${fullTicket.priority} priority.\n\n` +
            `**Suggested Actions:**\n` +
            `- Review the ticket details and assign to appropriate team\n` +
            `- Check if this matches any known issues or patterns\n` +
            `- Consider priority escalation if urgent keywords detected\n\n` +
            `*Use the "Ask Claude" feature for detailed AI-powered suggestions.*`,
          internal: true,
          aiReasoning: `Auto-triggered AI analysis for new ticket. Context: ${JSON.stringify(ticketContext)}`,
          aiConfidence: 0.9,
          aiModel: "automation-trigger",
          aiContext: {
            trigger: "TICKET_CREATED",
            automationType: "AI_ANALYSIS",
            ticketContext,
          },
        });

        if (analysisResult.success) {
          console.log(`[Automation] AI analysis created for ticket ${ticket.id}`);
          return {
            success: true,
            description: `AI analysis note added (${analysisResult.approvalStatus})`,
          };
        } else {
          console.error(`[Automation] AI analysis failed: ${analysisResult.error}`);
          return {
            success: false,
            description: `AI analysis failed: ${analysisResult.error}`,
          };
        }
      } catch (error) {
        console.error("[Automation] Error triggering AI analysis:", error);
        return {
          success: false,
          description: `AI analysis error: ${error instanceof Error ? error.message : "Unknown error"}`,
        };
      }
    }

    default:
      console.warn(`[Automation] Unknown action type: ${type}`);
      return {
        success: false,
        description: `Unknown action: ${type}`,
      };
  }
}

/**
 * Convenience function for ticket creation
 */
export async function runTicketCreatedAutomations(ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      subject: true,
      description: true,
      status: true,
      priority: true,
      assigneeId: true,
      groupId: true,
      contactId: true,
      source: true,
    },
  });

  if (!ticket) {
    console.error(`[Automation] Ticket not found: ${ticketId}`);
    return;
  }

  return runAutomations("TICKET_CREATED", ticket);
}

/**
 * Convenience function for ticket updates
 */
export async function runTicketUpdatedAutomations(
  ticketId: string,
  previousData?: Partial<TicketData>
) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      subject: true,
      description: true,
      status: true,
      priority: true,
      assigneeId: true,
      groupId: true,
      contactId: true,
      source: true,
    },
  });

  if (!ticket) {
    console.error(`[Automation] Ticket not found: ${ticketId}`);
    return;
  }

  return runAutomations("TICKET_UPDATED", ticket, previousData);
}
