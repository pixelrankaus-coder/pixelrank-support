'use client';

import { useState, useEffect } from 'react';
import { FileText, Save, Trash2 } from 'lucide-react';

export function QuickNotesPanel() {
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('quick-notes-scratch');
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('quick-notes-scratch', notes);
    setSaved(true);
    setLastSaved(new Date());
    setTimeout(() => setSaved(false), 2000);
  };

  const handleClear = () => {
    if (confirm('Clear all notes?')) {
      setNotes('');
      localStorage.removeItem('quick-notes-scratch');
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-medium text-gray-900">Quick Notes</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Save notes"
          >
            <Save className="h-4 w-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Clear notes"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-3">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Jot down quick notes here..."
          className="w-full h-32 text-sm border border-gray-200 rounded-md p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />

        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>{notes.length} characters</span>
          {saved && (
            <span className="text-green-600 flex items-center gap-1">
              Saved!
            </span>
          )}
          {lastSaved && !saved && (
            <span>Last saved: {formatTime(lastSaved)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
