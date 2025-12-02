'use client';

import { useEffect, useState, useCallback } from 'react';

export interface InstalledApp {
  app_id: string;
  enabled: boolean;
  config: Record<string, unknown>;
  installed_at: string;
  name?: string;
  description?: string;
  icon?: string;
  slots?: string[];
}

export function useInstalledApps() {
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInstalledApps = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/apps/installed');
      if (!response.ok) {
        throw new Error('Failed to fetch installed apps');
      }
      const data = await response.json();
      setInstalledApps(data);
    } catch (err) {
      console.error('Error fetching installed apps:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fallback mock data for development
      setInstalledApps([
        {
          app_id: 'ai-assist',
          enabled: true,
          config: {},
          installed_at: new Date().toISOString(),
          name: 'AI Assist',
          description: 'AI-powered assistance for tickets',
          icon: '🤖',
          slots: ['ticket-detail-sidebar', 'compose-toolbar']
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstalledApps();
  }, [fetchInstalledApps]);

  return { installedApps, isLoading, error, refetch: fetchInstalledApps };
}
