import { prisma } from "@/lib/db";

// Types
export type AIProvider = "anthropic" | "openai" | "openrouter";
export type TaskType = "summary" | "reply" | "categorize" | "sentiment" | "other";

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number;
  error?: string;
}

export interface AIRequestOptions {
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
  taskType?: TaskType;
  ticketId?: string;
  userId?: string;
}

// Provider configurations
const PROVIDER_CONFIG = {
  anthropic: {
    baseUrl: "https://api.anthropic.com/v1/messages",
    defaultModel: "claude-3-5-haiku-20241022",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o-mini",
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1/chat/completions",
    defaultModel: "meta-llama/llama-3.1-8b-instruct:free",
  },
};

// Model pricing (per 1M tokens) for cost estimation
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Anthropic
  "claude-3-5-haiku-20241022": { input: 1.0, output: 5.0 },
  "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
  "claude-3-opus-20240229": { input: 15.0, output: 75.0 },
  // OpenAI
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 5.0, output: 15.0 },
  "gpt-4-turbo": { input: 10.0, output: 30.0 },
  // OpenRouter free models
  "meta-llama/llama-3.1-8b-instruct:free": { input: 0, output: 0 },
  "meta-llama/llama-3.2-3b-instruct:free": { input: 0, output: 0 },
  "mistralai/mistral-7b-instruct:free": { input: 0, output: 0 },
  "google/gemma-2-9b-it:free": { input: 0, output: 0 },
  "qwen/qwen-2-7b-instruct:free": { input: 0, output: 0 },
  // OpenRouter cheap models
  "meta-llama/llama-3.1-70b-instruct": { input: 0.52, output: 0.75 },
  "mistralai/mistral-large": { input: 2.0, output: 6.0 },
};

// Free models on OpenRouter
export const OPENROUTER_FREE_MODELS = [
  { id: "meta-llama/llama-3.1-8b-instruct:free", name: "Llama 3.1 8B (Free)" },
  { id: "meta-llama/llama-3.2-3b-instruct:free", name: "Llama 3.2 3B (Free)" },
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B (Free)" },
  { id: "google/gemma-2-9b-it:free", name: "Gemma 2 9B (Free)" },
  { id: "qwen/qwen-2-7b-instruct:free", name: "Qwen 2 7B (Free)" },
];

// Popular cheap models on OpenRouter
export const OPENROUTER_CHEAP_MODELS = [
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B" },
  { id: "mistralai/mistral-large", name: "Mistral Large" },
  { id: "anthropic/claude-3-haiku", name: "Claude 3 Haiku (via OR)" },
];

// Anthropic models
export const ANTHROPIC_MODELS = [
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku (Fast & Cheap)" },
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet (Balanced)" },
  { id: "claude-3-opus-20240229", name: "Claude 3 Opus (Best Quality)" },
];

// OpenAI models
export const OPENAI_MODELS = [
  { id: "gpt-4o-mini", name: "GPT-4o Mini (Fast & Cheap)" },
  { id: "gpt-4o", name: "GPT-4o (Best)" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
];

/**
 * Calculate estimated cost based on tokens and model
 */
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

/**
 * Log AI usage to database
 */
async function logUsage(
  provider: AIProvider,
  model: string,
  taskType: TaskType,
  inputTokens: number,
  outputTokens: number,
  latencyMs: number,
  success: boolean,
  errorMessage?: string,
  ticketId?: string,
  userId?: string
): Promise<void> {
  try {
    const estimatedCost = calculateCost(model, inputTokens, outputTokens);

    await prisma.aIUsageLog.create({
      data: {
        provider,
        model,
        taskType,
        inputTokens,
        outputTokens,
        estimatedCost,
        latencyMs,
        success,
        errorMessage,
        ticketId,
        userId,
      },
    });
  } catch (error) {
    console.error("Failed to log AI usage:", error);
  }
}

/**
 * Get AI settings from database
 */
export async function getAISettings() {
  let settings = await prisma.aISettings.findUnique({
    where: { id: "default" },
  });

  // Create default settings if none exist
  if (!settings) {
    settings = await prisma.aISettings.create({
      data: { id: "default" },
    });
  }

  return settings;
}

/**
 * Check if a specific provider is enabled
 */
function isProviderEnabled(settings: Awaited<ReturnType<typeof getAISettings>>, provider: AIProvider): boolean {
  switch (provider) {
    case "anthropic":
      return settings.anthropicEnabled ?? true;
    case "openai":
      return settings.openaiEnabled ?? true;
    case "openrouter":
      return settings.openrouterEnabled ?? true;
    default:
      return false;
  }
}

/**
 * Get API key for a specific provider (from DB or env)
 */
function getApiKey(settings: Awaited<ReturnType<typeof getAISettings>>, provider: AIProvider): string | null {
  switch (provider) {
    case "anthropic":
      return settings.anthropicApiKey || process.env.ANTHROPIC_API_KEY || null;
    case "openai":
      return settings.openaiApiKey || process.env.OPENAI_API_KEY || null;
    case "openrouter":
      return settings.openrouterApiKey || process.env.OPENROUTER_API_KEY || null;
    default:
      return null;
  }
}

/**
 * Get model for a specific provider
 */
function getModel(settings: Awaited<ReturnType<typeof getAISettings>>, provider: AIProvider): string {
  switch (provider) {
    case "anthropic":
      return settings.anthropicModel || PROVIDER_CONFIG.anthropic.defaultModel;
    case "openai":
      return settings.openaiModel || PROVIDER_CONFIG.openai.defaultModel;
    case "openrouter":
      return settings.openrouterModel || PROVIDER_CONFIG.openrouter.defaultModel;
    default:
      return "";
  }
}

/**
 * Get provider and model for a specific task
 */
function getTaskProviderAndModel(
  settings: Awaited<ReturnType<typeof getAISettings>>,
  taskType: TaskType
): { provider: AIProvider; model: string } {
  // Check for task-specific overrides
  if (taskType === "summary" && settings.summaryProvider) {
    return {
      provider: settings.summaryProvider as AIProvider,
      model: settings.summaryModel || getModel(settings, settings.summaryProvider as AIProvider),
    };
  }

  if (taskType === "reply" && settings.replyProvider) {
    return {
      provider: settings.replyProvider as AIProvider,
      model: settings.replyModel || getModel(settings, settings.replyProvider as AIProvider),
    };
  }

  // Default to active provider
  return {
    provider: settings.activeProvider as AIProvider,
    model: getModel(settings, settings.activeProvider as AIProvider),
  };
}

/**
 * Call Anthropic API
 */
async function callAnthropic(
  apiKey: string,
  model: string,
  options: AIRequestOptions
): Promise<AIResponse> {
  const startTime = Date.now();
  const systemMessage = options.messages.find((m) => m.role === "system");
  const otherMessages = options.messages.filter((m) => m.role !== "system");

  const response = await fetch(PROVIDER_CONFIG.anthropic.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens || 1024,
      system: systemMessage?.content || "",
      messages: otherMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  const latencyMs = Date.now() - startTime;

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${error}`);
  }

  const data = await response.json();

  return {
    content: data.content[0].text,
    provider: "anthropic",
    model,
    inputTokens: data.usage?.input_tokens || 0,
    outputTokens: data.usage?.output_tokens || 0,
    latencyMs,
  };
}

/**
 * Call OpenAI-compatible API (works for OpenAI and OpenRouter)
 */
async function callOpenAICompatible(
  provider: "openai" | "openrouter",
  apiKey: string,
  model: string,
  options: AIRequestOptions
): Promise<AIResponse> {
  const startTime = Date.now();
  const config = PROVIDER_CONFIG[provider];

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  // OpenRouter requires additional headers
  if (provider === "openrouter") {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    headers["X-Title"] = "Helpdesk AI";
  }

  const response = await fetch(config.baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature || 0.7,
      messages: options.messages,
    }),
  });

  const latencyMs = Date.now() - startTime;

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`${provider} API error: ${error}`);
  }

  const data = await response.json();

  return {
    content: data.choices[0].message.content,
    provider,
    model,
    inputTokens: data.usage?.prompt_tokens || 0,
    outputTokens: data.usage?.completion_tokens || 0,
    latencyMs,
  };
}

/**
 * Main AI completion function with fallback support
 */
export async function generateAIResponse(options: AIRequestOptions): Promise<AIResponse> {
  const settings = await getAISettings();

  if (!settings.isEnabled) {
    return {
      content: "",
      provider: "anthropic",
      model: "",
      error: "AI is disabled",
    };
  }

  const taskType = options.taskType || "other";

  // Get provider/model for this task type
  const { provider: primaryProvider, model: primaryModel } = getTaskProviderAndModel(settings, taskType);

  // Build provider order: primary first, then fallbacks
  const providers: AIProvider[] = [primaryProvider];

  if (settings.useFallback && settings.fallbackOrder) {
    const fallbacks = settings.fallbackOrder.split(",").map((p) => p.trim()) as AIProvider[];
    providers.push(...fallbacks.filter((p) => p !== primaryProvider));
  }

  // Try each provider in order
  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];

    // Check if provider is enabled
    if (!isProviderEnabled(settings, provider)) {
      console.log(`Skipping ${provider}: provider is disabled`);
      continue;
    }

    const apiKey = getApiKey(settings, provider);

    if (!apiKey) {
      console.log(`Skipping ${provider}: no API key configured`);
      continue;
    }

    // Use task-specific model for primary provider, default for fallbacks
    const model = i === 0 ? primaryModel : getModel(settings, provider);

    try {
      console.log(`Trying ${provider} with model ${model}`);

      let result: AIResponse;

      if (provider === "anthropic") {
        result = await callAnthropic(apiKey, model, options);
      } else {
        result = await callOpenAICompatible(provider, apiKey, model, options);
      }

      // Log successful usage
      await logUsage(
        provider,
        model,
        taskType,
        result.inputTokens || 0,
        result.outputTokens || 0,
        result.latencyMs || 0,
        true,
        undefined,
        options.ticketId,
        options.userId
      );

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`${provider} failed:`, errorMessage);

      // Log failed attempt
      await logUsage(
        provider,
        model,
        taskType,
        0,
        0,
        0,
        false,
        errorMessage,
        options.ticketId,
        options.userId
      );

      // If this was the last provider, return the error
      if (i === providers.length - 1) {
        return {
          content: "",
          provider,
          model,
          error: errorMessage,
        };
      }

      // Otherwise, continue to next provider
      console.log(`Falling back to next provider...`);
    }
  }

  return {
    content: "",
    provider: "anthropic",
    model: "",
    error: "No AI providers configured",
  };
}

/**
 * Generate a ticket summary
 */
export async function generateTicketSummary(
  subject: string,
  description: string,
  messages: { body: string; authorType: string }[],
  ticketId?: string,
  userId?: string
): Promise<AIResponse> {
  const conversationText = messages
    .map((m) => `${m.authorType}: ${m.body}`)
    .join("\n\n");

  return generateAIResponse({
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that summarizes support tickets. Provide a brief, clear summary of the ticket and conversation in 2-3 sentences. Focus on the main issue and current status.",
      },
      {
        role: "user",
        content: `Subject: ${subject}\n\nDescription: ${description}\n\nConversation:\n${conversationText}\n\nPlease summarize this ticket.`,
      },
    ],
    maxTokens: 256,
    taskType: "summary",
    ticketId,
    userId,
  });
}

/**
 * Generate a suggested reply
 */
export async function generateSuggestedReply(
  subject: string,
  description: string,
  messages: { body: string; authorType: string }[],
  tone: "professional" | "friendly" | "formal" = "professional",
  ticketId?: string,
  userId?: string
): Promise<AIResponse> {
  const conversationText = messages
    .map((m) => `${m.authorType}: ${m.body}`)
    .join("\n\n");

  return generateAIResponse({
    messages: [
      {
        role: "system",
        content: `You are a helpful support agent. Write a ${tone} reply to help resolve the customer's issue. Be concise and helpful. Do not include a greeting or signature - just the body of the reply.`,
      },
      {
        role: "user",
        content: `Subject: ${subject}\n\nDescription: ${description}\n\nConversation:\n${conversationText}\n\nWrite a helpful reply to the customer.`,
      },
    ],
    maxTokens: 512,
    taskType: "reply",
    ticketId,
    userId,
  });
}

/**
 * Test if a provider is working
 */
export async function testProvider(provider: AIProvider): Promise<{ success: boolean; latencyMs?: number; error?: string }> {
  const settings = await getAISettings();
  const apiKey = getApiKey(settings, provider);

  if (!apiKey) {
    return { success: false, error: "No API key configured" };
  }

  const model = getModel(settings, provider);

  try {
    const options: AIRequestOptions = {
      messages: [{ role: "user", content: 'Say "Hello" and nothing else.' }],
      maxTokens: 10,
    };

    let result: AIResponse;

    if (provider === "anthropic") {
      result = await callAnthropic(apiKey, model, options);
    } else {
      result = await callOpenAICompatible(provider, apiKey, model, options);
    }

    return { success: true, latencyMs: result.latencyMs };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get AI usage statistics
 */
export async function getAIUsageStats(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const [totalStats, byProvider, byTask, recentLogs] = await Promise.all([
    // Total stats
    prisma.aIUsageLog.aggregate({
      where: { createdAt: { gte: startDate } },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        estimatedCost: true,
      },
      _count: true,
      _avg: {
        latencyMs: true,
      },
    }),
    // Stats by provider
    prisma.aIUsageLog.groupBy({
      by: ["provider"],
      where: { createdAt: { gte: startDate } },
      _sum: {
        inputTokens: true,
        outputTokens: true,
        estimatedCost: true,
      },
      _count: true,
    }),
    // Stats by task type
    prisma.aIUsageLog.groupBy({
      by: ["taskType"],
      where: { createdAt: { gte: startDate } },
      _sum: {
        estimatedCost: true,
      },
      _count: true,
    }),
    // Recent logs
    prisma.aIUsageLog.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return {
    totalCalls: totalStats._count,
    totalInputTokens: totalStats._sum.inputTokens || 0,
    totalOutputTokens: totalStats._sum.outputTokens || 0,
    totalCost: totalStats._sum.estimatedCost || 0,
    avgLatencyMs: Math.round(totalStats._avg.latencyMs || 0),
    byProvider,
    byTask,
    recentLogs,
  };
}
