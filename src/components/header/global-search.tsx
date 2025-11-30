"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { TicketIcon, UserIcon, LightBulbIcon, Cog6ToothIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

interface SearchResult {
  type: "ticket" | "contact" | "solution";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

interface RecentItem {
  type: "ticket" | "contact" | "solution";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

const TABS = [
  { id: "all", label: "All" },
  { id: "tickets", label: "Tickets" },
  { id: "contacts", label: "Contacts" },
  { id: "solutions", label: "Solutions" },
];

export function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Load recent data from localStorage
  useEffect(() => {
    if (open) {
      const searches = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      const viewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
      setRecentSearches(searches.slice(0, 5));
      setRecentlyViewed(viewed.slice(0, 5));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, onClose]);

  // Debounced search
  const searchDebounce = useRef<NodeJS.Timeout>();

  const performSearch = useCallback(async (searchQuery: string, tab: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ q: searchQuery });
      if (tab !== "all") {
        params.set("type", tab);
      }

      const res = await fetch(`/api/search?${params}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchDebounce.current) {
      clearTimeout(searchDebounce.current);
    }

    searchDebounce.current = setTimeout(() => {
      performSearch(query, activeTab);
    }, 300);

    return () => {
      if (searchDebounce.current) {
        clearTimeout(searchDebounce.current);
      }
    };
  }, [query, activeTab, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Save to recent searches
      const searches = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      const newSearches = [query, ...searches.filter((s: string) => s !== query)].slice(0, 10);
      localStorage.setItem("recentSearches", JSON.stringify(newSearches));
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Save to recently viewed
    const viewed = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
    const newViewed = [
      { type: result.type, id: result.id, title: result.title, subtitle: result.subtitle, href: result.href },
      ...viewed.filter((v: RecentItem) => v.id !== result.id)
    ].slice(0, 10);
    localStorage.setItem("recentlyViewed", JSON.stringify(newViewed));

    onClose();
    router.push(result.href);
  };

  const clearRecentSearches = () => {
    localStorage.setItem("recentSearches", "[]");
    setRecentSearches([]);
  };

  const clearRecentlyViewed = () => {
    localStorage.setItem("recentlyViewed", "[]");
    setRecentlyViewed([]);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "ticket":
        return <TicketIcon className="w-5 h-5 text-gray-400" />;
      case "contact":
        return <UserIcon className="w-5 h-5 text-gray-400" />;
      case "solution":
        return <LightBulbIcon className="w-5 h-5 text-gray-400" />;
      default:
        return <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/25" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center pt-20 px-4">
        <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl">
          {/* Search input */}
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-center px-4 border-b border-gray-200">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Tickets, Contacts, Solutions, Forums"
                className="flex-1 px-3 py-4 text-base text-gray-900 placeholder-gray-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="ml-2 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Tabs */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
            <div className="flex-1" />
            <button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Results / Recent */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Searching...</div>
            ) : query.trim() ? (
              // Search results
              results.length > 0 ? (
                <div className="py-2">
                  {results.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                    >
                      {getIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {result.title}
                        </p>
                        {result.subtitle && (
                          <p className="text-xs text-gray-500 truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No results found for "{query}"
                </div>
              )
            ) : (
              // Recent searches and recently viewed
              <div>
                {recentSearches.length > 0 && (
                  <div className="py-2">
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        Recently searched
                      </span>
                      <button
                        onClick={clearRecentSearches}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Clear
                      </button>
                    </div>
                    {recentSearches.map((search, i) => (
                      <button
                        key={i}
                        onClick={() => setQuery(search)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
                      >
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{search}</span>
                      </button>
                    ))}
                  </div>
                )}

                {recentlyViewed.length > 0 && (
                  <div className="py-2 border-t border-gray-100">
                    <div className="flex items-center justify-between px-4 py-2">
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        Recently viewed
                      </span>
                      <button
                        onClick={clearRecentlyViewed}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Clear
                      </button>
                    </div>
                    {recentlyViewed.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={onClose}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50"
                      >
                        {getIcon(item.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 truncate">{item.title}</p>
                          {item.subtitle && (
                            <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {recentSearches.length === 0 && recentlyViewed.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <MagnifyingGlassIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p>Start typing to search</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
