import { NextResponse } from "next/server";
import { z } from "zod";
import { UnauthorizedApiError, requireApiUser } from "@/lib/api-auth";
import { replaceCatalogProducts } from "@/lib/catalog-service";

export const runtime = "nodejs";

const productSchema = z.object({
  id: z.string().min(1),
  position: z.number().int().nonnegative(),
  image_path: z.string().min(1),
  image_url: z.string().url(),
  image_ratio: z.number().nullable(),
  sku: z.string().max(60),
  product_type: z.string().max(120),
  description: z.string().max(1000),
  original_price: z.number().nonnegative(),
  discount_percent: z.number().min(0).max(100),
  final_price: z.number().nonnegative(),
  sizes: z.string().max(120),
  ai_status: z.enum(["pending", "queued", "processing", "done", "failed"]),
  ai_error: z.string().nullable(),
});

const replaceProductsSchema = z.object({
  products: z.array(productSchema).max(50),
});

export async function PUT(
  request: Request,
  context: { params: { id: string } },
) {
  try {
    await requireApiUser();
    const payload = replaceProductsSchema.parse(await request.json());
    await replaceCatalogProducts(context.params.id, payload.products);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/catalogs/[id]/products failed", error);
    if (error instanceof UnauthorizedApiError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Não foi possível salvar produtos.",
      },
      { status: 400 },
    );
  }
}
