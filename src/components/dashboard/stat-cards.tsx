import Link from "next/link";

interface StatCardProps {
  label: string;
  value: number;
  href?: string;
  color?: "blue" | "red" | "yellow" | "green" | "gray" | "purple";
}

const colorClasses = {
  blue: "text-blue-600",
  red: "text-red-600",
  yellow: "text-yellow-600",
  green: "text-green-600",
  gray: "text-gray-900",
  purple: "text-purple-600",
};

function StatCard({ label, value, href, color = "gray" }: StatCardProps) {
  const content = (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

interface StatCardsProps {
  stats: {
    unresolved: number;
    overdue: number;
    dueToday: number;
    open: number;
    onHold: number;
    unassigned: number;
    total?: number;
    resolvedThisWeek?: number;
  };
}

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      <StatCard
        label="Total Tickets"
        value={stats.total || 0}
        href="/tickets?view=all"
        color="purple"
      />
      <StatCard
        label="Unresolved"
        value={stats.unresolved}
        href="/tickets?view=unresolved"
        color="blue"
      />
      <StatCard
        label="Overdue"
        value={stats.overdue}
        href="/tickets?overdue=true"
        color="red"
      />
      <StatCard
        label="Created Today"
        value={stats.dueToday}
        href="/tickets?created=today"
        color="yellow"
      />
      <StatCard
        label="Open"
        value={stats.open}
        href="/tickets?status=OPEN"
        color="blue"
      />
      <StatCard
        label="On Hold"
        value={stats.onHold}
        href="/tickets?status=PENDING"
        color="gray"
      />
      <StatCard
        label="Unassigned"
        value={stats.unassigned}
        href="/tickets?unassigned=true"
        color="gray"
      />
      <StatCard
        label="Resolved (7d)"
        value={stats.resolvedThisWeek || 0}
        href="/tickets?status=RESOLVED"
        color="green"
      />
    </div>
  );
}
