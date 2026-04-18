import { NextResponse } from "next/server";
import { z } from "zod";
import { UnauthorizedApiError, requireApiUser } from "@/lib/api-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAiImageQueue } from "@/lib/queue/queues";
import { ensureAiWorker } from "@/lib/queue/worker";

export const runtime = "nodejs";

const enqueueSchema = z.object({
  catalogId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    await requireApiUser();
    const payload = enqueueSchema.parse(await request.json());
    const supabase = getSupabaseAdminClient();

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, image_url")
      .eq("catalog_id", payload.catalogId)
      .order("position", { ascending: true });

    if (productsError) {
      throw productsError;
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: "Nenhum produto encontrado para este catálogo." },
        { status: 400 },
      );
    }

    if (products.length > 50) {
      return NextResponse.json(
        { error: "Limite excedido: o catálogo suporta no máximo 50 produtos por processamento." },
        { status: 400 },
      );
    }

    const { data: aiJob, error: aiJobError } = await supabase
      .from("ai_jobs")
      .insert({
        catalog_id: payload.catalogId,
        total_items: products.length,
        completed_items: 0,
        failed_items: 0,
        status: "queued",
      })
      .select("id")
      .single();

    if (aiJobError || !aiJob) {
      throw aiJobError ?? new Error("Não foi possível criar registro de job de IA.");
    }

    const jobId = aiJob.id;

    await supabase
      .from("products")
      .update({
        ai_status: "queued",
        ai_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("catalog_id", payload.catalogId);

    const queue = getAiImageQueue();

    for (const product of products) {
      await queue.add(`ai-${jobId}-${product.id}`, {
        aiJobId: jobId,
        catalogId: payload.catalogId,
        productId: product.id,
        imageUrl: product.image_url,
      });
    }

    await supabase
      .from("ai_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    ensureAiWorker();

    return NextResponse.json({
      jobId,
      total: products.length,
      message: "Processamento enfileirado com sucesso.",
    });
  } catch (error) {
    console.error("POST /api/process-image failed", error);
    if (error instanceof UnauthorizedApiError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Não foi possível iniciar o processamento IA.",
      },
      { status: 400 },
    );
  }
}

export async function GET(request: Request) {
  try {
    await requireApiUser();
    ensureAiWorker();
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "Parâmetro jobId é obrigatório." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { data: aiJob, error: aiJobError } = await supabase
      .from("ai_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (aiJobError || !aiJob) {
      return NextResponse.json({ error: "Job não encontrado." }, { status: 404 });
    }

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, sku, product_type, ai_status, ai_error")
      .eq("catalog_id", aiJob.catalog_id)
      .order("position", { ascending: true });

    if (productsError) {
      throw productsError;
    }

    const progress = aiJob.total_items
      ? Math.round((aiJob.completed_items + aiJob.failed_items) / aiJob.total_items * 100)
      : 0;

    return NextResponse.json({
      job: aiJob,
      progress,
      products,
    });
  } catch (error) {
    console.error("GET /api/process-image failed", error);
    if (error instanceof UnauthorizedApiError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Não foi possível consultar status do job.",
      },
      { status: 400 },
    );
  }
}
