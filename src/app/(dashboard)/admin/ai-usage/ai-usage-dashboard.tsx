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
} from "@heroicons/react/24/outline";

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

export function AIUsageDashboard() {
  const [data, setData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string | null>(null);

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

  const { stats, dailyUsage, modelUsage, featureUsage, recentUsage } = data;

  // Calculate max for chart scaling
  const maxCost = Math.max(...dailyUsage.map((d) => d.cost), 0.01);

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
            Monitor your AI API usage, token consumption, and costs
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

      {/* Stats Cards */}
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
          <h3 className="font-medium text-gray-900 mb-4">Daily Cost</h3>
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
                        className="w-full bg-purple-500 rounded-t hover:bg-purple-600 transition-colors cursor-pointer group relative"
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

        {/* Model Usage */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-medium text-gray-900 mb-4">Usage by Model</h3>
          {modelUsage.length > 0 ? (
            <div className="space-y-3">
              {modelUsage.map((model) => {
                const percentage =
                  stats.totalCost > 0 ? (model.cost / stats.totalCost) * 100 : 0;
                return (
                  <div key={`${model.provider}:${model.model}`}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium truncate flex-1">
                        {model.model}
                      </span>
                      <span className="text-gray-500 ml-2">
                        {formatCost(model.cost)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{model.provider}</span>
                      <span>{model.requests} requests</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              No model usage data yet
            </div>
          )}
        </div>
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
                    <th className="pb-2 font-medium">Feature</th>
                    <th className="pb-2 font-medium">Model</th>
                    <th className="pb-2 font-medium text-right">Tokens</th>
                    <th className="pb-2 font-medium text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentUsage.map((usage) => (
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
                        <span className="inline-flex items-center gap-1 text-purple-700">
                          <SparklesIcon className="w-3 h-3" />
                          {formatFeatureName(usage.feature)}
                        </span>
                      </td>
                      <td className="py-2 text-gray-600 truncate max-w-[150px]">
                        {usage.model}
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {formatTokens(usage.totalTokens)}
                      </td>
                      <td className="py-2 text-right font-medium text-gray-900">
                        {formatCost(usage.totalCost)}
                      </td>
                    </tr>
                  ))}
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

      {/* Cost Estimation Info */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">About Cost Tracking</h4>
        <p className="text-sm text-blue-700">
          Costs are estimated based on published API pricing. Actual costs may vary slightly.
          Pricing used: Claude Haiku ($1/$5 per 1M tokens), Sonnet ($3/$15), Opus ($15/$75),
          GPT-4o-mini ($0.15/$0.60), GPT-4o ($2.50/$10), GPT-4-turbo ($10/$30).
        </p>
      </div>
    </div>
  );
}
