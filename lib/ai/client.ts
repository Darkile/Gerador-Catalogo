import OpenAI from "openai";
import { env } from "@/lib/env";

let openaiClient: OpenAI | null = null;

export function getOpenAiClient() {
  if (!openaiClient) {
    if (!env.openaiApiKey) {
      throw new Error("OPENAI_API_KEY não configurada.");
    }

    openaiClient = new OpenAI({
      apiKey: env.openaiApiKey,
      timeout: 30_000,
    });
  }

  return openaiClient;
}
