import { chromium } from "playwright-core";
import fs from "node:fs";

const CANDIDATES = [
  process.env.BROWSER_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
].filter(Boolean) as string[];

export async function htmlToPdf(html: string): Promise<Buffer> {
  const exe = CANDIDATES.find((p) => fs.existsSync(p));
  if (!exe) throw new Error("PDF 렌더용 브라우저를 찾지 못했습니다. BROWSER_PATH 를 설정하세요.");
  const browser = await chromium.launch({ executablePath: exe, headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(() => (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready);
    const pdf = await page.pdf({ format: "A4", printBackground: false, preferCSSPageSize: true });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
