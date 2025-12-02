"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { EyeIcon } from "@heroicons/react/24/outline";
import { cn, getInitials } from "@/lib/utils";

interface Viewer {
  userId: string;
  userName: string | null;
  isTyping: boolean;
  lastSeen: string;
}

interface PresenceIndicatorProps {
  ticketId: string;
  currentUserId: string;
  onTypingChange?: (isTyping: boolean) => void;
  onOtherAgentTyping?: (viewers: Viewer[]) => void;
}

const POLL_INTERVAL = 5000; // 5 seconds
const HEARTBEAT_INTERVAL = 15000; // 15 seconds

export function PresenceIndicator({
  ticketId,
  currentUserId,
  onTypingChange,
  onOtherAgentTyping,
}: PresenceIndicatorProps) {
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const isTypingRef = useRef(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onOtherAgentTypingRef = useRef(onOtherAgentTyping);
  const onTypingChangeRef = useRef(onTypingChange);

  // Keep refs up to date
  useEffect(() => {
    onOtherAgentTypingRef.current = onOtherAgentTyping;
  }, [onOtherAgentTyping]);

  useEffect(() => {
    onTypingChangeRef.current = onTypingChange;
  }, [onTypingChange]);

  // Filter out current user and get other viewers
  const otherViewers = viewers.filter((v) => v.userId !== currentUserId);
  const typingViewers = otherViewers.filter((v) => v.isTyping);

  // Update presence on server
  const updatePresence = useCallback(
    async (typing: boolean = false) => {
      try {
        const response = await fetch(`/api/tickets/${ticketId}/presence`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isTyping: typing }),
        });

        if (response.ok) {
          const data = await response.json();
          setViewers(data.viewers || []);
        }
      } catch (error) {
        console.error("Failed to update presence:", error);
      }
    },
    [ticketId]
  );

  // Fetch current presence
  const fetchPresence = useCallback(async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/presence`);
      if (response.ok) {
        const data = await response.json();
        setViewers(data.viewers || []);
      }
    } catch (error) {
      console.error("Failed to fetch presence:", error);
    }
  }, [ticketId]);

  // Remove presence when leaving
  const removePresence = useCallback(async () => {
    try {
      await fetch(`/api/tickets/${ticketId}/presence`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Failed to remove presence:", error);
    }
  }, [ticketId]);

  // Handle typing status
  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      updatePresence(true);
      onTypingChangeRef.current?.(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator after 3 seconds of no typing
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      updatePresence(false);
      onTypingChangeRef.current?.(false);
    }, 3000);
  }, [updatePresence]);

  // Notify parent about other agents typing - use JSON stringification for stable comparison
  const typingViewersJson = JSON.stringify(typingViewers);
  useEffect(() => {
    const parsed = JSON.parse(typingViewersJson) as Viewer[];
    onOtherAgentTypingRef.current?.(parsed);
  }, [typingViewersJson]);

  // Initialize presence and set up polling
  useEffect(() => {
    // Initial presence update
    updatePresence(false);

    // Poll for presence updates
    const pollInterval = setInterval(fetchPresence, POLL_INTERVAL);

    // Heartbeat to keep presence alive
    const heartbeatInterval = setInterval(() => {
      updatePresence(isTypingRef.current);
    }, HEARTBEAT_INTERVAL);

    // Cleanup on unmount
    return () => {
      clearInterval(pollInterval);
      clearInterval(heartbeatInterval);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      removePresence();
    };
  }, [ticketId, fetchPresence, updatePresence, removePresence]);

  // Expose typing handler
  useEffect(() => {
    // Add typing event to window for external components to call
    (window as any).__ticketPresenceHandleTyping = handleTyping;
    return () => {
      delete (window as any).__ticketPresenceHandleTyping;
    };
  }, [handleTyping]);

  if (otherViewers.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Viewer avatars */}
      <div className="flex -space-x-2">
        {otherViewers.slice(0, 3).map((viewer) => (
          <div
            key={viewer.userId}
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white ring-2 ring-white",
              viewer.isTyping ? "bg-green-500" : "bg-blue-500"
            )}
            title={`${viewer.userName || "Agent"} ${
              viewer.isTyping ? "(typing...)" : "(viewing)"
            }`}
          >
            {getInitials(viewer.userName || "Agent")}
          </div>
        ))}
        {otherViewers.length > 3 && (
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-gray-400 text-white ring-2 ring-white">
            +{otherViewers.length - 3}
          </div>
        )}
      </div>

      {/* Status text */}
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        {typingViewers.length > 0 ? (
          <>
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
            <span className="text-green-600 font-medium">
              {typingViewers.length === 1
                ? `${typingViewers[0].userName || "Agent"} is typing...`
                : `${typingViewers.length} agents typing...`}
            </span>
          </>
        ) : (
          <>
            <EyeIcon className="w-4 h-4" />
            <span>
              {otherViewers.length === 1
                ? `${otherViewers[0].userName || "1 agent"} viewing`
                : `${otherViewers.length} agents viewing`}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// Hook for components to trigger typing indicator
export function usePresenceTyping() {
  const triggerTyping = useCallback(() => {
    if (typeof window !== "undefined" && (window as any).__ticketPresenceHandleTyping) {
      (window as any).__ticketPresenceHandleTyping();
    }
  }, []);

  return { triggerTyping };
}
