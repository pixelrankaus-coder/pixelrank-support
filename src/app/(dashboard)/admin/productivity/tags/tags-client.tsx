"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  XMarkIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

interface Tag {
  id: string;
  name: string;
  color: string | null;
  _count: {
    tickets: number;
  };
}

interface TagsClientProps {
  tags: Tag[];
}

const colorOptions = [
  { name: "Gray", value: "#6B7280" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Green", value: "#22C55E" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
];

export function TagsClient({ tags }: TagsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#3B82F6",
  });

  const resetForm = () => {
    setFormData({ name: "", color: "#3B82F6" });
    setEditingTag(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color || "#3B82F6",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const url = editingTag
          ? `/api/admin/tags/${editingTag.id}`
          : "/api/admin/tags";
        const method = editingTag ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to save tag");
        }

        setShowModal(false);
        resetForm();
        router.refresh();
      } catch (error) {
        console.error("Error saving tag:", error);
        alert(error instanceof Error ? error.message : "Failed to save tag");
      }
    });
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`Are you sure you want to delete "${tag.name}"? This will remove the tag from all tickets.`)) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/tags/${tag.id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error("Failed to delete tag");
        }

        router.refresh();
      } catch (error) {
        console.error("Error deleting tag:", error);
        alert("Failed to delete tag");
      }
    });
  };

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/productivity"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <div className="text-sm text-gray-500">
              Admin &gt; Agent Productivity &gt; Tags
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Tags</h1>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Manage Tags</h2>
              <p className="text-sm text-gray-500">
                Create and manage tags to label your tickets for better organization
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4" />
              New Tag
            </button>
          </div>

          {tags.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TagIcon className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">No tags yet</h4>
              <p className="text-gray-500 max-w-md mx-auto mb-4">
                Create tags to categorize and organize your tickets for better filtering and reporting.
              </p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4" />
                Create your first tag
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color || "#6B7280" }}
                    />
                    <span className="font-medium text-gray-900">{tag.name}</span>
                    <span className="text-sm text-gray-500">
                      {tag._count.tickets} ticket{tag._count.tickets !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(tag)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                      title="Edit tag"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(tag)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                      title="Delete tag"
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
          <div className="bg-white rounded-lg w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTag ? "Edit Tag" : "New Tag"}
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
                  Tag Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., bug, feature-request, billing"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color.value
                          ? "border-gray-900 scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm text-gray-600">Preview:</span>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: formData.color }}
                >
                  {formData.name || "tag-name"}
                </span>
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
                  {isPending ? "Saving..." : editingTag ? "Update Tag" : "Create Tag"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
