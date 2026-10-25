import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { readConversionResponse } from "./lib/conversionApi";
import {
  UploadCloud,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileCheck,
  Check,
  Copy,
  Download,
  RotateCcw,
  Sparkles,
  Link2,
  Globe,
  AlertCircle,
  Eye,
  Code2,
  Columns2,
  Layers,
  ChevronRight,
  Sigma,
} from "lucide-react";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  base64: string;
}

interface ConversionStats {
  wordCount?: number;
  charCount?: number;
  headings?: number;
  tables?: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [urlInput, setUrlInput] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [markdown, setMarkdown] = useState<string>("");
  const [engineUsed, setEngineUsed] = useState<string>("");
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");

  // Output Style: standard, latex, or summary
  const [style, setStyle] = useState<"standard" | "latex" | "summary">("latex");
  const [includeToc, setIncludeToc] = useState(false);
  const [useAi, setUseAi] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File size formatter
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      loadSelectedFile(e.target.files[0]);
    }
  };

  const loadSelectedFile = (selectedFile: File) => {
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      setFile({
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        base64,
      });
    };
    reader.onerror = () => {
      setError("Failed to read the selected file. Please try another one.");
    };
    reader.readAsDataURL(selectedFile);
  };

  // Convert File to Markdown / LaTeX
  const handleConvertFile = async (targetFile?: UploadedFile) => {
    const fileToConvert = targetFile || file;
    if (!fileToConvert) return;

    setIsProcessing(true);
    setError(null);
    setProgressMsg(
      style === "latex"
        ? "Extracting mathematical equations & formatting LaTeX..."
        : "Ingesting document & structuring markdown..."
    );

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: fileToConvert.name,
          fileType: fileToConvert.type,
          fileData: fileToConvert.base64,
          options: {
            useAi,
            style,
            includeToc,
          },
        }),
      });

      const data = await readConversionResponse(response);

      setMarkdown(data.markdown);
      setEngineUsed(data.engine || "Native Markdown Engine");
      setStats(data.stats || null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during conversion.");
    } finally {
      setIsProcessing(false);
      setProgressMsg("");
    }
  };

  // Convert Web URL to Markdown / LaTeX
  const handleConvertUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;

    setIsProcessing(true);
    setError(null);
    setProgressMsg("Fetching web page & formatting markdown...");

    try {
      const response = await fetch("/api/convert-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await readConversionResponse(response);

      setMarkdown(data.markdown);
      setEngineUsed("Web Scraper Engine");
      setStats(data.stats || null);
      setFile({
        name: `${data.domain || "web-page"}.md`,
        size: data.markdown.length,
        type: "text/markdown",
        base64: "",
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while scraping the URL.");
    } finally {
      setIsProcessing(false);
      setProgressMsg("");
    }
  };

  // Copy Content to Clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download .md File
  const handleDownloadMd = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const baseName = file ? file.name.replace(/\.[^/.]+$/, "") : "document";
    link.download = `${baseName}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate & Download compilable .tex LaTeX document
  const handleDownloadTex = () => {
    const baseName = file ? file.name.replace(/\.[^/.]+$/, "") : "document";
    const cleanTitle = baseName.replace(/[_\$#&%]/g, " ");

    let texContent = `\\documentclass[11pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath,amssymb,amsfonts}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{hyperref}
\\usepackage{geometry}
\\geometry{margin=1in}

\\title{${cleanTitle}}
\\author{Compiled via MarkItDown}
\\date{\\today}

\\begin{document}
\\maketitle

`;

    const lines = markdown.split(/\r?\n/);
    let inCode = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith("```")) {
        if (!inCode) {
          inCode = true;
          texContent += `\\begin{verbatim}\n`;
        } else {
          inCode = false;
          texContent += `\\end{verbatim}\n\n`;
        }
        continue;
      }
      if (inCode) {
        texContent += `${line}\n`;
        continue;
      }

      if (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length > 2) {
        const eq = trimmed.slice(2, -2).trim();
        texContent += `\\begin{equation}\n${eq}\n\\end{equation}\n\n`;
        continue;
      }

      if (trimmed.startsWith("# ")) {
        texContent += `\\section{${trimmed.slice(2)}}\n\n`;
        continue;
      }
      if (trimmed.startsWith("## ")) {
        texContent += `\\subsection{${trimmed.slice(3)}}\n\n`;
        continue;
      }
      if (trimmed.startsWith("### ")) {
        texContent += `\\subsubsection{${trimmed.slice(4)}}\n\n`;
        continue;
      }

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        texContent += `\\begin{itemize}\n  \\item ${trimmed.slice(2)}\n\\end{itemize}\n\n`;
        continue;
      }

      const cleanLine = line
        .replace(/\*\*([^*]+)\*\*/g, "\\textbf{$1}")
        .replace(/\*([^*]+)\*/g, "\\textit{$1}");

      if (cleanLine.trim().length > 0) {
        texContent += `${cleanLine}\n\n`;
      }
    }

    texContent += `\\end{document}\n`;

    const blob = new Blob([texContent], { type: "application/x-tex;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${baseName}.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Reset to Upload State
  const handleReset = () => {
    setMarkdown("");
    setFile(null);
    setUrlInput("");
    setError(null);
    setStats(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-blue-500/20 selection:text-blue-700">
      {/* Top Header - Clean, Light & Minimal */}
      <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-mono font-bold text-sm shadow-xs">
            M↓
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-900 text-sm tracking-tight">MarkItDown</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                Markdown & LaTeX
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Convert any document, file or web page to clean Markdown & LaTeX
            </p>
          </div>
        </div>

        {/* Right Header Action */}
        <div className="flex items-center space-x-2">
          {markdown && (
            <button
              onClick={handleReset}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Convert Another File</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3 text-red-800 text-xs shadow-xs animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Conversion issue</p>
              <p className="mt-0.5 text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-800 font-bold text-sm cursor-pointer"
            >
              ×
            </button>
          </div>
        )}

        {/* WORKSPACE VIEW: When Markdown / LaTeX is generated */}
        {markdown ? (
          <div className="flex-1 flex flex-col h-[calc(100vh-140px)] min-h-[520px] space-y-3">
            {/* Top Workspace Action Bar */}
            <div className="bg-white border border-slate-200 rounded-xl p-3 sm:px-4 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {file?.name || "document.md"}
                  </h3>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                    <span className="text-blue-600 font-semibold">{engineUsed}</span>
                    {style === "latex" && (
                      <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-mono">
                        LaTeX Math Active
                      </span>
                    )}
                    {stats && (
                      <span className="hidden sm:inline font-mono text-slate-400">
                        • {stats.wordCount?.toLocaleString()} words • {stats.headings || 0} headings •{" "}
                        {stats.tables || 0} tables
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* View Switcher & Action Buttons */}
              <div className="flex items-center space-x-2">
                {/* View Mode Buttons */}
                <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode("split")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                      viewMode === "split"
                        ? "bg-white text-blue-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Side-by-side view"
                  >
                    <Columns2 className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Split</span>
                  </button>
                  <button
                    onClick={() => setViewMode("edit")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                      viewMode === "edit"
                        ? "bg-white text-blue-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Raw Source Editor"
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Raw Source</span>
                  </button>
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                      viewMode === "preview"
                        ? "bg-white text-blue-700 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    title="Rendered Math Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview & Math</span>
                  </button>
                </div>

                {/* Copy Button */}
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                {/* Download .tex (LaTeX document) */}
                <button
                  onClick={handleDownloadTex}
                  className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-xs font-bold text-indigo-700 flex items-center space-x-1.5 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Download compile-ready LaTeX .tex document"
                >
                  <Sigma className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Download .tex</span>
                </button>

                {/* Download .md */}
                <button
                  onClick={handleDownloadMd}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white flex items-center space-x-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
                  title="Download standard Markdown .md file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            {/* Split Editor / Preview Area */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0 overflow-hidden">
              {/* RAW Markdown / LaTeX Panel */}
              {(viewMode === "split" || viewMode === "edit") && (
                <div
                  className={`bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-xs ${
                    viewMode === "edit" ? "md:col-span-2" : ""
                  }`}
                >
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500 font-semibold">
                    <span>EDITABLE MARKDOWN & LATEX SOURCE</span>
                    <span>UTF-8 GFM + MATH</span>
                  </div>
                  <textarea
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    className="flex-1 p-4 bg-white text-slate-800 font-mono text-xs leading-relaxed outline-none resize-none overflow-y-auto selection:bg-blue-100"
                    placeholder="Markdown & LaTeX content..."
                    spellCheck={false}
                  />
                </div>
              )}

              {/* RENDERED Preview Panel with KaTeX Math Rendering */}
              {(viewMode === "split" || viewMode === "preview") && (
                <div
                  className={`bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-xs ${
                    viewMode === "preview" ? "md:col-span-2" : ""
                  }`}
                >
                  <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500 font-semibold">
                    <span>RENDERED PREVIEW (KATEX MATH ENABLED)</span>
                    <span className="text-blue-600 font-normal">Live equations</span>
                  </div>
                  <div className="flex-1 p-6 overflow-y-auto markdown-body">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {markdown}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* INITIAL INPUT WORKSPACE: Drop Zone & Clean Config */
          <div className="space-y-6">
            {/* Mode Switcher: Drop File vs Enter URL */}
            <div className="flex items-center justify-center">
              <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab("file")}
                  className={`px-5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
                    activeTab === "file"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Drop Any File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("url")}
                  className={`px-5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
                    activeTab === "url"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Link2 className="w-4 h-4" />
                  <span>Web Page URL</span>
                </button>
              </div>
            </div>

            {/* TAB 1: FILE DROP ZONE */}
            {activeTab === "file" && (
              <div className="space-y-4">
                {/* Drag & Drop Surface */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center min-h-[300px] shadow-xs ${
                    isDragging
                      ? "border-blue-500 bg-blue-50/40 scale-[0.99]"
                      : file
                      ? "border-blue-500/80 bg-blue-50/10"
                      : "border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/60"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.csv,.tsv,.xlsx,.txt,.md,.json,.html,.png,.jpg,.jpeg,.webp,.js,.ts,.py,.sql"
                    disabled={isProcessing}
                  />

                  {file ? (
                    /* File Selected State */
                    <div className="space-y-4 max-w-md w-full animate-in fade-in zoom-in-95 duration-150">
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base break-all">{file.name}</h4>
                        <p className="text-xs font-mono text-slate-500 mt-1">
                          {formatBytes(file.size)} • Ready to convert
                        </p>
                      </div>
                      <div className="flex items-center justify-center space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                        >
                          Change File
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Empty Prompt State */
                    <div className="space-y-4 max-w-lg">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                          Drop any document here, or browse
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                          Drop normal files (PDFs, Word docs, spreadsheets, code, or images) to generate
                          structured <span className="font-semibold text-blue-600">Markdown</span> or compile-ready{" "}
                          <span className="font-semibold text-indigo-600">LaTeX</span> with equations.
                        </p>
                      </div>

                      {/* Format tags */}
                      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                        {[
                          { label: "PDF", icon: FileText },
                          { label: "Word (.docx)", icon: FileText },
                          { label: "LaTeX Math ($$...$$)", icon: Sigma },
                          { label: "CSV / Excel", icon: FileSpreadsheet },
                          { label: "TXT / Code", icon: FileCode },
                          { label: "Images (OCR)", icon: FileCheck },
                        ].map((fmt) => (
                          <span
                            key={fmt.label}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-medium text-slate-700"
                          >
                            <fmt.icon className="w-3 h-3 text-blue-600" />
                            <span>{fmt.label}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Conversion Trigger Button */}
                {file && (
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      onClick={() => handleConvertFile()}
                      disabled={isProcessing}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>{progressMsg || "Structuring LaTeX / Markdown..."}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>
                            {style === "latex" ? "Generate LaTeX & Math .MD" : "Generate Structured .MD"}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: URL INPUT */}
            {activeTab === "url" && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-base">Enter Web Page URL</h3>
                  <p className="text-xs text-slate-500">
                    Fetch full article content, remove ads, clean HTML, and convert to structured Markdown & LaTeX.
                  </p>
                </div>

                <form onSubmit={handleConvertUrl} className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://en.wikipedia.org/wiki/LaTeX"
                      disabled={isProcessing}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 transition-colors font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessing || !urlInput.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Convert URL to .MD</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Clean Options Box with LaTeX Selector */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-slate-600 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Output Format:</span>
                </span>
                <div className="flex items-center space-x-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                  {[
                    { id: "latex", label: "LaTeX Math & Equations", icon: Sigma },
                    { id: "standard", label: "Standard .MD", icon: FileText },
                    { id: "summary", label: "Executive Summary", icon: Layers },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStyle(s.id as any)}
                      className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors flex items-center space-x-1 ${
                        style === s.id
                          ? "bg-white text-blue-700 font-semibold shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <s.icon className="w-3 h-3" />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeToc}
                    onChange={(e) => setIncludeToc(e.target.checked)}
                    className="accent-blue-600 rounded cursor-pointer"
                  />
                  <span>Table of Contents</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useAi}
                    onChange={(e) => setUseAi(e.target.checked)}
                    className="accent-blue-600 rounded cursor-pointer"
                  />
                  <span className="flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>AI Deep Structuring</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-slate-200 bg-white px-6 flex items-center justify-between text-xs text-slate-500 shrink-0">
        <p className="font-mono text-[11px]">MarkItDown • Document to Markdown & LaTeX</p>
        <p className="text-[11px] text-slate-500 hidden sm:block">
          LaTeX math typesetting ($$...$$) • .md and .tex export
        </p>
      </footer>
    </div>
  );
}
