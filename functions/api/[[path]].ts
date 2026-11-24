import * as cheerio from "cheerio";
import TurndownService from "turndown";
import { createDocument } from "@mixmark-io/domino";
// @ts-ignore
import { gfm } from "turndown-plugin-gfm";
import { convertWithFreeEngine } from "../../src/services/freeConverter";

const MAX_HTML_BYTES = 2_000_000;
function publicUrl(input: string): URL {
  const url = new URL(/^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`);
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password ||
      !host || host === "localhost" || /\.(localhost|local|internal|test)$/.test(host) ||
      host.includes(":")) throw new Error("Enter a public HTTP or HTTPS URL.");
  const ip = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ip) {
    const n = ip.slice(1).map(Number);
    if (n.some(x => x > 255) || n[0] === 0 || n[0] === 10 || n[0] === 127 ||
        n[0] >= 224 || (n[0] === 169 && n[1] === 254) ||
        (n[0] === 172 && n[1] >= 16 && n[1] <= 31) ||
        (n[0] === 192 && n[1] === 168) || (n[0] === 100 && n[1] >= 64 && n[1] <= 127))
      throw new Error("Enter a public HTTP or HTTPS URL.");
  }
  return url;
}
async function limitedHtml(response: Response): Promise<string> {
  if (Number(response.headers.get("content-length") || 0) > MAX_HTML_BYTES ||
      !/text\/html|application\/xhtml\+xml/i.test(response.headers.get("content-type") || ""))
    throw new Error("Source must be an HTML page under 2 MB.");
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_HTML_BYTES) { await reader.cancel(); throw new Error("Source exceeds 2 MB."); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

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
      let url: URL;
      try { url = publicUrl(body.url); }
      catch { return Response.json({ success: false, error: "Enter a public HTTP or HTTPS URL." }, { status: 400 }); }
      const upstream = await fetch(url, { signal: AbortSignal.timeout(15000), redirect: "manual", headers: { Accept: "text/html" } });
      if (upstream.status >= 300 && upstream.status < 400) throw new Error("Redirected sources are not supported.");
      if (!upstream.ok) throw new Error(`Source returned HTTP ${upstream.status}.`);
      const $ = cheerio.load(await limitedHtml(upstream));
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
