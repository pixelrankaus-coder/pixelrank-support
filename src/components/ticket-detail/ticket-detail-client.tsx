"use client";

import { useRef, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TicketActionBar } from "./ticket-action-bar";
import { TicketConversation } from "./ticket-conversation";
import { ReplyComposer, ReplyComposerRef } from "./reply-composer";
import { PropertiesCard } from "./properties-card";
import { ContactCard } from "./contact-card";
import { TicketTimeline } from "./ticket-timeline";
import { PresenceIndicator } from "./presence-indicator";
import { CollisionWarning } from "./collision-warning";
import { AIAssistPanel } from "./ai-assist-panel";
import { AskClaudePanel } from "./ask-claude-panel";
import { CreateTaskModal } from "./create-task-modal";
import { updateTicket, deleteTicket } from "@/lib/actions";
import { cn, getStatusColor, getPriorityColor } from "@/lib/utils";

interface TypingViewer {
  userId: string;
  userName: string | null;
  isTyping: boolean;
  lastSeen: string;
}

interface Message {
  id: string;
  authorType: string;
  authorName: string | null;
  body: string;
  internal: boolean;
  createdAt: Date;
  agentAuthor: { name: string | null; email: string; avatar: string | null } | null;
  contactAuthor: { name: string | null; email: string | null } | null;
}

interface Agent {
  id: string;
  name: string | null;
  email: string;
  avatar?: string | null;
}

interface Group {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface TicketTag {
  tag: Tag;
}

interface TimelineTicket {
  id: string;
  ticketNumber: number;
  subject: string;
  status: string;
  createdAt: Date;
}

interface TicketDetailClientProps {
  ticket: {
    id: string;
    ticketNumber: number;
    subject: string;
    status: string;
    priority: string;
    description: string | null;
    assigneeId: string | null;
    groupId?: string | null;
    contact: {
      id: string;
      name: string | null;
      email: string | null;
      company: string | null;
      workPhone: string | null;
    } | null;
    messages: Message[];
    tags?: TicketTag[];
    firstResponseDue?: Date | null;
    resolutionDue?: Date | null;
    firstRespondedAt?: Date | null;
    resolvedAt?: Date | null;
    aiSummary?: string | null;
    aiReply?: string | null;
    aiGeneratedAt?: Date | null;
    aiModel?: string | null;
    createdAt: Date;
  };
  agents: Agent[];
  groups?: Group[];
  availableTags?: Tag[];
  contactTickets: TimelineTicket[];
  userId: string;
  currentAgent: {
    id: string;
    name: string | null;
    email: string;
    avatar?: string | null;
  } | null;
}

export function TicketDetailClient({
  ticket,
  agents,
  groups = [],
  availableTags = [],
  contactTickets,
  userId,
  currentAgent,
}: TicketDetailClientProps) {
  const router = useRouter();
  const composerRef = useRef<ReplyComposerRef>(null);
  const [isPending, startTransition] = useTransition();
  const [typingViewers, setTypingViewers] = useState<TypingViewer[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleOtherAgentTyping = useCallback((viewers: TypingViewer[]) => {
    setTypingViewers(viewers);
  }, []);

  const handleSelectAction = (action: "reply" | "note") => {
    if (action === "reply") {
      composerRef.current?.focusReply();
    } else {
      composerRef.current?.focusNote();
    }
    // Scroll to composer
    document.getElementById("reply-composer")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCloseClick = () => {
    if (!confirm("Are you sure you want to close this ticket?")) return;

    startTransition(async () => {
      await updateTicket(ticket.id, { status: "CLOSED" });
    });
  };

  const handleDeleteClick = () => {
    if (!confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) return;

    startTransition(async () => {
      await deleteTicket(ticket.id);
    });
  };

  const handleInsertAIReply = useCallback((content: string) => {
    composerRef.current?.insertContent(content);
    document.getElementById("reply-composer")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Prepare initial AI data if exists
  const initialAIData = ticket.aiSummary && ticket.aiReply ? {
    summary: ticket.aiSummary,
    reply: ticket.aiReply,
    generatedAt: ticket.aiGeneratedAt?.toISOString() || null,
    model: ticket.aiModel || null,
    cached: true,
  } : null;

  return (
    <div className="flex flex-col h-full">
      {/* Action bar with breadcrumb */}
      <TicketActionBar
        ticketId={ticket.id}
        ticketNumber={ticket.ticketNumber}
        subject={ticket.subject}
        status={ticket.status}
        contactId={ticket.contact?.id}
        onSelectAction={handleSelectAction}
        onClose={handleCloseClick}
        onDelete={handleDeleteClick}
        onCreateTask={() => setIsTaskModalOpen(true)}
        isPending={isPending}
      />

      {/* Subject header with status/priority badges */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-start justify-between">
          <h1 className="text-lg font-semibold text-gray-900">
            {ticket.subject}
          </h1>
          <div className="flex items-center gap-4 ml-4 flex-shrink-0">
            {/* Presence indicator */}
            <PresenceIndicator
              ticketId={ticket.id}
              currentUserId={userId}
              onOtherAgentTyping={handleOtherAgentTyping}
            />
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "px-2.5 py-0.5 text-xs font-medium rounded-full",
                  getStatusColor(ticket.status)
                )}
              >
                {ticket.status}
              </span>
              <span
                className={cn(
                  "px-2.5 py-0.5 text-xs font-medium rounded-full",
                  getPriorityColor(ticket.priority)
                )}
              >
                {ticket.priority}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <div className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
            {/* Left column - Conversation */}
            <div className="space-y-4">
              <TicketConversation
                description={ticket.description}
                messages={ticket.messages}
                contactName={ticket.contact?.name || null}
                createdAt={ticket.createdAt}
              />

              {/* AI Panels - side by side buttons when collapsed */}
              <div className="flex flex-wrap gap-2 items-start">
                <AIAssistPanel
                  ticketId={ticket.id}
                  hasExistingAI={!!ticket.aiSummary}
                  initialData={initialAIData}
                  onInsertReply={handleInsertAIReply}
                />
                <AskClaudePanel ticketId={ticket.id} />
              </div>

              {/* Reply composer */}
              <div id="reply-composer" className="space-y-3">
                {/* Collision warning when other agents are typing */}
                <CollisionWarning typingViewers={typingViewers} />

                <ReplyComposer
                  ref={composerRef}
                  ticketId={ticket.id}
                  userId={userId}
                  contactEmail={ticket.contact?.email}
                  contactName={ticket.contact?.name}
                  agentName={currentAgent?.name}
                  agentEmail={currentAgent?.email}
                  agentAvatar={currentAgent?.avatar}
                />
              </div>
            </div>

            {/* Right column - Sidebar */}
            <div className="space-y-3">
              <PropertiesCard
                ticket={ticket}
                agents={agents}
                groups={groups}
                availableTags={availableTags}
              />
              <ContactCard contact={ticket.contact} />
              {ticket.contact && (
                <TicketTimeline
                  tickets={contactTickets}
                  currentTicketId={ticket.id}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        ticketId={ticket.id}
        ticketNumber={ticket.ticketNumber}
        ticketSubject={ticket.subject}
        contactId={ticket.contact?.id}
        currentUserId={userId}
        agents={agents}
      />
    </div>
  );
}
