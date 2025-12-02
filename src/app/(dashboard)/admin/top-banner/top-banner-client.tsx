"use client";

import { useState, useEffect } from "react";
import {
  MegaphoneIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";

interface TopBannerSettings {
  id: string;
  isEnabled: boolean;
  message: string;
  linkText: string | null;
  linkUrl: string | null;
  backgroundColor: string;
  textColor: string;
  dismissible: boolean;
}

const PRESET_COLORS = [
  { name: "Light Blue", bg: "#EFF6FF", text: "#344054" },
  { name: "Light Green", bg: "#ECFDF5", text: "#065F46" },
  { name: "Light Yellow", bg: "#FFFBEB", text: "#92400E" },
  { name: "Light Purple", bg: "#F5F3FF", text: "#5B21B6" },
  { name: "Light Red", bg: "#FEF2F2", text: "#991B1B" },
  { name: "Dark Blue", bg: "#1E40AF", text: "#FFFFFF" },
  { name: "Dark Green", bg: "#047857", text: "#FFFFFF" },
  { name: "Dark Purple", bg: "#7C3AED", text: "#FFFFFF" },
];

export function TopBannerClient() {
  const [settings, setSettings] = useState<TopBannerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [isEnabled, setIsEnabled] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#EFF6FF");
  const [textColor, setTextColor] = useState("#344054");
  const [dismissible, setDismissible] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/top-banner");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setIsEnabled(data.isEnabled);
        setBannerMessage(data.message || "");
        setLinkText(data.linkText || "");
        setLinkUrl(data.linkUrl || "");
        setBackgroundColor(data.backgroundColor || "#EFF6FF");
        setTextColor(data.textColor || "#344054");
        setDismissible(data.dismissible ?? true);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      setMessage({ type: "error", text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/top-banner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled,
          message: bannerMessage,
          linkText: linkText || null,
          linkUrl: linkUrl || null,
          backgroundColor,
          textColor,
          dismissible,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setMessage({ type: "success", text: "Settings saved successfully!" });
      } else {
        setMessage({ type: "error", text: "Failed to save settings" });
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const applyPreset = (preset: typeof PRESET_COLORS[0]) => {
    setBackgroundColor(preset.bg);
    setTextColor(preset.text);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <MegaphoneIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Top Banner Settings</h1>
            <p className="text-sm text-gray-500">
              Configure the announcement banner that appears at the top of the page
            </p>
          </div>
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircleIcon className="w-5 h-5" />
          ) : (
            <ExclamationCircleIcon className="w-5 h-5" />
          )}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Settings Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Enable/Disable Toggle */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Enable Banner</h3>
              <p className="text-sm text-gray-500">
                Show the announcement banner to all users
              </p>
            </div>
            <button
              onClick={() => setIsEnabled(!isEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isEnabled ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Banner Message */}
        <div className="p-6 border-b border-gray-100">
          <label className="block text-sm font-medium text-gray-900 mb-2">
            Banner Message
          </label>
          <textarea
            value={bannerMessage}
            onChange={(e) => setBannerMessage(e.target.value)}
            placeholder="Enter your announcement message..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            This message will be displayed in the banner. Keep it concise for best visibility.
          </p>
        </div>

        {/* Link Settings */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Optional Link
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Link Text
              </label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Learn More"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Link URL
              </label>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="/updates or https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Color Settings */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Appearance
          </h3>

          {/* Color Presets */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Quick Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="px-3 py-1.5 text-xs rounded-md border border-gray-200 hover:border-blue-400 transition-colors"
                  style={{ backgroundColor: preset.bg, color: preset.text }}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Background Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-9 w-12 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Text Color
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="h-9 w-12 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dismissible Option */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Allow Dismiss</h3>
              <p className="text-sm text-gray-500">
                Let users close the banner (remembers for 7 days)
              </p>
            </div>
            <button
              onClick={() => setDismissible(!dismissible)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                dismissible ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  dismissible ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Preview Toggle */}
        <div className="p-6 border-b border-gray-100">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            {showPreview ? (
              <EyeSlashIcon className="w-4 h-4" />
            ) : (
              <EyeIcon className="w-4 h-4" />
            )}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>

          {showPreview && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Preview:</p>
              <div
                className="h-[50px] px-4 flex items-center justify-center text-sm"
                style={{ backgroundColor, color: textColor }}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">Product Update:</span>
                  <span>{bannerMessage || "Your message here..."}</span>
                  {linkText && (
                    <span className="font-medium underline cursor-pointer">
                      {linkText}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="p-6 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
