"use client";

import { useState } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  FolderIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isPublished: boolean;
  parentId: string | null;
  parent: { id: string; name: string } | null;
  _count: { articles: number };
}

export function CategoriesClient({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    parentId: "",
    isPublished: true,
  });
  const [error, setError] = useState("");

  const fetchCategories = async () => {
    const res = await fetch("/api/admin/knowledge-base/categories");
    if (res.ok) {
      const data = await res.json();
      setCategories(data);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      icon: "",
      parentId: "",
      isPublished: true,
    });
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      icon: category.icon || "",
      parentId: category.parentId || "",
      isPublished: category.isPublished,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const url = editingCategory
        ? `/api/admin/knowledge-base/categories/${editingCategory.id}`
        : "/api/admin/knowledge-base/categories";

      const res = await fetch(url, {
        method: editingCategory ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save category");
      }

      await fetchCategories();
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const handleDelete = async (category: Category) => {
    if (
      !confirm(
        `Are you sure you want to delete "${category.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/knowledge-base/categories/${category.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete category");
      }

      await fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const togglePublish = async (category: Category) => {
    try {
      await fetch(`/api/admin/knowledge-base/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !category.isPublished }),
      });
      await fetchCategories();
    } catch (err) {
      console.error("Failed to toggle publish:", err);
    }
  };

  // Get root categories (no parent)
  const rootCategories = categories.filter((c) => !c.parentId);
  const getChildren = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId);

  const renderCategory = (category: Category, level = 0) => (
    <div key={category.id}>
      <div
        className={`flex items-center justify-between p-4 bg-white border-b hover:bg-gray-50 ${
          level > 0 ? "pl-" + (4 + level * 4) : ""
        }`}
        style={{ paddingLeft: level > 0 ? `${1 + level * 1.5}rem` : undefined }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
            {category.icon || <FolderIcon className="w-5 h-5 text-blue-600" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{category.name}</span>
              {!category.isPublished && (
                <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                  Draft
                </span>
              )}
            </div>
            {category.description && (
              <p className="text-sm text-gray-500 mt-0.5">
                {category.description}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              {category._count.articles} article
              {category._count.articles !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => togglePublish(category)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            title={category.isPublished ? "Unpublish" : "Publish"}
          >
            {category.isPublished ? (
              <EyeIcon className="w-4 h-4" />
            ) : (
              <EyeSlashIcon className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => openEditModal(category)}
            className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(category)}
            className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      {getChildren(category.id).map((child) => renderCategory(child, level + 1))}
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-gray-600">
            Organize your help articles into categories
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No categories yet
          </h3>
          <p className="text-gray-500 mb-4">
            Create your first category to start organizing articles
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="w-4 h-4" />
            Add Category
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          {rootCategories.map((category) => renderCategory(category))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editingCategory ? "Edit Category" : "New Category"}
              </h2>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="p-4 space-y-4">
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
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon (emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g. 📚"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Category
                  </label>
                  <select
                    value={formData.parentId}
                    onChange={(e) =>
                      setFormData({ ...formData, parentId: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">None (Top Level)</option>
                    {categories
                      .filter((c) => c.id !== editingCategory?.id && !c.parentId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublished"
                    checked={formData.isPublished}
                    onChange={(e) =>
                      setFormData({ ...formData, isPublished: e.target.checked })
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isPublished" className="text-sm text-gray-700">
                    Published (visible to customers)
                  </label>
                </div>
              </div>

              <div className="p-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCategory ? "Save Changes" : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
