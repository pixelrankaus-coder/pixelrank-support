"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface Viewer {
  userId: string;
  userName: string | null;
  isTyping: boolean;
  lastSeen: string;
}

interface CollisionWarningProps {
  typingViewers: Viewer[];
}

export function CollisionWarning({ typingViewers }: CollisionWarningProps) {
  if (typingViewers.length === 0) {
    return null;
  }

  const names = typingViewers
    .map((v) => v.userName || "An agent")
    .slice(0, 2)
    .join(" and ");
  const additionalCount = typingViewers.length - 2;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
      <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 flex-shrink-0" />
      <div className="flex-1">
        <span className="font-medium">Collision Warning:</span>{" "}
        {names}
        {additionalCount > 0 && ` and ${additionalCount} more`}
        {typingViewers.length === 1 ? " is " : " are "}
        also typing a response to this ticket.
      </div>
    </div>
  );
}
