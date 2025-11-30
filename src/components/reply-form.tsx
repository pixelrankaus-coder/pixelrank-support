"use client";

import { useState, useTransition } from "react";
import { addMessage } from "@/lib/actions";
import { cn } from "@/lib/utils";

interface ReplyFormProps {
  ticketId: string;
  userId: string;
}

export function ReplyForm({ ticketId, userId }: ReplyFormProps) {
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    startTransition(async () => {
      await addMessage({
        ticketId,
        body: body.trim(),
        internal: isInternal,
        authorType: "AGENT",
        authorId: userId,
      });
      setBody("");
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setIsInternal(false)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            !isInternal
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          Reply
        </button>
        <button
          type="button"
          onClick={() => setIsInternal(true)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-colors",
            isInternal
              ? "bg-yellow-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          Internal Note
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            isInternal
              ? "Add an internal note (not visible to customer)..."
              : "Write a reply..."
          }
          rows={4}
          className={cn(
            "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2",
            isInternal
              ? "border-yellow-300 focus:ring-yellow-500 bg-yellow-50"
              : "border-gray-300 focus:ring-blue-500"
          )}
        />
        <div className="flex justify-end mt-3">
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className={cn(
              "px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
              isInternal
                ? "bg-yellow-500 hover:bg-yellow-600"
                : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {isPending ? "Sending..." : isInternal ? "Add Note" : "Send Reply"}
          </button>
        </div>
      </form>
    </div>
  );
}
