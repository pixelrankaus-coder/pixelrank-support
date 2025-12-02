'use client';

import { useState } from 'react';
import { Sparkles, RefreshCw, Copy, Check } from 'lucide-react';

export function AIAssistPanel() {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <div className="border border-purple-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="font-semibold text-sm text-purple-900">AI Assist</span>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Beta</span>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={isLoading}
          className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Generating...' : 'Regenerate'}
        </button>
      </div>

      <div className="mb-4">
        <div className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Summary</div>
        <div className="bg-white rounded-md p-3 border border-purple-100">
          <p className="text-sm text-gray-700 leading-relaxed">
            The customer is requesting assistance with reconciling accounts. The ticket is currently open with medium priority.
          </p>
        </div>
      </div>

      <div>
        <div className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Suggested Reply</div>
        <div className="bg-white rounded-md p-3 border border-purple-100">
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Thank you for your request. We understand this is important for your records. Could you please provide any specific details about the accounts in question?
          </p>
          <button
            onClick={() => handleCopy('Thank you for your request...')}
            className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium"
          >
            {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy to reply</>}
          </button>
        </div>
      </div>

      <button className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded-md transition-colors">
        Insert into Reply
      </button>
    </div>
  );
}
