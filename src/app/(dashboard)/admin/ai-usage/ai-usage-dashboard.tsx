"use client";

import { useState, useEffect } from "react";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  CpuChipIcon,
  ClockIcon,
  ArrowPathIcon,
  SparklesIcon,
  BoltIcon,
  GlobeAltIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

// Provider info with colors and icons
const PROVIDER_INFO: Record<string, { name: string; color: string; bgColor: string; borderColor: string }> = {
  anthropic: {
    name: "Anthropic",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  openai: {
    name: "OpenAI",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  openrouter: {
    name: "OpenRouter",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
};

interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  cachedRequests: number;
  avgResponseTime: number;
}

interface DailyUsage {
  date: string;
  requests: number;
  tokens: number;
  cost: number;
}

interface ModelUsage {
  model: string;
  provider: string;
  requests: number;
  tokens: number;
  cost: number;
}

interface FeatureUsage {
  feature: string;
  requests: number;
  tokens: number;
  cost: number;
}

interface ProviderStats {
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

interface RecentUsage {
  id: string;
  provider: string;
  model: string;
  feature: string;
  totalTokens: number;
  totalCost: number;
  ticketId: string | null;
  createdAt: string;
}

interface UsageData {
  stats: UsageStats;
  dailyUsage: DailyUsage[];
  modelUsage: ModelUsage[];
  featureUsage: FeatureUsage[];
  providerStats: ProviderStats[];
  recentUsage: RecentUsage[];
}

function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `<$0.01`;
  }
  return `$${cost.toFixed(4)}`;
}

function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(2)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}

function formatResponseTime(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${Math.round(ms)}ms`;
}

function formatFeatureName(feature: string): string {
  return feature
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Provider Tab Content Component
function ProviderTabContent({ provider }: { provider: ProviderStats }) {
  const info = PROVIDER_INFO[provider.provider] || PROVIDER_INFO.openai;
  const maxCost = Math.max(...provider.dailyUsage.map((d) => d.cost), 0.01);

  return (
    <div className="space-y-6">
      {/* Provider Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${info.bgColor} rounded-xl border ${info.borderColor} p-5`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 bg-white rounded-lg`}>
              <CurrencyDollarIcon className={`w-5 h-5 ${info.color}`} />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Cost</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            ${provider.totalCost.toFixed(4)}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {provider.totalRequests} requests
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CpuChipIcon className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Total Tokens</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatTokens(provider.totalTokens)}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {formatTokens(provider.inputTokens)} in / {formatTokens(provider.outputTokens)} out
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ClockIcon className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Avg Response</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatResponseTime(provider.avgResponseTime)}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Average API latency
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-500">Success Rate</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {provider.successRate}%
          </div>
          <p className="text-sm text-gray-500 mt-1">
            API call success rate
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Cost Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-medium text-gray-900 mb-4">Daily Cost - {info.name}</h3>
          {provider.dailyUsage.length > 0 ? (
            <div className="h-48">
              <div className="flex items-end justify-between h-40 gap-1">
                {provider.dailyUsage.slice(-14).map((day) => {
                  const height = (day.cost / maxCost) * 100;
                  return (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className={`w-full rounded-t hover:opacity-80 transition-colors cursor-pointer group relative ${
                          provider.provider === "anthropic"
                            ? "bg-orange-500"
                            : provider.provider === "openai"
                            ? "bg-green-500"
                            : "bg-purple-500"
                        }`}
                        style={{ height: `${Math.max(height, 2)}%` }}
                        title={`${day.date}: ${formatCost(day.cost)}`}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                          {formatCost(day.cost)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>{provider.dailyUsage[Math.max(0, provider.dailyUsage.length - 14)]?.date?.slice(5)}</span>
                <span>{provider.dailyUsage[provider.dailyUsage.length - 1]?.date?.slice(5)}</span>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              No usage data for {info.name}
            </div>
          )}
        </div>

        {/* Model Usage */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-medium text-gray-900 mb-4">Models Used</h3>
          {provider.models.length > 0 ? (
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {provider.models.map((model) => {
                const percentage =
                  provider.totalCost > 0 ? (model.cost / provider.totalCost) * 100 : 0;
                return (
                  <div key={model.model}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium truncate flex-1" title={model.model}>
                        {model.model}
                      </span>
                      <span className="text-gray-500 ml-2">
                        {formatCost(model.cost)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          provider.provider === "anthropic"
                            ? "bg-gradient-to-r from-orange-400 to-orange-600"
                            : provider.provider === "openai"
                            ? "bg-gradient-to-r from-green-400 to-green-600"
                            : "bg-gradient-to-r from-purple-400 to-purple-600"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{formatTokens(model.tokens)} tokens</span>
                      <span>{model.requests} requests</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              No models used for {info.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Provider Comparison Component
function ProviderComparison({ providerStats }: { providerStats: ProviderStats[] }) {
  const totalCost = providerStats.reduce((sum, p) => sum + p.totalCost, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="font-medium text-gray-900 mb-4">Provider Comparison</h3>
      <div className="space-y-4">
        {providerStats.map((provider) => {
          const info = PROVIDER_INFO[provider.provider] || PROVIDER_INFO.openai;
          const percentage = totalCost > 0 ? (provider.totalCost / totalCost) * 100 : 0;

          return (
            <div key={provider.provider}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    provider.provider === "anthropic"
                      ? "bg-orange-500"
                      : provider.provider === "openai"
                      ? "bg-green-500"
                      : "bg-purple-500"
                  }`} />
                  <span className="font-medium text-gray-900">{info.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-900">${provider.totalCost.toFixed(4)}</span>
                  <span className="text-gray-500 text-sm ml-2">({percentage.toFixed(1)}%)</span>
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    provider.provider === "anthropic"
                      ? "bg-gradient-to-r from-orange-400 to-orange-600"
                      : provider.provider === "openai"
                      ? "bg-gradient-to-r from-green-400 to-green-600"
                      : "bg-gradient-to-r from-purple-400 to-purple-600"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{provider.totalRequests} requests</span>
                <span>{formatTokens(provider.totalTokens)} tokens</span>
                <span>{formatResponseTime(provider.avgResponseTime)} avg</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AIUsageDashboard() {
  const [data, setData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "anthropic" | "openai" | "openrouter">("overview");

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/ai-usage?days=${days}`);
      if (!res.ok) throw new Error("Failed to fetch data");
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError("Failed to load AI usage data");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [days]);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <ArrowPathIcon className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, dailyUsage, featureUsage, providerStats, recentUsage } = data;

  // Calculate max for chart scaling
  const maxCost = Math.max(...dailyUsage.map((d) => d.cost), 0.01);

  // Get selected provider stats
  const selectedProvider = providerStats.find(p => p.provider === activeTab);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="w-7 h-7 text-purple-600" />
            AI Usage & Costs
          </h1>
          <p className="text-gray-500 mt-1">
            Monitor your AI API usage, token consumption, and costs by provider
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button
            onClick={fetchData}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Provider Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "overview"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5" />
                Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab("anthropic")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "anthropic"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5" />
                Anthropic
                {providerStats.find(p => p.provider === "anthropic")?.totalCost ? (
                  <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                    ${providerStats.find(p => p.provider === "anthropic")?.totalCost.toFixed(2)}
                  </span>
                ) : null}
              </div>
            </button>
            <button
              onClick={() => setActiveTab("openai")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "openai"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <CpuChipIcon className="w-5 h-5" />
                OpenAI
                {providerStats.find(p => p.provider === "openai")?.totalCost ? (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                    ${providerStats.find(p => p.provider === "openai")?.totalCost.toFixed(2)}
                  </span>
                ) : null}
              </div>
            </button>
            <button
              onClick={() => setActiveTab("openrouter")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "openrouter"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <GlobeAltIcon className="w-5 h-5" />
                OpenRouter
                {providerStats.find(p => p.provider === "openrouter")?.totalCost ? (
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                    ${providerStats.find(p => p.provider === "openrouter")?.totalCost.toFixed(2)}
                  </span>
                ) : null}
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" ? (
        <>
          {/* Overview Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Cost */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Total Cost</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                ${stats.totalCost.toFixed(4)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {stats.totalRequests} requests
              </p>
            </div>

            {/* Total Tokens */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CpuChipIcon className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Total Tokens</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {formatTokens(stats.totalTokens)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {formatTokens(stats.inputTokens)} in / {formatTokens(stats.outputTokens)} out
              </p>
            </div>

            {/* Avg Response Time */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Avg Response</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {formatResponseTime(stats.avgResponseTime)}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Average API response time
              </p>
            </div>

            {/* Cache Hit Rate */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BoltIcon className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Cache Hits</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalRequests > 0
                  ? Math.round((stats.cachedRequests / stats.totalRequests) * 100)
                  : 0}%
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {stats.cachedRequests} cached responses
              </p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Daily Cost Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-4">Daily Cost (All Providers)</h3>
              {dailyUsage.length > 0 ? (
                <div className="h-48">
                  <div className="flex items-end justify-between h-40 gap-1">
                    {dailyUsage.slice(-14).map((day) => {
                      const height = (day.cost / maxCost) * 100;
                      return (
                        <div
                          key={day.date}
                          className="flex-1 flex flex-col items-center"
                        >
                          <div
                            className="w-full bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t hover:from-purple-500 hover:to-indigo-400 transition-colors cursor-pointer group relative"
                            style={{ height: `${Math.max(height, 2)}%` }}
                            title={`${day.date}: ${formatCost(day.cost)}`}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10">
                              {formatCost(day.cost)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>{dailyUsage[Math.max(0, dailyUsage.length - 14)]?.date?.slice(5)}</span>
                    <span>{dailyUsage[dailyUsage.length - 1]?.date?.slice(5)}</span>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400">
                  No usage data yet
                </div>
              )}
            </div>

            {/* Provider Comparison */}
            <ProviderComparison providerStats={providerStats} />
          </div>

          {/* Feature Usage & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feature Breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-4">Usage by Feature</h3>
              {featureUsage.length > 0 ? (
                <div className="space-y-4">
                  {featureUsage.map((feature) => (
                    <div key={feature.feature} className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <SparklesIcon className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            {formatFeatureName(feature.feature)}
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatCost(feature.cost)}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {feature.requests} requests • {formatTokens(feature.tokens)} tokens
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400">
                  No feature usage data yet
                </div>
              )}
            </div>

            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-4">Recent Activity</h3>
              {recentUsage.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="pb-2 font-medium">Time</th>
                        <th className="pb-2 font-medium">Provider</th>
                        <th className="pb-2 font-medium">Feature</th>
                        <th className="pb-2 font-medium text-right">Tokens</th>
                        <th className="pb-2 font-medium text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentUsage.map((usage) => {
                        const info = PROVIDER_INFO[usage.provider] || PROVIDER_INFO.openai;
                        return (
                          <tr key={usage.id} className="hover:bg-gray-50">
                            <td className="py-2 text-gray-600">
                              {new Date(usage.createdAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="py-2">
                              <span className={`inline-flex items-center gap-1 ${info.color}`}>
                                <span className={`w-2 h-2 rounded-full ${
                                  usage.provider === "anthropic"
                                    ? "bg-orange-500"
                                    : usage.provider === "openai"
                                    ? "bg-green-500"
                                    : "bg-purple-500"
                                }`} />
                                {info.name}
                              </span>
                            </td>
                            <td className="py-2">
                              <span className="inline-flex items-center gap-1 text-gray-700">
                                {formatFeatureName(usage.feature)}
                              </span>
                            </td>
                            <td className="py-2 text-right text-gray-600">
                              {formatTokens(usage.totalTokens)}
                            </td>
                            <td className="py-2 text-right font-medium text-gray-900">
                              {formatCost(usage.totalCost)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-gray-400">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </>
      ) : selectedProvider ? (
        <ProviderTabContent provider={selectedProvider} />
      ) : (
        <div className="text-center py-12 text-gray-500">
          No data available for this provider
        </div>
      )}

      {/* Cost Estimation Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">About Cost Tracking</h4>
        <p className="text-sm text-blue-700">
          Costs are estimated based on published API pricing. Actual costs may vary slightly.
          Pricing used: Claude Haiku ($1/$5 per 1M tokens), Sonnet ($3/$15), Opus ($15/$75),
          GPT-4o-mini ($0.15/$0.60), GPT-4o ($2.50/$10), OpenRouter varies by model.
        </p>
      </div>
    </div>
  );
}
