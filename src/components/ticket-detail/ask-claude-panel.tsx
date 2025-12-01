"use client";

import { useState } from "react";
import {
  ArrowPathIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

// Claude AI Avatar component - Anthropic-style with sparkle/starburst
function ClaudeAvatar({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <div className={`${className} rounded-full bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-sm`}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-4 h-4"
        xmlns="http://www.w3.org/2000/svg"
      >
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

interface AskClaudePanelProps {
  ticketId: string;
  onMessageSent?: () => void;
}

type ActionType = "reply" | "internal_note" | "task";

interface AIResponse {
  content: string;
  reasoning: string;
  confidence: number;
}

export function AskClaudePanel({ ticketId, onMessageSent }: AskClaudePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionType>("reply");

  const generateResponse = async () => {
    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      // Use the existing AI assist endpoint to get Claude's suggested response
      const res = await fetch(`/api/tickets/${ticketId}/ai-assist?regenerate=1`, {
        method: "POST",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to generate AI response");
      }

      setResponse({
        content: result.reply,
        reasoning: `Based on the ticket summary: ${result.summary}`,
        confidence: 0.85, // Default confidence
      });
      setIsOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate response");
    } finally {
      setIsGenerating(false);
    }
  };

  const sendAsClaudeReply = async () => {
    if (!response) return;

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = "/api/ai-agent/ticket-replies";
      const payload = {
        ticketId,
        body: response.content,
        internal: selectedAction === "internal_note",
        aiReasoning: response.reasoning,
        aiConfidence: response.confidence,
        aiModel: "claude-3-5-haiku",
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to send message");
      }

      setSuccess(
        result.approvalStatus === "AUTO_APPROVED"
          ? `${selectedAction === "internal_note" ? "Internal note" : "Reply"} sent successfully!`
          : `${selectedAction === "internal_note" ? "Internal note" : "Reply"} created and pending approval`
      );

      // Refresh the page after a short delay
      setTimeout(() => {
        onMessageSent?.();
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const createAsTask = async () => {
    if (!response) return;

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/ai-agent/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Follow up on ticket: ${response.content.slice(0, 50)}...`,
          description: response.content,
          priority: "MEDIUM",
          ticketId,
          aiReasoning: response.reasoning,
          aiConfidence: response.confidence,
          aiModel: "claude-3-5-haiku",
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to create task");
      }

      setSuccess(
        result.approvalStatus === "AUTO_APPROVED"
          ? "Task created successfully!"
          : "Task created and pending approval"
      );

      setTimeout(() => {
        setIsOpen(false);
        setResponse(null);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = async () => {
    if (!response) return;
    await navigator.clipboard.writeText(response.content);
    setSuccess("Copied to clipboard!");
    setTimeout(() => setSuccess(null), 2000);
  };

  // Button to open the panel
  if (!isOpen && !response) {
    return (
      <button
        onClick={generateResponse}
        disabled={isGenerating}
        className={cn(
          "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all",
          "bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 text-white",
          "hover:from-orange-500 hover:via-amber-600 hover:to-orange-700",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "shadow-sm hover:shadow-md"
        )}
      >
        {isGenerating ? (
          <>
            <ArrowPathIcon className="w-4 h-4 animate-spin" />
            Claude is thinking...
          </>
        ) : (
          <>
            <ClaudeAvatar className="w-5 h-5" />
            Ask Claude
          </>
        )}
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-orange-200">
        <div className="flex items-center gap-2">
          <ClaudeAvatar />
          <h3 className="font-medium text-orange-900">Claude AI Response</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={generateResponse}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-orange-700 hover:bg-orange-100 rounded-md transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={cn("w-4 h-4", isGenerating && "animate-spin")} />
            Regenerate
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              setResponse(null);
              setError(null);
              setSuccess(null);
            }}
            className="p-1.5 text-orange-500 hover:text-orange-700 hover:bg-orange-100 rounded-md transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="m-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {success && (
        <div className="m-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
          <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-700">{success}</div>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && !response && (
        <div className="p-8 text-center">
          <ArrowPathIcon className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-orange-600">Claude is analyzing the ticket...</p>
        </div>
      )}

      {/* Response Content */}
      {response && !isGenerating && (
        <div className="p-4 space-y-4">
          {/* Generated Response */}
          <div className="bg-white rounded-lg border border-orange-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">Suggested Response</h4>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800"
              >
                <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{response.content}</p>
          </div>

          {/* Action Selection */}
          <div className="bg-white rounded-lg border border-orange-100 p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Send as Claude</h4>

            {/* Action Type Selector */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSelectedAction("reply")}
                className={cn(
                  "flex-1 px-3 py-2 text-sm rounded-md border transition-colors",
                  selectedAction === "reply"
                    ? "bg-orange-100 border-orange-300 text-orange-800"
                    : "bg-white border-gray-200 text-gray-600 hover:border-orange-200"
                )}
              >
                Public Reply
              </button>
              <button
                onClick={() => setSelectedAction("internal_note")}
                className={cn(
                  "flex-1 px-3 py-2 text-sm rounded-md border transition-colors",
                  selectedAction === "internal_note"
                    ? "bg-orange-100 border-orange-300 text-orange-800"
                    : "bg-white border-gray-200 text-gray-600 hover:border-orange-200"
                )}
              >
                Internal Note
              </button>
              <button
                onClick={() => setSelectedAction("task")}
                className={cn(
                  "flex-1 px-3 py-2 text-sm rounded-md border transition-colors",
                  selectedAction === "task"
                    ? "bg-orange-100 border-orange-300 text-orange-800"
                    : "bg-white border-gray-200 text-gray-600 hover:border-orange-200"
                )}
              >
                Create Task
              </button>
            </div>

            {/* Send Button */}
            <button
              onClick={selectedAction === "task" ? createAsTask : sendAsClaudeReply}
              disabled={isSending}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white rounded-md transition-colors",
                "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isSending ? (
                <>
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  {selectedAction === "task" ? "Creating..." : "Sending..."}
                </>
              ) : selectedAction === "task" ? (
                <>
                  <DocumentTextIcon className="w-4 h-4" />
                  Create Task as Claude
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-4 h-4" />
                  Send {selectedAction === "internal_note" ? "Note" : "Reply"} as Claude
                </>
              )}
            </button>

            {/* Confidence Indicator */}
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-orange-500">
              <span>Confidence: {Math.round(response.confidence * 100)}%</span>
              {response.confidence >= 0.85 && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">
                  High
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
