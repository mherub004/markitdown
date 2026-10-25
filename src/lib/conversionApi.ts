export async function readConversionResponse(response: Response) {
  const text = await response.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(response.status === 413
      ? "This file is too large. Please try a smaller file."
      : "The conversion service returned an invalid response. Please try again; if this continues, the site's API deployment needs attention.");
  }
  if (!response.ok || data?.success !== true) {
    throw new Error(typeof data?.error === "string" ? data.error : "Conversion failed. Please try again.");
  }
  if (typeof data.markdown !== "string") {
    throw new Error("The conversion service did not return Markdown. Please try again.");
  }
  return data;
}
