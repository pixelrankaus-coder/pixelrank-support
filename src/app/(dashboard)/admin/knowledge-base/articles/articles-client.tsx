"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  DocumentTextIcon,
  EyeIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

// Dynamically import the rich text editor to avoid SSR issues
const RichTextEditor = dynamic(
  () => import("@/components/rich-text-editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => (
      <div className="border rounded-lg bg-white min-h-[400px] flex items-center justify-center text-gray-400">
        Loading editor...
      </div>
    ),
  }
);

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  status: string;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  category: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

interface Category {
  id: string;
  name: string;
}

export function ArticlesClient({
  initialArticles,
  categories,
}: {
  initialArticles: Article[];
  categories: Category[];
}) {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    categoryId: "",
    status: "DRAFT",
    metaTitle: "",
    metaDescription: "",
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchArticles = async () => {
    const params = new URLSearchParams();
    if (filterCategory) params.set("categoryId", filterCategory);
    if (filterStatus) params.set("status", filterStatus);

    const res = await fetch(
      `/api/admin/knowledge-base/articles?${params.toString()}`
    );
    if (res.ok) {
      const data = await res.json();
      setArticles(data);
    }
  };

  const openCreateModal = () => {
    setEditingArticle(null);
    setFormData({
      title: "",
      excerpt: "",
      content: "",
      categoryId: categories[0]?.id || "",
      status: "DRAFT",
      metaTitle: "",
      metaDescription: "",
    });
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = async (article: Article) => {
    try {
      // Fetch full article data
      const res = await fetch(`/api/admin/knowledge-base/articles/${article.id}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load article: ${res.status}`);
      }
      const fullArticle = await res.json();
      setEditingArticle(article);
      setFormData({
        title: fullArticle.title,
        excerpt: fullArticle.excerpt || "",
        content: fullArticle.content || "",
        categoryId: fullArticle.categoryId,
        status: fullArticle.status,
        metaTitle: fullArticle.metaTitle || "",
        metaDescription: fullArticle.metaDescription || "",
      });
      setError("");
      setIsModalOpen(true);
    } catch (err) {
      console.error("Failed to open edit modal:", err);
      alert(err instanceof Error ? err.message : "Failed to load article for editing");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const url = editingArticle
        ? `/api/admin/knowledge-base/articles/${editingArticle.id}`
        : "/api/admin/knowledge-base/articles";

      const res = await fetch(url, {
        method: editingArticle ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save article");
      }

      await fetchArticles();
      setIsModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (article: Article) => {
    if (
      !confirm(
        `Are you sure you want to delete "${article.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/knowledge-base/articles/${article.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete article");
      }

      await fetchArticles();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  // Image upload handler for the rich text editor
  const handleImageUpload = async (file: File): Promise<string> => {
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    const res = await fetch("/api/admin/knowledge-base/images", {
      method: "POST",
      body: uploadFormData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to upload image");
    }

    const data = await res.json();
    return data.url;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-800">
            Published
          </span>
        );
      case "DRAFT":
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-800">
            Draft
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800">
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  const filteredArticles = articles.filter((article) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        article.title.toLowerCase().includes(query) ||
        article.excerpt?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Category filter */}
          <select
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              fetchArticles();
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              fetchArticles();
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="w-4 h-4" />
          New Article
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Create a category first
          </h3>
          <p className="text-gray-500 mb-4">
            You need at least one category before creating articles
          </p>
          <button
            onClick={() => router.push("/admin/knowledge-base")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Categories
          </button>
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? "No articles found" : "No articles yet"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery
              ? "Try adjusting your search query"
              : "Create your first help article"}
          </p>
          {!searchQuery && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="w-4 h-4" />
              New Article
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Article
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feedback
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredArticles.map((article) => (
                <tr key={article.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {article.title}
                    </div>
                    {article.excerpt && (
                      <div className="text-sm text-gray-500 truncate max-w-md">
                        {article.excerpt}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {article.category.name}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(article.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {article.viewCount}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-green-600">
                      +{article.helpfulCount}
                    </span>
                    {" / "}
                    <span className="text-red-600">
                      -{article.notHelpfulCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {article.status === "PUBLISHED" && (
                        <a
                          href={`/help/articles/${article.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                          title="View live"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => openEditModal(article)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(article)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
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

      {/* Article Modal - Full Screen for better editing */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-100">
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingArticle ? "Edit Article" : "New Article"}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : editingArticle ? "Save Changes" : "Create Article"}
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-5xl mx-auto space-y-6">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {/* Title and Meta */}
                <div className="bg-white rounded-lg border p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                      placeholder="Article title..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category *
                      </label>
                      <select
                        value={formData.categoryId}
                        onChange={(e) =>
                          setFormData({ ...formData, categoryId: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
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
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Excerpt (shown in search results)
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) =>
                        setFormData({ ...formData, excerpt: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                      placeholder="Brief description of the article..."
                    />
                  </div>
                </div>

                {/* Content Editor */}
                <div className="bg-white rounded-lg border p-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Content
                  </label>
                  <RichTextEditor
                    content={formData.content}
                    onChange={(html) => setFormData({ ...formData, content: html })}
                    placeholder="Start writing your article..."
                    onImageUpload={handleImageUpload}
                  />
                </div>

                {/* SEO Settings */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">
                    SEO Settings (optional)
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Meta Title
                      </label>
                      <input
                        type="text"
                        value={formData.metaTitle}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metaTitle: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Custom page title for SEO"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Meta Description
                      </label>
                      <textarea
                        value={formData.metaDescription}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            metaDescription: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        placeholder="Description for search engines"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
