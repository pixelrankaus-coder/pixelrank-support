"use client";

import {
  UserPlusIcon,
  XCircleIcon,
  ArrowsRightLeftIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onAssign: () => void;
  onClose: () => void;
  onMerge: () => void;
  onSpam: () => void;
  onDelete: () => void;
}

export function BulkActionsToolbar({
  selectedCount,
  onAssign,
  onClose,
  onMerge,
  onSpam,
  onDelete,
}: BulkActionsToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2">
      <button
        onClick={onAssign}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      >
        <UserPlusIcon className="w-4 h-4" />
        Assign
      </button>

      <button
        onClick={onClose}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      >
        <XCircleIcon className="w-4 h-4" />
        Close
      </button>

      <button
        onClick={() => {}}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      >
        <ArrowPathIcon className="w-4 h-4" />
        Bulk update
      </button>

      <button
        onClick={onMerge}
        disabled={selectedCount < 2}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowsRightLeftIcon className="w-4 h-4" />
        Merge
      </button>

      <button
        onClick={onSpam}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
      >
        <ExclamationTriangleIcon className="w-4 h-4" />
        Spam
      </button>

      <button
        onClick={onDelete}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
      >
        <TrashIcon className="w-4 h-4" />
        Delete
      </button>

      <span className="ml-auto text-sm text-gray-500">
        {selectedCount} ticket{selectedCount !== 1 ? "s" : ""} selected
      </span>
    </div>
  );
}
