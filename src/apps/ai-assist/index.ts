import { registerApp, AppManifest } from '@/lib/app-registry';
import { AIAssistPanel } from './components/AIAssistPanel';
import { SuggestReplyButton } from './components/SuggestReplyButton';

export const AIAssistApp: AppManifest = {
  id: 'ai-assist',
  name: 'AI Assist',
  description: 'Claude-powered ticket summaries and suggested replies',
  icon: '🤖',
  version: '1.0.0',
  category: 'ai',
  isPremium: true,
  monthlyPrice: 10,
  slots: {
    'ticket-detail-sidebar': AIAssistPanel,
    'compose-toolbar': SuggestReplyButton,
  },
  permissions: ['read:tickets', 'write:tickets'],
};

registerApp(AIAssistApp);

export { AIAssistPanel } from './components/AIAssistPanel';
export { SuggestReplyButton } from './components/SuggestReplyButton';
