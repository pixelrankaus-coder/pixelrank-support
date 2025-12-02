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
  longDescription: `
**Connect your helpdesk with Slack for seamless communication**

The Slack integration brings your helpdesk notifications directly into your team's Slack workspace. Stay on top of new tickets, updates, and customer messages without leaving Slack.

### Key Benefits
- Real-time notifications for new tickets and updates
- Create tickets directly from Slack messages
- Reply to customers from Slack
- Customize which channels receive which notifications
- Support for Slack threads to keep conversations organized

### How it Works
1. Connect your Slack workspace with one click
2. Choose which channels receive ticket notifications
3. Configure notification preferences (new tickets, updates, SLA alerts)
4. Start managing tickets from Slack!
  `,
  icon: '💬',
  version: '2.1.0',
  category: 'integrations',
  isPremium: false,
  monthlyPrice: 0,
  slots: {
    'settings-menu': PlaceholderComponent,
  },
  permissions: ['read:tickets', 'notifications'],
  screenshots: [
    { url: '/screenshots/slack-1.png', title: 'Ticket notifications in Slack', description: 'Get real-time alerts in your team channels' },
    { url: '/screenshots/slack-2.png', title: 'Create tickets from Slack', description: 'Turn any Slack message into a support ticket' },
    { url: '/screenshots/slack-3.png', title: 'Reply from Slack', description: 'Respond to customers without leaving Slack' },
  ],
  developer: { name: 'Helpdesk Team', verified: true, website: 'https://helpdesk.com' },
  reviewStats: { averageRating: 4.8, totalReviews: 234, totalInstalls: 12500 },
  features: [
    'Real-time ticket notifications',
    'Create tickets from Slack messages',
    'Reply to customers from Slack',
    'Customizable notification channels',
    'SLA breach alerts',
    'Agent mention support',
  ],
  tags: ['slack', 'notifications', 'team chat', 'collaboration'],
  isFeatured: true,
  isPopular: true,
  releaseDate: '2023-01-15',
  lastUpdated: '2024-11-20',
  changelog: [
    { version: '2.1.0', date: '2024-11-20', changes: ['Added support for Slack threads', 'Improved notification formatting'] },
    { version: '2.0.0', date: '2024-06-01', changes: ['Complete redesign', 'Added create ticket from Slack', 'Performance improvements'] },
  ],
};

// Time Tracker
const TimeTrackerApp: AppManifest = {
  id: 'time-tracker',
  name: 'Time Tracker Pro',
  description: 'Track time spent on tickets with one-click timers and detailed reports',
  longDescription: `
**Accurate time tracking for your support team**

Time Tracker Pro helps you understand exactly how much time your team spends on each ticket. Perfect for billing clients, measuring productivity, and identifying bottlenecks.

### Features
- One-click timer on every ticket
- Manual time entry support
- Detailed time reports by agent, ticket, or customer
- Export to CSV for billing
- Integration with popular invoicing tools

### Perfect For
- Agencies billing clients by the hour
- Teams measuring productivity
- Managers identifying training needs
  `,
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
  screenshots: [
    { url: '/screenshots/time-1.png', title: 'One-click timer', description: 'Start tracking time with a single click' },
    { url: '/screenshots/time-2.png', title: 'Time reports', description: 'Detailed breakdowns by agent and ticket' },
    { url: '/screenshots/time-3.png', title: 'Billing export', description: 'Export time entries for client billing' },
  ],
  developer: { name: 'Productivity Labs', verified: true, email: 'support@productivitylabs.io', website: 'https://productivitylabs.io' },
  reviewStats: { averageRating: 4.6, totalReviews: 89, totalInstalls: 3200 },
  features: [
    'One-click timer',
    'Manual time entry',
    'Time reports',
    'CSV export',
    'Billable hours tracking',
    'Team productivity insights',
  ],
  tags: ['time tracking', 'productivity', 'billing', 'reports'],
  isStaffPick: true,
  releaseDate: '2023-06-01',
  lastUpdated: '2024-10-15',
};

// CSAT Survey
const CSATSurveyApp: AppManifest = {
  id: 'csat-survey',
  name: 'CSAT Surveys',
  description: 'Automatically send customer satisfaction surveys after ticket resolution',
  longDescription: `
**Measure customer happiness with automated surveys**

CSAT Surveys automatically sends satisfaction surveys to customers after their tickets are resolved. Get real-time feedback and identify areas for improvement.

### How it Works
1. Configure when surveys should be sent (after resolution, after X days, etc.)
2. Customize the survey questions and branding
3. Customers receive a simple one-click rating
4. View results in your dashboard

### Analytics
- CSAT score trends over time
- Breakdown by agent, team, and category
- Individual response viewing
- Automatic alerts for low scores
  `,
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
  screenshots: [
    { url: '/screenshots/csat-1.png', title: 'Survey email', description: 'Beautiful, branded survey emails' },
    { url: '/screenshots/csat-2.png', title: 'CSAT dashboard', description: 'Track satisfaction trends over time' },
    { url: '/screenshots/csat-3.png', title: 'Agent scores', description: 'See individual agent performance' },
  ],
  developer: { name: 'Helpdesk Team', verified: true },
  reviewStats: { averageRating: 4.5, totalReviews: 156, totalInstalls: 8900 },
  features: [
    'Automated survey sending',
    'Customizable questions',
    'CSAT score dashboard',
    'Agent performance tracking',
    'Low score alerts',
    'Response rate analytics',
  ],
  tags: ['csat', 'surveys', 'feedback', 'customer satisfaction'],
  isPopular: true,
  releaseDate: '2024-01-10',
  lastUpdated: '2024-09-05',
};

// Ticket Insights
const TicketInsightsApp: AppManifest = {
  id: 'ticket-insights',
  name: 'Ticket Insights AI',
  description: 'AI-powered analytics showing ticket trends, sentiment analysis, and predictions',
  longDescription: `
**Unlock the power of AI for your support data**

Ticket Insights AI uses advanced machine learning to analyze your tickets and provide actionable insights. Understand customer sentiment, predict ticket volume, and identify emerging issues before they become problems.

### AI-Powered Features
- **Sentiment Analysis**: Automatically detect customer emotions in tickets
- **Topic Clustering**: Group similar tickets to identify trends
- **Volume Prediction**: Forecast ticket volume for better staffing
- **Issue Detection**: Early warning for emerging problems

### Why You Need This
Support teams using Ticket Insights AI see 40% faster issue resolution and 25% improvement in CSAT scores.
  `,
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
  screenshots: [
    { url: '/screenshots/insights-1.png', title: 'AI Dashboard', description: 'Real-time AI insights at a glance' },
    { url: '/screenshots/insights-2.png', title: 'Sentiment trends', description: 'Track customer emotions over time' },
    { url: '/screenshots/insights-3.png', title: 'Volume predictions', description: 'Plan staffing with AI forecasts' },
  ],
  developer: { name: 'AI Analytics Inc', verified: true, website: 'https://aianalytics.io' },
  reviewStats: { averageRating: 4.9, totalReviews: 67, totalInstalls: 1800 },
  features: [
    'Sentiment analysis',
    'Topic clustering',
    'Volume prediction',
    'Issue detection',
    'Custom dashboards',
    'Weekly AI reports',
  ],
  tags: ['ai', 'analytics', 'machine learning', 'insights', 'predictions'],
  isFeatured: true,
  isStaffPick: true,
  releaseDate: '2024-03-15',
  lastUpdated: '2024-11-01',
};

// Knowledge Suggester
const KnowledgeSuggesterApp: AppManifest = {
  id: 'knowledge-suggester',
  name: 'Knowledge Suggester',
  description: 'Automatically suggest relevant knowledge base articles based on ticket content',
  longDescription: `
**Help agents find the right answer instantly**

Knowledge Suggester uses AI to analyze incoming tickets and automatically suggest relevant knowledge base articles. Reduce time to resolution and ensure consistent answers.

### How it Works
1. Customer submits a ticket
2. AI analyzes the ticket content
3. Relevant KB articles appear in the sidebar
4. Agent clicks to insert or reference

### Benefits
- 50% faster first response times
- More consistent answers
- Better KB article utilization
- Reduced training time for new agents
  `,
  icon: '📚',
  version: '1.2.0',
  category: 'self-service',
  isPremium: false,
  monthlyPrice: 0,
  slots: {
    'ticket-detail-sidebar': PlaceholderComponent,
  },
  permissions: ['read:tickets', 'read:knowledge-base'],
  screenshots: [
    { url: '/screenshots/kb-1.png', title: 'Article suggestions', description: 'AI-powered article recommendations' },
    { url: '/screenshots/kb-2.png', title: 'One-click insert', description: 'Insert article content with one click' },
  ],
  developer: { name: 'Helpdesk Team', verified: true },
  reviewStats: { averageRating: 4.4, totalReviews: 203, totalInstalls: 15600 },
  features: [
    'AI-powered suggestions',
    'One-click article insert',
    'Confidence scoring',
    'Article analytics',
    'Multi-language support',
  ],
  tags: ['knowledge base', 'ai', 'self-service', 'productivity'],
  isPopular: true,
  releaseDate: '2023-09-01',
  lastUpdated: '2024-08-20',
};

// Custom Fields
const CustomFieldsApp: AppManifest = {
  id: 'custom-fields',
  name: 'Custom Fields Pro',
  description: 'Add custom fields to tickets, contacts, and companies with advanced field types',
  longDescription: `
**Capture the data that matters to your business**

Custom Fields Pro lets you add unlimited custom fields to tickets, contacts, and companies. Support for advanced field types including dropdowns, dates, files, and more.

### Field Types
- Text (single and multi-line)
- Number (with validation)
- Date and DateTime
- Dropdown (single and multi-select)
- Checkbox
- File upload
- URL
- Email
- Phone number

### Advanced Features
- Conditional visibility rules
- Required field validation
- Field dependencies
- API access for all custom data
  `,
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
  screenshots: [
    { url: '/screenshots/fields-1.png', title: 'Field editor', description: 'Easy drag-and-drop field builder' },
    { url: '/screenshots/fields-2.png', title: 'Ticket view', description: 'Custom fields in ticket sidebar' },
    { url: '/screenshots/fields-3.png', title: 'Conditional rules', description: 'Show/hide fields based on values' },
  ],
  developer: { name: 'Form Builders Inc', verified: true, website: 'https://formbuilders.io' },
  reviewStats: { averageRating: 4.7, totalReviews: 178, totalInstalls: 9200 },
  features: [
    '15+ field types',
    'Conditional visibility',
    'Required field validation',
    'Field dependencies',
    'API access',
    'Import/Export',
  ],
  tags: ['custom fields', 'forms', 'customization', 'data'],
  isStaffPick: true,
  releaseDate: '2023-04-01',
  lastUpdated: '2024-10-30',
};

// Auto Assign
const AutoAssignApp: AppManifest = {
  id: 'auto-assign',
  name: 'Smart Auto Assign',
  description: 'Automatically assign tickets based on rules, workload, and agent skills',
  longDescription: `
**Put ticket routing on autopilot**

Smart Auto Assign automatically routes incoming tickets to the right agent based on your custom rules. Consider workload, skills, availability, and more.

### Assignment Methods
- **Round Robin**: Distribute evenly among agents
- **Load Balanced**: Route to least busy agent
- **Skill Based**: Match ticket category to agent expertise
- **Priority Based**: Route urgent tickets to senior agents

### Smart Features
- Respect agent working hours
- Consider current workload
- Factor in skill levels
- Handle escalations automatically
  `,
  icon: '🎯',
  version: '1.1.0',
  category: 'productivity',
  isPremium: false,
  monthlyPrice: 0,
  slots: {
    'settings-menu': PlaceholderComponent,
  },
  permissions: ['write:tickets', 'read:agents'],
  screenshots: [
    { url: '/screenshots/assign-1.png', title: 'Rule builder', description: 'Visual rule configuration' },
    { url: '/screenshots/assign-2.png', title: 'Assignment stats', description: 'Track distribution across team' },
  ],
  developer: { name: 'Helpdesk Team', verified: true },
  reviewStats: { averageRating: 4.3, totalReviews: 312, totalInstalls: 18500 },
  features: [
    'Round robin assignment',
    'Load balancing',
    'Skill-based routing',
    'Working hours respect',
    'Assignment rules',
    'Distribution analytics',
  ],
  tags: ['automation', 'routing', 'assignment', 'productivity'],
  isPopular: true,
  releaseDate: '2023-02-15',
  lastUpdated: '2024-07-10',
};

// SLA Monitor
const SLAMonitorApp: AppManifest = {
  id: 'sla-monitor',
  name: 'SLA Monitor',
  description: 'Real-time SLA breach alerts and compliance tracking with escalation workflows',
  longDescription: `
**Never miss an SLA again**

SLA Monitor gives you real-time visibility into SLA compliance across your entire support operation. Get alerted before breaches happen and automatically escalate at-risk tickets.

### Features
- **Real-time Dashboard**: See SLA status at a glance
- **Predictive Alerts**: Get warned before breaches happen
- **Auto Escalation**: Automatically escalate at-risk tickets
- **Compliance Reports**: Track SLA performance over time

### Reporting
- SLA compliance by agent, team, and category
- Breach analysis and root cause identification
- Trend reporting for continuous improvement
  `,
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
  screenshots: [
    { url: '/screenshots/sla-1.png', title: 'SLA Dashboard', description: 'Real-time compliance overview' },
    { url: '/screenshots/sla-2.png', title: 'Breach alerts', description: 'Get notified before breaches' },
    { url: '/screenshots/sla-3.png', title: 'Compliance reports', description: 'Track performance over time' },
  ],
  developer: { name: 'Compliance Tools LLC', verified: true, website: 'https://compliancetools.io' },
  reviewStats: { averageRating: 4.8, totalReviews: 145, totalInstalls: 7300 },
  features: [
    'Real-time monitoring',
    'Predictive alerts',
    'Auto escalation',
    'Compliance reports',
    'Team leaderboards',
    'Custom SLA policies',
  ],
  tags: ['sla', 'compliance', 'monitoring', 'alerts'],
  isFeatured: true,
  releaseDate: '2023-07-01',
  lastUpdated: '2024-09-25',
};

// Merge Tickets
const MergeTicketsApp: AppManifest = {
  id: 'merge-tickets',
  name: 'Ticket Merger',
  description: 'Easily merge duplicate tickets and link related issues together',
  longDescription: `
**Keep your ticket queue clean**

Ticket Merger helps you identify and merge duplicate tickets, reducing confusion and ensuring customers get a single, consolidated response.

### Features
- **Smart Detection**: AI suggests potential duplicates
- **Easy Merging**: One-click merge with history preserved
- **Ticket Linking**: Link related tickets without merging
- **Bulk Actions**: Merge multiple tickets at once

### How Merging Works
1. Select the primary ticket (the one you'll keep)
2. Choose tickets to merge into it
3. All messages and data are combined
4. Merged tickets become internal notes
  `,
  icon: '🔗',
  version: '1.0.0',
  category: 'productivity',
  isPremium: false,
  monthlyPrice: 0,
  slots: {
    'ticket-toolbar': PlaceholderComponent,
  },
  permissions: ['write:tickets', 'read:tickets'],
  screenshots: [
    { url: '/screenshots/merge-1.png', title: 'Duplicate detection', description: 'AI finds potential duplicates' },
    { url: '/screenshots/merge-2.png', title: 'Merge preview', description: 'Preview before merging' },
  ],
  developer: { name: 'Helpdesk Team', verified: true },
  reviewStats: { averageRating: 4.2, totalReviews: 98, totalInstalls: 6100 },
  features: [
    'Duplicate detection',
    'One-click merge',
    'Ticket linking',
    'History preservation',
    'Bulk merge',
    'Undo support',
  ],
  tags: ['merge', 'duplicates', 'productivity', 'cleanup'],
  isNew: true,
  releaseDate: '2024-10-01',
  lastUpdated: '2024-11-15',
};

// Zendesk Import
const ZendeskImportApp: AppManifest = {
  id: 'zendesk-import',
  name: 'Zendesk Importer',
  description: 'One-click migration from Zendesk including tickets, users, and knowledge base',
  longDescription: `
**Migrate from Zendesk in minutes**

Zendesk Importer makes switching to our helpdesk painless. Import your entire history including tickets, users, contacts, and knowledge base articles.

### What Gets Imported
- ✓ All tickets and conversations
- ✓ Agents and their settings
- ✓ Contacts and companies
- ✓ Knowledge base articles
- ✓ Custom fields and tags
- ✓ Attachments

### How it Works
1. Connect your Zendesk account
2. Choose what to import
3. Start the migration
4. Monitor progress in real-time

*Typically takes 1-4 hours depending on data volume*
  `,
  icon: '📥',
  version: '1.0.0',
  category: 'integrations',
  isPremium: true,
  monthlyPrice: 25,
  slots: {
    'settings-menu': PlaceholderComponent,
  },
  permissions: ['write:tickets', 'write:contacts', 'write:knowledge-base'],
  screenshots: [
    { url: '/screenshots/import-1.png', title: 'Connection wizard', description: 'Easy Zendesk authentication' },
    { url: '/screenshots/import-2.png', title: 'Import options', description: 'Choose what to migrate' },
    { url: '/screenshots/import-3.png', title: 'Progress tracking', description: 'Real-time migration status' },
  ],
  developer: { name: 'Migration Experts', verified: true, website: 'https://migrationexperts.io' },
  reviewStats: { averageRating: 4.6, totalReviews: 43, totalInstalls: 890 },
  features: [
    'Full ticket history',
    'User migration',
    'KB article import',
    'Custom field mapping',
    'Attachment migration',
    'Real-time progress',
  ],
  tags: ['zendesk', 'migration', 'import', 'switch'],
  isNew: true,
  releaseDate: '2024-09-01',
  lastUpdated: '2024-11-10',
};

// WhatsApp Business
const WhatsAppApp: AppManifest = {
  id: 'whatsapp-business',
  name: 'WhatsApp Business',
  description: 'Receive and respond to WhatsApp messages directly from your helpdesk',
  longDescription: `
**Support customers on WhatsApp**

Connect your WhatsApp Business account and manage all customer conversations alongside your other support channels. Full two-way messaging with rich media support.

### Features
- Receive WhatsApp messages as tickets
- Reply directly from the helpdesk
- Send images, documents, and voice notes
- Use message templates for quick responses
- View conversation history

### Requirements
- WhatsApp Business API access
- Facebook Business Manager account
- Verified business phone number
  `,
  icon: '📱',
  version: '2.0.0',
  category: 'communication',
  isPremium: true,
  monthlyPrice: 20,
  slots: {
    'compose-toolbar': PlaceholderComponent,
    'settings-menu': PlaceholderComponent,
  },
  permissions: ['read:tickets', 'write:tickets', 'send:messages'],
  screenshots: [
    { url: '/screenshots/whatsapp-1.png', title: 'WhatsApp inbox', description: 'All messages in one place' },
    { url: '/screenshots/whatsapp-2.png', title: 'Rich messaging', description: 'Send media and documents' },
    { url: '/screenshots/whatsapp-3.png', title: 'Templates', description: 'Quick response templates' },
  ],
  developer: { name: 'Messaging Solutions', verified: true, website: 'https://messagingsolutions.io' },
  reviewStats: { averageRating: 4.5, totalReviews: 189, totalInstalls: 4500 },
  features: [
    'Two-way messaging',
    'Rich media support',
    'Message templates',
    'Conversation history',
    'Read receipts',
    'Bulk messaging',
  ],
  tags: ['whatsapp', 'messaging', 'communication', 'mobile'],
  isFeatured: true,
  isPopular: true,
  releaseDate: '2023-08-01',
  lastUpdated: '2024-10-20',
};

// Shopify Integration
const ShopifyApp: AppManifest = {
  id: 'shopify-integration',
  name: 'Shopify',
  description: 'View customer order history and manage refunds directly from tickets',
  longDescription: `
**E-commerce support made easy**

The Shopify integration shows customer order information right inside your ticket view. Process refunds, track shipments, and resolve issues faster.

### What You'll See
- Recent orders and order history
- Order status and tracking info
- Product details and images
- Customer lifetime value

### Actions Available
- Process refunds
- Cancel orders
- Update order notes
- Send shipping updates
  `,
  icon: '🛒',
  version: '1.5.0',
  category: 'ecommerce',
  isPremium: true,
  monthlyPrice: 12,
  slots: {
    'ticket-detail-sidebar': PlaceholderComponent,
    'contact-sidebar': PlaceholderComponent,
  },
  permissions: ['read:tickets', 'read:orders', 'write:orders'],
  screenshots: [
    { url: '/screenshots/shopify-1.png', title: 'Order sidebar', description: 'See orders in ticket view' },
    { url: '/screenshots/shopify-2.png', title: 'Process refunds', description: 'One-click refund processing' },
    { url: '/screenshots/shopify-3.png', title: 'Customer history', description: 'Complete purchase history' },
  ],
  developer: { name: 'E-commerce Connect', verified: true, website: 'https://ecommerceconnect.io' },
  reviewStats: { averageRating: 4.7, totalReviews: 267, totalInstalls: 8900 },
  features: [
    'Order history view',
    'Refund processing',
    'Shipment tracking',
    'Customer value display',
    'Order notes',
    'Multi-store support',
  ],
  tags: ['shopify', 'ecommerce', 'orders', 'refunds'],
  isFeatured: true,
  isPopular: true,
  releaseDate: '2023-05-01',
  lastUpdated: '2024-11-05',
};

// Salesforce CRM
const SalesforceApp: AppManifest = {
  id: 'salesforce-crm',
  name: 'Salesforce CRM',
  description: 'Sync contacts, accounts, and opportunities with Salesforce',
  longDescription: `
**Connect support and sales**

The Salesforce integration syncs your helpdesk with Salesforce CRM. See sales context when handling support tickets and keep customer data in sync.

### Features
- Two-way contact sync
- View Salesforce data in tickets
- Create opportunities from tickets
- Sync ticket history to Salesforce
- Custom field mapping

### Benefits
- Complete customer view
- Faster issue resolution
- Better upsell opportunities
- Unified customer data
  `,
  icon: '☁️',
  version: '2.2.0',
  category: 'crm',
  isPremium: true,
  monthlyPrice: 18,
  slots: {
    'contact-sidebar': PlaceholderComponent,
    'settings-menu': PlaceholderComponent,
  },
  permissions: ['read:contacts', 'write:contacts', 'read:tickets'],
  screenshots: [
    { url: '/screenshots/sf-1.png', title: 'Salesforce sidebar', description: 'CRM data in ticket view' },
    { url: '/screenshots/sf-2.png', title: 'Sync settings', description: 'Configure field mapping' },
  ],
  developer: { name: 'CRM Connectors', verified: true, website: 'https://crmconnectors.io' },
  reviewStats: { averageRating: 4.4, totalReviews: 156, totalInstalls: 3400 },
  features: [
    'Two-way sync',
    'Contact matching',
    'Opportunity creation',
    'Custom field mapping',
    'Activity logging',
    'Multi-org support',
  ],
  tags: ['salesforce', 'crm', 'sales', 'sync'],
  isStaffPick: true,
  releaseDate: '2023-03-01',
  lastUpdated: '2024-09-15',
};

// Microsoft Teams
const TeamsApp: AppManifest = {
  id: 'microsoft-teams',
  name: 'Microsoft Teams',
  description: 'Get ticket notifications in Teams and collaborate with your team',
  longDescription: `
**Bring helpdesk into Microsoft Teams**

Stay connected to your helpdesk without leaving Microsoft Teams. Get notifications, discuss tickets with colleagues, and respond to customers.

### Features
- Ticket notifications in channels
- @mention agents on tickets
- Create tickets from Teams messages
- Personal notifications for assigned tickets
- Adaptive cards with quick actions

### Perfect For
Teams already using Microsoft 365
  `,
  icon: '👥',
  version: '1.8.0',
  category: 'integrations',
  isPremium: false,
  monthlyPrice: 0,
  slots: {
    'settings-menu': PlaceholderComponent,
  },
  permissions: ['read:tickets', 'notifications'],
  screenshots: [
    { url: '/screenshots/teams-1.png', title: 'Teams notifications', description: 'Rich ticket cards in Teams' },
    { url: '/screenshots/teams-2.png', title: 'Quick actions', description: 'Take action from Teams' },
  ],
  developer: { name: 'Helpdesk Team', verified: true },
  reviewStats: { averageRating: 4.6, totalReviews: 198, totalInstalls: 11200 },
  features: [
    'Channel notifications',
    'Personal alerts',
    'Ticket creation',
    'Adaptive cards',
    'Agent mentions',
    'Status updates',
  ],
  tags: ['teams', 'microsoft', 'collaboration', 'notifications'],
  isPopular: true,
  releaseDate: '2023-04-15',
  lastUpdated: '2024-10-01',
};

// Phone System (Twilio)
const PhoneSystemApp: AppManifest = {
  id: 'phone-system',
  name: 'Phone System',
  description: 'Integrated phone support with call recording, IVR, and voicemail',
  longDescription: `
**Complete phone support solution**

Add phone support to your helpdesk with our integrated phone system. Features IVR menus, call recording, voicemail transcription, and more.

### Features
- Inbound and outbound calling
- IVR menu builder
- Call recording with transcription
- Voicemail to ticket
- Click-to-call from tickets
- Call analytics and reporting

### Pricing
Includes 1000 minutes/month. Additional minutes at $0.02/minute.
  `,
  icon: '📞',
  version: '3.0.0',
  category: 'communication',
  isPremium: true,
  monthlyPrice: 35,
  slots: {
    'ticket-toolbar': PlaceholderComponent,
    'contact-sidebar': PlaceholderComponent,
    'dashboard-widget': PlaceholderComponent,
  },
  permissions: ['read:tickets', 'write:tickets', 'make:calls'],
  screenshots: [
    { url: '/screenshots/phone-1.png', title: 'Softphone', description: 'Built-in browser phone' },
    { url: '/screenshots/phone-2.png', title: 'IVR builder', description: 'Visual IVR menu designer' },
    { url: '/screenshots/phone-3.png', title: 'Call history', description: 'Complete call records' },
  ],
  developer: { name: 'Telephony Solutions', verified: true, website: 'https://telephonysolutions.io' },
  reviewStats: { averageRating: 4.3, totalReviews: 87, totalInstalls: 2100 },
  features: [
    'Browser-based calling',
    'IVR menus',
    'Call recording',
    'Voicemail transcription',
    'Click-to-call',
    'Call analytics',
  ],
  tags: ['phone', 'calling', 'ivr', 'voicemail'],
  isFeatured: true,
  releaseDate: '2023-06-15',
  lastUpdated: '2024-11-01',
};

// Live Chat Widget
const LiveChatApp: AppManifest = {
  id: 'live-chat',
  name: 'Live Chat Widget',
  description: 'Add a beautiful chat widget to your website for real-time customer support',
  longDescription: `
**Real-time customer engagement**

Add a customizable chat widget to your website and engage with customers in real-time. Convert visitors to customers and resolve issues instantly.

### Features
- Customizable widget design
- Pre-chat forms
- Canned responses
- File sharing
- Chat routing
- Mobile-friendly

### Benefits
- Faster response times
- Higher conversion rates
- Better customer satisfaction
- Reduced email volume
  `,
  icon: '💭',
  version: '2.5.0',
  category: 'communication',
  isPremium: false,
  monthlyPrice: 0,
  slots: {
    'dashboard-widget': PlaceholderComponent,
    'settings-menu': PlaceholderComponent,
  },
  permissions: ['read:tickets', 'write:tickets'],
  screenshots: [
    { url: '/screenshots/chat-1.png', title: 'Chat widget', description: 'Beautiful embedded widget' },
    { url: '/screenshots/chat-2.png', title: 'Customization', description: 'Match your brand colors' },
    { url: '/screenshots/chat-3.png', title: 'Chat dashboard', description: 'Manage all chats' },
  ],
  developer: { name: 'Helpdesk Team', verified: true },
  reviewStats: { averageRating: 4.8, totalReviews: 423, totalInstalls: 24500 },
  features: [
    'Customizable design',
    'Pre-chat forms',
    'Canned responses',
    'File sharing',
    'Chat routing',
    'Offline messages',
  ],
  tags: ['chat', 'live chat', 'widget', 'real-time'],
  isFeatured: true,
  isPopular: true,
  isStaffPick: true,
  releaseDate: '2022-12-01',
  lastUpdated: '2024-10-25',
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
registerApp(WhatsAppApp);
registerApp(ShopifyApp);
registerApp(SalesforceApp);
registerApp(TeamsApp);
registerApp(PhoneSystemApp);
registerApp(LiveChatApp);
