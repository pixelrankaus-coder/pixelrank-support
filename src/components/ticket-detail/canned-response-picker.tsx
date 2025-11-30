"use client";

import { useState, useEffect, useRef } from "react";
import { MagnifyingGlassIcon, FolderIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface CannedResponse {
  id: string;
  title: string;
  content: string;
  folder: {
    id: string;
    name: string;
  };
}

interface Folder {
  id: string;
  name: string;
  responses: CannedResponse[];
}

interface CannedResponsePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (content: string) => void;
}

export function CannedResponsePicker({
  isOpen,
  onClose,
  onSelect,
}: CannedResponsePickerProps) {
  const [search, setSearch] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchResponses();
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const fetchResponses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/canned-responses");
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders);
        setResponses(data.responses);
      }
    } catch (error) {
      console.error("Failed to fetch canned responses:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResponses = responses.filter((r) => {
    const matchesSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.content.toLowerCase().includes(search.toLowerCase());
    const matchesFolder = !selectedFolder || r.folder.id === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const handleSelect = (response: CannedResponse) => {
    onSelect(response.content);
    onClose();
    setSearch("");
    setSelectedFolder(null);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-0 mb-2 w-96 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">Canned Responses</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-gray-200">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search responses..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex max-h-72">
        {/* Folders sidebar */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <button
            onClick={() => setSelectedFolder(null)}
            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 ${
              !selectedFolder ? "bg-blue-50 text-blue-600" : "text-gray-700"
            }`}
          >
            <FolderIcon className="w-4 h-4" />
            All
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolder(folder.id)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 ${
                selectedFolder === folder.id ? "bg-blue-50 text-blue-600" : "text-gray-700"
              }`}
            >
              <FolderIcon className="w-4 h-4" />
              {folder.name}
              <span className="ml-auto text-xs text-gray-400">
                {folder.responses.length}
              </span>
            </button>
          ))}
        </div>

        {/* Responses list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              Loading...
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              {search ? "No responses found" : "No canned responses available"}
            </div>
          ) : (
            filteredResponses.map((response) => (
              <button
                key={response.id}
                onClick={() => handleSelect(response)}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="text-sm font-medium text-gray-900">
                  {response.title}
                </div>
                <div className="text-xs text-gray-500 truncate mt-0.5">
                  {response.content.replace(/<[^>]*>/g, "").substring(0, 60)}...
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
        Press / to search • Click to insert
      </div>
    </div>
  );
}
