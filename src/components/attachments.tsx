"use client";

import { useState, useRef } from "react";
import {
  PaperClipIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { formatFileSize } from "@/lib/storage";

interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

interface AttachmentUploadProps {
  ticketId: string;
  onUploadComplete?: (attachment: Attachment) => void;
  isPortal?: boolean;
}

export function AttachmentUpload({
  ticketId,
  onUploadComplete,
  isPortal = false,
}: AttachmentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("ticketId", ticketId);

      const endpoint = isPortal ? "/api/portal/attachments" : "/api/attachments";
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const attachment = await response.json();
      onUploadComplete?.(attachment);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleUpload}
        disabled={uploading}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md cursor-pointer transition-colors ${
          uploading
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
        }`}
      >
        <PaperClipIcon className="h-4 w-4" />
        {uploading ? "Uploading..." : "Attach File"}
      </label>
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
}

interface AttachmentListProps {
  attachments: Attachment[];
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export function AttachmentList({
  attachments,
  onDelete,
  canDelete = false,
}: AttachmentListProps) {
  if (attachments.length === 0) return null;

  const getIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <PhotoIcon className="h-5 w-5 text-blue-500" />;
    }
    return <DocumentIcon className="h-5 w-5 text-gray-500" />;
  };

  const isImage = (mimeType: string) => mimeType.startsWith("image/");

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1">
        <PaperClipIcon className="h-4 w-4" />
        Attachments ({attachments.length})
      </h4>
      <div className="grid gap-2">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg border"
          >
            {isImage(attachment.mimeType) && !attachment.url.startsWith("data:") ? (
              <img
                src={attachment.url}
                alt={attachment.originalName}
                className="h-10 w-10 object-cover rounded"
              />
            ) : (
              <div className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded">
                {getIcon(attachment.mimeType)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {attachment.originalName}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(attachment.size)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <a
                href={attachment.url}
                download={attachment.originalName}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Download"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
              </a>
              {canDelete && onDelete && (
                <button
                  onClick={() => onDelete(attachment.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface AttachmentSectionProps {
  ticketId: string;
  initialAttachments?: Attachment[];
  isPortal?: boolean;
}

export function AttachmentSection({
  ticketId,
  initialAttachments = [],
  isPortal = false,
}: AttachmentSectionProps) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);

  const handleUploadComplete = (attachment: Attachment) => {
    setAttachments((prev) => [attachment, ...prev]);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/attachments?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete attachment:", error);
    }
  };

  return (
    <div className="space-y-4">
      <AttachmentUpload
        ticketId={ticketId}
        onUploadComplete={handleUploadComplete}
        isPortal={isPortal}
      />
      <AttachmentList
        attachments={attachments}
        onDelete={handleDelete}
        canDelete={!isPortal}
      />
    </div>
  );
}
