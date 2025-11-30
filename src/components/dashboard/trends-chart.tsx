"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TrendsChartProps {
  data: {
    hour: number;
    today: number;
    yesterday: number;
  }[];
}

export function TrendsChart({ data }: TrendsChartProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Today&apos;s trends</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: number, name: string) => [
                value,
                name === "today" ? "Today" : "Yesterday",
              ]}
              labelFormatter={(label) => `${label}:00`}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="plainline"
              wrapperStyle={{ fontSize: 12, paddingBottom: 10 }}
              formatter={(value) => (value === "today" ? "Today" : "Yesterday")}
            />
            <Line
              type="monotone"
              dataKey="today"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 3, fill: "#2563eb" }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="yesterday"
              stroke="#93c5fd"
              strokeWidth={2}
              dot={{ r: 3, fill: "#93c5fd" }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-center text-xs text-gray-500 mt-2">
        Created date - Hour of the Day
      </div>
    </div>
  );
}
