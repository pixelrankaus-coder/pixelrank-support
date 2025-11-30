"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface GroupMember {
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  members: GroupMember[];
  _count: {
    tickets: number;
  };
}

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

interface GroupsClientProps {
  groups: Group[];
  agents: Agent[];
}

export function GroupsClient({ groups, agents }: GroupsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    memberIds: [] as string[],
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", memberIds: [] });
    setEditingGroup(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (group: Group) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      memberIds: group.members.map((m) => m.user.id),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const url = editingGroup
          ? `/api/admin/groups/${editingGroup.id}`
          : "/api/admin/groups";
        const method = editingGroup ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to save group");
        }

        setShowModal(false);
        resetForm();
        router.refresh();
      } catch (error) {
        console.error("Error saving group:", error);
        alert(error instanceof Error ? error.message : "Failed to save group");
      }
    });
  };

  const handleDelete = async (group: Group) => {
    if (!confirm(`Are you sure you want to delete "${group.name}"?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/groups/${group.id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error("Failed to delete group");
        }

        router.refresh();
      } catch (error) {
        console.error("Error deleting group:", error);
        alert("Failed to delete group");
      }
    });
  };

  const toggleMember = (agentId: string) => {
    setFormData((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(agentId)
        ? prev.memberIds.filter((id) => id !== agentId)
        : [...prev.memberIds, agentId],
    }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Groups</h3>
          <p className="text-sm text-gray-500">
            Organize agents into teams for better ticket routing and workload management
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4" />
          New Group
        </button>
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No groups yet</h4>
          <p className="text-gray-500 max-w-md mx-auto mb-4">
            Create groups to organize your agents into teams. Groups help with ticket routing and workload management.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            Create your first group
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Group Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Description
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Members
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Tickets
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {groups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserGroupIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{group.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {group.description || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {group.members.length}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {group._count.tickets}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(group)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                        title="Edit group"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(group)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                        title="Delete group"
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
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingGroup ? "Edit Group" : "New Group"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Technical Support"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the purpose of this group..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Members ({formData.memberIds.length} selected)
                </label>
                <div className="border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                  {agents.length === 0 ? (
                    <p className="text-sm text-gray-500 p-3">No agents available</p>
                  ) : (
                    agents.map((agent) => (
                      <label
                        key={agent.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.memberIds.includes(agent.id)}
                          onChange={() => toggleMember(agent.id)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {agent.name || "Unnamed"}
                          </div>
                          <div className="text-xs text-gray-500">{agent.email}</div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || !formData.name}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : editingGroup ? "Update Group" : "Create Group"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
