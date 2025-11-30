"use client";

import {
  useState,
  useTransition,
  useImperativeHandle,
  forwardRef,
  useCallback,
  useRef,
} from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import CodeBlock from "@tiptap/extension-code-block";
import { addMessage } from "@/lib/actions";
import { cn } from "@/lib/utils";
import {
  ChevronDownIcon,
  XMarkIcon,
  ArrowsPointingOutIcon,
  PaperClipIcon,
  FaceSmileIcon,
  BookOpenIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChatBubbleLeftRightIcon,
  DocumentIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { CannedResponsePicker } from "./canned-response-picker";
import { usePresenceTyping } from "./presence-indicator";

interface UploadedAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

interface Recipient {
  email: string;
  name?: string | null;
  type: "to" | "cc" | "bcc";
  isRequester?: boolean;
}

interface ReplyComposerProps {
  ticketId: string;
  userId: string;
  contactEmail?: string | null;
  contactName?: string | null;
  agentName?: string | null;
  agentEmail?: string | null;
  agentAvatar?: string | null;
}

export interface ReplyComposerRef {
  focusReply: () => void;
  focusNote: () => void;
  insertContent: (content: string) => void;
}

export const ReplyComposer = forwardRef<ReplyComposerRef, ReplyComposerProps>(
  function ReplyComposer(
    { ticketId, userId, contactEmail, contactName, agentName, agentEmail, agentAvatar },
    ref
  ) {
    const [activeTab, setActiveTab] = useState<"reply" | "note">("reply");
    const [isPending, startTransition] = useTransition();
    const [showBcc, setShowBcc] = useState(false);
    const [toRecipients, setToRecipients] = useState<Recipient[]>(
      contactEmail
        ? [{ email: contactEmail, name: contactName, type: "to", isRequester: true }]
        : []
    );
    const [ccRecipients, setCcRecipients] = useState<Recipient[]>([]);
    const [bccRecipients, setBccRecipients] = useState<Recipient[]>([]);
    const [newToEmail, setNewToEmail] = useState("");
    const [newCcEmail, setNewCcEmail] = useState("");
    const [newBccEmail, setNewBccEmail] = useState("");
    const [savedStatus, setSavedStatus] = useState<"saved" | "saving" | null>("saved");
    const [showCannedResponses, setShowCannedResponses] = useState(false);
    const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { triggerTyping } = usePresenceTyping();

    const isInternal = activeTab === "note";

    // Handle file upload
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);

      for (const file of Array.from(files)) {
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("ticketId", ticketId);

          const response = await fetch("/api/attachments", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            console.error("Upload failed:", error.error);
            alert(`Failed to upload ${file.name}: ${error.error}`);
            continue;
          }

          const attachment = await response.json();
          setAttachments((prev) => [...prev, attachment]);
        } catch (error) {
          console.error("Upload error:", error);
          alert(`Failed to upload ${file.name}`);
        }
      }

      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    // Remove attachment
    const handleRemoveAttachment = async (attachmentId: string) => {
      try {
        await fetch(`/api/attachments?id=${attachmentId}`, {
          method: "DELETE",
        });
        setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      } catch (error) {
        console.error("Failed to remove attachment:", error);
      }
    };

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          codeBlock: false,
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { class: "text-blue-600 underline" },
        }),
        Image,
        Placeholder.configure({
          placeholder: isInternal
            ? "Write an internal note..."
            : `Hi ${contactName || "there"},\n\n`,
        }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        TextStyle,
        Color,
        Highlight.configure({ multicolor: true }),
        Table.configure({ resizable: true }),
        TableRow,
        TableHeader,
        TableCell,
        CodeBlock,
      ],
      content: isInternal ? "" : `<p>Hi ${contactName || "there"},</p><p></p><p></p><p>${agentName || "Agent"}</p>`,
      editorProps: {
        attributes: {
          class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] px-4 py-3",
        },
      },
      onUpdate: () => {
        setSavedStatus("saving");
        // Simulate auto-save
        setTimeout(() => setSavedStatus("saved"), 500);
        // Trigger typing indicator for presence
        triggerTyping();
      },
    });

    useImperativeHandle(ref, () => ({
      focusReply: () => {
        setActiveTab("reply");
        setTimeout(() => editor?.commands.focus(), 0);
      },
      focusNote: () => {
        setActiveTab("note");
        setTimeout(() => editor?.commands.focus(), 0);
      },
      insertContent: (content: string) => {
        if (!editor) return;
        setActiveTab("reply");
        // Clear the editor and set the new content
        editor.commands.setContent(
          `<p>Hi ${contactName || "there"},</p><p></p>${content}<p></p><p>${agentName || "Agent"}</p>`
        );
        editor.commands.focus();
      },
    }));

    const handleSubmit = useCallback(() => {
      if (!editor) return;
      const content = editor.getHTML();
      if (!content || content === "<p></p>") return;

      startTransition(async () => {
        await addMessage({
          ticketId,
          body: content,
          internal: isInternal,
          authorType: "AGENT",
          authorId: userId,
          attachmentIds: attachments.map((a) => a.id),
        });
        editor.commands.clearContent();
        setAttachments([]); // Clear attachments after sending
        // Reset to default greeting after sending
        if (!isInternal) {
          editor.commands.setContent(
            `<p>Hi ${contactName || "there"},</p><p></p><p></p><p>${agentName || "Agent"}</p>`
          );
        }
      });
    }, [editor, ticketId, isInternal, userId, contactName, agentName, attachments]);

    const removeRecipient = (email: string, type: "to" | "cc" | "bcc") => {
      if (type === "to") {
        setToRecipients((prev) => prev.filter((r) => r.email !== email));
      } else if (type === "cc") {
        setCcRecipients((prev) => prev.filter((r) => r.email !== email));
      } else {
        setBccRecipients((prev) => prev.filter((r) => r.email !== email));
      }
    };

    const addRecipient = (email: string, type: "to" | "cc" | "bcc") => {
      if (!email.trim() || !email.includes("@")) return;
      const newRecipient: Recipient = { email: email.trim(), type };
      if (type === "to") {
        if (!toRecipients.find((r) => r.email === email)) {
          setToRecipients((prev) => [...prev, newRecipient]);
        }
        setNewToEmail("");
      } else if (type === "cc") {
        if (!ccRecipients.find((r) => r.email === email)) {
          setCcRecipients((prev) => [...prev, newRecipient]);
        }
        setNewCcEmail("");
      } else {
        if (!bccRecipients.find((r) => r.email === email)) {
          setBccRecipients((prev) => [...prev, newRecipient]);
        }
        setNewBccEmail("");
      }
    };

    const clearRecipients = (type: "to" | "cc" | "bcc") => {
      if (type === "to") setToRecipients([]);
      else if (type === "cc") setCcRecipients([]);
      else setBccRecipients([]);
    };

    const handleInsertCannedResponse = (content: string) => {
      if (!editor) return;
      editor.commands.insertContent(content);
      editor.commands.focus();
    };

    const RecipientPill = ({ recipient, onRemove }: { recipient: Recipient; onRemove: () => void }) => (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 text-sm rounded">
        <span>
          {recipient.email}
          {recipient.isRequester && (
            <span className="text-slate-500 ml-1">(Requester)</span>
          )}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-400 hover:text-slate-600"
        >
          <XMarkIcon className="w-3.5 h-3.5" />
        </button>
      </span>
    );

    // Toolbar button component
    const ToolbarButton = ({
      onClick,
      isActive,
      children,
      title,
    }: {
      onClick: () => void;
      isActive?: boolean;
      children: React.ReactNode;
      title?: string;
    }) => (
      <button
        type="button"
        onClick={onClick}
        title={title}
        className={cn(
          "p-1.5 rounded hover:bg-slate-100 transition-colors",
          isActive && "bg-slate-200 text-blue-600"
        )}
      >
        {children}
      </button>
    );

    if (!editor) {
      return <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">Loading editor...</div>;
    }

    return (
      <div
        className={cn(
          "rounded-lg border shadow-sm",
          isInternal ? "border-yellow-300 bg-yellow-50" : "border-gray-200 bg-white"
        )}
      >
        {/* Top bar - From line */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-slate-50">
          {/* Avatar */}
          {agentAvatar ? (
            <img
              src={agentAvatar}
              alt={agentName || "Agent"}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
              {(agentName || "A").charAt(0).toUpperCase()}
            </div>
          )}

          {/* Back/Reply dropdown */}
          <button className="flex items-center gap-1 text-slate-500 hover:text-slate-700">
            <ChevronLeftIcon className="w-4 h-4" />
            <ChevronDownIcon className="w-3 h-3" />
          </button>

          {/* From info */}
          <div className="flex-1 text-sm">
            <span className="text-slate-500">From:</span>{" "}
            <span className="font-medium text-slate-900">{agentName || "Agent"}</span>{" "}
            <span className="text-slate-500">({agentEmail || "support@help.freshdesk.com"})</span>
          </div>

          {/* Expand button */}
          <button className="p-1 text-slate-400 hover:text-slate-600">
            <ArrowsPointingOutIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Reply vs Note tabs - only show for switching context */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("reply")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "reply"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            Reply
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("note")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === "note"
                ? "border-yellow-500 text-yellow-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            Add note
          </button>
        </div>

        {/* To field - only for replies */}
        {!isInternal && (
          <div className="flex items-start gap-2 px-3 py-2 border-b border-gray-100">
            <span className="text-sm text-slate-500 py-1 w-8">To:</span>
            <div className="flex-1 flex flex-wrap items-center gap-2">
              {toRecipients.map((r) => (
                <RecipientPill
                  key={r.email}
                  recipient={r}
                  onRemove={() => removeRecipient(r.email, "to")}
                />
              ))}
              <input
                type="email"
                value={newToEmail}
                onChange={(e) => setNewToEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addRecipient(newToEmail, "to");
                  }
                }}
                onBlur={() => newToEmail && addRecipient(newToEmail, "to")}
                placeholder="Add recipient..."
                className="flex-1 min-w-[150px] text-sm bg-transparent border-none outline-none"
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              {!showBcc && (
                <button
                  type="button"
                  onClick={() => setShowBcc(true)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Bcc
                </button>
              )}
              <button
                type="button"
                onClick={() => clearRecipients("to")}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Cc field - only for replies */}
        {!isInternal && (
          <div className="flex items-start gap-2 px-3 py-2 border-b border-gray-100">
            <span className="text-sm text-slate-500 py-1 w-8">Cc:</span>
            <div className="flex-1 flex flex-wrap items-center gap-2">
              {ccRecipients.map((r) => (
                <RecipientPill
                  key={r.email}
                  recipient={r}
                  onRemove={() => removeRecipient(r.email, "cc")}
                />
              ))}
              <input
                type="email"
                value={newCcEmail}
                onChange={(e) => setNewCcEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addRecipient(newCcEmail, "cc");
                  }
                }}
                onBlur={() => newCcEmail && addRecipient(newCcEmail, "cc")}
                placeholder="Add Cc..."
                className="flex-1 min-w-[150px] text-sm bg-transparent border-none outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => clearRecipients("cc")}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear
            </button>
          </div>
        )}

        {/* Bcc field - only for replies when shown */}
        {!isInternal && showBcc && (
          <div className="flex items-start gap-2 px-3 py-2 border-b border-gray-100">
            <span className="text-sm text-slate-500 py-1 w-8">Bcc:</span>
            <div className="flex-1 flex flex-wrap items-center gap-2">
              {bccRecipients.map((r) => (
                <RecipientPill
                  key={r.email}
                  recipient={r}
                  onRemove={() => removeRecipient(r.email, "bcc")}
                />
              ))}
              <input
                type="email"
                value={newBccEmail}
                onChange={(e) => setNewBccEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addRecipient(newBccEmail, "bcc");
                  }
                }}
                onBlur={() => newBccEmail && addRecipient(newBccEmail, "bcc")}
                placeholder="Add Bcc..."
                className="flex-1 min-w-[150px] text-sm bg-transparent border-none outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => clearRecipients("bcc")}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Clear
            </button>
          </div>
        )}

        {/* Internal note warning */}
        {isInternal && (
          <div className="px-4 py-2 bg-yellow-100 border-b border-yellow-200 text-sm text-yellow-800">
            This note is only visible to agents
          </div>
        )}

        {/* Editor content area */}
        <div className={cn("min-h-[250px]", isInternal && "bg-yellow-50/50")}>
          <EditorContent editor={editor} />
        </div>

        {/* Attachments display */}
        {attachments.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                >
                  {attachment.mimeType.startsWith("image/") ? (
                    <PhotoIcon className="w-4 h-4 text-blue-500" />
                  ) : (
                    <DocumentIcon className="w-4 h-4 text-gray-500" />
                  )}
                  <span className="max-w-[150px] truncate">{attachment.originalName}</span>
                  <span className="text-gray-400 text-xs">{formatFileSize(attachment.size)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(attachment.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uploading indicator */}
        {isUploading && (
          <div className="px-4 py-2 border-t border-gray-200 bg-blue-50 text-blue-700 text-sm">
            Uploading files...
          </div>
        )}

        {/* Rich text toolbar */}
        <div className="flex items-center gap-1 px-3 py-2 border-t border-gray-200 bg-white">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive("bold")}
            title="Bold"
          >
            <span className="font-bold text-sm">B</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive("italic")}
            title="Italic"
          >
            <span className="italic text-sm">I</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive("underline")}
            title="Underline"
          >
            <span className="underline text-sm">U</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {}}
            title="Text color"
          >
            <span className="text-sm">A<span className="text-red-500">:</span></span>
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive("bulletList")}
            title="Bullet list"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive("orderedList")}
            title="Numbered list"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          </ToolbarButton>

          <div className="w-px h-5 bg-gray-200 mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive("blockquote")}
            title="Quote"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              const url = window.prompt("Enter URL:");
              if (url) {
                editor.chain().focus().setLink({ href: url }).run();
              }
            }}
            isActive={editor.isActive("link")}
            title="Insert link"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => {
              const url = window.prompt("Enter image URL:");
              if (url) {
                editor.chain().focus().setImage({ src: url }).run();
              }
            }}
            title="Insert image"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}
            title="Insert table"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive("codeBlock")}
            title="Code block"
          >
            <span className="text-sm font-mono">{"{}"}</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive("strike")}
            title="Strikethrough"
          >
            <span className="text-sm line-through">S</span>
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            title="Clear formatting"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </ToolbarButton>
        </div>

        {/* Footer bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-slate-50 rounded-b-lg">
          {/* Left icons */}
          <div className="flex items-center gap-1 relative">
            <button
              type="button"
              onClick={() => setShowCannedResponses(!showCannedResponses)}
              className={cn(
                "p-2 hover:bg-slate-100 rounded",
                showCannedResponses ? "text-blue-600 bg-blue-50" : "text-slate-500 hover:text-slate-700"
              )}
              title="Canned responses"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
            </button>
            <CannedResponsePicker
              isOpen={showCannedResponses}
              onClose={() => setShowCannedResponses(false)}
              onSelect={handleInsertCannedResponse}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.json,.zip"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={cn(
                "p-2 hover:bg-slate-100 rounded",
                isUploading ? "text-blue-500 animate-pulse" : "text-slate-500 hover:text-slate-700"
              )}
              title="Attach file"
            >
              <PaperClipIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
              title="Insert emoji"
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded"
              title="Knowledge base"
            >
              <BookOpenIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {savedStatus && (
              <span className="text-sm text-slate-400">
                {savedStatus === "saving" ? "Saving..." : "Saved"}
              </span>
            )}
            <button
              type="button"
              onClick={() => editor.commands.clearContent()}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"
              title="Discard draft"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className={cn(
                  "px-4 py-2 text-sm font-medium text-white rounded-l-md transition-colors disabled:opacity-50",
                  isInternal
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                {isPending ? "Sending..." : "Send"}
              </button>
              <button
                type="button"
                className={cn(
                  "px-2 py-2 text-white rounded-r-md border-l border-white/20 transition-colors",
                  isInternal
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-blue-600 hover:bg-blue-700"
                )}
              >
                <ChevronDownIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
