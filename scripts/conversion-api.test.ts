import assert from "node:assert/strict";
import test from "node:test";
import { readConversionResponse } from "../src/lib/conversionApi";

test("accepts successful conversions", async () => {
  const data = await readConversionResponse(Response.json({ success: true, markdown: "# Converted" }));
  assert.equal(data.markdown, "# Converted");
});

test("reports empty, HTML, and malformed API responses without JSON parser errors", async () => {
  for (const body of ["", "<!doctype html><title>App</title>", "{"]) {
    await assert.rejects(readConversionResponse(new Response(body)), /API deployment needs attention/);
  }
});

test("preserves server errors and reports oversized files", async () => {
  await assert.rejects(readConversionResponse(Response.json({ success: false, error: "Unsupported file" }, { status: 400 })), /Unsupported file/);
  await assert.rejects(readConversionResponse(new Response("", { status: 413 })), /too large/);
});

test("rejects successful responses missing converted content", async () => {
  await assert.rejects(readConversionResponse(Response.json({ success: true })), /did not return Markdown/);
});
