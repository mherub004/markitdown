import React from 'react';
import { History, Trash2, ExternalLink, FileText, X, Clock, ArrowRight } from 'lucide-react';
import { SavedScrape } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: SavedScrape[];
  onSelectScrape: (scrape: SavedScrape) => void;
  onDeleteScrape: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectScrape,
  onDeleteScrape,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#4A4A3A]/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-[#F5F5F0] border-l border-[#E2E2D5] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2E2D5] bg-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5A5A40]/10 flex items-center justify-center text-[#5A5A40]">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif italic font-bold text-[#5A5A40] text-base">Scraped Markdown History</h2>
              <p className="text-[11px] text-[#8B8B7A]">Saved .md documents from previous sessions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#F5F5F0] text-[#8B8B7A] hover:text-[#4A4A3A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-16 space-y-2 text-[#8B8B7A]">
              <FileText className="w-10 h-10 mx-auto text-[#D6D6C2]" />
              <p className="text-xs font-semibold text-[#5A5A40]">No scraped history saved yet.</p>
              <p className="text-[11px] text-[#8B8B7A]">Scraped documents will automatically appear here.</p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#E2E2D5] hover:border-[#D6D6C2] rounded-2xl p-4 space-y-2.5 transition-all shadow-2xs group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono font-medium text-[#5A5A40] bg-[#5A5A40]/10 px-2 py-0.5 rounded-full border border-[#5A5A40]/20">
                      {item.domain}
                    </span>
                    <h3
                      onClick={() => {
                        onSelectScrape(item);
                        onClose();
                      }}
                      className="font-bold text-[#4A4A3A] hover:text-[#5A5A40] text-xs mt-1.5 truncate cursor-pointer font-serif italic"
                      title={item.title}
                    >
                      {item.title}
                    </h3>
                  </div>

                  <button
                    onClick={() => onDeleteScrape(item.id)}
                    className="p-1 rounded-full text-[#8B8B7A] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#8B8B7A] pt-2 border-t border-[#F5F5F0]">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1 text-[#8B8B7A]" />
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => {
                      onSelectScrape(item);
                      onClose();
                    }}
                    className="text-xs text-[#5A5A40] hover:text-[#3D3D2E] font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Open .MD</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="p-4 border-t border-[#E2E2D5] flex items-center justify-between bg-white">
            <span className="text-xs text-[#8B8B7A] font-medium">{history.length} saved document(s)</span>
            <button
              onClick={onClearAll}
              className="text-xs text-red-600 hover:text-red-700 font-semibold transition-colors cursor-pointer"
            >
              Clear All History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
