"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BoltIcon,
  XMarkIcon,
  ArrowLeftIcon,
  PlayIcon,
  PauseIcon,
} from "@heroicons/react/24/outline";

interface Automation {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  trigger: string;
  conditions: string;
  actions: string;
  priority: number;
}

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

interface Group {
  id: string;
  name: string;
}

interface AutomationsClientProps {
  automations: Automation[];
  agents: Agent[];
  groups: Group[];
}

const triggerOptions = [
  { value: "TICKET_CREATED", label: "When a ticket is created" },
  { value: "TICKET_UPDATED", label: "When a ticket is updated" },
  { value: "TIME_BASED", label: "Time-based (scheduled)" },
];

const conditionFields = [
  { value: "status", label: "Status", type: "select", options: ["OPEN", "PENDING", "RESOLVED", "CLOSED"] },
  { value: "priority", label: "Priority", type: "select", options: ["LOW", "MEDIUM", "HIGH", "URGENT"] },
  { value: "assigneeId", label: "Assignee", type: "agent" },
  { value: "groupId", label: "Group", type: "group" },
  { value: "subject", label: "Subject", type: "text" },
];

const actionTypes = [
  { value: "SET_STATUS", label: "Set status" },
  { value: "SET_PRIORITY", label: "Set priority" },
  { value: "ASSIGN_AGENT", label: "Assign to agent" },
  { value: "ASSIGN_GROUP", label: "Assign to group" },
  { value: "ADD_TAG", label: "Add tag" },
  { value: "SEND_EMAIL", label: "Send email notification" },
];

export function AutomationsClient({ automations, agents, groups }: AutomationsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger: "TICKET_CREATED",
    conditions: [] as { field: string; operator: string; value: string }[],
    actions: [] as { type: string; value: string }[],
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      trigger: "TICKET_CREATED",
      conditions: [],
      actions: [],
    });
    setEditingAutomation(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (automation: Automation) => {
    setEditingAutomation(automation);
    setFormData({
      name: automation.name,
      description: automation.description || "",
      trigger: automation.trigger,
      conditions: JSON.parse(automation.conditions || "[]"),
      actions: JSON.parse(automation.actions || "[]"),
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const url = editingAutomation
          ? `/api/admin/automations/${editingAutomation.id}`
          : "/api/admin/automations";
        const method = editingAutomation ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            trigger: formData.trigger,
            conditions: JSON.stringify(formData.conditions),
            actions: JSON.stringify(formData.actions),
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to save automation");
        }

        setShowModal(false);
        resetForm();
        router.refresh();
      } catch (error) {
        console.error("Error saving automation:", error);
        alert(error instanceof Error ? error.message : "Failed to save automation");
      }
    });
  };

  const handleToggleActive = async (automation: Automation) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/automations/${automation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !automation.isActive }),
        });

        if (!res.ok) {
          throw new Error("Failed to toggle automation");
        }

        router.refresh();
      } catch (error) {
        console.error("Error toggling automation:", error);
        alert("Failed to toggle automation");
      }
    });
  };

  const handleDelete = async (automation: Automation) => {
    if (!confirm(`Are you sure you want to delete "${automation.name}"?`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/automations/${automation.id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error("Failed to delete automation");
        }

        router.refresh();
      } catch (error) {
        console.error("Error deleting automation:", error);
        alert("Failed to delete automation");
      }
    });
  };

  const addCondition = () => {
    setFormData((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { field: "status", operator: "equals", value: "" }],
    }));
  };

  const removeCondition = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  };

  const updateCondition = (index: number, key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c, i) => (i === index ? { ...c, [key]: value } : c)),
    }));
  };

  const addAction = () => {
    setFormData((prev) => ({
      ...prev,
      actions: [...prev.actions, { type: "SET_STATUS", value: "" }],
    }));
  };

  const removeAction = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const updateAction = (index: number, key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.map((a, i) => (i === index ? { ...a, [key]: value } : a)),
    }));
  };

  const getTriggerLabel = (trigger: string) => {
    return triggerOptions.find((t) => t.value === trigger)?.label || trigger;
  };

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/workflows"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <div className="text-sm text-gray-500">
              Admin &gt; Workflows &gt; Automations
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Automations</h1>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Automation Rules</h2>
              <p className="text-sm text-gray-500">
                Create rules to automatically categorize, assign, and update tickets
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4" />
              New Automation
            </button>
          </div>

          {automations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BoltIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No automations yet</h4>
              <p className="text-gray-500 max-w-md mx-auto mb-4">
                Create automation rules to streamline your ticket workflow and save time on repetitive tasks.
              </p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4" />
                Create your first automation
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {automations.map((automation) => (
                <div
                  key={automation.id}
                  className="px-4 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${automation.isActive ? "bg-green-100" : "bg-gray-100"}`}>
                      <BoltIcon className={`w-5 h-5 ${automation.isActive ? "text-green-600" : "text-gray-400"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{automation.name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          automation.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {automation.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {automation.description || getTriggerLabel(automation.trigger)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {JSON.parse(automation.conditions || "[]").length} condition(s) • {JSON.parse(automation.actions || "[]").length} action(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(automation)}
                      className={`p-1.5 rounded ${
                        automation.isActive
                          ? "text-green-600 hover:bg-green-50"
                          : "text-gray-400 hover:bg-gray-100"
                      }`}
                      title={automation.isActive ? "Pause automation" : "Activate automation"}
                    >
                      {automation.isActive ? (
                        <PauseIcon className="w-4 h-4" />
                      ) : (
                        <PlayIcon className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditModal(automation)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                      title="Edit automation"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(automation)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                      title="Delete automation"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAutomation ? "Edit Automation" : "New Automation"}
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

            <form onSubmit={handleSubmit} className="p-4 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Automation Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Auto-assign urgent tickets"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe what this automation does..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger
                  </label>
                  <select
                    value={formData.trigger}
                    onChange={(e) => setFormData({ ...formData, trigger: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {triggerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Conditions</label>
                  <button
                    type="button"
                    onClick={addCondition}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add condition
                  </button>
                </div>
                {formData.conditions.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No conditions - automation will run on all matching triggers</p>
                ) : (
                  <div className="space-y-2">
                    {formData.conditions.map((condition, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                        <select
                          value={condition.field}
                          onChange={(e) => updateCondition(index, "field", e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          {conditionFields.map((field) => (
                            <option key={field.value} value={field.value}>
                              {field.label}
                            </option>
                          ))}
                        </select>
                        <select
                          value={condition.operator}
                          onChange={(e) => updateCondition(index, "operator", e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="equals">equals</option>
                          <option value="not_equals">not equals</option>
                          <option value="contains">contains</option>
                        </select>
                        <input
                          type="text"
                          value={condition.value}
                          onChange={(e) => updateCondition(index, "value", e.target.value)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Value..."
                        />
                        <button
                          type="button"
                          onClick={() => removeCondition(index)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Actions *</label>
                  <button
                    type="button"
                    onClick={addAction}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    + Add action
                  </button>
                </div>
                {formData.actions.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Add at least one action</p>
                ) : (
                  <div className="space-y-2">
                    {formData.actions.map((action, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                        <select
                          value={action.type}
                          onChange={(e) => updateAction(index, "type", e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          {actionTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        {action.type === "ASSIGN_AGENT" ? (
                          <select
                            value={action.value}
                            onChange={(e) => updateAction(index, "value", e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select agent...</option>
                            {agents.map((agent) => (
                              <option key={agent.id} value={agent.id}>
                                {agent.name || agent.email}
                              </option>
                            ))}
                          </select>
                        ) : action.type === "ASSIGN_GROUP" ? (
                          <select
                            value={action.value}
                            onChange={(e) => updateAction(index, "value", e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select group...</option>
                            {groups.map((group) => (
                              <option key={group.id} value={group.id}>
                                {group.name}
                              </option>
                            ))}
                          </select>
                        ) : action.type === "SET_STATUS" ? (
                          <select
                            value={action.value}
                            onChange={(e) => updateAction(index, "value", e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select status...</option>
                            <option value="OPEN">Open</option>
                            <option value="PENDING">Pending</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                        ) : action.type === "SET_PRIORITY" ? (
                          <select
                            value={action.value}
                            onChange={(e) => updateAction(index, "value", e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select priority...</option>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={action.value}
                            onChange={(e) => updateAction(index, "value", e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Value..."
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeAction(index)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  disabled={isPending || !formData.name || formData.actions.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : editingAutomation ? "Update Automation" : "Create Automation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
