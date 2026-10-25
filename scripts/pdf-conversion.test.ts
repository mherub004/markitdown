import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { convertWithFreeEngine } from "../src/services/freeConverter";

test("decodes compressed PDF streams using embedded font Unicode mappings", async () => {
  const pdf = await readFile(new URL("./fixtures/unicode-fonts.pdf", import.meta.url));
  const { markdown } = await convertWithFreeEngine("unicode.pdf", "application/pdf", pdf.toString("base64"));
  assert.ok(markdown.includes("café naïve résumé — Ελληνικά Привет"), markdown);
  assert.ok(markdown.includes("€42.50 and £10.00"), markdown);
  assert.ok(markdown.includes("Second page: Unicode extraction verified"), markdown);
  assert.ok(!markdown.includes("\ufffd"));
});

test("explains when a PDF needs OCR instead of returning fabricated content", async () => {
  const pdf = await readFile(new URL("./fixtures/no-text.pdf", import.meta.url));
  await assert.rejects(convertWithFreeEngine("scan.pdf", "application/pdf", pdf.toString("base64")), /no readable text layer.*OCR/);
});

test("rejects invalid PDF input", async () => {
  await assert.rejects(convertWithFreeEngine("broken.pdf", "application/pdf", Buffer.from("not a PDF").toString("base64")));
});
