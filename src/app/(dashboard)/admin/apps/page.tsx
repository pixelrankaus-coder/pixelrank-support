'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  StarIcon,
  FireIcon,
  BoltIcon,
  CheckBadgeIcon,
  PhoneIcon,
  ShoppingCartIcon,
  BriefcaseIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface App {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
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
  screenshots?: { url: string; title: string; description?: string }[];
  developer?: { name: string; verified: boolean; website?: string };
  reviewStats?: { averageRating: number; totalReviews: number; totalInstalls: number };
  features?: string[];
  tags?: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  isStaffPick?: boolean;
  releaseDate?: string;
  lastUpdated?: string;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  ai: SparklesIcon,
  productivity: BoltIcon,
  integrations: PuzzlePieceIcon,
  reporting: ChartBarIcon,
  feedback: StarIcon,
  customization: Cog6ToothIcon,
  'self-service': BookOpenIcon,
  communication: ChatBubbleLeftRightIcon,
  crm: BriefcaseIcon,
  ecommerce: ShoppingCartIcon,
};

const CATEGORY_LABELS: Record<string, string> = {
  ai: 'AI & Automation',
  productivity: 'Productivity',
  integrations: 'Integrations',
  reporting: 'Reporting & Analytics',
  feedback: 'Feedback & Surveys',
  customization: 'Customization',
  'self-service': 'Self-Service',
  communication: 'Communication',
  crm: 'CRM & Sales',
  ecommerce: 'E-commerce',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIconSolid
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= rating ? 'text-yellow-400' : 'text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

export default function AppsPage() {
  const [apps, setApps] = useState<App[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [installingApp, setInstallingApp] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchesSearch =
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = !selectedCategory || app.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [apps, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(apps.map(app => app.category)));
    return cats.sort((a, b) => (CATEGORY_LABELS[a] || a).localeCompare(CATEGORY_LABELS[b] || b));
  }, [apps]);

  const featuredApps = useMemo(() => apps.filter(app => app.isFeatured), [apps]);
  const staffPicks = useMemo(() => apps.filter(app => app.isStaffPick), [apps]);
  const newApps = useMemo(() => apps.filter(app => app.isNew), [apps]);
  const popularApps = useMemo(() => apps.filter(app => app.isPopular), [apps]);
  const installedApps = useMemo(() => apps.filter(app => app.isInstalled), [apps]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-4 flex-shrink-0">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Browse
          </h2>
          <nav className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                !selectedCategory
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CubeIcon className="w-5 h-5" />
              All Apps
              <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                {apps.length}
              </span>
            </button>
          </nav>
        </div>

        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Collections
          </h2>
          <nav className="space-y-1">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery('featured');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <FireIcon className="w-5 h-5 text-orange-500" />
              Featured
              <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                {featuredApps.length}
              </span>
            </button>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery('');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <StarIcon className="w-5 h-5 text-purple-500" />
              Staff Picks
              <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                {staffPicks.length}
              </span>
            </button>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery('');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <BoltIcon className="w-5 h-5 text-yellow-500" />
              Popular
              <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                {popularApps.length}
              </span>
            </button>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSearchQuery('');
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <SparklesIcon className="w-5 h-5 text-green-500" />
              New
              <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                {newApps.length}
              </span>
            </button>
          </nav>
        </div>

        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Categories
          </h2>
          <nav className="space-y-1">
            {categories.map(category => {
              const CategoryIcon = CATEGORY_ICONS[category] || CubeIcon;
              const count = apps.filter(a => a.category === category).length;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <CategoryIcon className="w-5 h-5" />
                  {CATEGORY_LABELS[category] || category}
                  <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {installedApps.length > 0 && (
          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              My Apps
            </h2>
            <nav className="space-y-1">
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery('installed');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <CheckCircleIcon className="w-5 h-5 text-green-500" />
                Installed
                <span className="ml-auto text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">
                  {installedApps.length}
                </span>
              </button>
            </nav>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">App Marketplace</h1>
          <p className="text-gray-500 mt-1">
            Extend your helpdesk with powerful apps and integrations
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl mb-8">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search apps, integrations, and tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
          />
        </div>

        {/* Featured Apps Hero */}
        {!selectedCategory && !searchQuery && featuredApps.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <FireIcon className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">Featured Apps</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredApps.slice(0, 3).map(app => (
                <FeaturedAppCard
                  key={app.id}
                  app={app}
                  isInstalling={installingApp === app.id}
                  onInstall={() => handleInstall(app.id)}
                  onUninstall={() => handleUninstall(app.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Staff Picks */}
        {!selectedCategory && !searchQuery && staffPicks.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <StarIcon className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">Staff Picks</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {staffPicks.slice(0, 4).map(app => (
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
          </section>
        )}

        {/* Popular Apps */}
        {!selectedCategory && !searchQuery && popularApps.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <BoltIcon className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900">Most Popular</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularApps.slice(0, 4).map(app => (
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
          </section>
        )}

        {/* New Apps */}
        {!selectedCategory && !searchQuery && newApps.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <SparklesIcon className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">Recently Added</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {newApps.slice(0, 4).map(app => (
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
          </section>
        )}

        {/* All Apps / Filtered Results */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedCategory
                ? CATEGORY_LABELS[selectedCategory] || selectedCategory
                : searchQuery
                  ? `Search Results (${filteredApps.length})`
                  : 'All Apps'
              }
            </h2>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>

          {filteredApps.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
        </section>
      </main>
    </div>
  );
}

interface FeaturedAppCardProps {
  app: App;
  isInstalling: boolean;
  onInstall: () => void;
  onUninstall: () => void;
}

function FeaturedAppCard({ app, isInstalling, onInstall, onUninstall }: FeaturedAppCardProps) {
  return (
    <Link
      href={`/admin/apps/${app.id}`}
      className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white hover:shadow-lg transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-3xl flex-shrink-0">
          {app.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg truncate">{app.name}</h3>
            {app.developer?.verified && (
              <CheckBadgeIcon className="w-5 h-5 text-blue-200 flex-shrink-0" />
            )}
          </div>
          <p className="text-white/80 text-sm line-clamp-2 mt-1">
            {app.description}
          </p>
          {app.reviewStats && (
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1">
                <StarIconSolid className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-medium">{app.reviewStats.averageRating.toFixed(1)}</span>
              </div>
              <span className="text-white/60 text-sm">
                {formatNumber(app.reviewStats.totalInstalls)} installs
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        {app.isPremium ? (
          <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">
            ${app.monthlyPrice}/mo
          </span>
        ) : (
          <span className="text-sm font-semibold bg-green-400/30 px-3 py-1 rounded-full">
            Free
          </span>
        )}
        {app.isInstalled ? (
          <span className="text-sm bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
            <CheckCircleIcon className="w-4 h-4" />
            Installed
          </span>
        ) : (
          <span className="text-sm bg-white px-4 py-1.5 rounded-full text-blue-600 font-medium group-hover:bg-blue-50">
            View Details
          </span>
        )}
      </div>
    </Link>
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
  return (
    <div className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow flex flex-col">
      <Link href={`/admin/apps/${app.id}`} className="flex-1">
        <div className="flex items-start gap-3">
          {/* App Icon */}
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            {app.icon}
          </div>

          {/* App Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-gray-900 truncate">{app.name}</h3>
              {app.developer?.verified && (
                <CheckBadgeIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
              {app.isNew && (
                <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                  NEW
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
              {app.description}
            </p>
          </div>
        </div>

        {/* Ratings and Installs */}
        {app.reviewStats && (
          <div className="flex items-center gap-3 mt-3 text-sm">
            <div className="flex items-center gap-1">
              <StarRating rating={Math.round(app.reviewStats.averageRating)} />
              <span className="text-gray-500 ml-1">
                {app.reviewStats.averageRating.toFixed(1)}
              </span>
            </div>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">
              {formatNumber(app.reviewStats.totalInstalls)} installs
            </span>
          </div>
        )}

        {/* Tags */}
        {app.tags && app.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {app.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* Price and Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t">
        {app.isPremium ? (
          <span className="text-sm font-semibold text-gray-700">
            ${app.monthlyPrice}/mo
          </span>
        ) : (
          <span className="text-sm font-semibold text-green-600">
            Free
          </span>
        )}

        {app.isInstalled ? (
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.preventDefault(); onToggle(); }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                app.isEnabled
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {app.isEnabled ? 'Enabled' : 'Disabled'}
            </button>
            <button
              onClick={(e) => { e.preventDefault(); onUninstall(); }}
              disabled={isInstalling}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.preventDefault(); onInstall(); }}
            disabled={isInstalling}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isInstalling ? (
              'Installing...'
            ) : (
              <>
                <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                Install
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
