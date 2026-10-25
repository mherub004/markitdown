import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = process.argv[2] || "http://127.0.0.1:8788";
const health = await fetch(`${base}/api/health`);
assert.equal(health.status, 200);
assert.equal((await health.json()).status, "ok");

const page = await fetch(base);
assert.equal(page.status, 200);
const html = await page.text();
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(match => match[1]);
assert.ok(assets.some(asset => asset.endsWith(".js")), "Page must load a built application bundle");
for (const asset of assets) {
  const response = await fetch(new URL(asset, base));
  assert.equal(response.status, 200, asset);
  assert.ok(!response.headers.get("content-type")?.includes("text/html"), `${asset} returned fallback HTML`);
  if (asset.endsWith(".css")) {
    const css = await response.text();
    const fonts = [...new Set([...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map(match => match[1].replace(/["']/g, "")))];
    assert.ok(fonts.length > 0, "Math fonts must be bundled with the application");
    await Promise.all(fonts.map(async font => {
      const result = await fetch(new URL(font, new URL(asset, base)));
      assert.equal(result.status, 200, font);
      assert.ok(!result.headers.get("content-type")?.includes("text/html"), `${font} returned fallback HTML`);
    }));
  }
}

for (const [fileName, fileType, text, expected] of [
  ["sample.html", "text/html", "<h1>Cloudflare smoke</h1><p>Hello <strong>world</strong></p>", "# Cloudflare smoke"],
  ["sample.csv", "text/csv", "Name,Value\nReady,42", "Ready"],
]) {
  const response = await fetch(`${base}/api/convert`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, fileType, fileData: Buffer.from(text).toString("base64"), options: { useAi: false } }),
  });
  const data = await response.json();
  assert.equal(response.status, 200, JSON.stringify(data));
  assert.equal(data.success, true);
  assert.ok(data.markdown.includes(expected), data.markdown);
}

const docx = await fetch(`${base}/api/convert`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fileName: "sample.docx", fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileData: (await readFile(new URL("./fixtures/sample.docx", import.meta.url))).toString("base64"),
    options: { useAi: false },
  }),
});
const document = await docx.json();
assert.equal(docx.status, 200, JSON.stringify(document));
assert.ok(document.markdown.includes("DOCX conversion verified"), "DOCX must extract content, not return a placeholder");

const pdf = await fetch(`${base}/api/convert`, {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fileName: "unicode.pdf", fileType: "application/pdf",
    fileData: (await readFile(new URL("./fixtures/unicode-fonts.pdf", import.meta.url))).toString("base64"),
    options: { useAi: false },
  }),
});
const pdfResult = await pdf.json();
assert.equal(pdf.status, 200, JSON.stringify(pdfResult));
assert.ok(pdfResult.markdown.includes("café naïve résumé — Ελληνικά Привет"), pdfResult.markdown);
assert.ok(pdfResult.markdown.includes("Second page: Unicode extraction verified"), pdfResult.markdown);

const missing = await fetch(`${base}/api/convert`, {
  method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
});
assert.equal(missing.status, 400);
console.log("Pages smoke checks passed: health, frontend assets, HTML/CSV/DOCX/PDF conversion, input validation.");
