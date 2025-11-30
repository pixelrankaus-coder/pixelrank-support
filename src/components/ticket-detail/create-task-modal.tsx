"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { XMarkIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  ticketNumber: number;
  ticketSubject: string;
  contactId?: string | null;
  currentUserId: string;
  agents: Agent[];
}

export function CreateTaskModal({
  isOpen,
  onClose,
  ticketId,
  ticketNumber,
  ticketSubject,
  contactId,
  currentUserId,
  agents,
}: CreateTaskModalProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: `Follow up: Ticket #${ticketNumber}`,
    description: `Task created from ticket #${ticketNumber}: ${ticketSubject}`,
    priority: "MEDIUM",
    dueDate: "",
    assigneeId: currentUserId,
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [createdTask, setCreatedTask] = useState<{ id: string; title: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          ticketId,
          contactId: contactId || null,
          assigneeId: formData.assigneeId || null,
          dueDate: formData.dueDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create task");
      }

      const task = await res.json();
      setCreatedTask(task);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setCreatedTask(null);
    setFormData({
      title: `Follow up: Ticket #${ticketNumber}`,
      description: `Task created from ticket #${ticketNumber}: ${ticketSubject}`,
      priority: "MEDIUM",
      dueDate: "",
      assigneeId: currentUserId,
    });
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {createdTask ? (
          // Success state
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Task Created!
            </h2>
            <p className="text-gray-600 mb-4 text-sm">
              {createdTask.title}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
              <Link
                href={`/tasks/${createdTask.id}`}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                View Task
              </Link>
            </div>
          </div>
        ) : (
          // Form state
          <>
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Create Task from Ticket</h2>
              <button
                onClick={handleClose}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                <p className="font-medium">Linked to Ticket #{ticketNumber}</p>
                <p className="text-blue-600 truncate">{ticketSubject}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Task title..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Task description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign To
                </label>
                <select
                  value={formData.assigneeId}
                  onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Unassigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name || agent.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? "Creating..." : "Create Task"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
