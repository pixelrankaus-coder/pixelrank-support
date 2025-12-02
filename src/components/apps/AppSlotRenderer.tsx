'use client';

import { AppSlot, appRegistry } from '@/lib/app-registry';
import { useInstalledApps } from '@/hooks/useInstalledApps';

interface AppSlotRendererProps {
  slot: AppSlot;
  className?: string;
}

export function AppSlotRenderer({ slot, className }: AppSlotRendererProps) {
  const { installedApps, isLoading } = useInstalledApps();

  if (isLoading) return null;

  const appsForSlot = installedApps
    .filter(installed => installed.enabled)
    .map(installed => appRegistry[installed.app_id])
    .filter(app => app?.slots[slot]);

  if (appsForSlot.length === 0) return null;

  return (
    <div className={className}>
      {appsForSlot.map(app => {
        const Component = app.slots[slot]!;
        return (
          <div key={app.id} data-app-id={app.id}>
            <Component />
          </div>
        );
      })}
    </div>
  );
}
