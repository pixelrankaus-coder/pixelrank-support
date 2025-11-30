"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  PlusIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  FunnelIcon,
  DocumentTextIcon,
  DocumentCheckIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  sortOrder: number;
  assignee: { id: string; name: string | null; email: string } | null;
  _count: { notes: number };
  createdAt: string;
}

interface Deliverable {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  dueDate: string | null;
  deliveredAt: string | null;
  fileUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | null;
  dueDate: string | null;
  completedAt: string | null;
  company: { id: string; name: string } | null;
  manager: { id: string; name: string | null; email: string } | null;
  tasks: Task[];
  deliverables: Deliverable[];
  createdAt: string;
  updatedAt: string;
}

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

interface Contact {
  id: string;
  name: string | null;
  email: string;
}

interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "bg-green-100 text-green-700" },
  ON_HOLD: { label: "On Hold", color: "bg-yellow-100 text-yellow-700" },
  COMPLETED: { label: "Completed", color: "bg-blue-100 text-blue-700" },
  ARCHIVED: { label: "Archived", color: "bg-gray-100 text-gray-700" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  LOW: { label: "Low", color: "bg-gray-100 text-gray-700" },
  MEDIUM: { label: "Medium", color: "bg-blue-100 text-blue-700" },
  HIGH: { label: "High", color: "bg-orange-100 text-orange-700" },
  URGENT: { label: "Urgent", color: "bg-red-100 text-red-700" },
};

const DELIVERABLE_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-gray-100 text-gray-700" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  DELIVERED: { label: "Delivered", color: "bg-green-100 text-green-700" },
  APPROVED: { label: "Approved", color: "bg-purple-100 text-purple-700" },
};

const DELIVERABLE_TYPE_CONFIG: Record<string, { label: string }> = {
  MONTHLY_REPORT: { label: "Monthly Report" },
  CONTENT_CALENDAR: { label: "Content Calendar" },
  KEYWORD_RESEARCH: { label: "Keyword Research" },
  TECHNICAL_AUDIT: { label: "Technical Audit" },
  LINK_BUILDING_REPORT: { label: "Link Building Report" },
  COMPETITOR_ANALYSIS: { label: "Competitor Analysis" },
  CONTENT_PIECE: { label: "Content Piece" },
  OTHER: { label: "Other" },
};

export function ProjectDetailClient({
  project,
  taskStats,
  agents,
  contacts,
  currentUserId,
}: {
  project: Project;
  taskStats: TaskStats;
  agents: Agent[];
  contacts: Contact[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>(project.tasks);
  const [deliverables, setDeliverables] = useState<Deliverable[]>(project.deliverables);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeliverableModalOpen, setIsDeliverableModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingDeliverable, setEditingDeliverable] = useState<Deliverable | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectData, setProjectData] = useState({
    name: project.name,
    description: project.description || "",
    status: project.status,
    startDate: project.startDate
      ? (typeof project.startDate === 'string' ? project.startDate.split("T")[0] : new Date(project.startDate).toISOString().split("T")[0])
      : "",
    dueDate: project.dueDate
      ? (typeof project.dueDate === 'string' ? project.dueDate.split("T")[0] : new Date(project.dueDate).toISOString().split("T")[0])
      : "",
  });
  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: "",
    assigneeId: "",
    contactId: "",
  });
  const [deliverableFormData, setDeliverableFormData] = useState({
    name: "",
    description: "",
    type: "OTHER",
    status: "PENDING",
    dueDate: "",
    fileUrl: "",
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchTasks = async () => {
    const res = await fetch(`/api/projects/${project.id}`);
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks);
    }
  };

  const fetchDeliverables = async () => {
    const res = await fetch(`/api/deliverables?projectId=${project.id}`);
    if (res.ok) {
      const data = await res.json();
      setDeliverables(data);
    }
  };

  const openDeliverableModal = (deliverable?: Deliverable) => {
    if (deliverable) {
      setEditingDeliverable(deliverable);
      setDeliverableFormData({
        name: deliverable.name,
        description: deliverable.description || "",
        type: deliverable.type,
        status: deliverable.status,
        dueDate: deliverable.dueDate ? deliverable.dueDate.split("T")[0] : "",
        fileUrl: deliverable.fileUrl || "",
      });
    } else {
      setEditingDeliverable(null);
      setDeliverableFormData({
        name: "",
        description: "",
        type: "MONTHLY_REPORT",
        status: "PENDING",
        dueDate: "",
        fileUrl: "",
      });
    }
    setError("");
    setIsDeliverableModalOpen(true);
  };

  const handleDeliverableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const url = editingDeliverable
        ? `/api/deliverables/${editingDeliverable.id}`
        : "/api/deliverables";
      const res = await fetch(url, {
        method: editingDeliverable ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...deliverableFormData,
          projectId: project.id,
          dueDate: deliverableFormData.dueDate || null,
          fileUrl: deliverableFormData.fileUrl || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save deliverable");
      }

      await fetchDeliverables();
      setIsDeliverableModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDeliverable = async (deliverable: Deliverable) => {
    if (!confirm(`Delete deliverable "${deliverable.name}"?`)) return;
    try {
      await fetch(`/api/deliverables/${deliverable.id}`, { method: "DELETE" });
      await fetchDeliverables();
      router.refresh();
    } catch (err) {
      alert("Failed to delete deliverable");
    }
  };

  const handleDeliverableStatusChange = async (deliverable: Deliverable, newStatus: string) => {
    try {
      await fetch(`/api/deliverables/${deliverable.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchDeliverables();
      router.refresh();
    } catch (err) {
      console.error("Failed to update deliverable status:", err);
    }
  };

  const openTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
        assigneeId: task.assignee?.id || "",
        contactId: "",
      });
    } else {
      setEditingTask(null);
      setTaskFormData({
        title: "",
        description: "",
        status: "TODO",
        priority: "MEDIUM",
        dueDate: "",
        assigneeId: currentUserId,
        contactId: "",
      });
    }
    setError("");
    setIsTaskModalOpen(true);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : "/api/tasks";
      const res = await fetch(url, {
        method: editingTask ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskFormData,
          projectId: project.id,
          companyId: project.company?.id || null,
          assigneeId: taskFormData.assigneeId || null,
          contactId: taskFormData.contactId || null,
          dueDate: taskFormData.dueDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save task");
      }

      await fetchTasks();
      setIsTaskModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === "DONE" ? "TODO" : "DONE";
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchTasks();
      router.refresh();
    } catch (err) {
      console.error("Failed to toggle task status:", err);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      await fetchTasks();
      router.refresh();
    } catch (err) {
      alert("Failed to delete task");
    }
  };

  const handleProjectUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...projectData,
          startDate: projectData.startDate || null,
          dueDate: projectData.dueDate || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to update project");
      setIsEditingProject(false);
      router.refresh();
    } catch (err) {
      alert("Failed to update project");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm(`Delete project "${project.name}" and all its tasks?`)) return;
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/projects");
      }
    } catch (err) {
      alert("Failed to delete project");
    }
  };

  const filteredTasks = filterStatus
    ? tasks.filter((t) => t.status === filterStatus)
    : tasks;

  const progressPercent = taskStats.total > 0
    ? Math.round((taskStats.done / taskStats.total) * 100)
    : 0;

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isOverdue = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to Projects
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditingProject ? (
              <form onSubmit={handleProjectUpdate} className="space-y-4 max-w-lg">
                <input
                  type="text"
                  value={projectData.name}
                  onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                  className="text-2xl font-bold w-full px-3 py-1 border rounded-lg"
                  required
                />
                <textarea
                  value={projectData.description}
                  onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="Description..."
                />
                <div className="grid grid-cols-3 gap-3">
                  <select
                    value={projectData.status}
                    onChange={(e) => setProjectData({ ...projectData, status: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                  <input
                    type="date"
                    value={projectData.startDate}
                    onChange={(e) => setProjectData({ ...projectData, startDate: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                    placeholder="Start date"
                  />
                  <input
                    type="date"
                    value={projectData.dueDate}
                    onChange={(e) => setProjectData({ ...projectData, dueDate: e.target.value })}
                    className="px-3 py-2 border rounded-lg"
                    placeholder="Due date"
                  />
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
                    onClick={() => setIsEditingProject(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${STATUS_CONFIG[project.status]?.color}`}>
                    {STATUS_CONFIG[project.status]?.label}
                  </span>
                </div>
                {project.description && (
                  <p className="text-gray-600 mb-3">{project.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  {project.company && (
                    <span className="flex items-center gap-1">
                      <BuildingOfficeIcon className="w-4 h-4" />
                      {project.company.name}
                    </span>
                  )}
                  {project.manager && (
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      {project.manager.name || project.manager.email}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    Due: <span className={isOverdue(project.dueDate) && project.status !== "COMPLETED" ? "text-red-600" : ""}>
                      {formatDate(project.dueDate)}
                    </span>
                  </span>
                </div>
              </>
            )}
          </div>

          {!isEditingProject && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingProject(true)}
                className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                title="Edit Project"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleDeleteProject}
                className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                title="Delete Project"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Card */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Progress</h2>
          <span className="text-2xl font-bold text-blue-600">{progressPercent}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{taskStats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-500">{taskStats.todo}</div>
            <div className="text-xs text-gray-500">To Do</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
            <div className="text-xs text-gray-500">In Progress</div>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{taskStats.done}</div>
            <div className="text-xs text-gray-500">Done</div>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-gray-900">Tasks</h2>
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-sm border rounded-lg px-2 py-1"
              >
                <option value="">All Status</option>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => openTaskModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Add Task
          </button>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-500 mb-4">Add tasks to track progress on this project</p>
            <button
              onClick={() => openTaskModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4" />
              Add Task
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {filteredTasks.map((task) => (
              <div key={task.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                <button
                  onClick={() => handleToggleTaskStatus(task)}
                  className="flex-shrink-0"
                  title={task.status === "DONE" ? "Mark as To Do" : "Mark as Done"}
                >
                  {task.status === "DONE" ? (
                    <CheckCircleSolidIcon className="w-5 h-5 text-green-500" />
                  ) : task.status === "IN_PROGRESS" ? (
                    <ClockIcon className="w-5 h-5 text-blue-500" />
                  ) : (
                    <CheckCircleIcon className="w-5 h-5 text-gray-300 hover:text-green-500" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/tasks/${task.id}`}
                      className={`font-medium hover:text-blue-600 ${
                        task.status === "DONE" ? "line-through text-gray-500" : "text-gray-900"
                      }`}
                    >
                      {task.title}
                    </Link>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${PRIORITY_CONFIG[task.priority]?.color}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    {task.assignee && (
                      <span className="flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        {task.assignee.name || task.assignee.email}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 ${
                        isOverdue(task.dueDate) && task.status !== "DONE" ? "text-red-600" : ""
                      }`}>
                        <CalendarIcon className="w-3 h-3" />
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                    {task._count.notes > 0 && (
                      <span>{task._count.notes} note{task._count.notes !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openTaskModal(task)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deliverables Section */}
      <div className="bg-white rounded-lg border mt-6">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-gray-900">Client Deliverables</h2>
            <span className="text-sm text-gray-500">
              {deliverables.length} deliverable{deliverables.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={() => openDeliverableModal()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
          >
            <PlusIcon className="w-4 h-4" />
            Add Deliverable
          </button>
        </div>

        {deliverables.length === 0 ? (
          <div className="p-12 text-center">
            <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No deliverables yet</h3>
            <p className="text-gray-500 mb-4">Track client deliverables like reports, audits, and content</p>
            <button
              onClick={() => openDeliverableModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <PlusIcon className="w-4 h-4" />
              Add Deliverable
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {deliverables.map((deliverable) => (
              <div key={deliverable.id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                <div className="flex-shrink-0">
                  {deliverable.status === "APPROVED" ? (
                    <DocumentCheckIcon className="w-5 h-5 text-purple-500" />
                  ) : deliverable.status === "DELIVERED" ? (
                    <DocumentCheckIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{deliverable.name}</span>
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                      {DELIVERABLE_TYPE_CONFIG[deliverable.type]?.label || deliverable.type}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${DELIVERABLE_STATUS_CONFIG[deliverable.status]?.color}`}>
                      {DELIVERABLE_STATUS_CONFIG[deliverable.status]?.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    {deliverable.dueDate && (
                      <span className={`flex items-center gap-1 ${
                        isOverdue(deliverable.dueDate) && deliverable.status !== "DELIVERED" && deliverable.status !== "APPROVED" ? "text-red-600" : ""
                      }`}>
                        <CalendarIcon className="w-3 h-3" />
                        Due: {formatDate(deliverable.dueDate)}
                      </span>
                    )}
                    {deliverable.deliveredAt && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircleIcon className="w-3 h-3" />
                        Delivered: {formatDate(deliverable.deliveredAt)}
                      </span>
                    )}
                    {deliverable.fileUrl && (
                      <a
                        href={deliverable.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        <LinkIcon className="w-3 h-3" />
                        View File
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {deliverable.status !== "APPROVED" && (
                    <select
                      value={deliverable.status}
                      onChange={(e) => handleDeliverableStatusChange(deliverable, e.target.value)}
                      className="text-xs border rounded px-2 py-1"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="APPROVED">Approved</option>
                    </select>
                  )}
                  <button
                    onClick={() => openDeliverableModal(deliverable)}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDeliverable(deliverable)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deliverable Modal */}
      {isDeliverableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">
                {editingDeliverable ? "Edit Deliverable" : "New Deliverable"}
              </h2>
            </div>

            <form onSubmit={handleDeliverableSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={deliverableFormData.name}
                  onChange={(e) => setDeliverableFormData({ ...deliverableFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., January Monthly Report"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={deliverableFormData.description}
                  onChange={(e) => setDeliverableFormData({ ...deliverableFormData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  rows={2}
                  placeholder="Brief description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={deliverableFormData.type}
                    onChange={(e) => setDeliverableFormData({ ...deliverableFormData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="MONTHLY_REPORT">Monthly Report</option>
                    <option value="CONTENT_CALENDAR">Content Calendar</option>
                    <option value="KEYWORD_RESEARCH">Keyword Research</option>
                    <option value="TECHNICAL_AUDIT">Technical Audit</option>
                    <option value="LINK_BUILDING_REPORT">Link Building Report</option>
                    <option value="COMPETITOR_ANALYSIS">Competitor Analysis</option>
                    <option value="CONTENT_PIECE">Content Piece</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={deliverableFormData.status}
                    onChange={(e) => setDeliverableFormData({ ...deliverableFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="APPROVED">Approved</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={deliverableFormData.dueDate}
                  onChange={(e) => setDeliverableFormData({ ...deliverableFormData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File URL
                </label>
                <input
                  type="url"
                  value={deliverableFormData.fileUrl}
                  onChange={(e) => setDeliverableFormData({ ...deliverableFormData, fileUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                  placeholder="https://drive.google.com/..."
                />
                <p className="text-xs text-gray-500 mt-1">Link to Google Drive, Dropbox, or other file storage</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsDeliverableModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : editingDeliverable ? "Save Changes" : "Create Deliverable"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">
                {editingTask ? "Edit Task" : "New Task"}
              </h2>
            </div>

            <form onSubmit={handleTaskSubmit} className="p-6 space-y-4">
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
                  value={taskFormData.title}
                  onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
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
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
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
                    value={taskFormData.status}
                    onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskFormData.priority}
                    onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value })}
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
                    value={taskFormData.dueDate}
                    onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignee
                  </label>
                  <select
                    value={taskFormData.assigneeId}
                    onChange={(e) => setTaskFormData({ ...taskFormData, assigneeId: e.target.value })}
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

              {contacts.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Related Contact
                  </label>
                  <select
                    value={taskFormData.contactId}
                    onChange={(e) => setTaskFormData({ ...taskFormData, contactId: e.target.value })}
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
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
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
