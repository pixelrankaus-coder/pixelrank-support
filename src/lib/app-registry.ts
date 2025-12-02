import { ComponentType } from 'react';

export type AppSlot =
  | 'ticket-detail-sidebar'
  | 'ticket-toolbar'
  | 'compose-toolbar'
  | 'dashboard-widget'
  | 'settings-menu'
  | 'contact-sidebar';

export type AppCategory =
  | 'ai'
  | 'productivity'
  | 'integrations'
  | 'customization'
  | 'reporting'
  | 'feedback'
  | 'self-service'
  | 'communication'
  | 'crm'
  | 'ecommerce';

export interface AppScreenshot {
  url: string;
  title: string;
  description?: string;
}

export interface AppDeveloper {
  name: string;
  website?: string;
  email?: string;
  verified: boolean;
}

export interface AppReviewStats {
  averageRating: number;
  totalReviews: number;
  totalInstalls: number;
}

export interface AppManifest {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  icon: string;
  version: string;
  category: AppCategory;
  isPremium: boolean;
  monthlyPrice: number;
  slots: Partial<Record<AppSlot, ComponentType>>;
  permissions: string[];

  // Enhanced marketplace fields
  screenshots?: AppScreenshot[];
  developer?: AppDeveloper;
  reviewStats?: AppReviewStats;
  features?: string[];
  requirements?: string[];
  changelog?: { version: string; date: string; changes: string[] }[];
  tags?: string[];
  isFeatured?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  isStaffPick?: boolean;
  releaseDate?: string;
  lastUpdated?: string;
  supportUrl?: string;
  documentationUrl?: string;
  privacyPolicyUrl?: string;
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

export function getFeaturedApps(): AppManifest[] {
  return Object.values(appRegistry).filter(app => app.isFeatured);
}

export function getNewApps(): AppManifest[] {
  return Object.values(appRegistry).filter(app => app.isNew);
}

export function getPopularApps(): AppManifest[] {
  return Object.values(appRegistry).filter(app => app.isPopular);
}

export function getStaffPicks(): AppManifest[] {
  return Object.values(appRegistry).filter(app => app.isStaffPick);
}

export function getAppsByCategory(category: AppCategory): AppManifest[] {
  return Object.values(appRegistry).filter(app => app.category === category);
}

export const CATEGORY_INFO: Record<AppCategory, { label: string; icon: string; description: string }> = {
  ai: {
    label: 'AI & Automation',
    icon: '🤖',
    description: 'Leverage AI to automate responses, categorize tickets, and boost agent productivity',
  },
  productivity: {
    label: 'Productivity',
    icon: '⚡',
    description: 'Tools to help your team work faster and smarter',
  },
  integrations: {
    label: 'Integrations',
    icon: '🔌',
    description: 'Connect your helpdesk with the tools you already use',
  },
  customization: {
    label: 'Customization',
    icon: '🎨',
    description: 'Tailor your helpdesk to your specific needs',
  },
  reporting: {
    label: 'Reporting & Analytics',
    icon: '📊',
    description: 'Get insights into your team\'s performance and customer satisfaction',
  },
  feedback: {
    label: 'Feedback & Surveys',
    icon: '⭐',
    description: 'Collect and analyze customer feedback',
  },
  'self-service': {
    label: 'Self-Service',
    icon: '📚',
    description: 'Help customers help themselves',
  },
  communication: {
    label: 'Communication',
    icon: '💬',
    description: 'Multi-channel communication tools',
  },
  crm: {
    label: 'CRM & Sales',
    icon: '💼',
    description: 'Customer relationship and sales tools',
  },
  ecommerce: {
    label: 'E-commerce',
    icon: '🛒',
    description: 'Integrate with your online store',
  },
};
