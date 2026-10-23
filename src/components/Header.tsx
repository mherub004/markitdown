import React from 'react';
import { FileText, History, Layers, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenHistory: () => void;
  onOpenBatch: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenHistory,
  onOpenBatch,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F5F5F0]/90 backdrop-blur-md border-b border-[#E2E2D5] text-[#4A4A3A] px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo and App Title */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#5A5A40] flex items-center justify-center shadow-sm text-white">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8B8B7A]">
              Conversion Engine
            </div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-serif italic text-[#5A5A40] leading-none tracking-tight">
                Lichen.md
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#5A5A40]/10 text-[#5A5A40] border border-[#5A5A40]/20">
                <Sparkles className="w-3 h-3 mr-1 text-[#5A5A40]" />
                Gemini Powered
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={onOpenBatch}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-white hover:bg-[#EAEADF] text-[#5A5A40] border border-[#D6D6C2] transition-all cursor-pointer shadow-sm"
            title="Batch scrape multiple URLs"
          >
            <Layers className="w-4 h-4 text-[#5A5A40]" />
            <span className="hidden sm:inline">Batch Binder</span>
            <span className="sm:hidden">Batch</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="relative flex items-center space-x-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-[#5A5A40] hover:bg-[#4A4A3A] text-white transition-all cursor-pointer shadow-sm"
            title="View saved scrapes history"
          >
            <History className="w-4 h-4 text-white/90" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-[#5A5A40] bg-white rounded-full">
                {historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
