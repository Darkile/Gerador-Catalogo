import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function recomputeAiJobProgress(aiJobId: string) {
  const supabase = getSupabaseAdminClient();

  const { data: aiJob, error: aiJobError } = await supabase
    .from("ai_jobs")
    .select("id, catalog_id, total_items")
    .eq("id", aiJobId)
    .single();

  if (aiJobError || !aiJob) {
    throw aiJobError ?? new Error("AI job não encontrado.");
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("ai_status")
    .eq("catalog_id", aiJob.catalog_id);

  if (productsError) {
    throw productsError;
  }

  const completed = products.filter((p) => p.ai_status === "done").length;
  const failed = products.filter((p) => p.ai_status === "failed").length;
  const finished = completed + failed >= aiJob.total_items;

  const { error: updateError } = await supabase
    .from("ai_jobs")
    .update({
      completed_items: completed,
      failed_items: failed,
      status: finished ? (failed > 0 ? "failed" : "completed") : "processing",
      finished_at: finished ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", aiJobId);

  if (updateError) {
    throw updateError;
  }
}
