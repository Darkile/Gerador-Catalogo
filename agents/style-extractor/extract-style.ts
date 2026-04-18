import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import type { DesignTokens } from "@/lib/types";
import baseTokens from "@/design/gregory-design-tokens.json";
import { designTokensToCssVariables } from "@/lib/design-tokens";

interface PdfTextItem {
  str: string;
  fontName: string;
  transform: number[];
}

function roundToHalf(value: number) {
  return Math.round(value * 2) / 2;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPdfInputFromArgs() {
  const inputArg = process.argv.find((arg) => arg.startsWith("--input="));
  return inputArg?.split("=")[1];
}

async function loadTextItems(pdfFilePath: string) {
  const data = new Uint8Array(await fs.readFile(pdfFilePath));
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;

  const pagesToScan = Math.min(pdf.numPages, 20);
  const items: PdfTextItem[] = [];
  let pageWidthPt = 595;
  let pageHeightPt = 842;

  for (let pageNumber = 1; pageNumber <= pagesToScan; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    pageWidthPt = viewport.width;
    pageHeightPt = viewport.height;

    const textContent = await page.getTextContent();
    for (const item of textContent.items as PdfTextItem[]) {
      if (typeof item.str === "string" && item.str.trim()) {
        items.push(item);
      }
    }
  }

  return { items, pagesToScan, pageWidthPt, pageHeightPt };
}

function inferTokens(items: PdfTextItem[]): DesignTokens {
  const base = structuredClone(baseTokens) as DesignTokens;

  const sizeCount = new Map<number, number>();
  const fontCount = new Map<string, number>();

  for (const item of items) {
    const rawSize = Math.abs(item.transform[0]) || Math.abs(item.transform[3]) || 12;
    const size = roundToHalf(clamp(rawSize, 8, 48));
    sizeCount.set(size, (sizeCount.get(size) ?? 0) + 1);
    fontCount.set(item.fontName, (fontCount.get(item.fontName) ?? 0) + 1);
  }

  const sortedSizes = [...sizeCount.entries()].sort((a, b) => b[1] - a[1]);
  const bodySizeCandidate = sortedSizes.find(([size]) => size >= 10 && size <= 18)?.[0] ?? 14;
  const titleSizeCandidate = sortedSizes.find(([size]) => size >= bodySizeCandidate + 6)?.[0] ?? 30;
  const priceSizeCandidate = clamp(titleSizeCandidate - 8, 20, 24);

  base.typography.body_font_size_px = clamp(bodySizeCandidate, 13, 15);
  base.typography.title_font_size_px = clamp(titleSizeCandidate, 24, 32);
  base.typography.price_font_size_px = priceSizeCandidate;

  const primaryFont = [...fontCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Inter";
  if (/playfair|times|serif/i.test(primaryFont)) {
    base.typography.title_font_family = "Playfair Display";
    base.typography.body_font_family = "Inter";
  }

  return base;
}

async function main() {
  const defaultInput = path.resolve("Exemplos", "Revista Inverno 2026_1776266245778 (1).pdf");
  const inputPath = path.resolve(getPdfInputFromArgs() ?? defaultInput);
  const outputJsonPath = path.resolve("design", "gregory-design-tokens.json");
  const outputCssPath = path.resolve("design", "gregory-design-tokens.css");

  const { items, pagesToScan, pageWidthPt, pageHeightPt } = await loadTextItems(inputPath);
  const tokens = inferTokens(items);
  const cssVariables = designTokensToCssVariables(tokens);

  await fs.writeFile(outputJsonPath, `${JSON.stringify(tokens, null, 2)}\n`, "utf8");
  await fs.writeFile(outputCssPath, `${cssVariables.trim()}\n`, "utf8");

  console.log("Style extractor concluído.");
  console.log(`Arquivo PDF: ${inputPath}`);
  console.log(`Páginas analisadas: ${pagesToScan}`);
  console.log(`Página base (pt): ${pageWidthPt.toFixed(2)} x ${pageHeightPt.toFixed(2)}`);
  console.log(`Saída JSON: ${outputJsonPath}`);
  console.log(`Saída CSS: ${outputCssPath}`);
}

main().catch((error) => {
  console.error("Falha no style extractor:", error);
  process.exit(1);
});
