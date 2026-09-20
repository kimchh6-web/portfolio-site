import fs from "node:fs";
import puppeteer, { type Browser } from "puppeteer-core";

const LOCAL_CANDIDATES = [
  process.env.BROWSER_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
].filter(Boolean) as string[];

async function launch(): Promise<Browser> {
  // Vercel/AWS Lambda 같은 서버리스 환경: 번들된 Chromium 사용
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import("@sparticuz/chromium")).default;
    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
  // 로컬: 설치된 Edge/Chrome 사용
  const exe = LOCAL_CANDIDATES.find((p) => fs.existsSync(p));
  if (!exe) throw new Error("PDF 렌더용 브라우저를 찾지 못했습니다. BROWSER_PATH 를 설정하세요.");
  return puppeteer.launch({ executablePath: exe, headless: true });
}

export async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 45000 });
    await page.waitForNetworkIdle({ idleTime: 500, timeout: 20000 }).catch(() => {});
    await page.evaluate(() => (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready);
    const pdf = await page.pdf({ format: "A4", printBackground: false, preferCSSPageSize: true });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
