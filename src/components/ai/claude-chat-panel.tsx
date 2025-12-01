"use client";

import { useState, useRef, useEffect } from "react";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { ClaudeAvatar } from "./ai-badge";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actionType?: string | null;
  actionSuccess?: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

interface ClaudeChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClaudeChatPanel({ isOpen, onClose }: ClaudeChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Load conversation history on mount
  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/claude-chat");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/claude-chat?conversationId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setConversationId(id);
        setMessages(
          data.conversation.messages.map((m: Message) => ({
            ...m,
            role: m.role.toLowerCase() as "user" | "assistant",
          }))
        );
        setShowHistory(false);
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setShowHistory(false);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/claude-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      const assistantMessage: Message = {
        id: data.message.id,
        role: "assistant",
        content: data.message.content,
        actionType: data.message.actionType,
        actionSuccess: data.message.actionSuccess,
        createdAt: data.message.createdAt,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh conversations list
      loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    }
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 w-[420px] h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <div className="flex items-center gap-3">
          <ClaudeAvatar size="md" />
          <div>
            <h2 className="font-semibold text-lg">Chat with Claude</h2>
            <p className="text-xs text-white/80">AI Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="Conversation history"
          >
            <ClockIcon className="w-5 h-5" />
          </button>
          <button
            onClick={startNewConversation}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            title="New conversation"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* History Sidebar */}
      {showHistory && (
        <div className="absolute top-14 left-0 right-0 bottom-0 bg-white z-10 flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-medium text-gray-900">Conversation History</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No conversations yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                      conversationId === conv.id ? "bg-orange-50" : ""
                    }`}
                  >
                    <div className="font-medium text-gray-900 truncate">
                      {conv.title || "New conversation"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(conv.updatedAt)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-t">
            <button
              onClick={() => setShowHistory(false)}
              className="w-full py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Back to chat
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <ClaudeAvatar size="lg" className="mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">
              How can I help you today?
            </h3>
            <p className="text-sm max-w-xs">
              Ask me to create tasks, tickets, or just chat about anything
              support-related.
            </p>
            <div className="mt-4 text-xs space-y-1">
              <p className="text-gray-400">Try saying:</p>
              <p className="bg-white px-3 py-1 rounded-full border border-gray-200">
                &quot;Create a task to review the API docs, due tomorrow&quot;
              </p>
              <p className="bg-white px-3 py-1 rounded-full border border-gray-200">
                &quot;Create a ticket for John about billing issues&quot;
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && <ClaudeAvatar size="sm" />}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white border border-gray-200 rounded-bl-md shadow-sm"
                }`}
              >
                {/* Action indicator */}
                {msg.actionType && (
                  <div
                    className={`flex items-center gap-1.5 text-xs mb-2 ${
                      msg.actionSuccess
                        ? "text-green-600"
                        : "text-amber-600"
                    }`}
                  >
                    {msg.actionSuccess ? (
                      <CheckCircleIcon className="w-4 h-4" />
                    ) : (
                      <ExclamationTriangleIcon className="w-4 h-4" />
                    )}
                    <span>
                      {msg.actionType === "CREATE_TASK"
                        ? "Task Created"
                        : msg.actionType === "CREATE_TICKET"
                        ? "Ticket Created"
                        : msg.actionType}
                    </span>
                  </div>
                )}
                <p
                  className={`text-sm whitespace-pre-wrap ${
                    msg.role === "user" ? "text-white" : "text-gray-700"
                  }`}
                >
                  {msg.content}
                </p>
                <div
                  className={`text-[10px] mt-1 ${
                    msg.role === "user"
                      ? "text-white/70"
                      : "text-gray-400"
                  }`}
                >
                  {formatTime(msg.createdAt)}
                </div>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                  You
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <ClaudeAvatar size="sm" />
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span className="text-sm">Claude is thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent max-h-32"
            rows={1}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-orange-600 hover:to-amber-600 transition-all"
          >
            {isLoading ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-2 text-center">
          Claude can create tasks, tickets, and help with support queries
        </p>
      </div>
    </div>
  );
}

/**
 * Floating button to open the Claude Chat
 */
export function ClaudeChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center z-40"
      title="Chat with Claude"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-7 h-7"
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
    </button>
  );
}
