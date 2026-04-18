import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser } from "puppeteer-core";

export async function launchPdfBrowser(): Promise<Browser> {
  const isVercel = !!process.env.VERCEL;

  if (isVercel) {
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

  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}
