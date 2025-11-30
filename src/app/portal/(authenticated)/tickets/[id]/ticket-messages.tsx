"use client";

import { useState, useEffect, useRef } from "react";
import { UserCircleIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";

interface Message {
  id: string;
  body: string;
  authorType: string;
  authorName: string | null;
  createdAt: string;
}

export function TicketMessages({
  ticketId,
  initialMessages,
  customerName,
  isClosed,
}: {
  ticketId: string;
  initialMessages: Message[];
  customerName: string;
  isClosed: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll for new messages every 10 seconds
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/portal/tickets/${ticketId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      }
    };

    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [ticketId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setError("");
    setIsSending(true);

    try {
      const res = await fetch(`/api/portal/tickets/${ticketId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newMessage }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send message");
      }

      const message = await res.json();
      setMessages((prev) => [...prev, message]);
      setNewMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else {
      return date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-gray-900">Conversation</h2>
      </div>

      {/* Messages List */}
      <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation below.
          </p>
        ) : (
          messages.map((message) => {
            const isCustomer = message.authorType === "CONTACT";
            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isCustomer ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isCustomer ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <UserCircleIcon
                    className={`w-5 h-5 ${
                      isCustomer ? "text-blue-600" : "text-gray-600"
                    }`}
                  />
                </div>
                <div
                  className={`flex-1 max-w-[80%] ${
                    isCustomer ? "text-right" : ""
                  }`}
                >
                  <div
                    className={`inline-block rounded-lg p-3 ${
                      isCustomer
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{message.body}</p>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    {!isCustomer && (
                      <span className="font-medium">
                        {message.authorName || "Support Agent"}
                      </span>
                    )}
                    <span>{formatDate(message.createdAt)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Form */}
      <div className="p-4 border-t bg-gray-50">
        {isClosed ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">
              This ticket is closed. Sending a reply will reopen it.
            </p>
          </div>
        ) : null}

        {error && (
          <div className="mb-3 p-2 bg-red-50 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your reply..."
            rows={2}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
          <button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 self-end"
          >
            {isSending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </span>
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
