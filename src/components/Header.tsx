import React from 'react';
import { Clapperboard } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-white/10 bg-[#0a0a0a] py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Clapperboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">CineFlow</h1>
            <p className="text-xs text-gray-400 uppercase tracking-wider">AI Storyboard Director</p>
          </div>
        </div>
        <div className="text-xs font-mono text-gray-500 border border-gray-800 px-3 py-1 rounded-full">
          SEEDANCE 2.0 MODE
        </div>
      </div>
    </header>
  );
}
