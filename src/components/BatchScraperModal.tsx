import React, { useState } from 'react';
import { Layers, X, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import { ScrapeMode } from '../types';

interface BatchScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBatchScrape: (urls: string[], mode: ScrapeMode) => void;
  isLoading: boolean;
}

export const BatchScraperModal: React.FC<BatchScraperModalProps> = ({
  isOpen,
  onClose,
  onBatchScrape,
  isLoading,
}) => {
  const [urlsInput, setUrlsInput] = useState('');
  const [mode, setMode] = useState<ScrapeMode>('ai_structured');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urls = urlsInput
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0) return;
    onBatchScrape(urls, mode);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#4A4A3A]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2E2D5] rounded-[32px] max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E2D5] pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#5A5A40]/10 border border-[#5A5A40]/20 flex items-center justify-center text-[#5A5A40]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif italic font-bold text-[#5A5A40] text-base">Batch Scraper & Markdown Binder</h3>
              <p className="text-xs text-[#8B8B7A]">Scrape multiple URLs & compile into a single .md file</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#F5F5F0] text-[#8B8B7A] hover:text-[#4A4A3A] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#8B8B7A] mb-1.5">
              Enter Web Page URLs (One per line, up to 5 URLs)
            </label>
            <textarea
              value={urlsInput}
              onChange={(e) => setUrlsInput(e.target.value)}
              placeholder="https://docs.python.org/3/tutorial/app.html&#10;https://docs.python.org/3/tutorial/errors.html&#10;https://docs.python.org/3/tutorial/classes.html"
              className="w-full h-36 p-3.5 bg-[#FBFBFA] border border-[#D6D6C2] rounded-2xl font-mono text-xs text-[#4A4A3A] placeholder-[#A0A090] outline-none focus:border-[#5A5A40] leading-relaxed shadow-inner"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#8B8B7A] mb-1.5">
              Compilation Style
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMode('ai_structured')}
                className={`p-3 rounded-2xl border text-xs text-left cursor-pointer transition-all ${
                  mode === 'ai_structured'
                    ? 'bg-[#5A5A40] border-[#5A5A40] text-white shadow-xs'
                    : 'bg-white border-[#E2E2D5] text-[#6B705C] hover:border-[#D6D6C2]'
                }`}
              >
                <div className="font-semibold">AI Unified Book</div>
                <div className={`text-[10px] ${mode === 'ai_structured' ? 'text-white/80' : 'text-[#8B8B7A]'}`}>With TOC & section links</div>
              </button>

              <button
                type="button"
                onClick={() => setMode('raw')}
                className={`p-3 rounded-2xl border text-xs text-left cursor-pointer transition-all ${
                  mode === 'raw'
                    ? 'bg-[#5A5A40] border-[#5A5A40] text-white shadow-xs'
                    : 'bg-white border-[#E2E2D5] text-[#6B705C] hover:border-[#D6D6C2]'
                }`}
              >
                <div className="font-semibold">Raw Combined .MD</div>
                <div className={`text-[10px] ${mode === 'raw' ? 'text-white/80' : 'text-[#8B8B7A]'}`}>Direct sequential export</div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#E2E2D5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-semibold text-[#8B8B7A] hover:text-[#4A4A3A] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !urlsInput.trim()}
              className="px-5 py-2.5 rounded-full text-xs font-serif italic bg-[#5A5A40] hover:bg-[#4A4A3A] text-white font-semibold shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Compiling Binder...</span>
                </>
              ) : (
                <>
                  <span>Compile Batch .MD</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
