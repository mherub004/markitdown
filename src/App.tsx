import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import {
  UploadCloud,
  FileText,
  Check,
  Copy,
  Download,
  Settings,
  RefreshCw,
  Globe,
  Sparkles,
  Trash2,
  Eye,
  Code2,
  AlertCircle,
  X,
  BookOpen,
  ArrowRight,
  Zap,
  Terminal,
  Cpu,
  Layers
} from "lucide-react";

interface FileInfo {
  name: string;
  size: number;
  type: string;
  data: string; // base64
}

interface ConversionOptions {
  style: string;
  extractTables: boolean;
  cleanSpelling: boolean;
  codeBlocks: boolean;
  language: string;
  engine: "free" | "gemini";
}

interface ConversionStats {
  wordCount?: number;
  charCount?: number;
  headings?: number;
  tables?: number;
}

// Built-in sample files for users to try the app instantly
const SAMPLE_FILES = [
  {
    name: "Standard Invoice.pdf",
    type: "application/pdf",
    size: 45200,
    label: "Invoice (PDF)",
    description: "Itemized billing document with multi-row table",
    data: "JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFsgMyAwIFIgXSAvQ291bnQgMSA+PgplbmRvYmoKMyAwIG9iago8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbIDAgMCA1OTUgODQyIF0gL0NvbnRlbnRzIDQgMCBSID4+CmVuZG9iago0IDAgb2JqCjw8IC9MZW5ndGggMjUwID4+CnN0cmVhbQpCVAovRjEgMTQgVGYKMTAwIDc1MCBUZAooSU5WT0lDRSAjIElOVi04OTAyKSBUagowIC0yNSBUZAooRGF0ZTogMjAyNi0wNy0xNikgVGoKMCAtMjUgVGQKKEJpbGwgVG86IEFjbWUgQ29ycCkgVGoKMCAtMzUgVGQKKEl0ZW0gMSAtIENsb3VkIEhvc3RpbmcgRW50ZXJwcmlzZSAtICQzODYuMDApIFRqCjAgLTI1IFRkCihJdGVtIDIgLSBBSSBBc3Npc3RhbnQgQVBJIC0gJDQ5OS4wMCkgVGoKMCAtMzAgVGQKKFRvdGFsOiAkODg1LjAwKSBUagpFVAplbmRzdHJlYW0KZW5kb2JqCnhyZWYKMCA1CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDIxMCAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDUgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjUxMAolJUVPRg=="
  },
  {
    name: "Technical Specs.txt",
    type: "text/plain",
    size: 1048,
    label: "Specs (TXT)",
    description: "Raw text document with data tables & code",
    data: "Q09SRSBQT1dFUiBFTkdJTkVFUklORyBTUEVDSUZJQ0FUSU9OUwoKMS4gT1ZFUlZJRVcKVGhlIG5leHQtZ2VuZXJhdGlvbiBlbmdpbmUgZm9jdXNlcyBvbiBlZmZpY2llbmN5LCB0aGVybWFsIGRpc3NpcGF0aW9uLCBhbmQgY29tcHV0ZSBkZW5zaXR5LiAKCjIuIFBFUkZPUk1BTkNFIE1FVFJJQ1MKfCBNZXRyaWMgfCBWYWx1ZSB8IFN0YXR1cyB8Cnwgc3BlZWQgfCA0LjUgR0h6IHwgT3B0aW1hbCB8CnwgdGVtcCB8IDY1wrBDIHwgU3RhYmxlIHwKfCBwb3dlciB8IDEyMFcgfCBMb3ctUG93ZXIgfAoKMy4gQ09ERSBTRUdNRU5UCmZ1bmN0aW9uIGluaXRpYWxpemVFbmdpbmUoY29uZmlnKSB7CiAgY29uc3QgcG93ZXIgPSBjb25maWcucG93ZXIgfHwgMTIwOwogIGxldCB0ZW1wID0gY29uZmlnLnN0YXJ0VGVtcCB8fCAyMDsKICBpZiAodGVtcCA+IDY1KSB7CiAgICB0aHJvdyBuZXcgRXJyb3IoIkNsaW1hdGUgT3ZlcmhlYXQgV2FybmluZyIpOwogIH0KICByZXR1cm4geyBzdGF0dXM6ICJhY3RpdmUiLCBzcGVlZDogIjQuNUdIeiIsIHBvd2VyIH07Cn0="
  },
  {
    name: "Meeting_Whiteboard.png",
    type: "image/png",
    size: 2840,
    label: "Whiteboard (PNG)",
    description: "Visual whiteboard notes & system flowchart",
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
  }
];

export default function App() {
  const [file, setFile] = useState<FileInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [convertedMarkdown, setConvertedMarkdown] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [engineUsed, setEngineUsed] = useState<string>("Free Native Engine");
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  const [stats, setStats] = useState<ConversionStats | null>(null);
  const [showApiDocs, setShowApiDocs] = useState(false);
  
  // Workspace views: 'split' (side-by-side), 'edit' (raw editor only), 'preview' (rendered only)
  const [workspaceMode, setWorkspaceMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [isCopied, setIsCopied] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Conversion Options - default to free engine for 100% reliable zero-key execution
  const [options, setOptions] = useState<ConversionOptions>({
    style: "Standard Markdown",
    extractTables: true,
    cleanSpelling: false,
    codeBlocks: true,
    language: "Original Language",
    engine: "free"
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const steps = [
    "Ingesting document and identifying syntax encoding...",
    "Executing parser and mapping structural hierarchies...",
    "Formatting tables, code blocks, and lists to GFM...",
    "Finalizing UTF-8 Markdown generation..."
  ];

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const base64Data = result.split(",")[1];
        setFile({
          name: selectedFile.name,
          size: selectedFile.size,
          type: selectedFile.type,
          data: base64Data
        });
      }
    };
    reader.onerror = () => {
      setError("Failed to read file. Please try again with another file.");
    };
    reader.readAsDataURL(selectedFile);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Convert File utilizing Free Native API or Gemini Cloud AI
  const handleConvert = async () => {
    if (!file) return;

    setIsConverting(true);
    setCurrentStep(0);
    setError(null);
    setFallbackNotice(null);

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 400);

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileData: file.data,
          options,
          engine: options.engine
        })
      });

      const data = await response.json();
      clearInterval(stepInterval);

      if (response.ok && data.success) {
        setConvertedMarkdown(data.markdown);
        setEngineUsed(data.engineLabel || (options.engine === "free" ? "Free Native Engine" : "Gemini Cloud AI"));
        if (data.fallbackNotice) {
          setFallbackNotice(data.fallbackNotice);
        }
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        throw new Error(data.error || "Failed to convert document.");
      }
    } catch (err: any) {
      clearInterval(stepInterval);
      console.error(err);
      setError(err.message || "An error occurred during conversion.");
    } finally {
      setIsConverting(false);
    }
  };

  const selectSample = (sample: typeof SAMPLE_FILES[0]) => {
    setError(null);
    setFile({
      name: sample.name,
      size: sample.size,
      type: sample.type,
      data: sample.data
    });
  };

  const handleReset = () => {
    setFile(null);
    setConvertedMarkdown("");
    setError(null);
    setFallbackNotice(null);
    setStats(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(convertedMarkdown);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([convertedMarkdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const originalName = file ? file.name : "document";
    const baseName = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
    link.download = `${baseName}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const copyCurlCode = () => {
    const snippet = `curl -X POST "${window.location.origin}/api/convert-free" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fileName": "example.pdf",
    "fileData": "<BASE64_ENCODED_FILE>",
    "options": {
      "style": "Standard Markdown",
      "extractTables": true
    }
  }'`;
    navigator.clipboard.writeText(snippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#F8F9FA] text-[#1A1A1B] flex flex-col font-sans selection:bg-neutral-200">
      {/* Top Navigation */}
      <header id="app-header" className="h-16 border-b border-[#E2E4E7] bg-white px-6 sm:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black flex items-center justify-center rounded-sm">
            <span className="text-white font-mono text-xs font-bold">M↓</span>
          </div>
          <div>
            <span className="font-bold tracking-tight text-base sm:text-lg font-display">MARKDOWN.OS</span>
            <span className="ml-2.5 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              Free API Active
            </span>
          </div>
        </div>
        
        <nav className="hidden md:flex gap-8 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
          <button 
            type="button"
            onClick={() => handleReset()}
            className="text-black border-b-2 border-black pb-1 hover:text-black cursor-pointer"
          >
            Convert
          </button>
          <button 
            type="button"
            onClick={() => setShowApiDocs(true)}
            className="hover:text-black transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5" />
            Free API Docs
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <button 
            id="api-docs-btn"
            type="button"
            onClick={() => setShowApiDocs(true)}
            className="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 text-black text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all flex items-center gap-1.5 border border-[#E2E4E7]"
          >
            <Terminal className="w-3 h-3" />
            <span className="hidden sm:inline">API Endpoints</span>
            <span className="sm:hidden">API</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Flow */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {!convertedMarkdown ? (
            /* Config & Upload State */
            <motion.div
              key="upload-workspace"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full"
            >
              {/* Left Column: Sidebar-style Configuration (col-span-4) */}
              <div className="lg:col-span-4 bg-white border border-[#E2E4E7] rounded-lg p-6 space-y-6">
                
                {/* Engine Selector */}
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF] mb-3 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-black" />
                    Conversion Engine Mode
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      id="engine-free-btn"
                      type="button"
                      onClick={() => setOptions({ ...options, engine: "free" })}
                      className={`text-left p-3 border rounded-md transition-all ${
                        options.engine === "free"
                          ? "border-black bg-black text-white"
                          : "border-[#E2E4E7] bg-white hover:bg-[#F8F9FA] text-[#1A1A1B]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <Zap className={`w-3.5 h-3.5 ${options.engine === "free" ? "text-emerald-400" : "text-emerald-600"}`} />
                          Free Native Engine
                        </span>
                        <span className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded ${options.engine === "free" ? "bg-neutral-800 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                          100% Free
                        </span>
                      </div>
                      <p className={`text-[10px] mt-1 ${options.engine === "free" ? "text-neutral-300" : "text-neutral-500"}`}>
                        Zero external API keys required. Instant local parsing of PDFs, CSVs, TXT, code, HTML & JSON.
                      </p>
                    </button>

                    <button
                      id="engine-gemini-btn"
                      type="button"
                      onClick={() => setOptions({ ...options, engine: "gemini" })}
                      className={`text-left p-3 border rounded-md transition-all ${
                        options.engine === "gemini"
                          ? "border-black bg-black text-white"
                          : "border-[#E2E4E7] bg-white hover:bg-[#F8F9FA] text-[#1A1A1B]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Gemini Cloud AI
                        </span>
                        <span className={`text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded ${options.engine === "gemini" ? "bg-neutral-800 text-neutral-300" : "bg-neutral-100 text-neutral-600"}`}>
                          Auto-Fallback
                        </span>
                      </div>
                      <p className={`text-[10px] mt-1 ${options.engine === "gemini" ? "text-neutral-300" : "text-neutral-500"}`}>
                        Deep multimodal vision model. Automatically falls back to Free Engine if key is unconfigured.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Parsing Rules */}
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF] mb-4 flex items-center gap-2">
                    <Settings className="w-3.5 h-3.5" />
                    Parsing Rules
                  </h3>
                  <div className="flex flex-col gap-2.5">
                    <label className="flex items-center justify-between p-3 border border-[#E2E4E7] rounded-md cursor-pointer hover:bg-[#F8F9FA] transition-colors">
                      <span className="text-xs font-semibold text-slate-700">Extract Tabular Tables</span>
                      <input
                        id="extract-tables-check"
                        type="checkbox"
                        checked={options.extractTables}
                        onChange={(e) => setOptions({ ...options, extractTables: e.target.checked })}
                        className="accent-black w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 border border-[#E2E4E7] rounded-md cursor-pointer hover:bg-[#F8F9FA] transition-colors">
                      <span className="text-xs font-semibold text-slate-700">Detect Code Snippets</span>
                      <input
                        id="code-blocks-check"
                        type="checkbox"
                        checked={options.codeBlocks}
                        onChange={(e) => setOptions({ ...options, codeBlocks: e.target.checked })}
                        className="accent-black w-4 h-4 cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 border border-[#E2E4E7] rounded-md cursor-pointer hover:bg-[#F8F9FA] transition-colors">
                      <span className="text-xs font-semibold text-slate-700">Clean Typos & Spells</span>
                      <input
                        id="clean-spelling-check"
                        type="checkbox"
                        checked={options.cleanSpelling}
                        onChange={(e) => setOptions({ ...options, cleanSpelling: e.target.checked })}
                        className="accent-black w-4 h-4 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Output Style Configuration */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF] mb-3">
                    Document Output Style
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { name: "Standard Markdown", desc: "Structured headings, lists & GFM tables" },
                      { name: "Academic/Technical", desc: "Formal report with LaTeX equations" },
                      { name: "Executive Summary", desc: "High-level takeaways and action items" },
                      { name: "Raw OCR", desc: "Literal structured layout matching" }
                    ].map((styleOption) => (
                      <button
                        key={styleOption.name}
                        type="button"
                        onClick={() => setOptions({ ...options, style: styleOption.name })}
                        className={`text-left p-2.5 border rounded-md transition-all ${
                          options.style === styleOption.name
                            ? "border-black bg-black text-white"
                            : "border-[#E2E4E7] bg-white hover:bg-[#F8F9FA] text-[#1A1A1B]"
                        }`}
                      >
                        <p className="font-bold text-xs">{styleOption.name}</p>
                        <p className={`text-[10px] mt-0.5 ${options.style === styleOption.name ? "text-neutral-300" : "text-neutral-500"}`}>
                          {styleOption.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Multi-language selector */}
                <div className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF] mb-2 flex items-center">
                    <Globe className="w-3.5 h-3.5 mr-1 text-[#9CA3AF]" />
                    Output Translation
                  </h3>
                  <select
                    id="translation-lang"
                    value={options.language}
                    onChange={(e) => setOptions({ ...options, language: e.target.value })}
                    className="w-full text-xs p-3 border border-[#E2E4E7] rounded-md bg-white text-[#1A1A1B] font-medium cursor-pointer"
                  >
                    <option value="Original Language">Original Language (As-is)</option>
                    <option value="English">English</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="French">French (Français)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Japanese">Japanese (日本語)</option>
                    <option value="Chinese">Chinese (中文)</option>
                  </select>
                </div>
              </div>

              {/* Right Column: Dynamic Stage & File Upload Zone (col-span-8) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="text-center lg:text-left space-y-2">
                  <h2 className="text-2xl font-extrabold tracking-tight text-[#1A1A1B] font-display">
                    Convert Any Document to Markdown (.md)
                  </h2>
                  <p className="text-neutral-500 text-xs leading-relaxed">
                    Powered by the built-in <strong>Free Native API</strong> and cloud vision models. Upload invoices, spreadsheets, reports, code, or whiteboard screenshots. No API keys required.
                  </p>
                </div>

                {/* Upload Zone */}
                <div
                  id="drop-zone"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative overflow-hidden border-2 border-dashed rounded-lg p-10 transition-all duration-150 flex flex-col items-center justify-center text-center cursor-pointer min-h-[320px] bg-white ${
                    isDragging
                      ? "border-black bg-neutral-50/50 scale-[0.995]"
                      : file
                      ? "border-emerald-500 bg-emerald-50/5"
                      : "border-[#CBD5E1] hover:border-black"
                  }`}
                  onClick={!isConverting ? triggerFileInput : undefined}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.html,.md,.json,.csv,.tsv"
                    disabled={isConverting}
                  />

                  <AnimatePresence mode="wait">
                    {file ? (
                      <motion.div
                        key="selected-file"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-4 max-w-sm w-full"
                      >
                        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                          <FileText className="w-7 h-7" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-[#1A1A1B] break-all">
                            {file.name}
                          </p>
                          <p className="text-[10px] uppercase font-mono tracking-wider text-[#9CA3AF] mt-1">
                            {formatFileSize(file.size)} • {file.type || "Document"}
                          </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2">
                          <button
                            id="change-file-btn"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerFileInput();
                            }}
                            className="px-3 py-1.5 border border-[#E2E4E7] text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-neutral-50 transition-colors"
                          >
                            Change File
                          </button>
                          <button
                            id="remove-file-btn"
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReset();
                            }}
                            className="px-3 py-1.5 border border-[#E2E4E7] text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-rose-50 text-rose-600 hover:border-rose-200 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty-prompt"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-4"
                      >
                        <div className="mx-auto w-16 h-16 bg-[#F1F5F9] rounded-full flex items-center justify-center mb-2">
                          <UploadCloud className="w-7 h-7 text-[#94A3B8]" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-800">
                            Drag & drop your document here, or{" "}
                            <span className="text-black font-bold underline decoration-2 underline-offset-2">
                              browse local disk
                            </span>
                          </p>
                          <p className="text-[10px] uppercase font-mono tracking-widest text-[#94A3B8] mt-2">
                            PDF • CSV • TXT • JSON • HTML • PNG • JPG
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="absolute bottom-4 text-[9px] text-[#94A3B8] uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    Free Engine Ready • Instant Local Processing
                  </div>
                </div>

                {/* Instant Try-it Sample Files */}
                <div className="space-y-3 bg-white p-5 border border-[#E2E4E7] rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF]">
                      Try Instantly with Built-in Sample Files
                    </h3>
                    <span className="text-[9px] text-emerald-600 font-mono font-bold uppercase">
                      Zero Setup
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SAMPLE_FILES.map((sample, idx) => (
                      <button
                        key={idx}
                        id={`sample-btn-${idx}`}
                        type="button"
                        onClick={() => selectSample(sample)}
                        className={`text-left p-3 border rounded-md transition-all text-xs flex flex-col justify-between h-20 cursor-pointer ${
                          file?.name === sample.name
                            ? "border-black bg-neutral-50 ring-1 ring-black"
                            : "border-[#E2E4E7] bg-white hover:border-neutral-400"
                        }`}
                      >
                        <div>
                          <p className="font-bold text-neutral-800 text-[11px] truncate">{sample.label}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{sample.description}</p>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-900 flex items-center">
                          Select <ArrowRight className="w-2.5 h-2.5 ml-1" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conversion Trigger Button */}
                <div>
                  <button
                    id="convert-button"
                    type="button"
                    onClick={handleConvert}
                    disabled={!file || isConverting}
                    className={`w-full py-3.5 px-6 font-bold uppercase tracking-widest text-xs flex items-center justify-center space-x-2 rounded-sm transition-all shadow-sm cursor-pointer ${
                      !file
                        ? "bg-[#F1F5F9] text-neutral-400 cursor-not-allowed border border-[#E2E4E7]"
                        : "bg-black hover:bg-neutral-900 text-white hover:shadow-md active:scale-[0.99]"
                    }`}
                  >
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Run Markdown Transformation</span>
                  </button>
                </div>

                {/* Error Banner */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-rose-50 border border-rose-200 rounded-md flex items-start space-x-3 text-xs text-rose-800"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold">Transformation Error</p>
                      <p className="opacity-90 mt-1">{error}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setOptions({ ...options, engine: "free" });
                          setError(null);
                        }}
                        className="mt-2 text-[10px] font-bold uppercase tracking-wider underline cursor-pointer text-rose-900"
                      >
                        Switch to Free Native Engine & Try Again
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            /* Conversion Output Workspace Screen */
            <motion.div
              key="output-workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-[calc(100vh-180px)] min-h-[520px] w-full"
            >
              {/* Fallback Notice if triggered */}
              {fallbackNotice && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-center justify-between text-xs text-amber-800">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{fallbackNotice}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100 px-2 py-0.5 rounded">
                    Auto-Recovered
                  </span>
                </div>
              )}

              {/* Workspace Navigation Bar */}
              <div className="bg-white border border-[#E2E4E7] rounded-md p-4 mb-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm shrink-0">
                <div className="flex items-center space-x-3 w-full md:w-auto">
                  <div className="w-8 h-8 rounded bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-200">
                    <Check className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[220px] sm:max-w-md">
                      {file?.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">
                        {engineUsed}
                      </span>
                      {stats && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          • {stats.wordCount} words • {stats.tables || 0} tables
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-[#F8F9FA] p-1 border border-[#E2E4E7] rounded-md w-full md:w-auto justify-center">
                  <button
                    id="view-split"
                    onClick={() => setWorkspaceMode("split")}
                    className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                      workspaceMode === "split"
                        ? "bg-black text-white"
                        : "text-[#6B7280] hover:text-black"
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5 rotate-90" />
                    <span className="hidden sm:inline">Split View</span>
                  </button>
                  <button
                    id="view-edit"
                    onClick={() => setWorkspaceMode("edit")}
                    className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                      workspaceMode === "edit"
                        ? "bg-black text-white"
                        : "text-[#6B7280] hover:text-black"
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Raw MD</span>
                  </button>
                  <button
                    id="view-preview"
                    onClick={() => setWorkspaceMode("preview")}
                    className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                      workspaceMode === "preview"
                        ? "bg-black text-white"
                        : "text-[#6B7280] hover:text-black"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Rendered</span>
                  </button>
                </div>

                {/* Actions Block */}
                <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                  <button
                    id="copy-markdown-btn"
                    onClick={handleCopy}
                    className="p-2 px-3 border border-[#E2E4E7] text-[10px] font-bold uppercase tracking-widest rounded-sm text-neutral-800 hover:bg-[#F8F9FA] flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Copied" : "Copy"}</span>
                  </button>

                  <button
                    id="download-markdown-btn"
                    onClick={handleDownload}
                    className="p-2 px-3 bg-black hover:bg-neutral-900 text-[10px] font-bold uppercase tracking-widest rounded-sm text-white flex items-center space-x-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .md</span>
                  </button>

                  <button
                    id="reset-workspace-btn"
                    onClick={handleReset}
                    className="p-2 border border-[#E2E4E7] text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-sm transition-all cursor-pointer"
                    title="Upload New File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Panels split according to layout settings */}
              <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                {/* Markdown RAW Panel */}
                {(workspaceMode === "split" || workspaceMode === "edit") && (
                  <div className={`flex flex-col bg-white border border-[#E2E4E7] rounded-md overflow-hidden h-full ${workspaceMode === "edit" ? "md:col-span-2" : ""}`}>
                    <div className="bg-[#F8F9FA] border-b border-[#E2E4E7] px-4 py-2.5 flex items-center justify-between text-[10px] font-bold tracking-widest text-[#9CA3AF] font-mono">
                      <span>RAW EDITABLE SOURCE</span>
                      <span>UTF-8 GFM</span>
                    </div>
                    <textarea
                      id="markdown-raw-editor"
                      value={convertedMarkdown}
                      onChange={(e) => setConvertedMarkdown(e.target.value)}
                      className="flex-1 p-5 bg-white text-slate-800 font-mono text-xs leading-relaxed outline-none resize-none overflow-y-auto selection:bg-neutral-200"
                      placeholder="Markdown content is generated..."
                    />
                  </div>
                )}

                {/* Markdown PREVIEW Panel */}
                {(workspaceMode === "split" || workspaceMode === "preview") && (
                  <div className={`flex flex-col bg-white border border-[#E2E4E7] rounded-md overflow-hidden h-full ${workspaceMode === "preview" ? "md:col-span-2" : ""}`}>
                    <div className="bg-[#F8F9FA] border-b border-[#E2E4E7] px-4 py-2.5 flex items-center justify-between text-[10px] font-bold tracking-widest text-[#9CA3AF] font-mono">
                      <span>LIVE RENDERED DOCUMENT</span>
                      <span>PREVIEW</span>
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto max-w-none bg-white">
                      {convertedMarkdown ? (
                        <div className="markdown-body text-slate-800 text-sm leading-relaxed space-y-4">
                          <ReactMarkdown>{convertedMarkdown}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-12">
                          <BookOpen className="w-10 h-10 text-slate-300 mb-3" />
                          <p className="text-slate-400 text-xs uppercase tracking-wider font-mono">No document loaded.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Conversion Overlay */}
        <AnimatePresence>
          {isConverting && (
            <motion.div
              key="loading-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.98 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.98 }}
                className="bg-white rounded-lg p-8 max-w-md w-full shadow-2xl border border-[#E2E4E7] text-center space-y-6"
              >
                <div className="relative mx-auto w-12 h-12 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-2 border-neutral-100 border-t-black animate-spin" />
                  <Zap className="w-5 h-5 text-emerald-500" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-sm uppercase tracking-widest text-slate-900 font-display">
                    Transforming Content
                  </h3>
                  <p className="text-slate-400 text-[10px] px-4 font-mono">
                    {options.engine === "free" ? "FREE NATIVE ENGINE ACTIVE" : "AI ENGINE ACTIVE"}
                  </p>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-2 text-left bg-[#F8F9FA] p-4 border border-[#E2E4E7] rounded-md font-mono">
                  {steps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center space-x-2 text-[10px] transition-opacity duration-300 ${
                        currentStep === idx
                          ? "text-black font-bold opacity-100"
                          : currentStep > idx
                          ? "text-emerald-600 opacity-60"
                          : "text-slate-400 opacity-30"
                      }`}
                    >
                      <div className="shrink-0 font-bold">
                        {currentStep > idx ? "✓" : currentStep === idx ? "●" : " "}
                      </div>
                      <span className="truncate uppercase tracking-wider">{step}</span>
                    </div>
                  ))}
                </div>

                <div className="w-full bg-[#F1F5F9] h-1 rounded-full overflow-hidden">
                  <motion.div
                    className="bg-black h-1 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Free API Documentation Modal */}
      <AnimatePresence>
        {showApiDocs && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-2xl w-full border border-[#E2E4E7] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-4 px-6 border-b border-[#E2E4E7] flex items-center justify-between bg-[#F8F9FA]">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-black" />
                  <h3 className="font-bold text-sm text-[#1A1A1B] uppercase tracking-wider font-mono">
                    Free Markdown API Documentation
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowApiDocs(false)}
                  className="text-neutral-400 hover:text-black cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#1A1A1B]">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800">
                  <p className="font-bold text-[11px] uppercase tracking-wider">100% Free & Always Available</p>
                  <p className="text-[11px] mt-0.5">
                    This app includes a self-contained, high-performance Markdown conversion API. You can call it from curl, Python, Node.js, or any frontend with zero API key configuration.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold uppercase tracking-wider text-[11px] text-[#9CA3AF] mb-1 font-mono">
                    Endpoint
                  </h4>
                  <div className="p-3 bg-[#F8F9FA] border border-[#E2E4E7] rounded font-mono text-xs flex items-center justify-between">
                    <span><strong className="text-emerald-700">POST</strong> /api/convert-free</span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-neutral-200 text-neutral-700 rounded">Public & Free</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-bold uppercase tracking-wider text-[11px] text-[#9CA3AF] font-mono">
                      Example cURL Request
                    </h4>
                    <button
                      type="button"
                      onClick={copyCurlCode}
                      className="text-[10px] font-bold uppercase tracking-wider text-black flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      {copiedCurl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCurl ? "Copied" : "Copy cURL"}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-neutral-900 text-neutral-100 rounded text-[11px] font-mono overflow-x-auto leading-relaxed">
{`curl -X POST "${window.location.origin}/api/convert-free" \\
  -H "Content-Type: application/json" \\
  -d '{
    "fileName": "invoice.pdf",
    "fileData": "<BASE64_STRING>",
    "options": {
      "style": "Standard Markdown",
      "extractTables": true,
      "codeBlocks": true
    }
  }'`}
                  </pre>
                </div>

                <div>
                  <h4 className="font-bold uppercase tracking-wider text-[11px] text-[#9CA3AF] mb-1 font-mono">
                    JSON Response Schema
                  </h4>
                  <pre className="p-4 bg-neutral-900 text-neutral-100 rounded text-[11px] font-mono overflow-x-auto leading-relaxed">
{`{
  "success": true,
  "markdown": "# INVOICE # INV-8902\\n\\n| Item | Amount |...",
  "engine": "free",
  "engineLabel": "Free Native API",
  "stats": {
    "wordCount": 182,
    "charCount": 1420,
    "headings": 4,
    "tables": 2
  }
}`}
                  </pre>
                </div>
              </div>

              <div className="p-4 border-t border-[#E2E4E7] bg-[#F8F9FA] flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowApiDocs(false)}
                  className="px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-sm hover:bg-neutral-800 cursor-pointer"
                >
                  Close Documentation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Geometric Balance Status Footer */}
      <footer className="h-12 border-t border-[#E2E4E7] bg-white px-6 sm:px-8 flex items-center justify-between text-[10px] text-[#94A3B8] font-mono shrink-0">
        <div className="flex gap-6 uppercase">
          <span>Engine: <span className="text-black font-bold">{options.engine === "free" ? "Free Native Engine (Active)" : "Gemini Cloud AI"}</span></span>
          <span className="hidden sm:inline">Status: <span className="text-emerald-500 font-bold">● Operational</span></span>
        </div>
        <div className="flex gap-6 uppercase">
          <button 
            type="button"
            onClick={() => setShowApiDocs(true)} 
            className="hover:text-black underline cursor-pointer"
          >
            Free API Docs
          </button>
          <span className="hidden sm:inline">v1.2.0-free-native</span>
        </div>
      </footer>
    </div>
  );
}
