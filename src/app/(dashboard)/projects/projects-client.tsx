"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  PlusIcon,
  FolderIcon,
  CalendarIcon,
  UserIcon,
  BuildingOfficeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  PauseCircleIcon,
  ArchiveBoxIcon,
  Squares2X2Icon,
  ListBulletIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: string | Date | null;
  dueDate: string | Date | null;
  completedAt: string | Date | null;
  company: { id: string; name: string } | null;
  manager: { id: string; name: string | null; email: string; image?: string | null } | null;
  _count: { tasks: number };
  taskStats: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    overdue: number;
  };
  team?: TeamMember[];
  createdAt: string | Date;
  updatedAt?: string | Date;
}

type ProjectHealth = "on_track" | "at_risk" | "blocked";

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

interface Company {
  id: string;
  name: string;
}

export function ProjectsClient({
  initialProjects,
  agents,
  companies,
}: {
  initialProjects: Project[];
  agents: Agent[];
  companies: Company[];
}) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "ACTIVE",
    startDate: "",
    dueDate: "",
    companyId: "",
    managerId: "",
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchProjects = async () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterCompany) params.set("companyId", filterCompany);

    const res = await fetch(`/api/projects?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setProjects(data);
    }
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({
      name: "",
      description: "",
      status: "ACTIVE",
      startDate: "",
      dueDate: "",
      companyId: "",
      managerId: "",
    });
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    // Handle both Date objects and strings from server
    const formatDateForInput = (date: string | Date | null): string => {
      if (!date) return "";
      if (typeof date === "string") {
        return date.split("T")[0];
      }
      return new Date(date).toISOString().split("T")[0];
    };
    setFormData({
      name: project.name,
      description: project.description || "",
      status: project.status,
      startDate: formatDateForInput(project.startDate),
      dueDate: formatDateForInput(project.dueDate),
      companyId: project.company?.id || "",
      managerId: project.manager?.id || "",
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const url = editingProject
        ? `/api/projects/${editingProject.id}`
        : "/api/projects";

      const res = await fetch(url, {
        method: editingProject ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          companyId: formData.companyId || null,
          managerId: formData.managerId || null,
          startDate: formData.startDate || null,
          dueDate: formData.dueDate || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save project");
      }

      await fetchProjects();
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (
      !confirm(
        `Are you sure you want to delete "${project.name}"? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete project");
      }
      await fetchProjects();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete project");
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; icon: typeof CheckCircleIcon }> = {
      ACTIVE: { bg: "bg-green-100", text: "text-green-700", icon: CheckCircleIcon },
      ON_HOLD: { bg: "bg-yellow-100", text: "text-yellow-700", icon: PauseCircleIcon },
      COMPLETED: { bg: "bg-blue-100", text: "text-blue-700", icon: CheckCircleIcon },
      ARCHIVED: { bg: "bg-gray-100", text: "text-gray-700", icon: ArchiveBoxIcon },
    };
    const { bg, text, icon: Icon } = config[status] || config.ACTIVE;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${bg} ${text}`}>
        <Icon className="w-3 h-3" />
        {status.replace("_", " ")}
      </span>
    );
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getProgressPercentage = (stats: Project["taskStats"]) => {
    if (stats.total === 0) return 0;
    return Math.round((stats.done / stats.total) * 100);
  };

  // Calculate project health based on multiple factors
  const getProjectHealth = (project: Project): ProjectHealth => {
    // Completed or archived projects are always on track
    if (project.status === "COMPLETED" || project.status === "ARCHIVED") {
      return "on_track";
    }

    const { taskStats, dueDate, updatedAt } = project;
    const now = new Date();

    // Blocked: Has overdue tasks OR project is past due date
    if (taskStats.overdue > 0) {
      return "blocked";
    }

    if (dueDate) {
      const due = new Date(dueDate);
      if (due < now) {
        return "blocked";
      }

      // At Risk: Due date is within 7 days and less than 75% complete
      const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const progressPct = getProgressPercentage(taskStats);
      if (daysUntilDue <= 7 && progressPct < 75) {
        return "at_risk";
      }
    }

    // At Risk: No activity in 7+ days (if updatedAt is available)
    if (updatedAt) {
      const lastUpdate = new Date(updatedAt);
      const daysSinceUpdate = Math.ceil((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceUpdate > 7 && taskStats.total > 0 && taskStats.done < taskStats.total) {
        return "at_risk";
      }
    }

    // At Risk: Has tasks but none in progress and not complete
    if (taskStats.total > 0 && taskStats.inProgress === 0 && taskStats.done === 0) {
      return "at_risk";
    }

    return "on_track";
  };

  const getHealthBadge = (project: Project) => {
    const health = getProjectHealth(project);
    const config: Record<ProjectHealth, {
      bg: string;
      text: string;
      icon: typeof CheckCircleIcon;
      label: string;
      dot: string;
    }> = {
      on_track: {
        bg: "bg-green-100",
        text: "text-green-700",
        icon: CheckCircleIcon,
        label: "On Track",
        dot: "bg-green-500"
      },
      at_risk: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        icon: ExclamationTriangleIcon,
        label: "At Risk",
        dot: "bg-yellow-500"
      },
      blocked: {
        bg: "bg-red-100",
        text: "text-red-700",
        icon: ExclamationCircleIcon,
        label: "Blocked",
        dot: "bg-red-500"
      },
    };
    const { bg, text, icon: Icon, label, dot } = config[health];
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded ${bg} ${text}`}
        title={health === "blocked"
          ? `${project.taskStats.overdue} overdue task(s)`
          : health === "at_risk"
          ? "Needs attention"
          : "Project is progressing well"}
      >
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        {label}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 text-sm mt-1">
            {projects.length} project{projects.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${
                viewMode === "grid"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="Grid View"
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${
                viewMode === "list"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="List View"
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setTimeout(fetchProjects, 0);
            }}
            className="px-3 py-1.5 text-sm border rounded-lg"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          <select
            value={filterCompany}
            onChange={(e) => {
              setFilterCompany(e.target.value);
              setTimeout(fetchProjects, 0);
            }}
            className="px-3 py-1.5 text-sm border rounded-lg"
          >
            <option value="">All Companies</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Display */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No projects yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first project to organize tasks
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            New Project
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg border hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderIcon className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900 truncate">
                      {project.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {getHealthBadge(project)}
                    {getStatusBadge(project.status)}
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{getProgressPercentage(project.taskStats)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${getProgressPercentage(project.taskStats)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{project.taskStats.todo} to do</span>
                    <span>{project.taskStats.inProgress} in progress</span>
                    <span>{project.taskStats.done} done</span>
                  </div>
                </div>

                {/* Team avatars */}
                {project.team && project.team.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {project.team.slice(0, 5).map((member) => (
                          <div
                            key={member.id}
                            className="relative"
                            title={member.name || member.email}
                          >
                            {member.image ? (
                              <Image
                                src={member.image}
                                alt={member.name || member.email}
                                width={28}
                                height={28}
                                className="w-7 h-7 rounded-full border-2 border-white object-cover"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                {(member.name || member.email).charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        ))}
                        {project.team.length > 5 && (
                          <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                            +{project.team.length - 5}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {project.team.length} member{project.team.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                )}

                {/* Meta info */}
                <div className="space-y-2 text-sm text-gray-500">
                  {project.company && (
                    <div className="flex items-center gap-2">
                      <BuildingOfficeIcon className="w-4 h-4" />
                      <span>{project.company.name}</span>
                    </div>
                  )}
                  {project.dueDate && (
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Due {formatDate(project.dueDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="border-t px-5 py-3 flex items-center justify-between">
                <Link
                  href={`/projects/${project.id}`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View Project ({project._count.tasks} tasks)
                </Link>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(project)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(project)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-lg border overflow-hidden">
          {/* Table Header */}
          <div className="bg-gray-50 border-b px-6 py-3 grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
            <div className="col-span-3">Project</div>
            <div className="col-span-1">Health</div>
            <div className="col-span-2">Team</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Progress</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          {/* Table Body */}
          <div className="divide-y">
            {projects.map((project) => (
              <div
                key={project.id}
                className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-gray-50"
              >
                {/* Project Info */}
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <FolderIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0">
                      <Link
                        href={`/projects/${project.id}`}
                        className="font-medium text-gray-900 hover:text-blue-600 truncate block"
                      >
                        {project.name}
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        {project.company && (
                          <span className="flex items-center gap-1">
                            <BuildingOfficeIcon className="w-3 h-3" />
                            {project.company.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Health */}
                <div className="col-span-1">
                  {getHealthBadge(project)}
                </div>

                {/* Team */}
                <div className="col-span-2">
                  {project.team && project.team.length > 0 ? (
                    <div className="flex items-center">
                      <div className="flex -space-x-2">
                        {project.team.slice(0, 4).map((member) => (
                          <div
                            key={member.id}
                            className="relative"
                            title={member.name || member.email}
                          >
                            {member.image ? (
                              <Image
                                src={member.image}
                                alt={member.name || member.email}
                                width={28}
                                height={28}
                                className="w-7 h-7 rounded-full border-2 border-white object-cover"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                {(member.name || member.email).charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        ))}
                        {project.team.length > 4 && (
                          <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                            +{project.team.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <UserGroupIcon className="w-4 h-4" />
                      No team
                    </span>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-1">
                  {getStatusBadge(project.status)}
                </div>

                {/* Progress */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${getProgressPercentage(project.taskStats)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-10 text-right">
                      {getProgressPercentage(project.taskStats)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {project.taskStats.done}/{project.taskStats.total} tasks
                  </div>
                </div>

                {/* Due Date */}
                <div className="col-span-2">
                  {project.dueDate ? (
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      {formatDate(project.dueDate)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">No due date</span>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <button
                    onClick={() => openEditModal(project)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(project)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                    title="Delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">
                {editingProject ? "Edit Project" : "New Project"}
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
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Project name..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Project description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <select
                  value={formData.companyId}
                  onChange={(e) =>
                    setFormData({ ...formData, companyId: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Company</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Manager
                </label>
                <select
                  value={formData.managerId}
                  onChange={(e) =>
                    setFormData({ ...formData, managerId: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Manager</option>
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
                  {isSaving
                    ? "Saving..."
                    : editingProject
                    ? "Save Changes"
                    : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
