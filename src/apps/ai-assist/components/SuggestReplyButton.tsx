'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export function SuggestReplyButton({ onSuggestion }: { onSuggestion?: (text: string) => void }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    setTimeout(() => {
      onSuggestion?.("Thank you for reaching out. I'd be happy to help...");
      setIsLoading(false);
    }, 1500);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-md transition-colors disabled:opacity-50"
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
      <span className="font-medium">{isLoading ? 'Thinking...' : 'Suggest Reply'}</span>
    </button>
  );
}
