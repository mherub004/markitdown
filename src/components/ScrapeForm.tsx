import React, { useState } from 'react';
import {
  Globe,
  Sparkles,
  Settings2,
  BookOpen,
  FileCode,
  FileText,
  ListOrdered,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import { ScrapeMode, ScrapeOptions } from '../types';

interface ScrapeFormProps {
  onScrape: (url: string, mode: ScrapeMode, options: ScrapeOptions) => void;
  isLoading: boolean;
}

const SAMPLE_URLS = [
  { label: 'Python Docs', url: 'https://docs.python.org/3/tutorial/controlflow.html' },
  { label: 'Wikipedia (AI)', url: 'https://en.wikipedia.org/wiki/Artificial_intelligence' },
  { label: 'GitHub Docs', url: 'https://docs.github.com/en/get-started/start-your-codespace' },
  { label: 'Hacker News', url: 'https://news.ycombinator.com' },
];

export const ScrapeForm: React.FC<ScrapeFormProps> = ({ onScrape, isLoading }) => {
  const [url, setUrl] = useState('');
  const [mode, setMode] = useState<ScrapeMode>('ai_structured');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [options, setOptions] = useState<ScrapeOptions>({
    includeFrontmatter: true,
    includeTableOfContents: true,
    extractImages: true,
    extractLinks: true,
    includeMetadata: true,
    customPrompt: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onScrape(url.trim(), mode, options);
  };

  const handleSampleClick = (sampleUrl: string) => {
    setUrl(sampleUrl);
    onScrape(sampleUrl, mode, options);
  };

  return (
    <div className="bg-white/80 border border-[#E2E2D5] rounded-[32px] p-5 sm:p-7 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* URL Input Bar */}
        <div className="space-y-2">
          <label htmlFor="url-input" className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#8B8B7A]">
            Target Website URL
          </label>
          <div className="relative flex items-center">
            <div className="absolute left-4 text-[#8B8B7A] pointer-events-none">
              <Globe className="w-5 h-5 text-[#5A5A40]" />
            </div>
            <input
              id="url-input"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article-or-documentation"
              className="w-full pl-12 pr-36 py-3.5 bg-white border border-[#D6D6C2] focus:border-[#5A5A40] focus:ring-2 focus:ring-[#5A5A40]/15 rounded-full text-[#4A4A3A] text-sm placeholder-[#A0A090] outline-none transition-all shadow-inner"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="absolute right-1.5 px-5 py-2.5 bg-[#5A5A40] hover:bg-[#4A4A3A] disabled:opacity-50 disabled:cursor-not-allowed text-white font-serif italic text-sm rounded-full shadow-md transition-all flex items-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scraping...</span>
                </>
              ) : (
                <>
                  <span>Scrape & .MD</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Test Chips */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[#8B8B7A] flex items-center text-[11px] font-medium">
            <HelpCircle className="w-3.5 h-3.5 mr-1 text-[#8B8B7A]" />
            Try sample URL:
          </span>
          {SAMPLE_URLS.map((sample) => (
            <button
              key={sample.label}
              type="button"
              onClick={() => handleSampleClick(sample.url)}
              disabled={isLoading}
              className="px-3 py-1 rounded-full bg-white hover:bg-[#F5F5F0] text-[#5A5A40] border border-[#E2E2D5] transition-colors cursor-pointer text-xs font-medium shadow-2xs"
            >
              {sample.label}
            </button>
          ))}
        </div>

        {/* Mode Selector */}
        <div className="space-y-2 pt-1">
          <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#8B8B7A]">
            Output Format & AI Style
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <button
              type="button"
              onClick={() => setMode('ai_structured')}
              className={`flex flex-col items-center p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${
                mode === 'ai_structured'
                  ? 'bg-[#5A5A40] border-[#5A5A40] text-white shadow-sm'
                  : 'bg-white border-[#E2E2D5] text-[#6B705C] hover:border-[#D6D6C2] hover:text-[#5A5A40]'
              }`}
            >
              <Sparkles className={`w-4 h-4 mb-1 ${mode === 'ai_structured' ? 'text-white' : 'text-[#5A5A40]'}`} />
              <span className="font-semibold">AI Structured</span>
              <span className={`text-[10px] mt-0.5 text-center ${mode === 'ai_structured' ? 'text-white/80' : 'text-[#8B8B7A]'}`}>Clean & Complete</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('documentation')}
              className={`flex flex-col items-center p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${
                mode === 'documentation'
                  ? 'bg-[#5A5A40] border-[#5A5A40] text-white shadow-sm'
                  : 'bg-white border-[#E2E2D5] text-[#6B705C] hover:border-[#D6D6C2] hover:text-[#5A5A40]'
              }`}
            >
              <FileCode className={`w-4 h-4 mb-1 ${mode === 'documentation' ? 'text-white' : 'text-[#5A5A40]'}`} />
              <span className="font-semibold">Developer Docs</span>
              <span className={`text-[10px] mt-0.5 text-center ${mode === 'documentation' ? 'text-white/80' : 'text-[#8B8B7A]'}`}>API & Code Focus</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('article')}
              className={`flex flex-col items-center p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${
                mode === 'article'
                  ? 'bg-[#5A5A40] border-[#5A5A40] text-white shadow-sm'
                  : 'bg-white border-[#E2E2D5] text-[#6B705C] hover:border-[#D6D6C2] hover:text-[#5A5A40]'
              }`}
            >
              <BookOpen className={`w-4 h-4 mb-1 ${mode === 'article' ? 'text-white' : 'text-[#5A5A40]'}`} />
              <span className="font-semibold">Article / Blog</span>
              <span className={`text-[10px] mt-0.5 text-center ${mode === 'article' ? 'text-white/80' : 'text-[#8B8B7A]'}`}>Summary & Body</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('cheatsheet')}
              className={`flex flex-col items-center p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${
                mode === 'cheatsheet'
                  ? 'bg-[#5A5A40] border-[#5A5A40] text-white shadow-sm'
                  : 'bg-white border-[#E2E2D5] text-[#6B705C] hover:border-[#D6D6C2] hover:text-[#5A5A40]'
              }`}
            >
              <ListOrdered className={`w-4 h-4 mb-1 ${mode === 'cheatsheet' ? 'text-white' : 'text-[#5A5A40]'}`} />
              <span className="font-semibold">Cheatsheet</span>
              <span className={`text-[10px] mt-0.5 text-center ${mode === 'cheatsheet' ? 'text-white/80' : 'text-[#8B8B7A]'}`}>Quick Reference</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('raw')}
              className={`flex flex-col items-center p-3.5 rounded-2xl border text-xs transition-all cursor-pointer ${
                mode === 'raw'
                  ? 'bg-[#5A5A40] border-[#5A5A40] text-white shadow-sm'
                  : 'bg-white border-[#E2E2D5] text-[#6B705C] hover:border-[#D6D6C2] hover:text-[#5A5A40]'
              }`}
            >
              <FileText className={`w-4 h-4 mb-1 ${mode === 'raw' ? 'text-white' : 'text-[#5A5A40]'}`} />
              <span className="font-semibold">Direct Turndown</span>
              <span className={`text-[10px] mt-0.5 text-center ${mode === 'raw' ? 'text-white/80' : 'text-[#8B8B7A]'}`}>Raw HTML to .MD</span>
            </button>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-1.5 text-xs text-[#5A5A40] hover:text-[#3D3D2E] font-semibold transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#5A5A40]" />
            <span>Advanced Formatting & Options</span>
            {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showAdvanced && (
            <div className="mt-3 p-4 bg-[#FBFBFA] rounded-2xl border border-[#E2E2D5] space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <label className="flex items-center space-x-2 text-xs text-[#4A4A3A] font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.includeFrontmatter}
                    onChange={(e) => setOptions({ ...options, includeFrontmatter: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#5A5A40]"
                  />
                  <span>YAML Frontmatter</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-[#4A4A3A] font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.includeTableOfContents}
                    onChange={(e) => setOptions({ ...options, includeTableOfContents: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#5A5A40]"
                  />
                  <span>Table of Contents</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-[#4A4A3A] font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.extractImages}
                    onChange={(e) => setOptions({ ...options, extractImages: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#5A5A40]"
                  />
                  <span>Format Images</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-[#4A4A3A] font-medium cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.extractLinks}
                    onChange={(e) => setOptions({ ...options, extractLinks: e.target.checked })}
                    className="w-4 h-4 rounded accent-[#5A5A40]"
                  />
                  <span>Link References</span>
                </label>
              </div>

              {/* Custom AI Instructions */}
              <div>
                <label className="block text-[11px] font-semibold text-[#8B8B7A] mb-1">
                  Custom AI Refinement Prompt (Optional)
                </label>
                <input
                  type="text"
                  value={options.customPrompt || ''}
                  onChange={(e) => setOptions({ ...options, customPrompt: e.target.value })}
                  placeholder="e.g. Highlight code examples, translate to German, or focus on setup instructions"
                  className="w-full px-3.5 py-2 bg-white border border-[#D6D6C2] rounded-xl text-xs text-[#4A4A3A] placeholder-[#A0A090] outline-none focus:border-[#5A5A40]"
                />
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
