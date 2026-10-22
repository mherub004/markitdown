import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { convertWithFreeEngine } from "./src/services/freeConverter";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Configure body parser with high limit to handle uploaded document base64 payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize GoogleGenAI client (lazy load/fallback checked on call)
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health & Engine Status API
app.get("/api/status", (req, res) => {
  res.json({
    status: "ok",
    engines: {
      free: {
        available: true,
        name: "Free Native Engine",
        description: "Zero external dependencies, instant document-to-markdown conversion."
      },
      gemini: {
        available: !!process.env.GEMINI_API_KEY,
        name: "Gemini 3.8 Flash Cloud AI",
        description: "Multimodal deep neural document parser via Google GenAI."
      }
    }
  });
});

// Dedicated Free Conversion API endpoint
app.post("/api/convert-free", (req, res) => {
  try {
    const { fileName, fileType, fileData, options } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: "No document data provided." });
    }
    const result = convertWithFreeEngine(fileName, fileType, fileData, options);
    res.json({
      success: true,
      markdown: result.markdown,
      engine: "free",
      engineLabel: "Free Native API",
      stats: result.stats
    });
  } catch (error: any) {
    console.error("Free conversion error:", error);
    res.status(500).json({
      error: error.message || "Failed to convert document with free engine."
    });
  }
});

// Primary Conversion API endpoint with Free Native Engine & Cloud Gemini fallback
app.post("/api/convert", async (req, res) => {
  try {
    const { fileName, fileType, fileData, options, engine } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: "No document data provided." });
    }

    const selectedEngine = engine || options?.engine || "free";

    // 1. If user explicitly chooses Free Engine, run it directly with zero latency
    if (selectedEngine === "free") {
      const freeResult = convertWithFreeEngine(fileName, fileType, fileData, options);
      return res.json({
        success: true,
        markdown: freeResult.markdown,
        engine: "free",
        engineLabel: "Free Native Engine (Zero Cost & Fast)",
        stats: freeResult.stats
      });
    }

    // 2. If Gemini is requested, attempt Gemini with seamless automatic fallback to Free Engine
    const ai = getAiClient();
    if (!ai) {
      console.warn("Gemini API key not configured. Automatically falling back to Free Engine.");
      const freeResult = convertWithFreeEngine(fileName, fileType, fileData, options);
      return res.json({
        success: true,
        markdown: freeResult.markdown,
        engine: "free",
        engineLabel: "Free Native Engine",
        fallbackNotice: "Switched to Free Native Engine (no API key required).",
        stats: freeResult.stats
      });
    }

    try {
      const style = options?.style || "Standard Markdown";
      const extractTables = options?.extractTables !== false;
      const cleanSpelling = !!options?.cleanSpelling;
      const codeBlocks = options?.codeBlocks !== false;
      const language = options?.language || "Original Language";

      let systemInstruction =
        "You are a professional document-to-markdown converter. " +
        "Your sole mission is to ingest the provided document (PDF, image, text, code, CSV, JSON, HTML) " +
        "and generate clean, standard, highly readable, and beautifully structured GitHub-Flavored Markdown (.md). " +
        "Do NOT wrap the outer output in markdown code blocks (e.g., ```markdown ... ```), just return the raw markdown content directly.\n";

      if (style === "Academic/Technical") {
        systemInstruction += "- Format with professional heading hierarchies, clean paragraph spacing, and mathematical formulas in standard LaTeX block/inline formatting if applicable.\n";
      } else if (style === "Executive Summary") {
        systemInstruction += "- Analyze the document and convert it into a well-structured Executive Summary, highlighting key takeaways, action items, and conclusions in Markdown list and section formats.\n";
      } else if (style === "Raw OCR") {
        systemInstruction += "- Extract the literal text exactly as-is from the page layout with minimal restructuring, focusing on word-for-word accuracy.\n";
      } else {
        systemInstruction += "- Use standard headings (# ## ###), lists (* or 1.), bold, and italics to recreate the visual hierarchy of the original document beautifully.\n";
      }

      if (extractTables) {
        systemInstruction += "- Convert any tables, grids, or tabular structures into pristine, well-aligned Markdown tables with proper column headers.\n";
      }

      if (cleanSpelling) {
        systemInstruction += "- Fix obvious typos, spelling mistakes, and grammatical slips from the text without changing the core meaning.\n";
      }

      if (codeBlocks) {
        systemInstruction += "- Detect source code or scripting segments and isolate them in Markdown code blocks with appropriate language tags.\n";
      }

      if (language && language !== "Original Language") {
        systemInstruction += `- TRANSLATE the final output Markdown text entirely into ${language}. Keep the same markdown structure and styling.\n`;
      }

      // Map MIME type
      let mimeType = fileType || "application/pdf";
      if (fileName) {
        const ext = fileName.split(".").pop()?.toLowerCase();
        if (ext === "pdf") mimeType = "application/pdf";
        else if (ext === "png") mimeType = "image/png";
        else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
        else if (ext === "webp") mimeType = "image/webp";
        else if (ext === "txt") mimeType = "text/plain";
        else if (ext === "html" || ext === "htm") mimeType = "text/html";
        else if (ext === "md") mimeType = "text/markdown";
        else if (ext === "json") mimeType = "application/json";
        else if (ext === "csv") mimeType = "text/csv";
      }

      const documentPart = {
        inlineData: {
          mimeType,
          data: fileData,
        },
      };

      const textPart = {
        text: `Please convert this document "${fileName || 'document'}" into beautiful Markdown using the specified settings.`,
      };

      // Use gemini-3.8-flash for document and text processing tasks
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: {
          parts: [documentPart, textPart],
        },
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      const markdownResult = response.text || "";
      if (!markdownResult.trim()) {
        throw new Error("Empty response received from Gemini.");
      }

      return res.json({
        success: true,
        markdown: markdownResult,
        engine: "gemini",
        engineLabel: "Gemini 3.8 Flash Cloud AI",
      });
    } catch (geminiError: any) {
      console.warn("Gemini conversion failed (key invalid, unauthenticated, or rate-limited). Falling back to Free Engine:", geminiError.message);
      
      // Graceful fallback to Free Native Engine
      const fallbackResult = convertWithFreeEngine(fileName, fileType, fileData, options);
      return res.json({
        success: true,
        markdown: fallbackResult.markdown,
        engine: "free",
        engineLabel: "Free Native Engine (Auto-Fallback)",
        fallbackNotice: `Notice: Cloud AI key returned an authentication error (${geminiError.status || "401"}). Converted successfully with Free Native Engine.`,
        stats: fallbackResult.stats
      });
    }
  } catch (error: any) {
    console.error("Conversion error:", error);
    res.status(500).json({
      error: error.message || "An error occurred during document conversion.",
    });
  }
});

// Configure Vite or Static Files depending on environment
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode: Use Vite dev server as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware loaded.");
  } else {
    // Production Mode: Serve built static assets from /dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

setupServer();
