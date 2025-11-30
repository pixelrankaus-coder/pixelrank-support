"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  XMarkIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  InboxArrowDownIcon,
  CommandLineIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";

interface EmailChannel {
  id: string;
  name: string;
  email: string;
  isDefault: boolean;
  isActive: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPassword: string | null;
  smtpSecure: boolean;
  imapHost: string | null;
  imapPort: number | null;
  imapUser: string | null;
  imapPassword: string | null;
  imapSecure: boolean;
}

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  body: string;
  isActive: boolean;
}

interface ActivityLog {
  id: string;
  channelId: string | null;
  channelName: string | null;
  type: string;
  level: string;
  message: string;
  details: Record<string, unknown> | null;
  duration: number | null;
  createdAt: string;
}

interface EmailChannelClientProps {
  emailChannels: EmailChannel[];
  emailTemplates: EmailTemplate[];
}

export function EmailChannelClient({ emailChannels, emailTemplates }: EmailChannelClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<"channels" | "templates" | "logs">("channels");
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<EmailChannel | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [testingChannel, setTestingChannel] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [fetchingEmails, setFetchingEmails] = useState<string | null>(null);
  const [fetchResult, setFetchResult] = useState<{ success: boolean; message: string; newTickets?: number; newMessages?: number } | null>(null);

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Fetch activity logs
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (logFilter !== "all") {
        params.set("level", logFilter.toUpperCase());
      }
      const res = await fetch(`/api/admin/email-channels/logs?${params}`);
      const data = await res.json();
      setActivityLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLogsLoading(false);
    }
  }, [logFilter]);

  // Auto-refresh logs when on logs tab
  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
      if (autoRefresh) {
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [activeTab, autoRefresh, fetchLogs]);

  const [channelForm, setChannelForm] = useState({
    name: "",
    email: "",
    smtpHost: "",
    smtpPort: "587",
    smtpUser: "",
    smtpPassword: "",
    smtpSecure: true,
    imapHost: "",
    imapPort: "993",
    imapUser: "",
    imapPassword: "",
    imapSecure: true,
  });

  const [templateForm, setTemplateForm] = useState({
    name: "",
    slug: "",
    subject: "",
    body: "",
    isActive: true,
  });

  const resetChannelForm = () => {
    setChannelForm({
      name: "",
      email: "",
      smtpHost: "",
      smtpPort: "587",
      smtpUser: "",
      smtpPassword: "",
      smtpSecure: true,
      imapHost: "",
      imapPort: "993",
      imapUser: "",
      imapPassword: "",
      imapSecure: true,
    });
    setEditingChannel(null);
  };

  const resetTemplateForm = () => {
    setTemplateForm({
      name: "",
      slug: "",
      subject: "",
      body: "",
      isActive: true,
    });
    setEditingTemplate(null);
  };

  const openChannelModal = (channel?: EmailChannel) => {
    if (channel) {
      setEditingChannel(channel);
      setChannelForm({
        name: channel.name,
        email: channel.email,
        smtpHost: channel.smtpHost || "",
        smtpPort: channel.smtpPort?.toString() || "587",
        smtpUser: channel.smtpUser || "",
        smtpPassword: "",
        smtpSecure: channel.smtpSecure,
        imapHost: channel.imapHost || "",
        imapPort: channel.imapPort?.toString() || "993",
        imapUser: channel.imapUser || "",
        imapPassword: "",
        imapSecure: channel.imapSecure,
      });
    } else {
      resetChannelForm();
    }
    setShowChannelModal(true);
  };

  const openTemplateModal = (template?: EmailTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({
        name: template.name,
        slug: template.slug,
        subject: template.subject,
        body: template.body,
        isActive: template.isActive,
      });
    } else {
      resetTemplateForm();
    }
    setShowTemplateModal(true);
  };

  const handleChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const url = editingChannel
          ? `/api/admin/email-channels/${editingChannel.id}`
          : "/api/admin/email-channels";
        const method = editingChannel ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...channelForm,
            smtpPort: parseInt(channelForm.smtpPort) || 587,
            imapPort: parseInt(channelForm.imapPort) || 993,
          }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to save email channel");
        }

        setShowChannelModal(false);
        resetChannelForm();
        router.refresh();
      } catch (error) {
        console.error("Error saving email channel:", error);
        alert(error instanceof Error ? error.message : "Failed to save email channel");
      }
    });
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      try {
        const url = editingTemplate
          ? `/api/admin/email-templates/${editingTemplate.id}`
          : "/api/admin/email-templates";
        const method = editingTemplate ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(templateForm),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to save email template");
        }

        setShowTemplateModal(false);
        resetTemplateForm();
        router.refresh();
      } catch (error) {
        console.error("Error saving email template:", error);
        alert(error instanceof Error ? error.message : "Failed to save email template");
      }
    });
  };

  const handleDeleteChannel = async (channel: EmailChannel) => {
    if (!confirm(`Are you sure you want to delete "${channel.name}"?`)) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/email-channels/${channel.id}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Failed to delete");
        router.refresh();
      } catch (error) {
        console.error("Error deleting channel:", error);
        alert("Failed to delete email channel");
      }
    });
  };

  const handleTestConnection = async (channel: EmailChannel) => {
    setTestingChannel(channel.id);
    setTestResult(null);

    try {
      const res = await fetch(`/api/admin/email-channels/${channel.id}/test`, {
        method: "POST",
      });

      const data = await res.json();
      setTestResult({
        success: res.ok,
        message: data.message || (res.ok ? "Connection successful!" : "Connection failed"),
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: "Failed to test connection",
      });
    } finally {
      setTestingChannel(null);
    }
  };

  const handleFetchEmails = async (channel: EmailChannel) => {
    setFetchingEmails(channel.id);
    setFetchResult(null);

    try {
      const res = await fetch("/api/admin/email-channels/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: channel.id }),
      });

      const data = await res.json();

      if (data.success) {
        const msgs = [];
        if (data.newTickets > 0) msgs.push(`${data.newTickets} new ticket(s)`);
        if (data.newMessages > 0) msgs.push(`${data.newMessages} new message(s)`);

        setFetchResult({
          success: true,
          message: msgs.length > 0 ? `Fetched: ${msgs.join(", ")}` : "No new emails found",
          newTickets: data.newTickets,
          newMessages: data.newMessages,
        });

        if (data.newTickets > 0 || data.newMessages > 0) {
          router.refresh();
        }
      } else {
        setFetchResult({
          success: false,
          message: data.errors?.join(", ") || "Failed to fetch emails",
        });
      }
    } catch (error) {
      setFetchResult({
        success: false,
        message: "Failed to fetch emails",
      });
    } finally {
      setFetchingEmails(null);
    }
  };

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/channels"
            className="text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <div className="text-sm text-gray-500">
              Admin &gt; Channels &gt; Email
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Email Channel</h1>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("channels")}
            className={`py-3 border-b-2 text-sm font-medium transition-colors ${
              activeTab === "channels"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Cog6ToothIcon className="w-4 h-4" />
              Email Accounts
            </div>
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`py-3 border-b-2 text-sm font-medium transition-colors ${
              activeTab === "templates"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="w-4 h-4" />
              Email Templates
            </div>
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`py-3 border-b-2 text-sm font-medium transition-colors ${
              activeTab === "logs"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <CommandLineIcon className="w-4 h-4" />
              Activity Logs
            </div>
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === "channels" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Email Accounts</h2>
                <p className="text-sm text-gray-500">
                  Configure email accounts to send and receive ticket notifications
                </p>
              </div>
              <button
                onClick={() => openChannelModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="w-4 h-4" />
                Add Email Account
              </button>
            </div>

            {emailChannels.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <EnvelopeIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No email accounts configured</h4>
                <p className="text-gray-500 max-w-md mx-auto mb-4">
                  Add an email account to start sending ticket notifications to customers.
                </p>
                <button
                  onClick={() => openChannelModal()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add your first email account
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {emailChannels.map((channel) => (
                  <div key={channel.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${channel.isActive ? "bg-green-100" : "bg-gray-100"}`}>
                        <EnvelopeIcon className={`w-5 h-5 ${channel.isActive ? "text-green-600" : "text-gray-400"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{channel.name}</span>
                          {channel.isDefault && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                              Default
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            channel.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {channel.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{channel.email}</p>
                        {channel.smtpHost && (
                          <p className="text-xs text-gray-400">SMTP: {channel.smtpHost}:{channel.smtpPort}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {channel.imapHost && (
                        <button
                          onClick={() => handleFetchEmails(channel)}
                          disabled={fetchingEmails === channel.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50"
                        >
                          {fetchingEmails === channel.id ? (
                            <>
                              <ArrowPathIcon className="w-4 h-4 animate-spin" />
                              Fetching...
                            </>
                          ) : (
                            <>
                              <InboxArrowDownIcon className="w-4 h-4" />
                              Fetch Emails
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleTestConnection(channel)}
                        disabled={testingChannel === channel.id}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        {testingChannel === channel.id ? "Testing..." : "Test Connection"}
                      </button>
                      <button
                        onClick={() => openChannelModal(channel)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteChannel(channel)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(testResult || fetchResult) && (
              <div className="mx-4 mb-4 space-y-2">
                {testResult && (
                  <div className={`p-3 rounded-md flex items-center gap-2 ${
                    testResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  }`}>
                    {testResult.success ? (
                      <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                      <ExclamationCircleIcon className="w-5 h-5" />
                    )}
                    {testResult.message}
                  </div>
                )}
                {fetchResult && (
                  <div className={`p-3 rounded-md flex items-center gap-2 ${
                    fetchResult.success ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"
                  }`}>
                    {fetchResult.success ? (
                      <InboxArrowDownIcon className="w-5 h-5" />
                    ) : (
                      <ExclamationCircleIcon className="w-5 h-5" />
                    )}
                    {fetchResult.message}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "templates" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Email Templates</h2>
                <p className="text-sm text-gray-500">
                  Customize email templates sent to customers
                </p>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {emailTemplates.map((template) => (
                <div key={template.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{template.name}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        template.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {template.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Subject: {template.subject}</p>
                  </div>
                  <button
                    onClick={() => openTemplateModal(template)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Activity Logs</h2>
                <p className="text-sm text-gray-500">
                  Real-time email operations and troubleshooting information
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="w-4 h-4 text-gray-400" />
                  <select
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1.5"
                  >
                    <option value="all">All Levels</option>
                    <option value="error">Errors Only</option>
                    <option value="warn">Warnings</option>
                    <option value="info">Info</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                  Auto-refresh
                </label>
                <button
                  onClick={fetchLogs}
                  disabled={logsLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${logsLoading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Logs Display */}
            <div className="bg-gray-900 text-gray-100 font-mono text-sm max-h-[600px] overflow-y-auto">
              {activityLogs.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CommandLineIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No activity logs yet</p>
                  <p className="text-xs mt-1">Logs will appear here when email operations occur</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="p-3 hover:bg-gray-800/50">
                      <div className="flex items-start gap-3">
                        <span className="text-gray-500 text-xs whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                        <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${
                          log.level === "ERROR" ? "bg-red-500/20 text-red-400" :
                          log.level === "WARN" ? "bg-yellow-500/20 text-yellow-400" :
                          log.level === "INFO" ? "bg-blue-500/20 text-blue-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          {log.level}
                        </span>
                        <span className={`px-1.5 py-0.5 text-xs rounded ${
                          log.type === "CONNECTION" ? "bg-purple-500/20 text-purple-400" :
                          log.type === "FETCH" ? "bg-green-500/20 text-green-400" :
                          log.type === "SEND" ? "bg-cyan-500/20 text-cyan-400" :
                          log.type === "ERROR" ? "bg-red-500/20 text-red-400" :
                          "bg-gray-500/20 text-gray-400"
                        }`}>
                          {log.type}
                        </span>
                        {log.channelName && (
                          <span className="text-gray-500 text-xs">
                            [{log.channelName}]
                          </span>
                        )}
                        <span className="flex-1 text-gray-200">{log.message}</span>
                        {log.duration && (
                          <span className="text-gray-500 text-xs">
                            {log.duration}ms
                          </span>
                        )}
                      </div>
                      {log.details && (
                        <pre className="mt-2 ml-20 text-xs text-gray-400 bg-gray-800 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex items-center justify-between">
              <span>Showing last {activityLogs.length} entries</span>
              <span>
                {autoRefresh && (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Live updating every 5s
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Email Channel Modal */}
      {showChannelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingChannel ? "Edit Email Account" : "Add Email Account"}
              </h3>
              <button onClick={() => { setShowChannelModal(false); resetChannelForm(); }} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChannelSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
                <input
                  type="text"
                  value={channelForm.name}
                  onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Support Email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  value={channelForm.email}
                  onChange={(e) => setChannelForm({ ...channelForm, email: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="support@company.com"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">SMTP Settings (Outbound)</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
                    <input
                      type="text"
                      value={channelForm.smtpHost}
                      onChange={(e) => setChannelForm({ ...channelForm, smtpHost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
                    <input
                      type="number"
                      value={channelForm.smtpPort}
                      onChange={(e) => setChannelForm({ ...channelForm, smtpPort: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="587"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label>
                  <input
                    type="text"
                    value={channelForm.smtpUser}
                    onChange={(e) => setChannelForm({ ...channelForm, smtpUser: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your-email@gmail.com"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMTP Password {editingChannel && "(leave blank to keep current)"}
                  </label>
                  <input
                    type="password"
                    value={channelForm.smtpPassword}
                    onChange={(e) => setChannelForm({ ...channelForm, smtpPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                <div className="mt-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={channelForm.smtpSecure}
                      onChange={(e) => setChannelForm({ ...channelForm, smtpSecure: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Use SSL/TLS</span>
                  </label>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">IMAP Settings (Inbound - for receiving emails)</h4>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IMAP Host</label>
                    <input
                      type="text"
                      value={channelForm.imapHost}
                      onChange={(e) => setChannelForm({ ...channelForm, imapHost: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="imap.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IMAP Port</label>
                    <input
                      type="number"
                      value={channelForm.imapPort}
                      onChange={(e) => setChannelForm({ ...channelForm, imapPort: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="993"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">IMAP Username</label>
                  <input
                    type="text"
                    value={channelForm.imapUser}
                    onChange={(e) => setChannelForm({ ...channelForm, imapUser: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your-email@gmail.com"
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IMAP Password {editingChannel && "(leave blank to keep current)"}
                  </label>
                  <input
                    type="password"
                    value={channelForm.imapPassword}
                    onChange={(e) => setChannelForm({ ...channelForm, imapPassword: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                <div className="mt-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={channelForm.imapSecure}
                      onChange={(e) => setChannelForm({ ...channelForm, imapSecure: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Use SSL/TLS</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setShowChannelModal(false); resetChannelForm(); }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : editingChannel ? "Update" : "Add Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Email Template</h3>
              <button onClick={() => { setShowTemplateModal(false); resetTemplateForm(); }} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTemplateSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Body (HTML)</label>
                <textarea
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-medium text-gray-700 mb-2">Available Variables:</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <code className="px-2 py-1 bg-gray-200 rounded">{"{{ticketNumber}}"}</code>
                  <code className="px-2 py-1 bg-gray-200 rounded">{"{{subject}}"}</code>
                  <code className="px-2 py-1 bg-gray-200 rounded">{"{{contactName}}"}</code>
                  <code className="px-2 py-1 bg-gray-200 rounded">{"{{contactEmail}}"}</code>
                  <code className="px-2 py-1 bg-gray-200 rounded">{"{{agentName}}"}</code>
                  <code className="px-2 py-1 bg-gray-200 rounded">{"{{messageBody}}"}</code>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={templateForm.isActive}
                    onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Template is active</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setShowTemplateModal(false); resetTemplateForm(); }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isPending ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
