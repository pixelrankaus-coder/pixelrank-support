"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

interface Agent {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatar: string | null;
  isAiAgent: boolean;
  jobTitle: string | null;
  createdAt: Date;
  ticketCount: number;
  taskCount: number;
}

// Claude AI Avatar component - Anthropic-style with sparkle/starburst
function ClaudeAvatar({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} rounded-full bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-sm ring-2 ring-orange-200`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-5 h-5"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Claude-style starburst/sparkle icon */}
        <path
          d="M12 2L13.09 8.26L18 5L14.74 10.91L21 12L14.74 13.09L18 19L13.09 15.74L12 22L10.91 15.74L6 19L9.26 13.09L3 12L9.26 10.91L6 5L10.91 8.26L12 2Z"
          fill="white"
          stroke="white"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

interface AgentsListProps {
  initialAgents: Agent[];
}

export function AgentsList({ initialAgents }: AgentsListProps) {
  const router = useRouter();
  const [agents] = useState(initialAgents);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleOpenModal = () => {
    setShowModal(true);
    setError(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as string,
      password: formData.get("password") as string,
    };

    if (!data.email.trim()) {
      setError("Email is required");
      return;
    }

    if (!data.password) {
      setError("Password is required for new agents");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to save agent");
        }

        handleCloseModal();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save agent");
      }
    });
  };

  const handleDelete = async (agent: Agent) => {
    if (!confirm(`Are you sure you want to delete ${agent.name || agent.email}?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/agents/${agent.id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to delete agent");
        }

        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete agent");
      }
    });
  };

  return (
    <>
      {/* Add Agent Button */}
      <div className="mb-4">
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add Agent
        </button>
      </div>

      {/* Agents Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agent
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tickets
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tasks
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agents.map((agent) => (
              <tr key={agent.id} className={`hover:bg-gray-50 ${agent.isAiAgent ? "bg-orange-50/50" : ""}`}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {agent.isAiAgent ? (
                      <ClaudeAvatar />
                    ) : agent.avatar ? (
                      <img
                        src={agent.avatar}
                        alt={agent.name || "Agent"}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserCircleIcon className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900 flex items-center gap-2">
                        {agent.name || "Unnamed"}
                        {agent.isAiAgent && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                            AI
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {agent.jobTitle || agent.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      agent.isAiAgent
                        ? "bg-orange-100 text-orange-800"
                        : agent.role === "ADMIN"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {agent.isAiAgent ? "AI AGENT" : agent.role}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {agent.ticketCount}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {agent.taskCount}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {new Date(agent.createdAt).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    {!agent.isAiAgent && (
                      <>
                        <Link
                          href={`/admin/team/agents/${agent.id}`}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(agent)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {agent.isAiAgent && (
                      <span className="text-xs text-gray-400 italic">System Agent</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {agents.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-500">
                  No agents found. Add your first agent to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add New Agent
              </h3>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    defaultValue="AGENT"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="AGENT">Agent</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isPending ? "Saving..." : "Add Agent"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
