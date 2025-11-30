"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClockIcon,
  PlayIcon,
  StopIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

interface TimeEntry {
  id: string;
  description: string | null;
  duration: number; // in minutes
  date: string;
  isBillable: boolean;
  user: { id: string; name: string | null; email: string };
  createdAt: string;
}

interface TimeTrackingProps {
  taskId: string;
  initialEntries: TimeEntry[];
  currentUserId: string;
}

export function TimeTracking({ taskId, initialEntries, currentUserId }: TimeTrackingProps) {
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    hours: 0,
    minutes: 0,
    description: "",
    date: new Date().toISOString().split("T")[0],
    isBillable: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) return `${mins}m`;
    return `${hrs}h ${mins}m`;
  };

  const formatTimerDisplay = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTotalTime = () => {
    return entries.reduce((acc, entry) => acc + entry.duration, 0);
  };

  const startTimer = () => {
    setIsTimerRunning(true);
    setTimerStartTime(new Date());
    setTimerSeconds(0);
  };

  const stopTimer = async () => {
    setIsTimerRunning(false);
    if (timerSeconds < 60) {
      // Less than a minute, don't save
      setTimerSeconds(0);
      setTimerStartTime(null);
      return;
    }

    const durationMinutes = Math.round(timerSeconds / 60);
    await createEntry({
      duration: durationMinutes,
      description: "Timer session",
      date: new Date().toISOString().split("T")[0],
      isBillable: true,
    });

    setTimerSeconds(0);
    setTimerStartTime(null);
  };

  const createEntry = async (data: {
    duration: number;
    description: string;
    date: string;
    isBillable: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          ...data,
        }),
      });
      if (res.ok) {
        const newEntry = await res.json();
        setEntries((prev) => [newEntry, ...prev]);
        setShowAddForm(false);
        setFormData({
          hours: 0,
          minutes: 0,
          description: "",
          date: new Date().toISOString().split("T")[0],
          isBillable: true,
        });
      }
    } catch (err) {
      console.error("Failed to create time entry:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalMinutes = formData.hours * 60 + formData.minutes;
    if (totalMinutes <= 0) return;

    await createEntry({
      duration: totalMinutes,
      description: formData.description,
      date: formData.date,
      isBillable: formData.isBillable,
    });
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Delete this time entry?")) return;
    try {
      const res = await fetch(`/api/time-entries/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete time entry:", err);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Time Tracking</h3>
          <span className="text-sm text-gray-500">
            Total: {formatDuration(getTotalTime())}
          </span>
        </div>
        {!showAddForm && !isTimerRunning && (
          <div className="flex items-center gap-2">
            <button
              onClick={startTimer}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg"
            >
              <PlayIcon className="w-4 h-4" />
              Start Timer
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
            >
              <PlusIcon className="w-4 h-4" />
              Add Time
            </button>
          </div>
        )}
      </div>

      {/* Timer Running Display */}
      {isTimerRunning && (
        <div className="p-4 bg-green-50 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-2xl font-mono font-bold text-green-700">
              {formatTimerDisplay(timerSeconds)}
            </span>
          </div>
          <button
            onClick={stopTimer}
            className="flex items-center gap-1 px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg"
          >
            <StopIcon className="w-4 h-4" />
            Stop
          </button>
        </div>
      )}

      {/* Add Time Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 border-b">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Hours</label>
              <input
                type="number"
                min="0"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={formData.minutes}
                onChange={(e) => setFormData({ ...formData, minutes: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs text-gray-500 block mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="mb-3">
            <label className="text-xs text-gray-500 block mb-1">Description (optional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What did you work on?"
              className="w-full px-3 py-2 border rounded-lg text-sm"
            />
          </div>
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.isBillable}
                onChange={(e) => setFormData({ ...formData, isBillable: e.target.checked })}
                className="rounded"
              />
              <span>Billable</span>
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (formData.hours === 0 && formData.minutes === 0)}
              className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Add Time"}
            </button>
          </div>
        </form>
      )}

      {/* Time Entries List */}
      <div className="divide-y max-h-80 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <ClockIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">No time logged yet</p>
          </div>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="p-3 hover:bg-gray-50 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-900">
                    {formatDuration(entry.duration)}
                  </span>
                  {entry.isBillable && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                      Billable
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{formatDate(entry.date)}</span>
                  <span>•</span>
                  <span>{entry.user.name || entry.user.email}</span>
                </div>
                {entry.description && (
                  <p className="text-xs text-gray-600 mt-1 truncate">{entry.description}</p>
                )}
              </div>
              {entry.user.id === currentUserId && (
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded"
                  title="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
