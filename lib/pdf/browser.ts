import type { Browser } from "puppeteer-core";

export async function launchPdfBrowser(): Promise<Browser> {
  const isVercel = !!process.env.VERCEL;

  if (isVercel) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;
    const executablePath = await chromium.executablePath();

    return puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });
  }

  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;

  if (!executablePath) {
    throw new Error(
      "Defina PUPPETEER_EXECUTABLE_PATH no ambiente local para gerar PDF com puppeteer-core.",
    );
  }

  const puppeteer = (await import("puppeteer-core")).default;

  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}
