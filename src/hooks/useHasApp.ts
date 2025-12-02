'use client';

import { useInstalledApps } from './useInstalledApps';

export function useHasApp(appId: string): boolean {
  const { installedApps, isLoading } = useInstalledApps();
  if (isLoading) return false;
  return installedApps.some(app => app.app_id === appId && app.enabled);
}
