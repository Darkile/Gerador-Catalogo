import { getOpenAiClient } from "@/lib/ai/client";
import { buildVisionPrompt } from "@/lib/ai/prompt";
import { visionSchema } from "@/lib/ai/schema";
import { sanitizeAiText } from "@/lib/sanitize";
import { sleep } from "@/lib/utils";
import type { VisionResult } from "@/lib/types";

function fallbackVisionResult(): VisionResult {
  return {
    product_type: "Peça de moda feminina",
    description:
      "Peça com proposta elegante e versátil, ideal para composições de inverno. Modelagem pensada para valorizar a silhueta com acabamento sofisticado.",
  };
}

export async function processImageWithVision(imageUrl: string): Promise<VisionResult> {
  const openai = getOpenAiClient();

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_VISION_MODEL ?? "gpt-4o",
    messages: [
      {
        role: "system",
        content: buildVisionPrompt(),
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Retorne apenas JSON válido.",
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl,
              detail: "high",
            },
          },
        ],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: visionSchema,
    },
    temperature: 0.2,
    max_tokens: 280,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta vazia da IA de visão.");
  }

  const parsed = JSON.parse(content) as VisionResult;

  return {
    product_type: sanitizeAiText(parsed.product_type),
    description: sanitizeAiText(parsed.description),
  };
}

export async function processImageWithRetry(imageUrl: string, retries = 2): Promise<VisionResult> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await processImageWithVision(imageUrl);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(600 * (attempt + 1));
      }
    }
  }

  console.error("Falha no processamento IA, aplicando fallback.", lastError);
  return fallbackVisionResult();
}
