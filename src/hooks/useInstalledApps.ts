'use client';

import { useEffect, useState, useCallback } from 'react';

export interface InstalledApp {
  app_id: string;
  enabled: boolean;
  config: Record<string, unknown>;
  installed_at: string;
}

export function useInstalledApps() {
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInstalledApps = useCallback(async () => {
    try {
      // TODO: Replace with actual API call when tenant_apps table exists
      // const response = await fetch('/api/apps/installed');
      // const data = await response.json();
      // setInstalledApps(data);

      // Mock data - AI Assist enabled by default
      setInstalledApps([
        {
          app_id: 'ai-assist',
          enabled: true,
          config: {},
          installed_at: new Date().toISOString()
        }
      ]);
    } catch {
      // Fallback mock data
      setInstalledApps([
        {
          app_id: 'ai-assist',
          enabled: true,
          config: {},
          installed_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstalledApps();
  }, [fetchInstalledApps]);

  return { installedApps, isLoading, refetch: fetchInstalledApps };
}
