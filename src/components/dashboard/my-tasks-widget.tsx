"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
  project: { id: string; name: string } | null;
}

interface MyTasksWidgetProps {
  initialTasks: Task[];
  userId: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export function MyTasksWidget({ initialTasks, userId }: MyTasksWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const pendingTasks = tasks.filter((t) => t.status !== "DONE" && t.status !== "CANCELLED");
  const completedTasks = tasks.filter((t) => t.status === "DONE");

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">
          My Tasks ({pendingTasks.length})
        </h3>
        <Link
          href="/tasks"
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View all
          <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {pendingTasks.length === 0 && completedTasks.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            <CheckCircleIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p>No tasks assigned to you</p>
            <Link
              href="/tasks"
              className="text-blue-600 hover:text-blue-800 text-xs mt-1 inline-block"
            >
              Create a task
            </Link>
          </div>
        ) : (
          <>
            {pendingTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-2 py-2 border-b border-gray-50 hover:bg-gray-50 rounded px-1 -mx-1"
              >
                <button
                  onClick={() => handleToggleStatus(task)}
                  className="mt-0.5 flex-shrink-0"
                  title="Mark as done"
                >
                  {task.status === "IN_PROGRESS" ? (
                    <ClockIcon className="w-4 h-4 text-blue-500" />
                  ) : (
                    <CheckCircleIcon className="w-4 h-4 text-gray-300 hover:text-green-500" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/tasks/${task.id}`}
                    className="text-sm text-gray-900 hover:text-blue-600 block truncate"
                  >
                    {task.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${PRIORITY_COLORS[task.priority]}`}
                    >
                      {task.priority}
                    </span>
                    {task.dueDate && (
                      <span
                        className={`flex items-center gap-0.5 text-[10px] ${
                          isOverdue(task.dueDate) ? "text-red-600" : "text-gray-500"
                        }`}
                      >
                        <CalendarIcon className="w-3 h-3" />
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                    {task.project && (
                      <span className="text-[10px] text-gray-400 truncate">
                        {task.project.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {completedTasks.length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">
                  Recently Completed
                </p>
                {completedTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2 py-1.5 opacity-60"
                  >
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className="flex-shrink-0"
                      title="Mark as not done"
                    >
                      <CheckCircleSolidIcon className="w-4 h-4 text-green-500" />
                    </button>
                    <span className="text-xs text-gray-500 line-through truncate">
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
