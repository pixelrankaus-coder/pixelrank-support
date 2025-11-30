"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  PlusIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon,
  FolderIcon,
  ChatBubbleLeftIcon,
  PencilIcon,
  TrashIcon,
  Squares2X2Icon,
  MagnifyingGlassIcon,
  ViewColumnsIcon,
  ListBulletIcon,
  TableCellsIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  QueueListIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
  sortOrder: number;
  completedAt: string | null;
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
  subtasks: Subtask[];
  _count: { notes: number; subtasks: number };
  createdAt: string;
}

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

interface Project {
  id: string;
  name: string;
}

interface Company {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  name: string | null;
  email: string;
}

type ViewMode = "board" | "list" | "grid";
type SortField = "dueDate" | "priority" | "createdAt" | "title";
type SortDirection = "asc" | "desc";

const STATUSES = ["TODO", "IN_PROGRESS", "DONE"] as const;
type TaskStatus = (typeof STATUSES)[number];

const PRIORITY_ORDER: Record<string, number> = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "border-l-gray-300",
  MEDIUM: "border-l-blue-400",
  HIGH: "border-l-orange-400",
  URGENT: "border-l-red-500",
};

export function TasksClient({
  initialTasks,
  agents,
  projects,
  companies,
  contacts,
  currentUserId,
}: {
  initialTasks: Task[];
  agents: Agent[];
  projects: Project[];
  companies: Company[];
  contacts: Contact[];
  currentUserId: string;
}) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterProject, setFilterProject] = useState("");
  const [showMyTasks, setShowMyTasks] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  // View and search state - initialize from localStorage
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("tasks-view-mode") as ViewMode) || "board";
    }
    return "board";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("tasks-sort-field") as SortField) || "dueDate";
    }
    return "dueDate";
  });
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("tasks-sort-direction") as SortDirection) || "asc";
    }
    return "asc";
  });
  const [quickFilter, setQuickFilter] = useState<"" | "dueToday" | "overdue">("");
  // Bulk selection state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: "",
    assigneeId: "",
    projectId: "",
    companyId: "",
    contactId: "",
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Persist preferences to localStorage
  useEffect(() => {
    localStorage.setItem("tasks-view-mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem("tasks-sort-field", sortField);
  }, [sortField]);

  useEffect(() => {
    localStorage.setItem("tasks-sort-direction", sortDirection);
  }, [sortDirection]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return;
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        openCreateModal();
      }
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        document.getElementById("task-search")?.focus();
      }
      if (e.key === "Escape") {
        setSearchQuery("");
        setQuickFilter("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchTasks = async () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterAssignee) params.set("assigneeId", filterAssignee);
    if (filterProject) params.set("projectId", filterProject);
    if (showMyTasks) params.set("myTasks", "true");

    const res = await fetch(`/api/tasks?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setTasks(data);
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: "",
      assigneeId: currentUserId,
      projectId: "",
      companyId: "",
      contactId: "",
    });
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      assigneeId: task.assignee?.id || "",
      projectId: task.project?.id || "",
      companyId: task.company?.id || "",
      contactId: task.contact?.id || "",
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : "/api/tasks";

      const res = await fetch(url, {
        method: editingTask ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          assigneeId: formData.assigneeId || null,
          projectId: formData.projectId || null,
          companyId: formData.companyId || null,
          contactId: formData.contactId || null,
          dueDate: formData.dueDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save task");
      }

      await fetchTasks();
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await fetchTasks();
      }
    } catch (err) {
      console.error("Failed to toggle task status:", err);
    }
  };

  const handleDelete = async (task: Task) => {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchTasks();
      }
    } catch (err) {
      alert("Failed to delete task");
    }
  };

  // Bulk selection handlers
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const selectAllTasks = () => {
    if (selectedTasks.size === filteredAndSortedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredAndSortedTasks.map((t) => t.id)));
    }
  };

  const clearSelection = () => {
    setSelectedTasks(new Set());
    setBulkMode(false);
  };

  const handleBulkAction = async (action: string, data?: Record<string, unknown>) => {
    if (selectedTasks.size === 0) return;

    setBulkActionLoading(true);
    try {
      const res = await fetch("/api/tasks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskIds: Array.from(selectedTasks),
          action,
          data,
        }),
      });

      if (res.ok) {
        await fetchTasks();
        clearSelection();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Bulk action failed");
      }
    } catch (err) {
      alert("Failed to perform bulk action");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Check if we're over a column (status)
    if (STATUSES.includes(over.id as TaskStatus)) {
      const newStatus = over.id as string;
      if (activeTask.status !== newStatus) {
        setTasks((prev) =>
          prev.map((t) => (t.id === active.id ? { ...t, status: newStatus } : t))
        );
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;

    // Determine the target status
    let targetStatus: string;
    if (STATUSES.includes(over.id as TaskStatus)) {
      targetStatus = over.id as string;
    } else {
      // Dropped on another task - get that task's status
      const overTask = tasks.find((t) => t.id === over.id);
      if (!overTask) return;
      targetStatus = overTask.status;
    }

    // Update on server if status changed
    if (activeTask.status !== targetStatus || tasks.find((t) => t.id === active.id)?.status !== activeTask.status) {
      const currentTask = tasks.find((t) => t.id === active.id);
      if (currentTask && currentTask.status !== activeTask.status) {
        // Status was already updated optimistically, now persist
        try {
          await fetch(`/api/tasks/${active.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: currentTask.status }),
          });
        } catch (err) {
          console.error("Failed to update task status:", err);
          await fetchTasks(); // Revert on error
        }
      }
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-gray-100 text-gray-700",
      MEDIUM: "bg-blue-100 text-blue-700",
      HIGH: "bg-orange-100 text-orange-700",
      URGENT: "bg-red-100 text-red-700",
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded ${colors[priority]}`}>
        {priority}
      </span>
    );
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const isDueToday = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate).toDateString() === new Date().toDateString();
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatFullDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate stats
  const overdueCount = useMemo(() =>
    tasks.filter((t) => t.status !== "DONE" && isOverdue(t.dueDate)).length,
    [tasks]
  );

  const dueTodayCount = useMemo(() =>
    tasks.filter((t) => t.status !== "DONE" && isDueToday(t.dueDate)).length,
    [tasks]
  );

  // Filter and sort tasks - ALL filtering is now client-side for instant responsiveness
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // Apply status filter
    if (filterStatus) {
      result = result.filter((t) => t.status === filterStatus);
    }

    // Apply assignee filter
    if (filterAssignee) {
      result = result.filter((t) => t.assignee?.id === filterAssignee);
    }

    // Apply project filter
    if (filterProject) {
      result = result.filter((t) => t.project?.id === filterProject);
    }

    // Apply "My Tasks" filter
    if (showMyTasks) {
      result = result.filter((t) => t.assignee?.id === currentUserId);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.project?.name.toLowerCase().includes(query) ||
        t.assignee?.name?.toLowerCase().includes(query)
      );
    }

    // Apply quick filter
    if (quickFilter === "dueToday") {
      result = result.filter((t) => t.status !== "DONE" && isDueToday(t.dueDate));
    } else if (quickFilter === "overdue") {
      result = result.filter((t) => t.status !== "DONE" && isOverdue(t.dueDate));
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "dueDate":
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case "priority":
          comparison = (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
          break;
        case "createdAt":
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
      }

      return sortDirection === "desc" ? -comparison : comparison;
    });

    return result;
  }, [tasks, filterStatus, filterAssignee, filterProject, showMyTasks, currentUserId, searchQuery, quickFilter, sortField, sortDirection]);

  // Group tasks by status (for board view)
  const groupedTasks = useMemo(() => ({
    TODO: filteredAndSortedTasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: filteredAndSortedTasks.filter((t) => t.status === "IN_PROGRESS"),
    DONE: filteredAndSortedTasks.filter((t) => t.status === "DONE"),
  }), [filteredAndSortedTasks]);

  const columnConfig = {
    TODO: {
      title: "To Do",
      icon: <CheckCircleIcon className="w-5 h-5 text-gray-400" />,
      bgColor: "bg-gray-50",
      countBg: "bg-gray-200 text-gray-600",
    },
    IN_PROGRESS: {
      title: "In Progress",
      icon: <ClockIcon className="w-5 h-5 text-blue-500" />,
      bgColor: "bg-blue-50",
      countBg: "bg-blue-200 text-blue-700",
    },
    DONE: {
      title: "Done",
      icon: <CheckCircleSolidIcon className="w-5 h-5 text-green-500" />,
      bgColor: "bg-green-50",
      countBg: "bg-green-200 text-green-700",
    },
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ?
      <ChevronUpIcon className="w-4 h-4" /> :
      <ChevronDownIcon className="w-4 h-4" />;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">
            {filteredAndSortedTasks.length} task{filteredAndSortedTasks.length !== 1 ? "s" : ""}
            {viewMode === "board" && " • Drag tasks between columns"}
            {" • Press N for new task, F to search"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("board")}
              className={`p-2 rounded ${viewMode === "board" ? "bg-white shadow-sm" : "hover:bg-gray-200"}`}
              title="Board View"
            >
              <ViewColumnsIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"}`}
              title="List View"
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200"}`}
              title="Grid View"
            >
              <TableCellsIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              setBulkMode(!bulkMode);
              if (bulkMode) clearSelection();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              bulkMode
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Squares2X2Icon className="w-4 h-4" />
            {bulkMode ? "Exit Bulk Mode" : "Bulk Select"}
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {bulkMode && selectedTasks.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-blue-800">
                {selectedTasks.size} task{selectedTasks.size !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={selectAllTasks}
                className="text-sm text-blue-600 hover:underline"
              >
                {selectedTasks.size === filteredAndSortedTasks.length ? "Deselect All" : "Select All"}
              </button>
              <button
                onClick={clearSelection}
                className="text-sm text-gray-600 hover:underline"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Status Actions */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkAction("updateStatus", { status: e.target.value });
                    e.target.value = "";
                  }
                }}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 text-sm border rounded-lg bg-white"
                defaultValue=""
              >
                <option value="" disabled>Set Status...</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>

              {/* Priority Actions */}
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkAction("updatePriority", { priority: e.target.value });
                    e.target.value = "";
                  }
                }}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 text-sm border rounded-lg bg-white"
                defaultValue=""
              >
                <option value="" disabled>Set Priority...</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>

              {/* Assignee Actions */}
              <select
                onChange={(e) => {
                  if (e.target.value !== "") {
                    handleBulkAction("assignTo", {
                      assigneeId: e.target.value === "unassign" ? null : e.target.value
                    });
                    e.target.value = "";
                  }
                }}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 text-sm border rounded-lg bg-white"
                defaultValue=""
              >
                <option value="" disabled>Assign to...</option>
                <option value="unassign">Unassign</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name || agent.email}
                  </option>
                ))}
              </select>

              {/* Project Actions */}
              <select
                onChange={(e) => {
                  if (e.target.value !== "") {
                    handleBulkAction("moveToProject", {
                      projectId: e.target.value === "none" ? null : e.target.value
                    });
                    e.target.value = "";
                  }
                }}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 text-sm border rounded-lg bg-white"
                defaultValue=""
              >
                <option value="" disabled>Move to Project...</option>
                <option value="none">No Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              {/* Archive/Delete */}
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to archive selected tasks?")) {
                    handleBulkAction("archive");
                  }
                }}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 text-sm border rounded-lg bg-white text-orange-600 hover:bg-orange-50"
              >
                Archive
              </button>
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${selectedTasks.size} task(s)? This cannot be undone.`)) {
                    handleBulkAction("delete");
                  }
                }}
                disabled={bulkActionLoading}
                className="px-3 py-1.5 text-sm border rounded-lg bg-white text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="task-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks... (press F)"
              className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuickFilter(quickFilter === "dueToday" ? "" : "dueToday")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                quickFilter === "dueToday"
                  ? "bg-amber-50 border-amber-300 text-amber-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              Due Today
              {dueTodayCount > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  quickFilter === "dueToday" ? "bg-amber-200" : "bg-amber-100 text-amber-700"
                }`}>
                  {dueTodayCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setQuickFilter(quickFilter === "overdue" ? "" : "overdue")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                quickFilter === "overdue"
                  ? "bg-red-50 border-red-300 text-red-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <ExclamationCircleIcon className="w-4 h-4" />
              Overdue
              {overdueCount > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  quickFilter === "overdue" ? "bg-red-200" : "bg-red-100 text-red-700"
                }`}>
                  {overdueCount}
                </span>
              )}
            </button>
          </div>

          <div className="h-6 w-px bg-gray-200" />

          {/* Existing Filters */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-gray-400" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showMyTasks}
              onChange={(e) => setShowMyTasks(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm">My Tasks</span>
          </label>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg"
          >
            <option value="">All Status</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>

          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg"
          >
            <option value="">All Assignees</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name || agent.email}
              </option>
            ))}
          </select>

          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-3 py-1.5 text-sm border rounded-lg"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          {/* Clear Filters Button - show when any filter is active */}
          {(filterStatus || filterAssignee || filterProject || showMyTasks || searchQuery || quickFilter) && (
            <button
              onClick={() => {
                setFilterStatus("");
                setFilterAssignee("");
                setFilterProject("");
                setShowMyTasks(false);
                setSearchQuery("");
                setQuickFilter("");
              }}
              className="px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200"
            >
              Clear Filters
            </button>
          )}

          {/* Sort Dropdown (for list/grid views) */}
          {viewMode !== "board" && (
            <select
              value={`${sortField}-${sortDirection}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split("-") as [SortField, SortDirection];
                setSortField(field);
                setSortDirection(dir);
              }}
              className="px-3 py-1.5 text-sm border rounded-lg"
            >
              <option value="dueDate-asc">Due Date (Earliest)</option>
              <option value="dueDate-desc">Due Date (Latest)</option>
              <option value="priority-desc">Priority (High to Low)</option>
              <option value="priority-asc">Priority (Low to High)</option>
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
            </select>
          )}
        </div>
      </div>

      {/* Task Views */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <CheckCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || quickFilter ? "No matching tasks" : "No tasks yet"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || quickFilter
              ? "Try adjusting your search or filters"
              : "Create your first task to get started"}
          </p>
          {!searchQuery && !quickFilter && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4" />
              New Task
            </button>
          )}
        </div>
      ) : viewMode === "board" ? (
        /* Board View */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {STATUSES.map((status) => (
              <TaskColumn
                key={status}
                status={status}
                tasks={groupedTasks[status]}
                config={columnConfig[status]}
                onToggle={handleToggleStatus}
                onEdit={openEditModal}
                onDelete={handleDelete}
                getPriorityBadge={getPriorityBadge}
                isOverdue={isOverdue}
                formatDate={formatDate}
                bulkMode={bulkMode}
                selectedTasks={selectedTasks}
                onToggleSelect={toggleTaskSelection}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <div className="opacity-80">
                <TaskCardContent
                  task={activeTask}
                  onToggle={handleToggleStatus}
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  getPriorityBadge={getPriorityBadge}
                  isOverdue={isOverdue}
                  formatDate={formatDate}
                  isDragging
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : viewMode === "list" ? (
        /* List View */
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {bulkMode && (
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedTasks.size === filteredAndSortedTasks.length && filteredAndSortedTasks.length > 0}
                      onChange={selectAllTasks}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}
                <th className="w-10 px-4 py-3"></th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center gap-1">
                    Task <SortIcon field="title" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("priority")}
                >
                  <div className="flex items-center gap-1">
                    Priority <SortIcon field="priority" />
                  </div>
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("dueDate")}
                >
                  <div className="flex items-center gap-1">
                    Due Date <SortIcon field="dueDate" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignee
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="w-20 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedTasks.map((task) => (
                <tr
                  key={task.id}
                  className={`hover:bg-gray-50 ${selectedTasks.has(task.id) ? "bg-blue-50" : ""} ${
                    isOverdue(task.dueDate) && task.status !== "DONE" ? "bg-red-50/50" : ""
                  }`}
                >
                  {bulkMode && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedTasks.has(task.id)}
                        onChange={() => toggleTaskSelection(task.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className="flex-shrink-0"
                    >
                      {task.status === "DONE" ? (
                        <CheckCircleSolidIcon className="w-5 h-5 text-green-500" />
                      ) : (
                        <CheckCircleIcon className="w-5 h-5 text-gray-300 hover:text-green-500" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/tasks/${task.id}`}
                      className={`font-medium hover:text-blue-600 ${
                        task.status === "DONE" ? "line-through text-gray-500" : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </Link>
                    {task._count.notes > 0 && (
                      <span className="ml-2 text-xs text-gray-400">
                        <ChatBubbleLeftIcon className="w-3 h-3 inline" /> {task._count.notes}
                      </span>
                    )}
                    {task.subtasks && task.subtasks.length > 0 && (
                      <span className="ml-2 text-xs text-gray-400">
                        <QueueListIcon className="w-3 h-3 inline" /> {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      task.status === "DONE" ? "bg-green-100 text-green-700" :
                      task.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {task.status === "IN_PROGRESS" ? "In Progress" : task.status === "TODO" ? "To Do" : "Done"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getPriorityBadge(task.priority)}
                  </td>
                  <td className={`px-4 py-3 text-sm ${
                    isOverdue(task.dueDate) && task.status !== "DONE" ? "text-red-600 font-medium" : "text-gray-500"
                  }`}>
                    {formatFullDate(task.dueDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {task.assignee?.name || task.assignee?.email || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {task.project?.name || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(task)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredAndSortedTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow border-l-4 ${PRIORITY_COLORS[task.priority]} ${
                selectedTasks.has(task.id) ? "ring-2 ring-blue-400" : ""
              } ${isOverdue(task.dueDate) && task.status !== "DONE" ? "bg-red-50/30" : ""}`}
            >
              <div className="flex items-start gap-3">
                {bulkMode ? (
                  <input
                    type="checkbox"
                    checked={selectedTasks.has(task.id)}
                    onChange={() => toggleTaskSelection(task.id)}
                    className="mt-1 rounded border-gray-300"
                  />
                ) : (
                  <button
                    onClick={() => handleToggleStatus(task)}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {task.status === "DONE" ? (
                      <CheckCircleSolidIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      <CheckCircleIcon className="w-5 h-5 text-gray-300 hover:text-green-500" />
                    )}
                  </button>
                )}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/tasks/${task.id}`}
                    className={`font-medium block truncate hover:text-blue-600 ${
                      task.status === "DONE" ? "line-through text-gray-500" : "text-gray-900"
                    }`}
                  >
                    {task.title}
                  </Link>

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                    {getPriorityBadge(task.priority)}
                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                      task.status === "DONE" ? "bg-green-100 text-green-700" :
                      task.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {task.status === "IN_PROGRESS" ? "In Progress" : task.status === "TODO" ? "To Do" : "Done"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 ${
                        isOverdue(task.dueDate) && task.status !== "DONE" ? "text-red-600" : ""
                      }`}>
                        <CalendarIcon className="w-3 h-3" />
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                    {task.assignee && (
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        {task.assignee.name || task.assignee.email}
                      </span>
                    )}
                  </div>

                  {task.project && (
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <FolderIcon className="w-3 h-3" />
                      {task.project.name}
                    </div>
                  )}

                  {/* Subtask Progress Bar */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span className="flex items-center gap-1">
                          <QueueListIcon className="w-3 h-3" />
                          Subtasks
                        </span>
                        <span>{task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full transition-all duration-300"
                          style={{
                            width: `${(task.subtasks.filter(s => s.isCompleted).length / task.subtasks.length) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t">
                <button
                  onClick={() => openEditModal(task)}
                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                >
                  <PencilIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(task)}
                  className="p-1 text-gray-400 hover:text-red-600 rounded"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">
                {editingTask ? "Edit Task" : "New Task"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
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
                  rows={3}
                  placeholder="Task description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

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
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact
                  </label>
                  <select
                    value={formData.contactId}
                    onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">None</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.name || contact.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : editingTask ? "Save Changes" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Task Column Component with droppable area
function TaskColumn({
  status,
  tasks,
  config,
  onToggle,
  onEdit,
  onDelete,
  getPriorityBadge,
  isOverdue,
  formatDate,
  bulkMode,
  selectedTasks,
  onToggleSelect,
}: {
  status: string;
  tasks: Task[];
  config: {
    title: string;
    icon: React.ReactNode;
    bgColor: string;
    countBg: string;
  };
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  getPriorityBadge: (priority: string) => JSX.Element;
  isOverdue: (dueDate: string | null) => boolean;
  formatDate: (date: string | null) => string | null;
  bulkMode: boolean;
  selectedTasks: Set<string>;
  onToggleSelect: (taskId: string) => void;
}) {
  const { setNodeRef } = useSortable({
    id: status,
    data: { type: "column" },
  });

  return (
    <div ref={setNodeRef} className={`${config.bgColor} rounded-lg p-4 min-h-[400px]`}>
      <div className="flex items-center gap-2 mb-4">
        {config.icon}
        <h2 className="font-semibold text-gray-700">{config.title}</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full ${config.countBg}`}>
          {tasks.length}
        </span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              getPriorityBadge={getPriorityBadge}
              isOverdue={isOverdue}
              formatDate={formatDate}
              bulkMode={bulkMode}
              isSelected={selectedTasks.has(task.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

// Sortable Task Card wrapper
function SortableTaskCard({
  task,
  onToggle,
  onEdit,
  onDelete,
  getPriorityBadge,
  isOverdue,
  formatDate,
  bulkMode,
  isSelected,
  onToggleSelect,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  getPriorityBadge: (priority: string) => JSX.Element;
  isOverdue: (dueDate: string | null) => boolean;
  formatDate: (date: string | null) => string | null;
  bulkMode: boolean;
  isSelected: boolean;
  onToggleSelect: (taskId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCardContent
        task={task}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        getPriorityBadge={getPriorityBadge}
        isOverdue={isOverdue}
        formatDate={formatDate}
        isDragging={isDragging}
        bulkMode={bulkMode}
        isSelected={isSelected}
        onToggleSelect={onToggleSelect}
      />
    </div>
  );
}

// Task Card Content Component
function TaskCardContent({
  task,
  onToggle,
  onEdit,
  onDelete,
  getPriorityBadge,
  isOverdue,
  formatDate,
  isDragging,
  bulkMode,
  isSelected,
  onToggleSelect,
}: {
  task: Task;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  getPriorityBadge: (priority: string) => JSX.Element;
  isOverdue: (dueDate: string | null) => boolean;
  formatDate: (date: string | null) => string | null;
  isDragging?: boolean;
  bulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (taskId: string) => void;
}) {
  return (
    <div
      className={`bg-white rounded-lg border border-l-4 ${PRIORITY_COLORS[task.priority]} p-4 shadow-sm hover:shadow-md transition-shadow cursor-grab ${
        isDragging ? "shadow-lg ring-2 ring-blue-500" : ""
      } ${isSelected ? "ring-2 ring-blue-400 bg-blue-50" : ""} ${
        isOverdue(task.dueDate) && task.status !== "DONE" ? "bg-red-50/30" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {bulkMode && onToggleSelect ? (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              onToggleSelect(task.id);
            }}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(task);
            }}
            className="mt-0.5 flex-shrink-0"
            title={task.status === "DONE" ? "Mark as To Do" : "Mark as Done"}
          >
            {task.status === "DONE" ? (
              <CheckCircleSolidIcon className="w-5 h-5 text-green-500" />
            ) : (
              <CheckCircleIcon className="w-5 h-5 text-gray-300 hover:text-green-500" />
            )}
          </button>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/tasks/${task.id}`}
              className={`font-medium text-gray-900 truncate hover:text-blue-600 ${
                task.status === "DONE" ? "line-through text-gray-500" : ""
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {task.title}
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            {getPriorityBadge(task.priority)}

            {task.dueDate && (
              <span
                className={`flex items-center gap-1 ${
                  isOverdue(task.dueDate) && task.status !== "DONE"
                    ? "text-red-600 font-medium"
                    : ""
                }`}
              >
                <CalendarIcon className="w-3 h-3" />
                {formatDate(task.dueDate)}
              </span>
            )}

            {task.assignee && (
              <span className="flex items-center gap-1">
                <UserIcon className="w-3 h-3" />
                {task.assignee.name || task.assignee.email}
              </span>
            )}

            {task.project && (
              <span className="flex items-center gap-1">
                <FolderIcon className="w-3 h-3" />
                {task.project.name}
              </span>
            )}

            {task._count.notes > 0 && (
              <span className="flex items-center gap-1">
                <ChatBubbleLeftIcon className="w-3 h-3" />
                {task._count.notes}
              </span>
            )}

            {task.subtasks && task.subtasks.length > 0 && (
              <span className="flex items-center gap-1">
                <QueueListIcon className="w-3 h-3" />
                {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
              </span>
            )}
          </div>

          {/* Subtask Progress Bar */}
          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-2">
              <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${(task.subtasks.filter(s => s.isCompleted).length / task.subtasks.length) * 100}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1 text-gray-400 hover:text-blue-600 rounded"
            title="Edit"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task);
            }}
            className="p-1 text-gray-400 hover:text-red-600 rounded"
            title="Delete"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
