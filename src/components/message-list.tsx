import { formatDate, cn } from "@/lib/utils";

interface Message {
  id: string;
  authorType: string;
  authorName: string | null;
  body: string;
  internal: boolean;
  createdAt: Date;
  agentAuthor: { name: string | null; email: string } | null;
  contactAuthor: { name: string | null; email: string | null } | null;
}

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6 text-center text-gray-500">
        No messages yet
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      {messages.map((message) => {
        const authorName =
          message.authorName ||
          message.agentAuthor?.name ||
          message.agentAuthor?.email ||
          message.contactAuthor?.name ||
          message.contactAuthor?.email ||
          "System";

        return (
          <div
            key={message.id}
            className={cn(
              "bg-white rounded-lg shadow p-4",
              message.internal && "border-l-4 border-yellow-400 bg-yellow-50"
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{authorName}</span>
                {message.internal && (
                  <span className="px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded">
                    Internal Note
                  </span>
                )}
                <span
                  className={cn(
                    "px-2 py-0.5 text-xs rounded",
                    message.authorType === "AGENT" &&
                      "bg-blue-100 text-blue-800",
                    message.authorType === "CONTACT" &&
                      "bg-green-100 text-green-800",
                    message.authorType === "SYSTEM" &&
                      "bg-gray-100 text-gray-800"
                  )}
                >
                  {message.authorType}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {formatDate(message.createdAt)}
              </span>
            </div>
            <div className="text-gray-700 whitespace-pre-wrap">
              {message.body}
            </div>
          </div>
        );
      })}
    </div>
  );
}
