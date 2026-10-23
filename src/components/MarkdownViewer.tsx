import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Copy,
  Check,
  Download,
  Eye,
  Code,
  Columns,
  Sparkles,
  ExternalLink,
  BookOpen,
  Clock,
  FileText,
  RefreshCw,
  Image as ImageIcon,
  Link2,
} from 'lucide-react';
import { PageMetadata } from '../types';

interface MarkdownViewerProps {
  markdown: string;
  metadata?: PageMetadata;
  url?: string;
  onChangeMarkdown: (newMd: string) => void;
  onAIRefine?: (prompt: string) => void;
  isRefining?: boolean;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  markdown,
  metadata,
  url,
  onChangeMarkdown,
  onAIRefine,
  isRefining = false,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'code'>('split');
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [showLinksDrawer, setShowLinksDrawer] = useState(false);

  // Stats
  const wordCount = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;
  const lineCount = markdown.split('\n').length;
  const charCount = markdown.length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2000);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  const handleDownloadMd = () => {
    const filename = (metadata?.title || 'document')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '.md';

    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRefineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refinePrompt.trim() || !onAIRefine) return;
    onAIRefine(refinePrompt.trim());
    setShowRefineModal(false);
    setRefinePrompt('');
  };

  return (
    <div className="bg-white border border-[#E2E2D5] rounded-[32px] overflow-hidden shadow-sm flex flex-col min-h-[600px]">
      {/* Top Metadata & Stats Header */}
      {metadata && (
        <div className="bg-[#FBFBFA] px-5 py-3.5 border-b border-[#E2E2D5] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-3 min-w-0">
            <span className="px-2.5 py-0.5 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] border border-[#5A5A40]/20 font-mono font-medium text-[11px]">
              {metadata.domain}
            </span>
            <h2 className="font-serif italic font-bold text-[#5A5A40] truncate max-w-xs sm:max-w-md md:max-w-xl text-base" title={metadata.title}>
              {metadata.title}
            </h2>
            {url && (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-[#8B8B7A] hover:text-[#5A5A40] transition-colors inline-flex items-center"
                title="Open original website in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="flex items-center space-x-4 text-[#8B8B7A] text-[11px] font-medium">
            <span className="flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1 text-[#8B8B7A]" />
              {wordCount.toLocaleString()} words ({lineCount} lines)
            </span>
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-[#8B8B7A]" />
              ~{readTime} min read
            </span>
          </div>
        </div>
      )}

      {/* Main Control Toolbar */}
      <div className="bg-[#F5F5F0] px-5 py-2.5 border-b border-[#E2E2D5] flex flex-wrap items-center justify-between gap-2">
        {/* Left: View Mode Toggle */}
        <div className="flex items-center bg-white p-1 rounded-full border border-[#D6D6C2]">
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
              viewMode === 'split' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B705C] hover:text-[#5A5A40]'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Split</span>
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
              viewMode === 'preview' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B705C] hover:text-[#5A5A40]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
              viewMode === 'code' ? 'bg-[#5A5A40] text-white shadow-xs' : 'text-[#6B705C] hover:text-[#5A5A40]'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Raw .MD</span>
          </button>
        </div>

        {/* Right: Actions (Copy, Download, AI Refine) */}
        <div className="flex items-center space-x-2">
          {onAIRefine && (
            <button
              onClick={() => setShowRefineModal(true)}
              disabled={isRefining}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#EAEADF] hover:bg-[#E2E2D5] text-[#5A5A40] border border-[#D6D6C2] transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#5A5A40]" />
              <span>AI Edit / Refine</span>
            </button>
          )}

          <button
            onClick={handleCopyMarkdown}
            className="flex items-center space-x-1 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-[#F5F5F0] text-[#5A5A40] border border-[#D6D6C2] transition-colors cursor-pointer"
            title="Copy Raw Markdown"
          >
            {copiedMd ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#5A5A40]" />
                <span className="text-[#5A5A40]">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#8B8B7A]" />
                <span>Copy .MD</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadMd}
            className="flex items-center space-x-1 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#5A5A40] hover:bg-[#4A4A3A] text-white shadow-xs transition-colors cursor-pointer font-serif italic"
            title="Download .md file"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .MD</span>
          </button>
        </div>
      </div>

      {/* Dual Pane Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#E2E2D5] bg-white relative min-h-[500px]">
        {/* Left: Code Editor */}
        {(viewMode === 'split' || viewMode === 'code') && (
          <div className={`p-4 sm:p-5 flex flex-col bg-[#FBFBFA] ${viewMode === 'code' ? 'md:col-span-2' : ''}`}>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8B8B7A] flex items-center">
                <Code className="w-3.5 h-3.5 mr-1 text-[#5A5A40]" />
                Markdown Source (Editable)
              </span>
              <span className="text-[10px] text-[#8B8B7A] font-mono">
                {charCount.toLocaleString()} chars
              </span>
            </div>
            <textarea
              value={markdown}
              onChange={(e) => onChangeMarkdown(e.target.value)}
              className="w-full flex-1 min-h-[450px] p-3.5 bg-white font-mono text-xs sm:text-sm text-[#4A4A3A] border border-[#D6D6C2] rounded-2xl focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] outline-none resize-none leading-relaxed shadow-inner"
              placeholder="# Write or paste markdown here..."
              spellCheck={false}
            />
          </div>
        )}

        {/* Right: Rendered Markdown Preview */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className={`p-5 sm:p-7 overflow-y-auto max-h-[700px] bg-white ${viewMode === 'preview' ? 'md:col-span-2' : ''}`}>
            <div className="flex items-center justify-between mb-4 border-b border-[#E2E2D5] pb-2.5">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#8B8B7A] flex items-center">
                <Eye className="w-3.5 h-3.5 mr-1 text-[#5A5A40]" />
                Live Rendered Document
              </span>
            </div>

            {/* Styled Rendered Content */}
            <div className="markdown-body max-w-none text-[#4A4A3A] text-sm leading-relaxed space-y-4">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* AI Refine Modal */}
      {showRefineModal && (
        <div className="fixed inset-0 z-50 bg-[#4A4A3A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E2D5] rounded-[28px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-[#5A5A40]/10 border border-[#5A5A40]/20 flex items-center justify-center text-[#5A5A40]">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif italic font-bold text-[#5A5A40] text-base">Refine with Gemini AI</h3>
                <p className="text-xs text-[#8B8B7A]">Ask AI to modify or enhance this Markdown file</p>
              </div>
            </div>

            <form onSubmit={handleRefineSubmit} className="space-y-4">
              <textarea
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                placeholder="e.g. Add a summary table at the top, translate technical terms to Spanish, or organize into bullet points..."
                className="w-full h-28 p-3.5 bg-[#FBFBFA] border border-[#D6D6C2] rounded-2xl text-xs text-[#4A4A3A] placeholder-[#A0A090] outline-none focus:border-[#5A5A40]"
                autoFocus
              />

              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowRefineModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#8B8B7A] hover:text-[#4A4A3A] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!refinePrompt.trim() || isRefining}
                  className="px-5 py-2 rounded-full text-xs font-semibold bg-[#5A5A40] hover:bg-[#4A4A3A] text-white shadow-sm cursor-pointer disabled:opacity-50 font-serif italic"
                >
                  Apply Refinement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
