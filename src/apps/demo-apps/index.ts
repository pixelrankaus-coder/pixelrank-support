// Demo apps to populate the App Store
// These are placeholder apps to showcase the app store functionality

import { registerApp, AppManifest } from '@/lib/app-registry';

// Placeholder component for demo apps
const PlaceholderComponent = () => null;

// Slack Integration
const SlackApp: AppManifest = {
  id: 'slack-integration',
  name: 'Slack',
  description: 'Send ticket notifications to Slack channels and create tickets from Slack messages',
  icon: '💬',
  version: '2.1.0',
  category: 'integrations',
  isPremium: false,
  monthlyPrice: 0,
  slots: {
    'settings-menu': PlaceholderComponent,
  },
  permissions: ['read:tickets', 'notifications'],
};

// Time Tracker
const TimeTrackerApp: AppManifest = {
  id: 'time-tracker',
  name: 'Time Tracker',
  description: 'Track time spent on tickets with one-click timers and detailed reports',
  icon: '⏱️',
  version: '1.3.0',
  category: 'productivity',
  isPremium: true,
  monthlyPrice: 5,
  slots: {
    'ticket-toolbar': PlaceholderComponent,
    'ticket-detail-sidebar': PlaceholderComponent,
  },
  permissions: ['read:tickets', 'write:time-entries'],
};

// CSAT Survey
const CSATSurveyApp: AppManifest = {
  id: 'csat-survey',
  name: 'CSAT Surveys',
  description: 'Automatically send customer satisfaction surveys after ticket resolution',
  icon: '⭐',
  version: '1.0.0',
  category: 'feedback',
  isPremium: false,
  monthlyPrice: 0,
  slots: {
    'dashboard-widget': PlaceholderComponent,
    'settings-menu': PlaceholderComponent,
  },
  permissions: ['read:tickets', 'send:emails'],
};

// Ticket Insights
const TicketInsightsApp: AppManifest = {
  id: 'ticket-insights',
  name: 'Ticket Insights',
  description: 'AI-powered analytics showing ticket trends, sentiment analysis, and predictions',
  icon: '📊',
  version: '1.5.0',
  category: 'reporting',
  isPremium: true,
  monthlyPrice: 15,
  slots: {
    'dashboard-widget': PlaceholderComponent,
    'ticket-detail-sidebar': PlaceholderComponent,
  },
  permissions: ['read:tickets', 'read:analytics'],
};

// Knowledge Suggester
const KnowledgeSuggesterApp: AppManifest = {
  id: 'knowledge-suggester',
  name: 'Knowledge Suggester',
  description: 'Automatically suggest relevant knowledge base articles based on ticket content',
  icon: '📚',
  version: '1.2.0',
  category: 'self-service',
  isPremium: false,
  monthlyPrice: 0,
  slots: {
    'ticket-detail-sidebar': PlaceholderComponent,
  },
  permissions: ['read:tickets', 'read:knowledge-base'],
};

// Custom Fields
const CustomFieldsApp: AppManifest = {
  id: 'custom-fields',
  name: 'Custom Fields',
  description: 'Add custom fields to tickets, contacts, and companies with advanced field types',
  icon: '🏷️',
  version: '2.0.0',
  category: 'customization',
  isPremium: true,
  monthlyPrice: 8,
  slots: {
    'ticket-detail-sidebar': PlaceholderComponent,
    'contact-sidebar': PlaceholderComponent,
    'settings-menu': PlaceholderComponent,
  },
  permissions: ['write:custom-fields', 'read:tickets'],
};

// Auto Assign
const AutoAssignApp: AppManifest = {
  id: 'auto-assign',
  name: 'Auto Assign',
  description: 'Automatically assign tickets based on rules, workload, and agent skills',
  icon: '🎯',
  version: '1.1.0',
  category: 'productivity',
  isPremium: false,
  monthlyPrice: 0,
  slots: {
    'settings-menu': PlaceholderComponent,
  },
  permissions: ['write:tickets', 'read:agents'],
};

// SLA Monitor
const SLAMonitorApp: AppManifest = {
  id: 'sla-monitor',
  name: 'SLA Monitor',
  description: 'Real-time SLA breach alerts and compliance tracking with escalation workflows',
  icon: '⏰',
  version: '1.4.0',
  category: 'reporting',
  isPremium: true,
  monthlyPrice: 10,
  slots: {
    'dashboard-widget': PlaceholderComponent,
    'ticket-toolbar': PlaceholderComponent,
  },
  permissions: ['read:tickets', 'read:sla', 'notifications'],
};

// Merge Tickets
const MergeTicketsApp: AppManifest = {
  id: 'merge-tickets',
  name: 'Merge Tickets',
  description: 'Easily merge duplicate tickets and link related issues together',
  icon: '🔗',
  version: '1.0.0',
  category: 'productivity',
  isPremium: false,
  monthlyPrice: 0,
  slots: {
    'ticket-toolbar': PlaceholderComponent,
  },
  permissions: ['write:tickets', 'read:tickets'],
};

// Zendesk Import
const ZendeskImportApp: AppManifest = {
  id: 'zendesk-import',
  name: 'Zendesk Importer',
  description: 'One-click migration from Zendesk including tickets, users, and knowledge base',
  icon: '📥',
  version: '1.0.0',
  category: 'integrations',
  isPremium: true,
  monthlyPrice: 25,
  slots: {
    'settings-menu': PlaceholderComponent,
  },
  permissions: ['write:tickets', 'write:contacts', 'write:knowledge-base'],
};

// Register all demo apps
registerApp(SlackApp);
registerApp(TimeTrackerApp);
registerApp(CSATSurveyApp);
registerApp(TicketInsightsApp);
registerApp(KnowledgeSuggesterApp);
registerApp(CustomFieldsApp);
registerApp(AutoAssignApp);
registerApp(SLAMonitorApp);
registerApp(MergeTicketsApp);
registerApp(ZendeskImportApp);
