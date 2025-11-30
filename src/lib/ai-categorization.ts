import { prisma } from "./db";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const ENCRYPTION_KEY = process.env.NEXTAUTH_SECRET || "default-key";

function decryptApiKey(encrypted: string): string {
  try {
    const decoded = Buffer.from(encrypted, "base64").toString("utf-8");
    const parts = decoded.split(":");
    return parts.slice(1).join(":");
  } catch {
    return "";
  }
}

interface AISettings {
  provider: string;
  apiKey: string;
  model: string | null;
  isEnabled: boolean;
}

async function getAISettings(): Promise<AISettings | null> {
  const settings = await prisma.aISettings.findUnique({
    where: { id: "default" },
  });

  if (!settings || !settings.isEnabled || !settings.apiKey) {
    return null;
  }

  return {
    provider: settings.provider,
    apiKey: decryptApiKey(settings.apiKey),
    model: settings.model,
    isEnabled: settings.isEnabled,
  };
}

async function callAI(
  systemPrompt: string,
  userContent: string,
  settings: AISettings
): Promise<string> {
  if (settings.provider === "openai") {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model || "gpt-4o-mini",
        max_tokens: 256,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${await response.text()}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "";
  } else {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": settings.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: settings.model || "claude-3-5-haiku-20241022",
        max_tokens: 256,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${await response.text()}`);
    }

    const data = await response.json();
    return data.content[0]?.text || "";
  }
}

interface CategorizationResult {
  priority?: string;
  suggestedTags?: string[];
  category?: string;
  sentiment?: "positive" | "neutral" | "negative" | "urgent";
}

/**
 * Auto-categorize a ticket based on its content
 */
export async function categorizeTicket(
  subject: string,
  description: string | null
): Promise<CategorizationResult | null> {
  try {
    const aiSettings = await getAISettings();
    if (!aiSettings) {
      console.log("AI not configured, skipping auto-categorization");
      return null;
    }

    // Get existing tags to suggest from
    const existingTags = await prisma.tag.findMany({
      select: { name: true },
    });
    const tagNames = existingTags.map((t) => t.name);

    const systemPrompt = `You are a ticket categorization system. Analyze the support ticket and provide categorization in JSON format only.

Available tags: ${tagNames.length > 0 ? tagNames.join(", ") : "none defined yet"}

Respond ONLY with a JSON object (no markdown, no explanation):
{
  "priority": "LOW" | "MEDIUM" | "HIGH" | "URGENT",
  "suggestedTags": ["tag1", "tag2"],
  "category": "billing" | "technical" | "feature_request" | "bug" | "general_inquiry" | "complaint",
  "sentiment": "positive" | "neutral" | "negative" | "urgent"
}

Rules:
- priority: URGENT for issues affecting business operations or multiple users
- priority: HIGH for time-sensitive issues or unhappy customers
- priority: MEDIUM for standard requests
- priority: LOW for general questions or suggestions
- suggestedTags: suggest 1-3 relevant tags from the available list, or new relevant tags
- sentiment: urgent if customer expresses frustration or time pressure`;

    const userContent = `Subject: ${subject}

Description: ${description || "No description provided"}`;

    const response = await callAI(systemPrompt, userContent, aiSettings);

    // Parse JSON response
    try {
      // Clean up response - remove markdown code blocks if present
      const cleanResponse = response
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      const result = JSON.parse(cleanResponse) as CategorizationResult;
      return result;
    } catch (parseError) {
      console.error("Failed to parse AI categorization response:", response);
      return null;
    }
  } catch (error) {
    console.error("AI categorization error:", error);
    return null;
  }
}

/**
 * Apply categorization results to a ticket
 */
export async function applyCategorization(
  ticketId: string,
  categorization: CategorizationResult
): Promise<void> {
  const updates: { priority?: string } = {};

  // Update priority if suggested
  if (categorization.priority) {
    updates.priority = categorization.priority;
  }

  // Apply tag suggestions
  if (categorization.suggestedTags && categorization.suggestedTags.length > 0) {
    for (const tagName of categorization.suggestedTags) {
      // Get or create tag
      let tag = await prisma.tag.findUnique({
        where: { name: tagName },
      });

      if (!tag) {
        // Create new tag with default color
        tag = await prisma.tag.create({
          data: {
            name: tagName,
            color: getRandomTagColor(),
          },
        });
      }

      // Add tag to ticket
      await prisma.ticketTag.upsert({
        where: {
          ticketId_tagId: {
            ticketId,
            tagId: tag.id,
          },
        },
        update: {},
        create: {
          ticketId,
          tagId: tag.id,
        },
      });
    }
  }

  // Update ticket priority
  if (Object.keys(updates).length > 0) {
    await prisma.ticket.update({
      where: { id: ticketId },
      data: updates,
    });
  }
}

/**
 * Full auto-categorization pipeline
 */
export async function autoCategorizeTicket(
  ticketId: string,
  subject: string,
  description: string | null
): Promise<CategorizationResult | null> {
  const categorization = await categorizeTicket(subject, description);

  if (categorization) {
    await applyCategorization(ticketId, categorization);
  }

  return categorization;
}

function getRandomTagColor(): string {
  const colors = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#14b8a6", // teal
    "#0ea5e9", // sky
    "#3b82f6", // blue
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#a855f7", // purple
    "#ec4899", // pink
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
