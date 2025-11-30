"use client";

import { useState, useEffect } from "react";
import {
  SparklesIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface AIAssistData {
  summary: string;
  reply: string;
  generatedAt: string | null;
  model: string | null;
  cached?: boolean;
}

interface AIAssistPanelProps {
  ticketId: string;
  hasExistingAI: boolean;
  initialData?: AIAssistData | null;
  onInsertReply: (content: string) => void;
}

export function AIAssistPanel({
  ticketId,
  hasExistingAI,
  initialData,
  onInsertReply,
}: AIAssistPanelProps) {
  // Auto-open panel if we have cached AI data from server
  const [isOpen, setIsOpen] = useState(!!initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<AIAssistData | null>(initialData || null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [copiedReply, setCopiedReply] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Track client-side mount to avoid hydration mismatch with dates
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update state when initialData changes (e.g., on navigation)
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setIsOpen(true);
    }
  }, [initialData]);

  const fetchAIAssist = async (regenerate = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = `/api/tickets/${ticketId}/ai-assist${regenerate ? "?regenerate=1" : ""}`;
      const res = await fetch(url, { method: "POST" });
      const result = await res.json();

      if (!res.ok) {
        if (result.configError) {
          setError("AI is not configured. Please add ANTHROPIC_API_KEY to your environment variables.");
        } else {
          setError(result.error || "Failed to generate AI assist");
        }
        return;
      }

      setData(result);
      setIsOpen(true);
    } catch (err) {
      setError("Failed to connect to AI service");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, type: "summary" | "reply") => {
    await navigator.clipboard.writeText(text);
    if (type === "summary") {
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } else {
      setCopiedReply(true);
      setTimeout(() => setCopiedReply(false), 2000);
    }
  };

  const handleInsertReply = () => {
    if (data?.reply) {
      // Convert plain text to HTML paragraphs
      const htmlContent = data.reply
        .split("\n\n")
        .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
        .join("");
      onInsertReply(htmlContent);
    }
  };

  // If panel is closed, just show the button
  if (!isOpen) {
    return (
      <button
        onClick={() => fetchAIAssist(false)}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
          "bg-gradient-to-r from-purple-500 to-indigo-600 text-white",
          "hover:from-purple-600 hover:to-indigo-700",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "shadow-sm hover:shadow-md"
        )}
      >
        {isLoading ? (
          <>
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <SparklesIcon className="w-4 h-4" />
            {hasExistingAI ? "Show AI Assist" : "AI Assist"}
          </>
        )}
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-200">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-purple-600" />
          <h3 className="font-medium text-purple-900">AI Assist</h3>
          {data?.cached && (
            <span className="text-xs text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">
              Cached
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAIAssist(true)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-700 hover:bg-purple-100 rounded-md transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={cn("w-4 h-4", isLoading && "animate-spin")} />
            Regenerate
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 text-purple-500 hover:text-purple-700 hover:bg-purple-100 rounded-md transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !data && (
        <div className="p-8 text-center">
          <ArrowPathIcon className="w-8 h-8 text-purple-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-purple-600">Analyzing ticket and generating insights...</p>
        </div>
      )}

      {/* Content */}
      {data && !isLoading && (
        <div className="p-4 space-y-4">
          {/* Summary Section */}
          <div className="bg-white rounded-lg border border-purple-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Summary</h4>
              <button
                onClick={() => handleCopy(data.summary, "summary")}
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800"
              >
                <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                {copiedSummary ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.summary}</p>
          </div>

          {/* Suggested Reply Section */}
          <div className="bg-white rounded-lg border border-purple-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Suggested Reply</h4>
              <button
                onClick={() => handleCopy(data.reply, "reply")}
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800"
              >
                <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                {copiedReply ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap mb-3">{data.reply}</p>
            <button
              onClick={handleInsertReply}
              className="w-full py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
            >
              Insert into Reply
            </button>
          </div>

          {/* Metadata - only render date on client to avoid hydration mismatch */}
          {data.generatedAt && isMounted && (
            <p className="text-xs text-purple-400 text-center">
              Generated {new Date(data.generatedAt).toLocaleString()} using {data.model}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
