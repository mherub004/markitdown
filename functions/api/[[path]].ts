import * as cheerio from "cheerio";
import TurndownService from "turndown";
import { createDocument } from "@mixmark-io/domino";
// @ts-ignore
import { gfm } from "turndown-plugin-gfm";
import { convertWithFreeEngine } from "../../src/services/freeConverter";

function htmlToMarkdown(html: string): string {
  const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" });
  td.use(gfm);
  // Workers have no browser DOM. Pass a parsed DOM node to Turndown.
  return td.turndown(createDocument(html).body);
}

// Pages Functions supply the API alongside the static Vite application.
export async function onRequest({ request }: { request: Request }): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/api/health" && request.method === "GET") {
    return Response.json({ status: "ok", geminiConfigured: false, engine: "native-free" });
  }
  if (request.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed." }, { status: 405 });
  }
  try {
    const body = await request.json() as {
      fileName?: string; fileType?: string; fileData?: string;
      options?: { style?: string }; url?: string;
    };
    if (pathname === "/api/convert") {
      if (!body.fileData) {
        return Response.json({ success: false, error: "No document data received." }, { status: 400 });
      }
      const style = body.options?.style;
      const result = await convertWithFreeEngine(
        body.fileName || "document", body.fileType || "", body.fileData,
        {
          style: style === "latex" || style === "academic" ? "Academic/Technical" : style === "summary" ? "Executive Summary" : "Standard Markdown",
          extractTables: true, codeBlocks: true, cleanSpelling: true, htmlToMarkdown,
        },
      );
      return Response.json({ success: true, markdown: result.markdown, engine: result.engineLabel, stats: result.stats });
    }
    if (pathname === "/api/convert-url") {
      if (!body.url?.trim()) {
        return Response.json({ success: false, error: "URL is required." }, { status: 400 });
      }
      const url = new URL(/^https?:\/\//i.test(body.url.trim()) ? body.url.trim() : `https://${body.url.trim()}`);
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
        return Response.json({ success: false, error: "Enter a public HTTP or HTTPS URL." }, { status: 400 });
      }
      const upstream = await fetch(url, { signal: AbortSignal.timeout(15000), headers: { Accept: "text/html" } });
      if (!upstream.ok) throw new Error(`Source returned HTTP ${upstream.status}.`);
      const $ = cheerio.load(await upstream.text());
      const title = $('meta[property="og:title"]').attr("content") || $("title").text().trim() || "Web Document";
      $("script, style, noscript, iframe, svg, nav, footer, header, form, button").remove();
      const main = $("article, main, #content, .content, .post, .markdown-body").first();
      const markdown = `# ${title}\n\n> **Source:** [${url.href}](${url.href})\n\n${htmlToMarkdown((main.length ? main : $("body")).html() || "")}`;
      return Response.json({ success: true, markdown, title, domain: url.hostname, stats: {
        wordCount: markdown.split(/\s+/).filter(Boolean).length, charCount: markdown.length,
        headings: (markdown.match(/^#{1,6}\s/gm) || []).length,
      } });
    }
    return Response.json({ success: false, error: "API endpoint not found." }, { status: 404 });
  } catch (error) {
    return Response.json({ success: false, error: error instanceof Error ? error.message : "Conversion failed." }, { status: 500 });
  }
}
