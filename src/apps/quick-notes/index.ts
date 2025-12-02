import { registerApp, AppManifest } from '@/lib/app-registry';
import { QuickNotesPanel } from './components/QuickNotesPanel';

export const QuickNotesApp: AppManifest = {
  id: 'quick-notes',
  name: 'Quick Notes',
  description: 'A simple scratchpad for agents to jot down quick notes while working on tickets',
  icon: '📝',
  version: '1.0.0',
  category: 'productivity',
  isPremium: false,
  monthlyPrice: 0,
  slots: {
    'ticket-detail-sidebar': QuickNotesPanel,
  },
  permissions: ['read:tickets'],
};

registerApp(QuickNotesApp);

export { QuickNotesPanel } from './components/QuickNotesPanel';
