"use client";

import { useState, useEffect } from "react";
import {
  SparklesIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

// Brand Icons for AI Providers
const AnthropicIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.304 3.541h-3.672l6.696 16.918h3.672l-6.696-16.918zm-10.608 0l-6.696 16.918h3.78l1.344-3.528h6.912l1.344 3.528h3.78l-6.696-16.918h-3.768zm-.18 10.404l2.556-6.708 2.556 6.708h-5.112z"/>
  </svg>
);

const OpenAIIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08-4.778 2.758a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

const OpenRouterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" fillRule="evenodd"/>
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

interface AISettings {
  id: string;
  activeProvider: string;
  anthropicModel: string;
  openaiModel: string;
  openrouterModel: string;
  isEnabled: boolean;
  useFallback: boolean;
  fallbackOrder: string;
  hasAnthropicKey: boolean;
  hasOpenaiKey: boolean;
  hasOpenrouterKey: boolean;
  // Per-provider enable/disable toggles
  anthropicEnabled: boolean;
  openaiEnabled: boolean;
  openrouterEnabled: boolean;
  // Legacy fields for backward compatibility
  provider?: string;
  model?: string;
  hasApiKey?: boolean;
}

const ANTHROPIC_MODELS = [
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", price: "$0.25/1M input, $1.25/1M output" },
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", price: "$3/1M input, $15/1M output" },
  { id: "claude-3-opus-20240229", name: "Claude 3 Opus", price: "$15/1M input, $75/1M output" },
];

const OPENAI_MODELS = [
  { id: "gpt-4o-mini", name: "GPT-4o Mini", price: "$0.15/1M input, $0.60/1M output" },
  { id: "gpt-4o", name: "GPT-4o", price: "$2.50/1M input, $10/1M output" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", price: "$10/1M input, $30/1M output" },
];

const OPENROUTER_MODELS = [
  { id: "meta-llama/llama-3.1-8b-instruct:free", name: "Llama 3.1 8B (FREE)", price: "FREE" },
  { id: "google/gemma-2-9b-it:free", name: "Gemma 2 9B (FREE)", price: "FREE" },
  { id: "mistralai/mistral-7b-instruct:free", name: "Mistral 7B (FREE)", price: "FREE" },
  { id: "meta-llama/llama-3.1-70b-instruct", name: "Llama 3.1 70B", price: "$0.52/1M input, $0.75/1M output" },
  { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet (via OR)", price: "$3/1M input, $15/1M output" },
  { id: "openai/gpt-4o", name: "GPT-4o (via OR)", price: "$2.50/1M input, $10/1M output" },
];

export function AISettingsClient() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState({
    anthropic: false,
    openai: false,
    openrouter: false,
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<{ success: boolean; message: string } | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [formData, setFormData] = useState({
    activeProvider: "anthropic",
    anthropicApiKey: "",
    openaiApiKey: "",
    openrouterApiKey: "",
    anthropicModel: "claude-3-5-haiku-20241022",
    openaiModel: "gpt-4o-mini",
    openrouterModel: "meta-llama/llama-3.1-8b-instruct:free",
    isEnabled: false,
    useFallback: true,
    fallbackOrder: "openai,openrouter",
    // Per-provider enable/disable toggles
    anthropicEnabled: true,
    openaiEnabled: true,
    openrouterEnabled: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/ai-settings");
      const data = await res.json();
      setSettings(data);
      setFormData({
        activeProvider: data.activeProvider || data.provider || "anthropic",
        anthropicApiKey: "",
        openaiApiKey: "",
        openrouterApiKey: "",
        anthropicModel: data.anthropicModel || "claude-3-5-haiku-20241022",
        openaiModel: data.openaiModel || "gpt-4o-mini",
        openrouterModel: data.openrouterModel || "meta-llama/llama-3.1-8b-instruct:free",
        isEnabled: data.isEnabled || false,
        useFallback: data.useFallback ?? true,
        fallbackOrder: data.fallbackOrder || "openai,openrouter",
        anthropicEnabled: data.anthropicEnabled ?? true,
        openaiEnabled: data.openaiEnabled ?? true,
        openrouterEnabled: data.openrouterEnabled ?? true,
      });
    } catch (error) {
      console.error("Failed to fetch AI settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProviderChange = (provider: string) => {
    setFormData({ ...formData, activeProvider: provider });
    setTestResult(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setFormData(prev => ({
          ...prev,
          anthropicApiKey: "",
          openaiApiKey: "",
          openrouterApiKey: ""
        }));
        setSaveMessage({ success: true, message: "Settings saved successfully" });
      } else {
        const error = await res.json();
        setSaveMessage({ success: false, message: error.error || "Failed to save settings" });
      }
    } catch {
      setSaveMessage({ success: false, message: "Failed to save settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/admin/ai-settings", { method: "POST" });
      const data = await res.json();
      setTestResult({
        success: data.success,
        message: data.success ? data.message : data.error,
      });
    } catch {
      setTestResult({ success: false, message: "Connection test failed" });
    } finally {
      setIsTesting(false);
    }
  };

  const getActiveProviderModels = () => {
    switch (formData.activeProvider) {
      case "openai": return OPENAI_MODELS;
      case "openrouter": return OPENROUTER_MODELS;
      default: return ANTHROPIC_MODELS;
    }
  };

  const getActiveProviderModel = () => {
    switch (formData.activeProvider) {
      case "openai": return formData.openaiModel;
      case "openrouter": return formData.openrouterModel;
      default: return formData.anthropicModel;
    }
  };

  const setActiveProviderModel = (model: string) => {
    switch (formData.activeProvider) {
      case "openai":
        setFormData({ ...formData, openaiModel: model });
        break;
      case "openrouter":
        setFormData({ ...formData, openrouterModel: model });
        break;
      default:
        setFormData({ ...formData, anthropicModel: model });
    }
  };

  const hasActiveProviderKey = () => {
    switch (formData.activeProvider) {
      case "openai": return settings?.hasOpenaiKey;
      case "openrouter": return settings?.hasOpenrouterKey;
      default: return settings?.hasAnthropicKey;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <SparklesIcon className="w-7 h-7 text-purple-600" />
          AI Settings
        </h1>
        <p className="text-gray-500 mt-1">
          Configure AI assistant to help agents with ticket summaries and suggested replies.
        </p>
      </div>

      {/* Settings Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* Enable/Disable Toggle */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Enable AI Assist</h3>
              <p className="text-sm text-gray-500 mt-1">
                When enabled, agents can use AI to generate ticket summaries and reply suggestions.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isEnabled}
                onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* Provider Selection */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">AI Provider</h3>
          <div className="grid grid-cols-3 gap-4">
            {/* Anthropic */}
            <div
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                formData.activeProvider === "anthropic"
                  ? "border-purple-500 bg-purple-50"
                  : !formData.anthropicEnabled
                    ? "border-gray-200 bg-gray-100 opacity-60"
                    : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                className={`${formData.anthropicEnabled ? "cursor-pointer" : "cursor-not-allowed"}`}
                onClick={() => formData.anthropicEnabled && handleProviderChange("anthropic")}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${formData.anthropicEnabled ? "bg-[#D4A27F]" : "bg-gray-400"} flex items-center justify-center`}>
                    <AnthropicIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${formData.anthropicEnabled ? "text-gray-900" : "text-gray-500"}`}>Anthropic</div>
                    <div className="text-xs text-gray-500">Claude Models</div>
                  </div>
                </div>
                {settings?.hasAnthropicKey && formData.anthropicEnabled && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircleIcon className="w-3 h-3" />
                    Key configured
                  </div>
                )}
                {!formData.anthropicEnabled && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
                    <ExclamationCircleIcon className="w-3 h-3" />
                    Disabled
                  </div>
                )}
                {formData.activeProvider === "anthropic" && formData.anthropicEnabled && (
                  <div className="mt-2 text-xs text-purple-600 font-medium">Selected</div>
                )}
              </div>
              {/* Enable/Disable Toggle */}
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">Enable</span>
                <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={formData.anthropicEnabled}
                    onChange={(e) => {
                      setFormData({ ...formData, anthropicEnabled: e.target.checked });
                      // If disabling the active provider, switch to next enabled one
                      if (!e.target.checked && formData.activeProvider === "anthropic") {
                        if (formData.openaiEnabled) {
                          handleProviderChange("openai");
                        } else if (formData.openrouterEnabled) {
                          handleProviderChange("openrouter");
                        }
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            {/* OpenAI */}
            <div
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                formData.activeProvider === "openai"
                  ? "border-purple-500 bg-purple-50"
                  : !formData.openaiEnabled
                    ? "border-gray-200 bg-gray-100 opacity-60"
                    : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                className={`${formData.openaiEnabled ? "cursor-pointer" : "cursor-not-allowed"}`}
                onClick={() => formData.openaiEnabled && handleProviderChange("openai")}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${formData.openaiEnabled ? "bg-[#10A37F]" : "bg-gray-400"} flex items-center justify-center`}>
                    <OpenAIIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${formData.openaiEnabled ? "text-gray-900" : "text-gray-500"}`}>OpenAI</div>
                    <div className="text-xs text-gray-500">GPT Models</div>
                  </div>
                </div>
                {settings?.hasOpenaiKey && formData.openaiEnabled && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircleIcon className="w-3 h-3" />
                    Key configured
                  </div>
                )}
                {!formData.openaiEnabled && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
                    <ExclamationCircleIcon className="w-3 h-3" />
                    Disabled
                  </div>
                )}
                {formData.activeProvider === "openai" && formData.openaiEnabled && (
                  <div className="mt-2 text-xs text-purple-600 font-medium">Selected</div>
                )}
              </div>
              {/* Enable/Disable Toggle */}
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">Enable</span>
                <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={formData.openaiEnabled}
                    onChange={(e) => {
                      setFormData({ ...formData, openaiEnabled: e.target.checked });
                      // If disabling the active provider, switch to next enabled one
                      if (!e.target.checked && formData.activeProvider === "openai") {
                        if (formData.anthropicEnabled) {
                          handleProviderChange("anthropic");
                        } else if (formData.openrouterEnabled) {
                          handleProviderChange("openrouter");
                        }
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>

            {/* OpenRouter */}
            <div
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                formData.activeProvider === "openrouter"
                  ? "border-purple-500 bg-purple-50"
                  : !formData.openrouterEnabled
                    ? "border-gray-200 bg-gray-100 opacity-60"
                    : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div
                className={`${formData.openrouterEnabled ? "cursor-pointer" : "cursor-not-allowed"}`}
                onClick={() => formData.openrouterEnabled && handleProviderChange("openrouter")}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${formData.openrouterEnabled ? "bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]" : "bg-gray-400"} flex items-center justify-center`}>
                    <OpenRouterIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${formData.openrouterEnabled ? "text-gray-900" : "text-gray-500"}`}>OpenRouter</div>
                    <div className="text-xs text-gray-500">Multi-Model Gateway</div>
                  </div>
                </div>
                {settings?.hasOpenrouterKey && formData.openrouterEnabled && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
                    <CheckCircleIcon className="w-3 h-3" />
                    Key configured
                  </div>
                )}
                {!formData.openrouterEnabled && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-red-500">
                    <ExclamationCircleIcon className="w-3 h-3" />
                    Disabled
                  </div>
                )}
                {formData.activeProvider === "openrouter" && formData.openrouterEnabled && (
                  <div className="mt-2 text-xs text-purple-600 font-medium">Selected</div>
                )}
              </div>
              {/* Enable/Disable Toggle */}
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs text-gray-500">Enable</span>
                <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={formData.openrouterEnabled}
                    onChange={(e) => {
                      setFormData({ ...formData, openrouterEnabled: e.target.checked });
                      // If disabling the active provider, switch to next enabled one
                      if (!e.target.checked && formData.activeProvider === "openrouter") {
                        if (formData.anthropicEnabled) {
                          handleProviderChange("anthropic");
                        } else if (formData.openaiEnabled) {
                          handleProviderChange("openai");
                        }
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* OpenRouter info */}
          {formData.activeProvider === "openrouter" && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CurrencyDollarIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <strong>Cost Savings:</strong> OpenRouter provides access to FREE models like Llama 3.1 and Gemma 2.
                  Great for testing or high-volume use cases where quality trade-offs are acceptable.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* API Key for Selected Provider */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {formData.activeProvider === "anthropic" && "Anthropic API Key"}
            {formData.activeProvider === "openai" && "OpenAI API Key"}
            {formData.activeProvider === "openrouter" && "OpenRouter API Key"}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {formData.activeProvider === "anthropic" && (
              <>Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">console.anthropic.com</a></>
            )}
            {formData.activeProvider === "openai" && (
              <>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">platform.openai.com</a></>
            )}
            {formData.activeProvider === "openrouter" && (
              <>Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">openrouter.ai/keys</a></>
            )}
          </p>

          <div className="relative">
            <input
              type={showApiKeys[formData.activeProvider as keyof typeof showApiKeys] ? "text" : "password"}
              value={
                formData.activeProvider === "anthropic" ? formData.anthropicApiKey :
                formData.activeProvider === "openai" ? formData.openaiApiKey :
                formData.openrouterApiKey
              }
              onChange={(e) => {
                if (formData.activeProvider === "anthropic") {
                  setFormData({ ...formData, anthropicApiKey: e.target.value });
                } else if (formData.activeProvider === "openai") {
                  setFormData({ ...formData, openaiApiKey: e.target.value });
                } else {
                  setFormData({ ...formData, openrouterApiKey: e.target.value });
                }
              }}
              placeholder={hasActiveProviderKey() ? "••••••••••••••••••••" : "Enter your API key"}
              className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
            />
            <button
              type="button"
              onClick={() => setShowApiKeys({
                ...showApiKeys,
                [formData.activeProvider]: !showApiKeys[formData.activeProvider as keyof typeof showApiKeys]
              })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showApiKeys[formData.activeProvider as keyof typeof showApiKeys] ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          {hasActiveProviderKey() && (
            <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
              <CheckCircleIcon className="w-4 h-4" />
              API key is configured (leave blank to keep current key)
            </p>
          )}
        </div>

        {/* Model Selection */}
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-1">Model</h3>
          <p className="text-sm text-gray-500 mb-4">
            Choose the AI model to use for generating responses.
          </p>

          <select
            value={getActiveProviderModel()}
            onChange={(e) => setActiveProviderModel(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            {getActiveProviderModels().map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} - {model.price}
              </option>
            ))}
          </select>
        </div>

        {/* Advanced Settings */}
        <div className="border-b border-gray-200">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium text-gray-700">Advanced Settings</span>
            {showAdvanced ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {showAdvanced && (
            <div className="px-6 pb-6 space-y-4">
              {/* Fallback Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Enable Provider Fallback</div>
                  <div className="text-sm text-gray-500">
                    If the primary provider fails, automatically try other configured providers
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.useFallback}
                    onChange={(e) => setFormData({ ...formData, useFallback: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {/* Fallback Order */}
              {formData.useFallback && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fallback Order
                  </label>
                  <select
                    value={formData.fallbackOrder}
                    onChange={(e) => setFormData({ ...formData, fallbackOrder: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="openai,openrouter">OpenAI → OpenRouter</option>
                    <option value="openrouter,openai">OpenRouter → OpenAI</option>
                    <option value="anthropic,openrouter">Anthropic → OpenRouter</option>
                    <option value="anthropic,openai">Anthropic → OpenAI</option>
                    <option value="openrouter,anthropic">OpenRouter → Anthropic</option>
                    <option value="openai,anthropic">OpenAI → Anthropic</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    The order in which providers will be tried if the primary fails
                  </p>
                </div>
              )}

              {/* Other provider API keys */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Configure Other Providers</h4>
                <p className="text-xs text-gray-500 mb-4">
                  Add API keys for fallback providers or to enable multi-provider support
                </p>

                {/* Show non-active providers */}
                {formData.activeProvider !== "anthropic" && (
                  <div className="mb-3">
                    <label className="block text-sm text-gray-700 mb-1">Anthropic API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKeys.anthropic ? "text" : "password"}
                        value={formData.anthropicApiKey}
                        onChange={(e) => setFormData({ ...formData, anthropicApiKey: e.target.value })}
                        placeholder={settings?.hasAnthropicKey ? "••••••••" : "Enter key"}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKeys({ ...showApiKeys, anthropic: !showApiKeys.anthropic })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showApiKeys.anthropic ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {formData.activeProvider !== "openai" && (
                  <div className="mb-3">
                    <label className="block text-sm text-gray-700 mb-1">OpenAI API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKeys.openai ? "text" : "password"}
                        value={formData.openaiApiKey}
                        onChange={(e) => setFormData({ ...formData, openaiApiKey: e.target.value })}
                        placeholder={settings?.hasOpenaiKey ? "••••••••" : "Enter key"}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKeys({ ...showApiKeys, openai: !showApiKeys.openai })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showApiKeys.openai ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                {formData.activeProvider !== "openrouter" && (
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">OpenRouter API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKeys.openrouter ? "text" : "password"}
                        value={formData.openrouterApiKey}
                        onChange={(e) => setFormData({ ...formData, openrouterApiKey: e.target.value })}
                        placeholder={settings?.hasOpenrouterKey ? "••••••••" : "Enter key"}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKeys({ ...showApiKeys, openrouter: !showApiKeys.openrouter })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showApiKeys.openrouter ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Test & Status */}
        {(testResult || saveMessage) && (
          <div className="px-6 pt-4">
            {testResult && (
              <div className={`p-3 rounded-lg flex items-center gap-2 ${
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
            {saveMessage && (
              <div className={`p-3 rounded-lg flex items-center gap-2 mt-2 ${
                saveMessage.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}>
                {saveMessage.success ? (
                  <CheckCircleIcon className="w-5 h-5" />
                ) : (
                  <ExclamationCircleIcon className="w-5 h-5" />
                )}
                {saveMessage.message}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="p-6 flex items-center justify-between bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || !hasActiveProviderKey()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isTesting ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <h4 className="font-medium text-purple-900 mb-2">How AI Assist Works</h4>
        <ul className="text-sm text-purple-700 space-y-1">
          <li>• When viewing a ticket, agents can click the &quot;AI Assist&quot; button</li>
          <li>• The AI analyzes the ticket conversation and generates a summary</li>
          <li>• It also suggests a professional reply based on the context</li>
          <li>• Agents can insert the suggested reply directly into the composer</li>
          <li>• With fallback enabled, if one provider fails, another will be tried automatically</li>
        </ul>
      </div>

      {/* Cost Comparison Box */}
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
          <CurrencyDollarIcon className="w-5 h-5" />
          Cost Comparison
        </h4>
        <div className="text-sm text-green-700 space-y-2">
          <p><strong>Most Affordable:</strong> OpenRouter with FREE models (Llama 3.1 8B, Gemma 2, Mistral 7B)</p>
          <p><strong>Best Value:</strong> GPT-4o Mini ($0.15/1M) or Claude 3.5 Haiku ($0.25/1M)</p>
          <p><strong>Best Quality:</strong> Claude 3.5 Sonnet or GPT-4o (higher cost but better results)</p>
        </div>
      </div>
    </div>
  );
}
