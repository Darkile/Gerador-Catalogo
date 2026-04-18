import { NextResponse } from "next/server";
import { z } from "zod";
import { UnauthorizedApiError, requireApiUser } from "@/lib/api-auth";
import { createCatalog } from "@/lib/catalog-service";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const createCatalogSchema = z.object({
  title: z.string().min(2).max(120),
  coverEnabled: z.boolean().default(true),
});

const listCatalogsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: Request) {
  try {
    const user = await requireApiUser();
    const { searchParams } = new URL(request.url);
    const { limit } = listCatalogsSchema.parse({
      limit: searchParams.get("limit") ?? 20,
    });
    const supabase = getSupabaseAdminClient();

    const { data: catalogs, error: catalogsError } = await supabase
      .from("catalogs")
      .select("id, title, status, cover_enabled, pdf_path, updated_at, created_at")
      .eq("created_by", user.id)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (catalogsError) {
      throw catalogsError;
    }

    const catalogIds = (catalogs ?? []).map((catalog) => catalog.id);
    const productCountByCatalog = new Map<string, number>();

    if (catalogIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("catalog_id")
        .in("catalog_id", catalogIds);

      if (productsError) {
        throw productsError;
      }

      for (const product of products ?? []) {
        const current = productCountByCatalog.get(product.catalog_id) ?? 0;
        productCountByCatalog.set(product.catalog_id, current + 1);
      }
    }

    return NextResponse.json({
      catalogs: (catalogs ?? []).map((catalog) => ({
        ...catalog,
        product_count: productCountByCatalog.get(catalog.id) ?? 0,
      })),
    });
  } catch (error) {
    console.error("GET /api/catalogs failed", error);
    if (error instanceof UnauthorizedApiError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Não foi possível listar catálogos.",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = createCatalogSchema.parse(await request.json());
    const user = await requireApiUser();

    const catalog = await createCatalog({
      title: payload.title,
      coverEnabled: payload.coverEnabled,
      userId: user.id,
    });

    return NextResponse.json({ catalog }, { status: 201 });
  } catch (error) {
    console.error("POST /api/catalogs failed", error);
    if (error instanceof UnauthorizedApiError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Não foi possível criar catálogo.",
      },
      { status: 400 },
    );
  }
}
