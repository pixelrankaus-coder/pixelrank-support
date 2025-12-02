import { formatDate, cn, getInitials } from "@/lib/utils";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { DocumentIcon, PhotoIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { SafeHtml } from "@/components/safe-html";

interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
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
  attachments?: Attachment[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

interface TicketConversationProps {
  description: string | null;
  messages: Message[];
  contactName: string | null;
  createdAt: Date;
}

function MessageCard({ message }: { message: Message }) {
  const authorName =
    message.authorName ||
    message.agentAuthor?.name ||
    message.agentAuthor?.email ||
    message.contactAuthor?.name ||
    message.contactAuthor?.email ||
    "System";

  const isAgent = message.authorType === "AGENT";
  const isContact = message.authorType === "CONTACT";
  const agentAvatar = message.agentAuthor?.avatar;

  return (
    <div
      className={cn(
        "rounded-lg border",
        message.internal
          ? "bg-[#fef9c3] border-[#fde047]"
          : "bg-white border-[#eaecf0]"
      )}
    >
      {/* Message header */}
      <div
        className={cn(
          "px-4 py-3 border-b flex items-center justify-between",
          message.internal ? "border-[#fde047] bg-[#fef9c3]" : "border-[#eaecf0] bg-[#f9fafb]"
        )}
      >
        <div className="flex items-center gap-3">
          {isAgent && agentAvatar ? (
            <img
              src={agentAvatar}
              alt={authorName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                isAgent ? "bg-[#7e56d8]" : isContact ? "bg-[#16a34a]" : "bg-[#667085]"
              )}
            >
              {getInitials(authorName)}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#101828]">{authorName}</span>
              <span
                className={cn(
                  "px-2 py-0.5 text-xs font-medium rounded",
                  isAgent && "bg-[#f9f5ff] text-[#7e56d8]",
                  isContact && "bg-[#dcfce7] text-[#16a34a]",
                  message.authorType === "SYSTEM" && "bg-[#f2f4f7] text-[#667085]"
                )}
              >
                {message.authorType}
              </span>
              {message.internal && (
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-[#fde047] text-[#854d0e]">
                  Internal Note
                </span>
              )}
            </div>
          </div>
        </div>
        <span className="text-sm text-[#667085]">{formatDate(message.createdAt)}</span>
      </div>

      {/* Message body */}
      <div className="px-4 py-4">
        <SafeHtml
          html={message.body}
          className="text-[#344054] leading-relaxed prose prose-sm max-w-none"
        />

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-2">Attachments ({message.attachments.length})</p>
            <div className="flex flex-wrap gap-2">
              {message.attachments.map((attachment) => {
                const isImage = attachment.mimeType.startsWith("image/");
                return (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors group"
                  >
                    {isImage ? (
                      <PhotoIcon className="w-4 h-4 text-blue-500" />
                    ) : (
                      <DocumentIcon className="w-4 h-4 text-gray-500" />
                    )}
                    <span className="max-w-[150px] truncate text-gray-700">{attachment.originalName}</span>
                    <span className="text-gray-400 text-xs">{formatFileSize(attachment.size)}</span>
                    <ArrowDownTrayIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TicketConversation({
  description,
  messages,
  contactName,
  createdAt,
}: TicketConversationProps) {
  // Show description as the first "message" if present
  const hasDescription = description && description.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Original ticket description */}
      {hasDescription && (
        <div className="rounded-lg border border-[#eaecf0] bg-white">
          <div className="px-4 py-3 border-b border-[#eaecf0] bg-[#f9fafb] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#16a34a] flex items-center justify-center text-white text-sm font-medium">
                {getInitials(contactName || "Customer")}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#101828]">
                    {contactName || "Customer"}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-[#dcfce7] text-[#16a34a]">
                    CONTACT
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-[#f9f5ff] text-[#7e56d8]">
                    Original Request
                  </span>
                </div>
              </div>
            </div>
            <span className="text-sm text-[#667085]">{formatDate(createdAt)}</span>
          </div>
          <div className="px-4 py-4">
            <SafeHtml
              html={description}
              className="text-[#344054] leading-relaxed prose prose-sm max-w-none"
            />
          </div>
        </div>
      )}

      {/* Messages */}
      {messages.length === 0 && !hasDescription ? (
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <UserCircleIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No conversation yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Use the reply form below to start the conversation
          </p>
        </div>
      ) : (
        messages.map((message) => (
          <MessageCard key={message.id} message={message} />
        ))
      )}
    </div>
  );
}
