import Link from "next/link";

interface UnresolvedTicketsProps {
  groups: {
    name: string;
    count: number;
  }[];
}

export function UnresolvedTickets({ groups }: UnresolvedTicketsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Unresolved tickets</h3>
          <p className="text-xs text-gray-500">Across helpdesk</p>
        </div>
        <Link
          href="/tickets?status=OPEN,PENDING"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          View details
        </Link>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-gray-500 pb-2 border-b border-gray-100">
          <span>Group</span>
          <span>Open</span>
        </div>
        {groups.map((group) => (
          <div
            key={group.name}
            className="flex items-center justify-between py-2 text-sm"
          >
            <span className="text-gray-700">{group.name}</span>
            <span className="text-gray-900 font-medium">{group.count}</span>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="text-sm text-gray-500 py-4 text-center">
            No unresolved tickets
          </div>
        )}
      </div>
    </div>
  );
}
