import { ComponentType } from 'react';

export type AppSlot =
  | 'ticket-detail-sidebar'
  | 'ticket-toolbar'
  | 'compose-toolbar'
  | 'dashboard-widget'
  | 'settings-menu'
  | 'contact-sidebar';

export interface AppManifest {
  id: string;
  name: string;
  description: string;
  icon: string;
  version: string;
  category: 'ai' | 'productivity' | 'integrations' | 'customization' | 'reporting' | 'feedback' | 'self-service';
  isPremium: boolean;
  monthlyPrice: number;
  slots: Partial<Record<AppSlot, ComponentType>>;
  permissions: string[];
}

export const appRegistry: Record<string, AppManifest> = {};

export function registerApp(app: AppManifest) {
  appRegistry[app.id] = app;
}

export function getApp(id: string): AppManifest | undefined {
  return appRegistry[id];
}

export function getAllApps(): AppManifest[] {
  return Object.values(appRegistry);
}
