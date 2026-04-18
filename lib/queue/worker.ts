import { Worker } from "bullmq";
import { getRedisConnection } from "@/lib/queue/redis";
import { AI_IMAGE_QUEUE_NAME, type AiImageJobData } from "@/lib/queue/queues";
import { processImageWithRetry } from "@/lib/ai/process-product";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { normalizePricing } from "@/lib/price";
import { recomputeAiJobProgress } from "@/lib/queue/job-status";

let worker: Worker<AiImageJobData> | null = null;

export function ensureAiWorker() {
  if (worker) {
    return worker;
  }

  worker = new Worker<AiImageJobData>(
    AI_IMAGE_QUEUE_NAME,
    async (job) => {
      const supabase = getSupabaseAdminClient();
      const { aiJobId, productId, imageUrl } = job.data;

      await supabase
        .from("products")
        .update({ ai_status: "processing", ai_error: null, updated_at: new Date().toISOString() })
        .eq("id", productId);

      try {
        const vision = await processImageWithRetry(imageUrl, 2);

        const { data: existingProduct } = await supabase
          .from("products")
          .select("original_price, final_price")
          .eq("id", productId)
          .single();

        const pricing = normalizePricing(
          Number(existingProduct?.original_price ?? 0),
          Number(existingProduct?.final_price ?? 0),
        );

        await supabase
          .from("products")
          .update({
            product_type: vision.product_type,
            description: vision.description,
            discount_percent: pricing.discount_percent,
            final_price: pricing.final_price,
            ai_status: "done",
            ai_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", productId);
      } catch (error) {
        await supabase
          .from("products")
          .update({
            ai_status: "failed",
            ai_error: error instanceof Error ? error.message : "Erro inesperado no worker IA",
            updated_at: new Date().toISOString(),
          })
          .eq("id", productId);
      }

      await recomputeAiJobProgress(aiJobId);
    },
    {
      connection: getRedisConnection(),
      concurrency: Number(process.env.AI_WORKER_CONCURRENCY ?? "2"),
    },
  );

  worker.on("failed", (job, error) => {
    console.error("Falha de job na fila IA", {
      jobId: job?.id,
      error,
    });
  });

  return worker;
}
