import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";
import TurndownService from "turndown";
// @ts-ignore
import { gfm } from "turndown-plugin-gfm";
import { GoogleGenAI } from "@google/genai";
import { convertWithFreeEngine } from "./src/services/freeConverter";

const app = express();
const PORT = 3000;

// Generous limit for document uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini API client if key is present
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Turndown service
function createTurndownService() {
  const td = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    bulletListMarker: "-",
    hr: "---",
  });
  td.use(gfm);
  return td;
}

// Scrape Web URL helper
async function scrapeUrlContent(targetUrl: string) {
  let normalizedUrl = targetUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = "https://" + normalizedUrl;
  }

  const response = await fetch(normalizedUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    "Web Document";
  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    "";

  $("script, style, noscript, iframe, svg, nav, footer, header, form, button, .ads, .ad, #cookie-banner, .cookie-banner, .popup").remove();

  let $main = $("article, main, #content, .content, .post, .markdown-body").first();
  if (!$main.length || $main.text().trim().length < 100) {
    $main = $("body");
  }

  const td = createTurndownService();
  const markdown = td.turndown($main.html() || "");

  let domain = "";
  try {
    domain = new URL(normalizedUrl).hostname.replace(/^www\./, "");
  } catch {
    domain = normalizedUrl;
  }

  return {
    url: normalizedUrl,
    domain,
    title,
    description,
    markdown,
  };
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    geminiConfigured: !!ai,
    engine: ai ? "gemini-3.8-flash" : "native-free",
  });
});

// Primary Document Conversion Endpoint
// Handles any dropped file: PDF, DOCX, DOC, CSV, JSON, TXT, HTML, images, code
// Supports generating LaTeX equations and full LaTeX formatting
app.post("/api/convert", async (req, res) => {
  try {
    const { fileName = "document", fileType = "", fileData, options = {} } = req.body;

    if (!fileData) {
      return res.status(400).json({ success: false, error: "No document data received." });
    }

    const { useAi = true, style = "standard", includeToc = false } = options;

    // If Gemini is available and requested, try Gemini 3.8 Flash
    if (useAi && ai) {
      try {
        let mimeType = fileType || "application/pdf";
        const ext = fileName.split(".").pop()?.toLowerCase() || "";

        if (ext === "pdf") mimeType = "application/pdf";
        else if (["png", "jpg", "jpeg", "webp"].includes(ext)) mimeType = `image/${ext === "jpg" ? "jpeg" : ext}`;
        else if (["txt", "md", "csv", "tsv", "json", "html"].includes(ext)) mimeType = "text/plain";

        let systemInstruction =
          "You are an expert document parser, technical editor, and LaTeX/Markdown specialist. " +
          "Your mission is to ingest the provided document (PDF, Word DOC, spreadsheet, image, code, or text) " +
          "and generate clean, comprehensive, beautifully structured content.\n" +
          "- Recreate the hierarchy accurately using proper headings.\n" +
          "- Convert any tables or grids into clean, aligned Markdown tables with header rows.\n" +
          "- Isolate code into fenced code blocks with language identifiers.\n" +
          "- Maintain all core content, data values, key metrics, and references without omissions.\n";

        if (style === "latex" || style === "academic") {
          systemInstruction +=
            "\nCRITICAL REQUIREMENT - LATEX FORMATTING:\n" +
            "- You must convert all mathematical formulas, equations, scientific variables, relationships, and derivations into rigorous, publication-grade LaTeX math notation.\n" +
            "- Use $$ ... $$ for display/block equations and $ ... $ for inline variables and equations.\n" +
            "- Use proper LaTeX macros: \\frac{a}{b}, \\sum_{i=1}^{n}, \\int_{a}^{b}, \\partial, \\alpha, \\beta, \\theta, \\mathbf{X}, \\sqrt{...}, \\approx, \\begin{matrix}...\\end{matrix}, \\begin{align}...\\end{align}.\n" +
            "- Format as a formal academic/technical manuscript with Abstract, Formulation, Methodology, Quantitative Results (tables), and Conclusion.";
        } else if (style === "summary") {
          systemInstruction += "\n- Format as an Executive Summary with core findings, key takeaways, and structured details.";
        } else {
          systemInstruction += "\n- Return clean GitHub-Flavored Markdown (.md) with standard headers, lists, and tables.";
        }

        if (includeToc) {
          systemInstruction += "\n- Include an organized Table of Contents at the top with anchor links.";
        }

        let contents: any;
        const promptText = `Convert this file "${fileName}" into structured ${style === "latex" ? "LaTeX-enhanced" : "Markdown"} document.`;

        // If binary supported format (PDF or images)
        if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
          contents = {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: fileData,
                },
              },
              { text: promptText },
            ],
          };
        } else {
          // Decode text/code and pass directly
          const textDecoded = Buffer.from(fileData, "base64").toString("utf-8");
          contents = `${promptText}\n\nDocument Content:\n\n${textDecoded.slice(0, 40000)}`;
        }

        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents,
          config: {
            systemInstruction,
            temperature: 0.1,
          },
        });

        const markdown = aiResponse.text?.trim() || "";
        if (markdown) {
          const wordCount = markdown.split(/\s+/).filter(Boolean).length;
          const headings = (markdown.match(/^#{1,6}\s/gm) || []).length;
          const tables = (markdown.match(/\|[\s-]+\|/g) || []).length;

          return res.json({
            success: true,
            markdown,
            engine: "Gemini 3.8 Flash AI",
            stats: {
              wordCount,
              charCount: markdown.length,
              headings,
              tables,
            },
          });
        }
      } catch (aiErr: any) {
        console.warn("Gemini processing error, seamlessly falling back to Free Native Engine:", aiErr.message);
      }
    }

    // Free Native Engine fallback / default
    const freeResult = await convertWithFreeEngine(fileName, fileType, fileData, {
      style: style === "latex" || style === "academic" ? "Academic/Technical" : style === "summary" ? "Executive Summary" : "Standard Markdown",
      extractTables: true,
      codeBlocks: true,
      cleanSpelling: true,
    });

    return res.json({
      success: true,
      markdown: freeResult.markdown,
      engine: freeResult.engineLabel,
      stats: freeResult.stats,
    });
  } catch (error: any) {
    console.error("Conversion error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to process document.",
    });
  }
});

// Convert Web URL to Markdown
app.post("/api/convert-url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: "URL is required." });
    }

    const scraped = await scrapeUrlContent(url);
    let finalMarkdown = `# ${scraped.title}\n\n> **Source:** [${scraped.url}](${scraped.url})\n\n${scraped.markdown}`;

    if (ai) {
      try {
        const aiResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: `Clean and polish this scraped web content into a pristine, structured Markdown file with clean headers and formatted tables:\n\n${finalMarkdown.slice(0, 30000)}`,
        });
        if (aiResponse.text?.trim()) {
          finalMarkdown = aiResponse.text.trim();
        }
      } catch (err) {
        console.warn("AI URL polish failed, returning base markdown:", err);
      }
    }

    const wordCount = finalMarkdown.split(/\s+/).filter(Boolean).length;
    const headings = (finalMarkdown.match(/^#{1,6}\s/gm) || []).length;
    const tables = (finalMarkdown.match(/\|[\s-]+\|/g) || []).length;

    return res.json({
      success: true,
      markdown: finalMarkdown,
      title: scraped.title,
      domain: scraped.domain,
      stats: {
        wordCount,
        charCount: finalMarkdown.length,
        headings,
        tables,
      },
    });
  } catch (error: any) {
    console.error("URL scrape error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch and convert URL.",
    });
  }
});

// Start Express + Vite Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
