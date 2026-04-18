import { NextResponse } from "next/server";
import { z } from "zod";
import { UnauthorizedApiError, requireApiUser } from "@/lib/api-auth";
import { getCatalogById } from "@/lib/catalog-service";
import { env } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const patchCatalogSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  cover_enabled: z.boolean().optional(),
  token_overrides: z.record(z.string(), z.any()).optional(),
});

export async function GET(
  _request: Request,
  context: { params: { id: string } },
) {
  try {
    await requireApiUser();
    const catalog = await getCatalogById(context.params.id);
    return NextResponse.json({ catalog });
  } catch (error) {
    console.error("GET /api/catalogs/[id] failed", error);
    if (error instanceof UnauthorizedApiError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json({ error: "Catálogo não encontrado." }, { status: 404 });
  }
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } },
) {
  try {
    await requireApiUser();
    const payload = patchCatalogSchema.parse(await request.json());
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase
      .from("catalogs")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", context.params.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/catalogs/[id] failed", error);
    if (error instanceof UnauthorizedApiError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha ao atualizar catálogo.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: { id: string } },
) {
  try {
    const user = await requireApiUser();
    const supabase = getSupabaseAdminClient();

    const { data: catalog, error: catalogError } = await supabase
      .from("catalogs")
      .select("id, created_by, pdf_path")
      .eq("id", context.params.id)
      .eq("created_by", user.id)
      .single();

    if (catalogError || !catalog) {
      return NextResponse.json({ error: "Catálogo não encontrado." }, { status: 404 });
    }

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("image_path")
      .eq("catalog_id", context.params.id);

    if (productsError) {
      throw productsError;
    }

    const imagePaths = (products ?? [])
      .map((product) => product.image_path)
      .filter((path): path is string => Boolean(path));

    if (imagePaths.length > 0) {
      const { error: imageDeleteError } = await supabase.storage
        .from(env.imageBucketName)
        .remove(imagePaths);

      if (imageDeleteError) {
        throw imageDeleteError;
      }
    }

    if (catalog.pdf_path) {
      const { error: pdfDeleteError } = await supabase.storage
        .from(env.pdfBucketName)
        .remove([catalog.pdf_path]);

      if (pdfDeleteError) {
        throw pdfDeleteError;
      }
    }

    const { error: deleteError } = await supabase
      .from("catalogs")
      .delete()
      .eq("id", context.params.id)
      .eq("created_by", user.id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/catalogs/[id] failed", error);
    if (error instanceof UnauthorizedApiError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha ao excluir catálogo.",
      },
      { status: 400 },
    );
  }
}
