"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ExclamationTriangleIcon,
  CalendarIcon,
  ArrowRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: string;
  project: { id: string; name: string } | null;
}

interface TaskReminders {
  overdue: Task[];
  dueToday: Task[];
  dueTomorrow: Task[];
  dueThisWeek: Task[];
  summary: {
    overdue: number;
    dueToday: number;
    dueTomorrow: number;
    dueThisWeek: number;
    total: number;
  };
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "text-gray-500",
  MEDIUM: "text-blue-600",
  HIGH: "text-orange-600",
  URGENT: "text-red-600",
};

export function TaskRemindersWidget() {
  const [reminders, setReminders] = useState<TaskReminders | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReminders() {
      try {
        const res = await fetch("/api/tasks/reminders");
        if (res.ok) {
          const data = await res.json();
          setReminders(data);
        }
      } catch (err) {
        console.error("Failed to fetch task reminders:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReminders();
  }, []);

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const hasReminders = reminders && reminders.summary.total > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900">Upcoming Deadlines</h3>
        </div>
        <Link
          href="/tasks"
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          View all
          <ArrowRightIcon className="w-3 h-3" />
        </Link>
      </div>

      {!hasReminders ? (
        <div className="text-sm text-gray-500 text-center py-6">
          <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p>No upcoming deadlines</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Overdue Section */}
          {reminders.overdue.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-red-600 mb-1">
                <ExclamationTriangleIcon className="w-3 h-3" />
                Overdue ({reminders.overdue.length})
              </div>
              <div className="space-y-1">
                {reminders.overdue.slice(0, 2).map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block p-2 bg-red-50 rounded hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 truncate">{task.title}</span>
                      <span className="text-xs text-red-600">{formatDate(task.dueDate)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Due Today Section */}
          {reminders.dueToday.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-orange-600 mb-1">
                <ClockIcon className="w-3 h-3" />
                Due Today ({reminders.dueToday.length})
              </div>
              <div className="space-y-1">
                {reminders.dueToday.slice(0, 2).map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block p-2 bg-orange-50 rounded hover:bg-orange-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 truncate">{task.title}</span>
                      <span className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Due Tomorrow Section */}
          {reminders.dueTomorrow.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-blue-600 mb-1">
                <CalendarIcon className="w-3 h-3" />
                Due Tomorrow ({reminders.dueTomorrow.length})
              </div>
              <div className="space-y-1">
                {reminders.dueTomorrow.slice(0, 2).map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block p-2 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 truncate">{task.title}</span>
                      <span className={`text-xs ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* This Week Section */}
          {reminders.dueThisWeek.length > 0 && (
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
                <CalendarIcon className="w-3 h-3" />
                This Week ({reminders.dueThisWeek.length})
              </div>
              <div className="space-y-1">
                {reminders.dueThisWeek.slice(0, 2).map((task) => (
                  <Link
                    key={task.id}
                    href={`/tasks/${task.id}`}
                    className="block p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 truncate">{task.title}</span>
                      <span className="text-xs text-gray-500">{formatDate(task.dueDate)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
