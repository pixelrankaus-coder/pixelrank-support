"use client";

import {
  ChartBarIcon,
  TicketIcon,
  ClockIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

interface Stats {
  totalTickets: number;
  openTickets: number;
  pendingTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  urgentTickets: number;
  ticketsLast30Days: number;
  ticketsLast7Days: number;
  avgResponseHours: number;
}

interface PriorityData {
  priority: string;
  count: number;
}

interface AgentData {
  agent: string;
  count: number;
}

interface DailyData {
  date: string;
  count: number;
}

interface ReportsClientProps {
  stats: Stats;
  priorityData: PriorityData[];
  agentData: AgentData[];
  dailyData: DailyData[];
}

const priorityColors: Record<string, string> = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-blue-500",
  LOW: "bg-green-500",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-blue-500",
  PENDING: "bg-yellow-500",
  RESOLVED: "bg-green-500",
  CLOSED: "bg-gray-500",
};

export function ReportsClient({
  stats,
  priorityData,
  agentData,
  dailyData,
}: ReportsClientProps) {
  const maxDailyCount = Math.max(...dailyData.map((d) => d.count), 1);
  const totalPriorityCount = priorityData.reduce((sum, p) => sum + p.count, 0);
  const maxAgentCount = Math.max(...agentData.map((a) => a.count), 1);

  const unresolvedTickets = stats.openTickets + stats.pendingTickets;
  const resolutionRate = stats.totalTickets > 0
    ? Math.round(((stats.resolvedTickets + stats.closedTickets) / stats.totalTickets) * 100)
    : 0;

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-500">Overview of your helpdesk performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <TicketIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-500">{stats.ticketsLast7Days} in last 7 days</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unresolved</p>
              <p className="text-2xl font-bold text-gray-900">{unresolvedTickets}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-blue-600">{stats.openTickets} open</span>
            <span className="text-gray-300">•</span>
            <span className="text-yellow-600">{stats.pendingTickets} pending</span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resolution Rate</p>
              <p className="text-2xl font-bold text-gray-900">{resolutionRate}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-500">
              {stats.resolvedTickets + stats.closedTickets} resolved/closed
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Response Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgResponseHours > 0 ? `${stats.avgResponseHours}h` : "N/A"}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <ClockIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-gray-500">First response time</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Tickets by Day */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Tickets Created (Last 7 Days)</h3>
          <div className="flex items-end gap-2 h-40">
            {dailyData.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center">
                  <span className="text-xs text-gray-600 mb-1">{day.count}</span>
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{
                      height: `${(day.count / maxDailyCount) * 100}px`,
                      minHeight: day.count > 0 ? "4px" : "0",
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 mt-2">
                  {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tickets by Priority */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Tickets by Priority</h3>
          <div className="space-y-3">
            {["URGENT", "HIGH", "MEDIUM", "LOW"].map((priority) => {
              const data = priorityData.find((p) => p.priority === priority);
              const count = data?.count || 0;
              const percentage = totalPriorityCount > 0 ? (count / totalPriorityCount) * 100 : 0;
              return (
                <div key={priority}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{priority}</span>
                    <span className="text-gray-500">{count} ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${priorityColors[priority]} rounded-full transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets by Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Tickets by Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.openTickets}</p>
                <p className="text-sm text-gray-500">Open</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingTickets}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.resolvedTickets}</p>
                <p className="text-sm text-gray-500">Resolved</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.closedTickets}</p>
                <p className="text-sm text-gray-500">Closed</p>
              </div>
            </div>
          </div>
          {stats.urgentTickets > 0 && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg flex items-center gap-3">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">{stats.urgentTickets} urgent ticket(s)</p>
                <p className="text-sm text-red-600">Require immediate attention</p>
              </div>
            </div>
          )}
        </div>

        {/* Agent Performance */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Top Agents by Tickets</h3>
          {agentData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserGroupIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>No agent data available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {agentData.slice(0, 5).map((agent, index) => (
                <div key={agent.agent}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{agent.agent}</span>
                    </div>
                    <span className="text-gray-500">{agent.count} tickets</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden ml-7">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${(agent.count / maxAgentCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
