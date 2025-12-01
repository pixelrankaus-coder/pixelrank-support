import { prisma } from "@/lib/db";

// Pricing per 1M tokens (as of late 2024) - in USD
const PRICING = {
  anthropic: {
    "claude-3-5-haiku-20241022": { input: 1.00, output: 5.00 },
    "claude-3-5-sonnet-20241022": { input: 3.00, output: 15.00 },
    "claude-3-opus-20240229": { input: 15.00, output: 75.00 },
    default: { input: 1.00, output: 5.00 },
  },
  openai: {
    "gpt-4o-mini": { input: 0.15, output: 0.60 },
    "gpt-4o": { input: 2.50, output: 10.00 },
    "gpt-4-turbo": { input: 10.00, output: 30.00 },
    default: { input: 0.15, output: 0.60 },
  },
  openrouter: {
    // Free models
    "meta-llama/llama-3.1-8b-instruct:free": { input: 0, output: 0 },
    "meta-llama/llama-3.2-3b-instruct:free": { input: 0, output: 0 },
    "mistralai/mistral-7b-instruct:free": { input: 0, output: 0 },
    "google/gemma-2-9b-it:free": { input: 0, output: 0 },
    // Paid models via OpenRouter
    "openai/gpt-4o": { input: 2.50, output: 10.00 },
    "openai/gpt-4o-mini": { input: 0.15, output: 0.60 },
    "anthropic/claude-3-haiku": { input: 0.25, output: 1.25 },
    "anthropic/claude-3-sonnet": { input: 3.00, output: 15.00 },
    "meta-llama/llama-3.1-70b-instruct": { input: 0.52, output: 0.75 },
    default: { input: 0.50, output: 1.00 },
  },
} as const;

// Provider display info
export const PROVIDER_INFO = {
  anthropic: {
    name: "Anthropic",
    color: "orange",
    icon: "sparkles",
    description: "Claude AI models",
  },
  openai: {
    name: "OpenAI",
    color: "green",
    icon: "cpu",
    description: "GPT models",
  },
  openrouter: {
    name: "OpenRouter",
    color: "purple",
    icon: "globe",
    description: "Multi-model gateway",
  },
} as const;

interface TrackUsageParams {
  provider: string;
  model: string;
  feature: string;
  inputTokens: number;
  outputTokens: number;
  ticketId?: string;
  userId?: string;
  responseTime?: number;
  cached?: boolean;
}

export async function trackAIUsage(params: TrackUsageParams) {
  const {
    provider,
    model,
    feature,
    inputTokens,
    outputTokens,
    ticketId,
    userId,
    responseTime,
    cached = false,
  } = params;

  // Calculate costs
  const providerPricing = PRICING[provider as keyof typeof PRICING] || PRICING.anthropic;
  const modelPricing = providerPricing[model as keyof typeof providerPricing] || providerPricing.default;

  // Cost per token (pricing is per 1M tokens)
  const inputCost = (inputTokens / 1_000_000) * modelPricing.input;
  const outputCost = (outputTokens / 1_000_000) * modelPricing.output;
  const totalCost = inputCost + outputCost;

  try {
    await prisma.aIUsage.create({
      data: {
        provider,
        model,
        feature,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        inputCost,
        outputCost,
        totalCost,
        ticketId,
        userId,
        responseTime,
        cached,
      },
    });
  } catch (error) {
    console.error("Failed to track AI usage:", error);
    // Don't throw - tracking should not break the main flow
  }
}

export interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  cachedRequests: number;
  avgResponseTime: number;
}

export interface DailyUsage {
  date: string;
  requests: number;
  tokens: number;
  cost: number;
}

export interface ModelUsage {
  model: string;
  provider: string;
  requests: number;
  tokens: number;
  cost: number;
}

export interface FeatureUsage {
  feature: string;
  requests: number;
  tokens: number;
  cost: number;
}

export interface ProviderStats {
  provider: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  successRate: number;
  avgResponseTime: number;
  models: ModelUsage[];
  dailyUsage: DailyUsage[];
}

export async function getUsageStats(days: number = 30): Promise<{
  stats: UsageStats;
  dailyUsage: DailyUsage[];
  modelUsage: ModelUsage[];
  featureUsage: FeatureUsage[];
  providerStats: ProviderStats[];
  recentUsage: Array<{
    id: string;
    provider: string;
    model: string;
    feature: string;
    totalTokens: number;
    totalCost: number;
    ticketId: string | null;
    createdAt: Date;
  }>;
}> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all usage records for the period
  const usageRecords = await prisma.aIUsage.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate overall stats
  const stats: UsageStats = {
    totalRequests: usageRecords.length,
    totalTokens: usageRecords.reduce((sum, r) => sum + r.totalTokens, 0),
    totalCost: usageRecords.reduce((sum, r) => sum + r.totalCost, 0),
    inputTokens: usageRecords.reduce((sum, r) => sum + r.inputTokens, 0),
    outputTokens: usageRecords.reduce((sum, r) => sum + r.outputTokens, 0),
    cachedRequests: usageRecords.filter((r) => r.cached).length,
    avgResponseTime:
      usageRecords.filter((r) => r.responseTime).length > 0
        ? usageRecords.reduce((sum, r) => sum + (r.responseTime || 0), 0) /
          usageRecords.filter((r) => r.responseTime).length
        : 0,
  };

  // Group by day
  const dailyMap = new Map<string, DailyUsage>();
  usageRecords.forEach((r) => {
    const date = r.createdAt.toISOString().split("T")[0];
    const existing = dailyMap.get(date) || { date, requests: 0, tokens: 0, cost: 0 };
    existing.requests += 1;
    existing.tokens += r.totalTokens;
    existing.cost += r.totalCost;
    dailyMap.set(date, existing);
  });
  const dailyUsage = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Group by model
  const modelMap = new Map<string, ModelUsage>();
  usageRecords.forEach((r) => {
    const key = `${r.provider}:${r.model}`;
    const existing = modelMap.get(key) || { model: r.model, provider: r.provider, requests: 0, tokens: 0, cost: 0 };
    existing.requests += 1;
    existing.tokens += r.totalTokens;
    existing.cost += r.totalCost;
    modelMap.set(key, existing);
  });
  const modelUsage = Array.from(modelMap.values()).sort((a, b) => b.cost - a.cost);

  // Group by feature
  const featureMap = new Map<string, FeatureUsage>();
  usageRecords.forEach((r) => {
    const existing = featureMap.get(r.feature) || { feature: r.feature, requests: 0, tokens: 0, cost: 0 };
    existing.requests += 1;
    existing.tokens += r.totalTokens;
    existing.cost += r.totalCost;
    featureMap.set(r.feature, existing);
  });
  const featureUsage = Array.from(featureMap.values()).sort((a, b) => b.cost - a.cost);

  // Recent usage (last 20)
  const recentUsage = usageRecords.slice(0, 20).map((r) => ({
    id: r.id,
    provider: r.provider,
    model: r.model,
    feature: r.feature,
    totalTokens: r.totalTokens,
    totalCost: r.totalCost,
    ticketId: r.ticketId,
    createdAt: r.createdAt,
  }));

  // Group by provider (for tabs)
  const providerMap = new Map<string, {
    records: typeof usageRecords;
    dailyMap: Map<string, DailyUsage>;
    modelMap: Map<string, ModelUsage>;
  }>();

  // Initialize all providers
  ["anthropic", "openai", "openrouter"].forEach(p => {
    providerMap.set(p, {
      records: [],
      dailyMap: new Map(),
      modelMap: new Map(),
    });
  });

  usageRecords.forEach((r) => {
    const providerData = providerMap.get(r.provider);
    if (providerData) {
      providerData.records.push(r);

      // Daily usage per provider
      const date = r.createdAt.toISOString().split("T")[0];
      const existingDaily = providerData.dailyMap.get(date) || { date, requests: 0, tokens: 0, cost: 0 };
      existingDaily.requests += 1;
      existingDaily.tokens += r.totalTokens;
      existingDaily.cost += r.totalCost;
      providerData.dailyMap.set(date, existingDaily);

      // Model usage per provider
      const existingModel = providerData.modelMap.get(r.model) || { model: r.model, provider: r.provider, requests: 0, tokens: 0, cost: 0 };
      existingModel.requests += 1;
      existingModel.tokens += r.totalTokens;
      existingModel.cost += r.totalCost;
      providerData.modelMap.set(r.model, existingModel);
    }
  });

  const providerStats: ProviderStats[] = Array.from(providerMap.entries()).map(([provider, data]) => {
    const records = data.records;
    const recordsWithResponseTime = records.filter(r => r.responseTime);

    return {
      provider,
      totalRequests: records.length,
      totalTokens: records.reduce((sum, r) => sum + r.totalTokens, 0),
      totalCost: records.reduce((sum, r) => sum + r.totalCost, 0),
      inputTokens: records.reduce((sum, r) => sum + r.inputTokens, 0),
      outputTokens: records.reduce((sum, r) => sum + r.outputTokens, 0),
      successRate: records.length > 0 ? 100 : 0, // We only log successful requests
      avgResponseTime: recordsWithResponseTime.length > 0
        ? recordsWithResponseTime.reduce((sum, r) => sum + (r.responseTime || 0), 0) / recordsWithResponseTime.length
        : 0,
      models: Array.from(data.modelMap.values()).sort((a, b) => b.cost - a.cost),
      dailyUsage: Array.from(data.dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
    };
  }).sort((a, b) => b.totalCost - a.totalCost);

  return { stats, dailyUsage, modelUsage, featureUsage, providerStats, recentUsage };
}

// Format cost for display
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(4)}¢`;
  }
  return `$${cost.toFixed(4)}`;
}

// Format tokens for display
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}
