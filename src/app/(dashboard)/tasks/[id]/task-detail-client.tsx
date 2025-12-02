"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  CalendarIcon,
  UserIcon,
  FolderIcon,
  TicketIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  PaperAirplaneIcon,
  QueueListIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { getInitials } from "@/lib/utils";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";
import { TimeTracking } from "@/components/tasks/time-tracking";

interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
  completedAt: string | null;
}

interface Note {
  id: string;
  content: string;
  author: { id: string; name: string | null; email: string };
  createdAt: string;
}

interface TimeEntry {
  id: string;
  description: string | null;
  duration: number;
  date: string;
  isBillable: boolean;
  user: { id: string; name: string | null; email: string };
  createdAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  assignee: { id: string; name: string | null; email: string } | null;
  createdBy: { id: string; name: string | null; email: string };
  project: { id: string; name: string } | null;
  ticket: { id: string; ticketNumber: number; subject: string } | null;
  company: { id: string; name: string } | null;
  contact: { id: string; name: string | null; email: string } | null;
  notes: Note[];
  subtasks: Subtask[];
  timeEntries: TimeEntry[];
  createdAt: string;
  updatedAt: string;
}

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  TODO: { label: "To Do", color: "text-gray-700", bg: "bg-gray-100" },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-700", bg: "bg-blue-100" },
  DONE: { label: "Done", color: "text-green-700", bg: "bg-green-100" },
  CANCELLED: { label: "Cancelled", color: "text-gray-500", bg: "bg-gray-100" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: "Low", color: "text-gray-700", bg: "bg-gray-100" },
  MEDIUM: { label: "Medium", color: "text-blue-700", bg: "bg-blue-100" },
  HIGH: { label: "High", color: "text-orange-700", bg: "bg-orange-100" },
  URGENT: { label: "Urgent", color: "text-red-700", bg: "bg-red-100" },
};

export function TaskDetailClient({
  task: initialTask,
  agents,
  currentUserId,
}: {
  task: Task;
  agents: Agent[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [task, setTask] = useState<Task>(initialTask);
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  // Helper to format date for input field
  const formatDateForInput = (date: string | Date | null): string => {
    if (!date) return "";
    if (typeof date === "string") {
      return date.split("T")[0];
    }
    return new Date(date).toISOString().split("T")[0];
  };

  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || "",
    status: task.status,
    priority: task.priority,
    dueDate: formatDateForInput(task.dueDate),
    assigneeId: task.assignee?.id || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchTask = async () => {
    const res = await fetch(`/api/tasks/${task.id}`);
    if (res.ok) {
      const data = await res.json();
      setTask(data);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          assigneeId: formData.assigneeId || null,
          dueDate: formData.dueDate || null,
        }),
      });
      if (res.ok) {
        await fetchTask();
        setIsEditing(false);
      }
    } catch (err) {
      alert("Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        await fetchTask();
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/tasks");
      }
    } catch (err) {
      alert("Failed to delete task");
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsAddingNote(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });
      if (res.ok) {
        setNewNote("");
        await fetchTask();
      }
    } catch (err) {
      alert("Failed to add note");
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleAddSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    setIsAddingSubtask(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSubtaskTitle }),
      });
      if (res.ok) {
        setNewSubtaskTitle("");
        setShowSubtaskInput(false);
        await fetchTask();
      }
    } catch (err) {
      alert("Failed to add subtask");
    } finally {
      setIsAddingSubtask(false);
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks/${subtask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !subtask.isCompleted }),
      });
      if (res.ok) {
        await fetchTask();
      }
    } catch (err) {
      console.error("Failed to toggle subtask:", err);
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks/${subtaskId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchTask();
      }
    } catch (err) {
      console.error("Failed to delete subtask:", err);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const isOverdue = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date() && task.status !== "DONE";
  };

  
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Tasks
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-4 max-w-xl">
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-2xl font-bold w-full px-3 py-1 border rounded-lg"
                  required
                />
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="Description..."
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  />
                  <select
                    value={formData.assigneeId}
                    onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name || agent.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => handleStatusChange(task.status === "DONE" ? "TODO" : "DONE")}
                    className="flex-shrink-0"
                    title={task.status === "DONE" ? "Mark as To Do" : "Mark as Done"}
                  >
                    {task.status === "DONE" ? (
                      <CheckCircleSolidIcon className="w-7 h-7 text-green-500" />
                    ) : task.status === "IN_PROGRESS" ? (
                      <ClockIcon className="w-7 h-7 text-blue-500" />
                    ) : (
                      <CheckCircleIcon className="w-7 h-7 text-gray-300 hover:text-green-500" />
                    )}
                  </button>
                  <h1 className={`text-2xl font-bold ${task.status === "DONE" ? "line-through text-gray-500" : "text-gray-900"}`}>
                    {task.title}
                  </h1>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded ${STATUS_CONFIG[task.status]?.bg} ${STATUS_CONFIG[task.status]?.color}`}>
                    {STATUS_CONFIG[task.status]?.label}
                  </span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded ${PRIORITY_CONFIG[task.priority]?.bg} ${PRIORITY_CONFIG[task.priority]?.color}`}>
                    {task.priority} Priority
                  </span>
                </div>
                {task.description && (
                  <p className="text-gray-600 mb-4 whitespace-pre-wrap">{task.description}</p>
                )}
              </>
            )}
          </div>

          {!isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                title="Edit Task"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleDelete}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                title="Delete Task"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Time Tracking & Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Time Tracking */}
          <TimeTracking
            taskId={task.id}
            initialEntries={task.timeEntries}
            currentUserId={currentUserId}
          />

          {/* Subtasks Section */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QueueListIcon className="w-5 h-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Subtasks</h2>
                {(task.subtasks?.length ?? 0) > 0 && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {task.subtasks?.filter(s => s.isCompleted).length ?? 0}/{task.subtasks?.length ?? 0}
                  </span>
                )}
              </div>
              {!showSubtaskInput && (
                <button
                  onClick={() => setShowSubtaskInput(true)}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Subtask
                </button>
              )}
            </div>

            {/* Subtask Progress Bar */}
            {(task.subtasks?.length ?? 0) > 0 && (
              <div className="px-4 py-2 bg-gray-50 border-b">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{
                      width: `${((task.subtasks?.filter(s => s.isCompleted).length ?? 0) / (task.subtasks?.length ?? 1)) * 100}%`
                    }}
                  />
                </div>
              </div>
            )}

            {/* Add Subtask Form */}
            {showSubtaskInput && (
              <form onSubmit={handleAddSubtask} className="p-4 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Enter subtask title..."
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!newSubtaskTitle.trim() || isAddingSubtask}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isAddingSubtask ? "Adding..." : "Add"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSubtaskInput(false);
                      setNewSubtaskTitle("");
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </form>
            )}

            {/* Subtasks List */}
            {(task.subtasks?.length ?? 0) === 0 && !showSubtaskInput ? (
              <div className="p-8 text-center text-gray-500">
                <QueueListIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p>No subtasks yet.</p>
                <button
                  onClick={() => setShowSubtaskInput(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                >
                  Add your first subtask
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {(task.subtasks ?? []).map((subtask) => (
                  <div
                    key={subtask.id}
                    className={`p-4 flex items-center gap-3 hover:bg-gray-50 group ${
                      subtask.isCompleted ? "bg-gray-50" : ""
                    }`}
                  >
                    <button
                      onClick={() => handleToggleSubtask(subtask)}
                      className="flex-shrink-0"
                    >
                      {subtask.isCompleted ? (
                        <CheckCircleSolidIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <CheckCircleIcon className="w-5 h-5 text-gray-300 hover:text-green-500" />
                      )}
                    </button>
                    <span className={`flex-1 ${subtask.isCompleted ? "line-through text-gray-500" : "text-gray-900"}`}>
                      {subtask.title}
                    </span>
                    <button
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="bg-white rounded-lg border">
            <div className="p-4 border-b flex items-center gap-2">
              <ChatBubbleLeftIcon className="w-5 h-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Notes & Activity</h2>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {task.notes.length}
              </span>
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="p-4 border-b bg-gray-50">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-medium flex-shrink-0">
                  {getInitials(currentUserId)}
                </div>
                <div className="flex-1">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note or comment..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={!newNote.trim() || isAddingNote}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      <PaperAirplaneIcon className="w-4 h-4" />
                      {isAddingNote ? "Adding..." : "Add Note"}
                    </button>
                  </div>
                </div>
              </div>
            </form>

            {/* Notes List */}
            {task.notes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ChatBubbleLeftIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p>No notes yet. Add one above!</p>
              </div>
            ) : (
              <div className="divide-y">
                {task.notes.map((note) => (
                  <div key={note.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium flex-shrink-0">
                        {getInitials(note.author.name || note.author.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {note.author.name || note.author.email}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDateTime(note.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Details */}
        <div className="space-y-6">
          {/* Task Details Card */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
            <div className="space-y-4">
              {/* Status Quick Actions */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">
                  Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {["TODO", "IN_PROGRESS", "DONE"].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        task.status === status
                          ? `${STATUS_CONFIG[status].bg} ${STATUS_CONFIG[status].color} ring-2 ring-offset-1 ring-blue-300`
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {STATUS_CONFIG[status].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Assignee */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">
                  Assignee
                </label>
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {task.assignee?.name || task.assignee?.email || "Unassigned"}
                  </span>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">
                  Due Date
                </label>
                <div className={`flex items-center gap-2 text-sm ${isOverdue(task.dueDate) ? "text-red-600" : "text-gray-900"}`}>
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(task.dueDate)}</span>
                  {isOverdue(task.dueDate) && <span className="text-xs font-medium">(Overdue)</span>}
                </div>
              </div>

              {/* Project */}
              {task.project && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">
                    Project
                  </label>
                  <Link
                    href={`/projects/${task.project.id}`}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <FolderIcon className="w-4 h-4" />
                    <span>{task.project.name}</span>
                  </Link>
                </div>
              )}

              {/* Ticket */}
              {task.ticket && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">
                    Related Ticket
                  </label>
                  <Link
                    href={`/tickets/${task.ticket.id}`}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <TicketIcon className="w-4 h-4" />
                    <span>#{task.ticket.ticketNumber} - {task.ticket.subject}</span>
                  </Link>
                </div>
              )}

              {/* Company */}
              {task.company && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">
                    Company
                  </label>
                  <Link
                    href={`/companies/${task.company.id}`}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <BuildingOfficeIcon className="w-4 h-4" />
                    <span>{task.company.name}</span>
                  </Link>
                </div>
              )}

              {/* Contact */}
              {task.contact && (
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">
                    Contact
                  </label>
                  <Link
                    href={`/contacts/${task.contact.id}`}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>{task.contact.name || task.contact.email}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Meta Card */}
          <div className="bg-white rounded-lg border p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Activity</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <span className="text-gray-500">Created by</span>
                <p className="font-medium text-gray-900">
                  {task.createdBy.name || task.createdBy.email}
                </p>
                <p className="text-xs text-gray-400">{formatDateTime(task.createdAt)}</p>
              </div>
              {task.completedAt && (
                <div>
                  <span className="text-gray-500">Completed</span>
                  <p className="text-xs text-gray-400">{formatDateTime(task.completedAt)}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500">Last updated</span>
                <p className="text-xs text-gray-400">{formatDateTime(task.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
