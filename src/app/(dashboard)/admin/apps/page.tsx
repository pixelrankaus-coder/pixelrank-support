'use client';

import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  SparklesIcon,
  CubeIcon,
  PuzzlePieceIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ArrowDownTrayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface App {
  id: string;
  name: string;
  description: string;
  icon: string;
  version: string;
  category: string;
  isPremium: boolean;
  monthlyPrice: number;
  permissions: string[];
  slots: string[];
  isInstalled: boolean;
  isEnabled: boolean;
  config: Record<string, unknown>;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  ai: SparklesIcon,
  productivity: CubeIcon,
  integrations: PuzzlePieceIcon,
  reporting: ChartBarIcon,
  feedback: ChatBubbleLeftRightIcon,
  customization: Cog6ToothIcon,
};

const CATEGORY_LABELS: Record<string, string> = {
  ai: 'AI & Automation',
  productivity: 'Productivity',
  integrations: 'Integrations',
  reporting: 'Reporting',
  feedback: 'Feedback',
  customization: 'Customization',
  'self-service': 'Self-Service',
};

export default function AppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [installingApp, setInstallingApp] = useState<string | null>(null);

  useEffect(() => {
    fetchApps();
  }, []);

  async function fetchApps() {
    try {
      const response = await fetch('/api/apps');
      if (response.ok) {
        const data = await response.json();
        setApps(data);
      }
    } catch (error) {
      console.error('Error fetching apps:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleInstall(appId: string) {
    setInstallingApp(appId);
    try {
      const response = await fetch(`/api/apps/${appId}`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchApps();
      }
    } catch (error) {
      console.error('Error installing app:', error);
    } finally {
      setInstallingApp(null);
    }
  }

  async function handleUninstall(appId: string) {
    setInstallingApp(appId);
    try {
      const response = await fetch(`/api/apps/${appId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchApps();
      }
    } catch (error) {
      console.error('Error uninstalling app:', error);
    } finally {
      setInstallingApp(null);
    }
  }

  async function handleToggle(appId: string, isEnabled: boolean) {
    try {
      const response = await fetch(`/api/apps/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !isEnabled }),
      });
      if (response.ok) {
        await fetchApps();
      }
    } catch (error) {
      console.error('Error toggling app:', error);
    }
  }

  const filteredApps = apps.filter(app => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || app.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(apps.map(app => app.category)));
  const installedApps = apps.filter(app => app.isInstalled);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">App Store</h1>
        <p className="text-gray-500 mt-1">
          Extend your helpdesk with powerful apps and integrations
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search apps..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {CATEGORY_LABELS[category] || category}
            </button>
          ))}
        </div>
      </div>

      {/* Installed Apps Section */}
      {installedApps.length > 0 && !selectedCategory && !searchQuery && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Installed Apps ({installedApps.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {installedApps.map(app => (
              <AppCard
                key={app.id}
                app={app}
                isInstalling={installingApp === app.id}
                onInstall={() => handleInstall(app.id)}
                onUninstall={() => handleUninstall(app.id)}
                onToggle={() => handleToggle(app.id, app.isEnabled)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All Apps / Filtered Apps */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {selectedCategory
            ? CATEGORY_LABELS[selectedCategory] || selectedCategory
            : searchQuery
              ? `Search Results (${filteredApps.length})`
              : 'Available Apps'
          }
        </h2>
        {filteredApps.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <CubeIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No apps found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-2 text-blue-600 hover:underline text-sm"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredApps.map(app => (
              <AppCard
                key={app.id}
                app={app}
                isInstalling={installingApp === app.id}
                onInstall={() => handleInstall(app.id)}
                onUninstall={() => handleUninstall(app.id)}
                onToggle={() => handleToggle(app.id, app.isEnabled)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface AppCardProps {
  app: App;
  isInstalling: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onToggle: () => void;
}

function AppCard({ app, isInstalling, onInstall, onUninstall, onToggle }: AppCardProps) {
  const CategoryIcon = CATEGORY_ICONS[app.category] || CubeIcon;

  return (
    <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* App Icon */}
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-2xl flex-shrink-0">
          {app.icon || <CategoryIcon className="w-6 h-6" />}
        </div>

        {/* App Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{app.name}</h3>
            {app.isInstalled && (
              <CheckCircleIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
            {app.description}
          </p>
        </div>
      </div>

      {/* App Meta */}
      <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
        <span className="bg-gray-100 px-2 py-0.5 rounded">
          {CATEGORY_LABELS[app.category] || app.category}
        </span>
        <span>v{app.version}</span>
        {app.isPremium && (
          <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-medium">
            ${app.monthlyPrice}/mo
          </span>
        )}
      </div>

      {/* Slots */}
      {app.slots.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {app.slots.map(slot => (
            <span
              key={slot}
              className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded"
            >
              {slot.replace(/-/g, ' ')}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t">
        {app.isInstalled ? (
          <>
            <button
              onClick={onToggle}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                app.isEnabled
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {app.isEnabled ? 'Enabled' : 'Disabled'}
            </button>
            <button
              onClick={onUninstall}
              disabled={isInstalling}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={onInstall}
            disabled={isInstalling}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isInstalling ? (
              'Installing...'
            ) : (
              <>
                <ArrowDownTrayIcon className="w-4 h-4" />
                Install
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
