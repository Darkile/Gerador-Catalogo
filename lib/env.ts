export function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  aiProvider: process.env.AI_PROVIDER ?? "gemini",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiVisionModel: process.env.OPENAI_VISION_MODEL ?? "gpt-4o",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiVisionModel: process.env.GEMINI_VISION_MODEL ?? "gemini-3.1-pro-preview",
  aiTimeoutMs: Number(process.env.AI_TIMEOUT_MS ?? "30000"),
  redisUrl: process.env.UPSTASH_REDIS_REST_URL ?? process.env.REDIS_URL ?? "",
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.REDIS_TOKEN ?? "",
  redisHost: process.env.REDIS_HOST ?? "",
  redisPort: Number(process.env.REDIS_PORT ?? "6379"),
  redisPassword: process.env.REDIS_PASSWORD ?? "",
  aiWorkerConcurrency: Number(process.env.AI_WORKER_CONCURRENCY ?? "2"),
  pdfBucketName: process.env.PDF_BUCKET_NAME ?? "catalog-pdfs",
  imageBucketName: process.env.IMAGE_BUCKET_NAME ?? "catalog-images",
};
