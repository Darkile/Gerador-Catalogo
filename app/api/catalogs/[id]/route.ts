import { NextResponse } from "next/server";
import { z } from "zod";
import { UnauthorizedApiError, requireApiUser } from "@/lib/api-auth";
import { getCatalogById } from "@/lib/catalog-service";
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
