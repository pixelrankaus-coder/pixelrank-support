"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  UserCircleIcon,
  InformationCircleIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

interface Agent {
  id: string;
  name: string | null;
  email: string;
  role: string;
  phone: string | null;
  mobile: string | null;
  jobTitle: string | null;
  timezone: string;
  signature: string | null;
  avatar: string | null;
  agentType: string;
  ticketScope: string;
  level: string;
  points: number;
  channels: string | null;
  createdAt: Date;
  groupIds: string[];
  openTicketCount: number;
  badges: string[];
}

interface Group {
  id: string;
  name: string;
}

interface AgentEditClientProps {
  agent: Agent;
  availableGroups: Group[];
}

const TIMEZONES = [
  { value: "Pacific/Auckland", label: "Auckland" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Australia/Melbourne", label: "Melbourne" },
  { value: "Australia/Brisbane", label: "Brisbane" },
  { value: "Australia/Perth", label: "Perth" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Asia/Kolkata", label: "India (Kolkata)" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "America/New_York", label: "New York" },
  { value: "America/Chicago", label: "Chicago" },
  { value: "America/Denver", label: "Denver" },
  { value: "America/Los_Angeles", label: "Los Angeles" },
  { value: "UTC", label: "UTC" },
];

const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert", "Master"];

const ROLES = [
  { value: "AGENT", label: "Agent" },
  { value: "ADMIN", label: "Administrator" },
];

export function AgentEditClient({ agent, availableGroups }: AgentEditClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(agent.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    email: agent.email,
    name: agent.name || "",
    phone: agent.phone || "",
    mobile: agent.mobile || "",
    jobTitle: agent.jobTitle || "",
    timezone: agent.timezone || "UTC",
    signature: agent.signature || "",
    agentType: agent.agentType || "FULL_TIME",
    ticketScope: agent.ticketScope || "ALL",
    level: agent.level || "Beginner",
    role: agent.role || "AGENT",
    groupIds: agent.groupIds || [],
    channels: agent.channels?.split(",").filter(Boolean) || [],
    password: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGroupToggle = (groupId: string) => {
    setFormData((prev) => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter((id) => id !== groupId)
        : [...prev.groupIds, groupId],
    }));
  };

  const handleChannelToggle = (channel: string) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
      setError(null);
    };
    reader.onerror = () => {
      setError("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRoleToggle = (role: string) => {
    // Role is multi-select in Freshdesk but we'll keep it simple
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/agents/${agent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            channels: formData.channels.join(","),
            avatar: avatar,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update agent");
        }

        setSuccess(true);
        setFormData((prev) => ({ ...prev, password: "" }));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update agent");
      }
    });
  };

  const handleResetBadges = async () => {
    if (!confirm("Are you sure you want to reset all badges and points for this agent?")) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/agents/${agent.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            channels: formData.channels.join(","),
            points: 0,
            level: "Beginner",
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to reset badges");
        }

        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reset badges");
      }
    });
  };

  const pointsToNextLevel = () => {
    const levelThresholds: Record<string, number> = {
      Beginner: 500,
      Intermediate: 2500,
      Advanced: 5000,
      Expert: 10000,
      Master: 999999,
    };
    const threshold = levelThresholds[agent.level] || 500;
    return Math.max(0, threshold - agent.points);
  };

  return (
    <div className="min-h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/team/agents"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Edit agent</h1>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Form */}
        <div className="flex-1 p-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
            {/* Status Messages */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <XMarkIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
            {success && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckIcon className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-green-700">Agent updated successfully</span>
              </div>
            )}

            {/* Agent Type */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Agent type</h3>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="agentType"
                    value="FULL_TIME"
                    checked={formData.agentType === "FULL_TIME"}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Full time</div>
                    <p className="text-sm text-gray-500">
                      Full time agents are those in your support team who login to your help desk
                      every day.
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="agentType"
                    value="OCCASIONAL"
                    checked={formData.agentType === "OCCASIONAL"}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Occasional</div>
                    <p className="text-sm text-gray-500">
                      Occasional agents are those who would need to use your helpdesk infrequently.
                    </p>
                  </div>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="agentType"
                    value="FIELD_TECHNICIAN"
                    checked={formData.agentType === "FIELD_TECHNICIAN"}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Field technician</div>
                    <p className="text-sm text-gray-500">
                      Field technicians are company experts who assist users with maintenance,
                      repairs, or any other operations outside the company.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Agent Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Agent details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone number
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="-"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile number
                    </label>
                    <input
                      type="text"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="-"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    placeholder="-"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Zone</label>
                  <select
                    name="timezone"
                    value={formData.timezone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Info box */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <InformationCircleIcon className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    Admins cannot edit Agent&apos;s profile information. Agents can edit their
                    profile information in their profile settings.
                  </p>
                </div>

                {/* Avatar Upload */}
                <div className="flex items-center gap-4 pt-4">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                    {avatar ? (
                      <img src={avatar} alt={formData.name || "Avatar"} className="w-full h-full object-cover" />
                    ) : (
                      <UserCircleIcon className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <div className="text-sm">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:underline"
                    >
                      Change photo
                    </button>
                    {avatar && (
                      <>
                        <span className="mx-2 text-gray-400">-</span>
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="text-red-600 hover:underline"
                        >
                          Remove
                        </button>
                      </>
                    )}
                    <p className="text-gray-500 mt-1">
                      An image of the person, it&apos;s best if it has the same length and height (max 2MB)
                    </p>
                  </div>
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    className="w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Signature */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                  <textarea
                    name="signature"
                    value={formData.signature}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter agent signature..."
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Leave blank to keep current password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Settings Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Settings</h3>

              {/* Roles */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Roles{" "}
                  <InformationCircleIcon className="w-4 h-4 inline text-gray-400" />
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Determines the features that an agent can access
                </p>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => handleRoleToggle(role.value)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        formData.role === role.value
                          ? "bg-blue-100 border-blue-300 text-blue-700"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {role.label}
                      {formData.role === role.value && (
                        <XMarkIcon className="w-4 h-4 inline ml-1" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Selected role(s) can edit their own agent settings.
                </p>
              </div>

              {/* Ticket Scope */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scope for ticket visibility
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="ticketScope"
                      value="ALL"
                      checked={formData.ticketScope === "ALL"}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">All tickets</div>
                      <p className="text-sm text-gray-500">Can view and edit all tickets</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="ticketScope"
                      value="GROUP"
                      checked={formData.ticketScope === "GROUP"}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Tickets in a group</div>
                      <p className="text-sm text-gray-500">
                        Can view and edit tickets in their group(s) and tickets assigned to them
                      </p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="ticketScope"
                      value="ASSIGNED"
                      checked={formData.ticketScope === "ASSIGNED"}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Assigned tickets</div>
                      <p className="text-sm text-gray-500">
                        Can view and edit tickets assigned to them
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Groups */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organize agents into groups:
                </label>
                <p className="text-xs text-gray-500 mb-3">Add to groups</p>
                <div className="flex flex-wrap gap-2">
                  {availableGroups.map((group) => (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => handleGroupToggle(group.id)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        formData.groupIds.includes(group.id)
                          ? "bg-blue-100 border-blue-300 text-blue-700"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {group.name}
                      {formData.groupIds.includes(group.id) && (
                        <XMarkIcon className="w-4 h-4 inline ml-1" />
                      )}
                    </button>
                  ))}
                  {availableGroups.length === 0 && (
                    <span className="text-sm text-gray-500">No groups available</span>
                  )}
                </div>
              </div>

              {/* Support Channels */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Support Channels
                </label>
                <div className="space-y-2">
                  {["TICKET", "PHONE", "CHAT"].map((channel) => (
                    <label key={channel} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes(channel)}
                        onChange={() => handleChannelToggle(channel)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isPending && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
                Update agent
              </button>
              <Link
                href="/admin/team/agents"
                className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6 space-y-6">
          {/* Level & Points */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Level: <span className="font-medium text-gray-900">{agent.level}</span></div>
            <div className="text-2xl font-bold text-gray-900">{agent.points} pts</div>
            <div className="text-sm text-gray-500 mt-2">
              +{pointsToNextLevel()} to become{" "}
              <span className="text-blue-600">
                {LEVELS[LEVELS.indexOf(agent.level) + 1] || "Master"}
              </span>
            </div>
          </div>

          {/* Badges */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Badges achieved</h4>
            {agent.badges.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {agent.badges.map((badge) => (
                  <span
                    key={badge}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No Badges achieved yet.</p>
            )}
            <button
              type="button"
              onClick={handleResetBadges}
              className="text-sm text-blue-600 hover:underline mt-3"
            >
              Reset badges and points
            </button>
          </div>

          {/* Recently assigned tickets */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Recently assigned tickets (Open & Pending)
            </h4>
            {agent.openTicketCount > 0 ? (
              <p className="text-sm text-gray-600">
                {agent.openTicketCount} open and pending tickets for this agent
              </p>
            ) : (
              <p className="text-sm text-gray-500">No open and pending tickets for this agent</p>
            )}
          </div>

          {/* Help Sidebar */}
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Support Agents</h4>
              <p className="text-sm text-gray-500">
                Full time agents are those in your support team who login to your help desk every
                day.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Roles and Scope</h4>
              <p className="text-sm text-gray-500">
                Roles determine the features an agent can access. Scope determines the tickets that
                an agent can view and edit.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Groups</h4>
              <p className="text-sm text-gray-500">
                You can organize agents into specific groups such as Sales and Product Management.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
