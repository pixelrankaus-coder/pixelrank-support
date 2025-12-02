"use client";

import { useRef, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TicketActionBar } from "./ticket-action-bar";
import { TicketTabBar } from "./ticket-tab-bar";
import { MessageFilterPills } from "./message-filter-pills";
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
import { AppSlotRenderer } from "@/components/apps/AppSlotRenderer";
import { updateTicket, deleteTicket } from "@/lib/actions";

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
    source?: string | null;
    description: string | null;
    assigneeId: string | null;
    groupId?: string | null;
    contact: {
      id: string;
      name: string | null;
      email: string | null;
      company: string | null;
      workPhone: string | null;
      mobilePhone?: string | null;
      companyRef?: {
        name: string;
        timezone?: string | null;
      } | null;
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
  allContacts?: { id: string; name: string | null; email: string | null }[];
}

export function TicketDetailClient({
  ticket,
  agents,
  groups = [],
  availableTags = [],
  contactTickets,
  userId,
  currentAgent,
  allContacts = [],
}: TicketDetailClientProps) {
  const router = useRouter();
  const composerRef = useRef<ReplyComposerRef>(null);
  const [isPending, startTransition] = useTransition();
  const [typingViewers, setTypingViewers] = useState<TypingViewer[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"messages" | "notes" | "activities">("messages");
  const [messageFilter, setMessageFilter] = useState<"all" | "replies" | "notes">("all");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Compute message and note counts from existing messages data
  const messageCount = ticket.messages.filter(m => !m.internal).length;
  const noteCount = ticket.messages.filter(m => m.internal).length;

  // Filter messages based on current filter
  const filteredMessages = ticket.messages.filter(m => {
    if (messageFilter === "all") return true;
    if (messageFilter === "replies") return !m.internal;
    if (messageFilter === "notes") return m.internal;
    return true;
  });

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

      {/* Main layout with sidebar starting from header */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left side - Header + Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Ticket Header - Title and Meta Row */}
          <div className="bg-white border-b border-[#eaecf0] px-6 py-4">
            {/* Title Row */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-semibold text-[#101828] leading-tight">
                  {ticket.subject}
                </h1>
              </div>
              {/* Presence indicator only - status/priority moved to sidebar */}
              <PresenceIndicator
                ticketId={ticket.id}
                currentUserId={userId}
                onOtherAgentTyping={handleOtherAgentTyping}
              />
            </div>
            {/* Meta Row with icons */}
            <div className="flex items-center gap-3 mt-2 text-sm text-[#667085]">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{ticket.source || "Customer Portal"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTimeAgo(ticket.createdAt)}</span>
              </div>
              <a href="#" className="flex items-center gap-1.5 text-[#7e56d8] hover:underline">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>View in Customer Portal</span>
              </a>
            </div>
          </div>

          {/* Tab Bar */}
          <TicketTabBar
            messageCount={messageCount}
            noteCount={noteCount}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Content area */}
          <div className="flex-1 overflow-auto bg-[#f9fafb]">
            <div className="p-4">
              {/* Filter Pills */}
              <MessageFilterPills
                activeFilter={messageFilter}
                onFilterChange={setMessageFilter}
                replyCount={messageCount}
                noteCount={noteCount}
              />

              <TicketConversation
                description={ticket.description}
                messages={filteredMessages}
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
              <div id="reply-composer" className="space-y-3 mt-4">
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
          </div>
        </div>

        {/* Right Sidebar - starts from header level */}
        {isSidebarCollapsed ? (
          /* Collapsed sidebar - just show expand button */
          <div className="w-10 flex-shrink-0 border-l border-[#eaecf0] bg-white hidden lg:flex flex-col items-center pt-3">
            <button
              onClick={() => setIsSidebarCollapsed(false)}
              className="p-1.5 text-[#667085] hover:text-[#344054] hover:bg-[#f9fafb] rounded"
              title="Expand sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        ) : (
          /* Expanded sidebar */
          <div className="w-[340px] flex-shrink-0 border-l border-[#eaecf0] bg-white overflow-y-auto hidden lg:block">
            {/* Sidebar Tab Header */}
            <div className="flex items-center border-b border-[#eaecf0]">
              <button className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-[#7e56d8] border-b-2 border-[#7e56d8]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Details
              </button>
              <button className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-[#667085] hover:text-[#344054]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Apps
              </button>
              {/* Collapse button */}
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="ml-auto mr-2 p-1.5 text-[#667085] hover:text-[#344054] hover:bg-[#f9fafb] rounded"
                title="Collapse sidebar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="p-4 space-y-4">
              {/* Contact Card at top */}
              <ContactCard contact={ticket.contact} ticketId={ticket.id} allContacts={allContacts} />

              {/* Properties Card */}
              <PropertiesCard
                ticket={ticket}
                agents={agents}
                groups={groups}
                availableTags={availableTags}
              />

              {/* Timeline */}
              {ticket.contact && (
                <TicketTimeline
                  tickets={contactTickets}
                  currentTicketId={ticket.id}
                />
              )}

              {/* App Slot for sidebar apps */}
              <AppSlotRenderer slot="ticket-detail-sidebar" className="mt-4" />
            </div>
          </div>
        )}
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
