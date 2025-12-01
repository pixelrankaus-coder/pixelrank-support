"use client";

import { useState } from "react";
import { ClaudeChatPanel, ClaudeChatButton } from "./claude-chat-panel";

/**
 * Client wrapper for Claude Chat functionality
 * This wraps the panel and button with state management
 */
export function ClaudeChatWrapper() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <ClaudeChatButton onClick={() => setIsOpen(true)} />

      {/* Chat panel */}
      <ClaudeChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
