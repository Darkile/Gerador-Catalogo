import { NextResponse } from "next/server";
import { z } from "zod";
import { UnauthorizedApiError, requireApiUser } from "@/lib/api-auth";
import { getCatalogById } from "@/lib/catalog-service";
import { mergeDesignTokens } from "@/lib/design-tokens";
import { renderCatalogHtml } from "@/lib/pdf/catalog-template";
import { launchPdfBrowser } from "@/lib/pdf/browser";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildCatalogPdfFilename } from "@/lib/pdf/file-name";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const generateSchema = z.object({
  catalogId: z.string().uuid(),
});

export async function POST(request: Request) {
  let browser: Awaited<ReturnType<typeof launchPdfBrowser>> | null = null;

  try {
    await requireApiUser();
    const payload = generateSchema.parse(await request.json());
    const supabase = getSupabaseAdminClient();

    await supabase
      .from("catalogs")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", payload.catalogId);

    const catalog = await getCatalogById(payload.catalogId);
    const tokens = mergeDesignTokens(catalog.token_overrides ?? {});

    const html = renderCatalogHtml({
      catalog,
      products: catalog.products,
      tokens,
    });

    browser = await launchPdfBrowser();
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      printBackground: true,
      format: "A4",
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
      preferCSSPageSize: true,
    });

    const filename = buildCatalogPdfFilename();
    const path = `${payload.catalogId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from(env.pdfBucketName)
      .upload(path, pdfBuffer, {
        upsert: true,
        contentType: "application/pdf",
      });

    if (uploadError) {
      throw uploadError;
    }

    await supabase
      .from("catalogs")
      .update({
        status: "ready",
        pdf_path: path,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.catalogId);

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
      },
    });
  } catch (error) {
    console.error("POST /api/generate-pdf failed", error);
    if (error instanceof UnauthorizedApiError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha ao gerar PDF.",
      },
      { status: 400 },
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
