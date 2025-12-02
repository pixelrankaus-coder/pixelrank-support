'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  TrashIcon,
  StarIcon,
  CheckBadgeIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
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
  developer?: { name: string; verified: boolean; website?: string; email?: string };
  reviewStats?: { averageRating: number; totalReviews: number; totalInstalls: number };
  features?: string[];
  tags?: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  isStaffPick?: boolean;
  releaseDate?: string;
  lastUpdated?: string;
  changelog?: { version: string; date: string; changes: string[] }[];
  requirements?: string[];
  supportUrl?: string;
  documentationUrl?: string;
  privacyPolicyUrl?: string;
}

// Demo reviews for visual purposes
const DEMO_REVIEWS = [
  {
    id: '1',
    author: 'Sarah M.',
    rating: 5,
    date: '2024-11-15',
    title: 'Exactly what we needed!',
    content: 'This app has transformed how we handle support tickets. The integration was seamless and the team loves it.',
    helpful: 24,
  },
  {
    id: '2',
    author: 'Mike R.',
    rating: 4,
    date: '2024-11-10',
    title: 'Great app with minor issues',
    content: 'Works great for the most part. Had some initial setup issues but support was responsive and helped resolve them quickly.',
    helpful: 12,
  },
  {
    id: '3',
    author: 'Lisa K.',
    rating: 5,
    date: '2024-10-28',
    title: 'A must-have',
    content: 'Cannot imagine running our helpdesk without this app now. Highly recommend to any support team.',
    helpful: 18,
  },
];

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIconSolid
          key={star}
          className={`${sizes[size]} ${
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function AppDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;

  const [app, setApp] = useState<App | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'changelog'>('overview');
  const [selectedScreenshot, setSelectedScreenshot] = useState<number | null>(null);

  useEffect(() => {
    fetchApp();
  }, [appId]);

  async function fetchApp() {
    try {
      const response = await fetch('/api/apps');
      if (response.ok) {
        const apps = await response.json();
        const foundApp = apps.find((a: App) => a.id === appId);
        setApp(foundApp || null);
      }
    } catch (error) {
      console.error('Error fetching app:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleInstall() {
    setIsInstalling(true);
    try {
      const response = await fetch(`/api/apps/${appId}`, {
        method: 'POST',
      });
      if (response.ok) {
        await fetchApp();
      }
    } catch (error) {
      console.error('Error installing app:', error);
    } finally {
      setIsInstalling(false);
    }
  }

  async function handleUninstall() {
    setIsInstalling(true);
    try {
      const response = await fetch(`/api/apps/${appId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchApp();
      }
    } catch (error) {
      console.error('Error uninstalling app:', error);
    } finally {
      setIsInstalling(false);
    }
  }

  async function handleToggle() {
    if (!app) return;
    try {
      const response = await fetch(`/api/apps/${appId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !app.isEnabled }),
      });
      if (response.ok) {
        await fetchApp();
      }
    } catch (error) {
      console.error('Error toggling app:', error);
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-24 mb-6"></div>
          <div className="flex gap-8">
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="w-80">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="p-6">
        <Link
          href="/admin/apps"
          className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-6"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to App Store
        </Link>
        <div className="text-center py-12 bg-white rounded-lg border">
          <h2 className="text-xl font-semibold text-gray-900">App not found</h2>
          <p className="text-gray-500 mt-2">The app you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link
            href="/admin/apps"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Marketplace
          </Link>

          <div className="flex gap-6">
            {/* App Icon */}
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center text-5xl flex-shrink-0 shadow-sm">
              {app.icon}
            </div>

            {/* App Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{app.name}</h1>
                {app.developer?.verified && (
                  <CheckBadgeIcon className="w-6 h-6 text-blue-500" title="Verified Developer" />
                )}
                {app.isNew && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    NEW
                  </span>
                )}
                {app.isStaffPick && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                    STAFF PICK
                  </span>
                )}
              </div>

              <p className="text-gray-600 mt-2">{app.description}</p>

              <div className="flex items-center gap-6 mt-4">
                {/* Rating */}
                {app.reviewStats && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(app.reviewStats.averageRating)} size="lg" />
                    <span className="font-semibold text-gray-900">
                      {app.reviewStats.averageRating.toFixed(1)}
                    </span>
                    <span className="text-gray-500">
                      ({formatNumber(app.reviewStats.totalReviews)} reviews)
                    </span>
                  </div>
                )}

                {/* Installs */}
                {app.reviewStats && (
                  <div className="text-gray-500">
                    {formatNumber(app.reviewStats.totalInstalls)}+ installs
                  </div>
                )}

                {/* Developer */}
                {app.developer && (
                  <div className="flex items-center gap-1 text-gray-500">
                    by{' '}
                    {app.developer.website ? (
                      <a
                        href={app.developer.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {app.developer.name}
                      </a>
                    ) : (
                      <span>{app.developer.name}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="w-48 flex flex-col gap-3">
              {app.isInstalled ? (
                <>
                  <button
                    onClick={handleToggle}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      app.isEnabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {app.isEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button
                    onClick={handleUninstall}
                    disabled={isInstalling}
                    className="w-full py-3 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Uninstall
                  </button>
                </>
              ) : (
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isInstalling ? (
                    'Installing...'
                  ) : (
                    <>
                      <ArrowDownTrayIcon className="w-5 h-5" />
                      {app.isPremium ? `Install - $${app.monthlyPrice}/mo` : 'Install Free'}
                    </>
                  )}
                </button>
              )}

              {/* Price Badge */}
              {!app.isInstalled && (
                <div className="text-center">
                  {app.isPremium ? (
                    <span className="text-lg font-bold text-gray-900">${app.monthlyPrice}/month</span>
                  ) : (
                    <span className="text-lg font-bold text-green-600">Free</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex gap-8">
            {['overview', 'reviews', 'changelog'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'overview' && (
              <>
                {/* Screenshots */}
                {app.screenshots && app.screenshots.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Screenshots</h2>
                    <div className="grid grid-cols-3 gap-4">
                      {app.screenshots.map((screenshot, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedScreenshot(index)}
                          className="aspect-video bg-gray-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                        >
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                            <div className="text-center p-4">
                              <div className="text-3xl mb-2">{app.icon}</div>
                              <div className="text-sm font-medium text-gray-700">
                                {screenshot.title}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* Description */}
                <section className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Description</h2>
                  <div className="prose prose-gray max-w-none">
                    {app.longDescription ? (
                      <div
                        className="whitespace-pre-wrap text-gray-600"
                        dangerouslySetInnerHTML={{
                          __html: app.longDescription
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/### (.*)/g, '<h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">$1</h3>')
                            .replace(/- (.*)/g, '<li class="ml-4">$1</li>')
                            .replace(/\n\n/g, '</p><p class="mt-4">')
                        }}
                      />
                    ) : (
                      <p className="text-gray-600">{app.description}</p>
                    )}
                  </div>
                </section>

                {/* Features */}
                {app.features && app.features.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
                    <ul className="grid grid-cols-2 gap-3">
                      {app.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-600">
                          <CheckCircleIcon className="w-5 h-5 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Permissions */}
                {app.permissions && app.permissions.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Permissions</h2>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500 mb-3">
                        This app requires the following permissions:
                      </p>
                      <ul className="space-y-2">
                        {app.permissions.map((permission, index) => (
                          <li key={index} className="flex items-center gap-2 text-gray-700">
                            <ShieldCheckIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            {permission.replace(/:/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}
              </>
            )}

            {activeTab === 'reviews' && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Reviews</h2>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                    Write a Review
                  </button>
                </div>

                {/* Rating Summary */}
                {app.reviewStats && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-5xl font-bold text-gray-900">
                          {app.reviewStats.averageRating.toFixed(1)}
                        </div>
                        <StarRating rating={Math.round(app.reviewStats.averageRating)} size="lg" />
                        <div className="text-sm text-gray-500 mt-1">
                          {formatNumber(app.reviewStats.totalReviews)} reviews
                        </div>
                      </div>
                      <div className="flex-1">
                        {[5, 4, 3, 2, 1].map((stars) => (
                          <div key={stars} className="flex items-center gap-2 mb-1">
                            <span className="w-3 text-sm text-gray-500">{stars}</span>
                            <StarIconSolid className="w-4 h-4 text-yellow-400" />
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400 rounded-full"
                                style={{
                                  width: `${stars === 5 ? 70 : stars === 4 ? 20 : stars === 3 ? 7 : 3}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-6">
                  {DEMO_REVIEWS.map((review) => (
                    <div key={review.id} className="bg-white border rounded-lg p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-semibold text-gray-900">{review.author}</div>
                          <StarRating rating={review.rating} />
                        </div>
                        <div className="text-sm text-gray-500">{formatDate(review.date)}</div>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                      <p className="text-gray-600">{review.content}</p>
                      <div className="flex items-center gap-4 mt-4 text-sm">
                        <button className="text-gray-500 hover:text-blue-600">
                          Helpful ({review.helpful})
                        </button>
                        <button className="text-gray-500 hover:text-blue-600">Reply</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'changelog' && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Changelog</h2>
                {app.changelog && app.changelog.length > 0 ? (
                  <div className="space-y-6">
                    {app.changelog.map((entry, index) => (
                      <div key={index} className="border-l-2 border-blue-500 pl-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-gray-900">v{entry.version}</span>
                          <span className="text-sm text-gray-500">{formatDate(entry.date)}</span>
                        </div>
                        <ul className="space-y-1">
                          {entry.changes.map((change, i) => (
                            <li key={i} className="text-gray-600">• {change}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg border">
                    <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No changelog available</p>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="w-80 flex-shrink-0">
            <div className="bg-white border rounded-lg p-6 sticky top-6">
              <h3 className="font-semibold text-gray-900 mb-4">App Information</h3>

              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-gray-500">Version</dt>
                  <dd className="font-medium text-gray-900">{app.version}</dd>
                </div>

                <div>
                  <dt className="text-gray-500">Category</dt>
                  <dd className="font-medium text-gray-900 capitalize">{app.category.replace(/-/g, ' ')}</dd>
                </div>

                {app.lastUpdated && (
                  <div>
                    <dt className="text-gray-500">Last Updated</dt>
                    <dd className="font-medium text-gray-900">{formatDate(app.lastUpdated)}</dd>
                  </div>
                )}

                {app.releaseDate && (
                  <div>
                    <dt className="text-gray-500">Released</dt>
                    <dd className="font-medium text-gray-900">{formatDate(app.releaseDate)}</dd>
                  </div>
                )}

                {app.developer && (
                  <div>
                    <dt className="text-gray-500 mb-2">Developer</dt>
                    <dd className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{app.developer.name}</span>
                        {app.developer.verified && (
                          <CheckBadgeIcon className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      {app.developer.website && (
                        <a
                          href={app.developer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-600 hover:underline"
                        >
                          <GlobeAltIcon className="w-4 h-4" />
                          Website
                        </a>
                      )}
                      {app.developer.email && (
                        <a
                          href={`mailto:${app.developer.email}`}
                          className="flex items-center gap-2 text-blue-600 hover:underline"
                        >
                          <EnvelopeIcon className="w-4 h-4" />
                          Contact
                        </a>
                      )}
                    </dd>
                  </div>
                )}

                {app.tags && app.tags.length > 0 && (
                  <div>
                    <dt className="text-gray-500 mb-2">Tags</dt>
                    <dd className="flex flex-wrap gap-1">
                      {app.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </aside>
        </div>
      </div>

      {/* Screenshot Modal */}
      {selectedScreenshot !== null && app.screenshots && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={() => setSelectedScreenshot(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setSelectedScreenshot(null)}
          >
            <XMarkIcon className="w-8 h-8" />
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedScreenshot(Math.max(0, selectedScreenshot - 1));
            }}
            disabled={selectedScreenshot === 0}
          >
            <ChevronLeftIcon className="w-10 h-10" />
          </button>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedScreenshot(Math.min(app.screenshots!.length - 1, selectedScreenshot + 1));
            }}
            disabled={selectedScreenshot === app.screenshots.length - 1}
          >
            <ChevronRightIcon className="w-10 h-10" />
          </button>

          <div
            className="max-w-4xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-7xl mb-4">{app.icon}</div>
                <div className="text-xl font-medium text-gray-700">
                  {app.screenshots[selectedScreenshot].title}
                </div>
                {app.screenshots[selectedScreenshot].description && (
                  <div className="text-gray-500 mt-2">
                    {app.screenshots[selectedScreenshot].description}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
