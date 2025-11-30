"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FolderIcon,
  PlusIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  visibility: string;
  createdAt: Date;
}

interface Folder {
  id: string;
  name: string;
  type: string;
  responses: CannedResponse[];
  _count: { responses: number };
}

interface CannedResponsesClientProps {
  initialFolders: Folder[];
}

export function CannedResponsesClient({ initialFolders }: CannedResponsesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [folders, setFolders] = useState(initialFolders);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    initialFolders[0]?.id || null
  );
  const [showNewResponseModal, setShowNewResponseModal] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [editingResponse, setEditingResponse] = useState<CannedResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  const handleCreateFolder = async (name: string) => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/canned-responses/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create folder");
        }

        setShowNewFolderModal(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create folder");
      }
    });
  };

  const handleCreateResponse = async (data: {
    title: string;
    content: string;
    visibility: string;
  }) => {
    if (!selectedFolderId) return;
    setError(null);

    startTransition(async () => {
      try {
        const url = editingResponse
          ? `/api/admin/canned-responses/${editingResponse.id}`
          : "/api/admin/canned-responses";
        const method = editingResponse ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            folderId: selectedFolderId,
          }),
        });

        if (!res.ok) {
          const resData = await res.json();
          throw new Error(resData.error || "Failed to save response");
        }

        setShowNewResponseModal(false);
        setEditingResponse(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save response");
      }
    });
  };

  const handleDeleteResponse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this canned response?")) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/canned-responses/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error("Failed to delete response");
        }

        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete response");
      }
    });
  };

  return (
    <div className="flex h-full">
      {/* Left sidebar - Folders */}
      <div className="w-80 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            FOLDERS
          </h2>
        </div>
        <div className="p-2">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                selectedFolderId === folder.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FolderIcon className="w-5 h-5 text-gray-400" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{folder.name}</div>
                <div className="text-xs text-gray-500">
                  {folder._count.responses} canned response{folder._count.responses !== 1 ? "s" : ""}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              disabled
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 border border-gray-200 rounded-md"
            >
              <ArrowUpTrayIcon className="w-4 h-4" />
              Export
            </button>
            <button
              disabled
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 border border-gray-200 rounded-md"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={() => setShowNewFolderModal(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <PlusIcon className="w-4 h-4" />
              New Folder
            </button>
          </div>
          <button
            onClick={() => {
              setEditingResponse(null);
              setShowNewResponseModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            New Canned Response
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {selectedFolder && selectedFolder.responses.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Visibility
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedFolder.responses.map((response) => (
                    <tr key={response.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{response.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-md">
                          {response.content.substring(0, 100)}
                          {response.content.length > 100 ? "..." : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {response.visibility === "ALL"
                            ? "All agents"
                            : response.visibility === "MYSELF"
                            ? "Myself"
                            : "Group"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingResponse(response);
                              setShowNewResponseModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteResponse(response.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
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
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-48 h-48 mb-6">
                <svg viewBox="0 0 200 200" className="w-full h-full text-gray-200">
                  <rect x="40" y="60" width="120" height="100" rx="8" fill="currentColor" />
                  <rect x="50" y="80" width="60" height="8" rx="2" fill="#E5E7EB" />
                  <rect x="50" y="96" width="80" height="6" rx="2" fill="#E5E7EB" />
                  <rect x="50" y="110" width="70" height="6" rx="2" fill="#E5E7EB" />
                  <circle cx="140" cy="50" r="25" fill="#E5E7EB" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                You haven&apos;t created any canned responses.
              </h3>
              <p className="text-gray-500 mb-6 text-center max-w-md">
                Pre-create replies to quickly insert them in responses to customers
              </p>
              <button
                onClick={() => {
                  setEditingResponse(null);
                  setShowNewResponseModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                New Canned Response
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Response Modal */}
      {showNewResponseModal && (
        <ResponseModal
          response={editingResponse}
          onSave={handleCreateResponse}
          onClose={() => {
            setShowNewResponseModal(false);
            setEditingResponse(null);
          }}
          isPending={isPending}
          error={error}
        />
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <FolderModal
          onSave={handleCreateFolder}
          onClose={() => setShowNewFolderModal(false)}
          isPending={isPending}
          error={error}
        />
      )}
    </div>
  );
}

function ResponseModal({
  response,
  onSave,
  onClose,
  isPending,
  error,
}: {
  response: CannedResponse | null;
  onSave: (data: { title: string; content: string; visibility: string }) => void;
  onClose: () => void;
  isPending: boolean;
  error: string | null;
}) {
  const [title, setTitle] = useState(response?.title || "");
  const [content, setContent] = useState(response?.content || "");
  const [visibility, setVisibility] = useState(response?.visibility || "ALL");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave({ title: title.trim(), content: content.trim(), visibility });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {response ? "Edit canned response" : "New Canned Response"}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Response title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a title for this response"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the response content"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available for
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="MYSELF"
                    checked={visibility === "MYSELF"}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Myself</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="ALL"
                    checked={visibility === "ALL"}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">All agents</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="GROUP"
                    checked={visibility === "GROUP"}
                    onChange={(e) => setVisibility(e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Agents in group</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Preview
                </button>
                <button
                  type="submit"
                  disabled={isPending || !title.trim() || !content.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : response ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function FolderModal({
  onSave,
  onClose,
  isPending,
  error,
}: {
  onSave: (name: string) => void;
  onClose: () => void;
  isPending: boolean;
  error: string | null;
}) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Folder</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Folder name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter folder name"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || !name.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
