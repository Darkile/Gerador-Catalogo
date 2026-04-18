import { getOpenAiClient } from "@/lib/ai/client";
import { buildVisionPrompt } from "@/lib/ai/prompt";
import { visionSchema } from "@/lib/ai/schema";
import { sanitizeAiText } from "@/lib/sanitize";
import { sleep } from "@/lib/utils";
import type { VisionResult } from "@/lib/types";

const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS ?? "30000");

function fallbackVisionResult(): VisionResult {
  return {
    product_type: "Peça de moda feminina",
    description:
      "Peça com proposta elegante e versátil, ideal para composições de inverno. Modelagem pensada para valorizar a silhueta com acabamento sofisticado.",
  };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Timeout de ${timeoutMs}ms no processamento IA (${label}).`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function stripCodeFence(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```") && trimmed.endsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return trimmed;
}

function parseVisionResult(raw: string): VisionResult {
  const cleaned = stripCodeFence(raw);
  const parsed = JSON.parse(cleaned) as {
    product_type?: unknown;
    description?: unknown;
  };

  if (typeof parsed.product_type !== "string" || typeof parsed.description !== "string") {
    throw new Error("Resposta da IA fora do schema esperado.");
  }

  return {
    product_type: sanitizeAiText(parsed.product_type),
    description: sanitizeAiText(parsed.description),
  };
}

async function processImageWithOpenAi(imageUrl: string): Promise<VisionResult> {
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
  }, {
    timeout: AI_TIMEOUT_MS,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta vazia da IA de visão (OpenAI).");
  }

  return parseVisionResult(content);
}

async function fetchImageAsBase64(imageUrl: string) {
  const response = await fetch(imageUrl, {
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem para Gemini: HTTP ${response.status}`);
  }

  const contentTypeHeader = response.headers.get("content-type") ?? "image/jpeg";
  const mimeType = contentTypeHeader.split(";")[0]?.trim() || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());

  return {
    mimeType,
    dataBase64: buffer.toString("base64"),
  };
}

async function processImageWithGemini(imageUrl: string): Promise<VisionResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada.");
  }

  const model = process.env.GEMINI_VISION_MODEL ?? "gemini-2.5-flash";
  const { mimeType, dataBase64 } = await fetchImageAsBase64(imageUrl);

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${buildVisionPrompt()}\nRetorne apenas JSON válido com as chaves product_type e description.`,
          },
          {
            inline_data: {
              mime_type: mimeType,
              data: dataBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 280,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          product_type: {
            type: "string",
          },
          description: {
            type: "string",
          },
        },
        required: ["product_type", "description"],
      },
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini retornou erro ${response.status}: ${errorText.slice(0, 400)}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  const text = payload.candidates?.[0]?.content?.parts?.find((part) => typeof part.text === "string")?.text;

  if (!text) {
    throw new Error("Resposta vazia da IA de visão (Gemini).");
  }

  return parseVisionResult(text);
}

function resolveProvider() {
  const explicit = (process.env.AI_PROVIDER ?? "gemini").trim().toLowerCase();

  if (explicit === "gemini" || explicit === "openai") {
    return explicit;
  }

  if (explicit === "auto") {
    if (process.env.GEMINI_API_KEY?.trim()) {
      return "gemini";
    }
    if (process.env.OPENAI_API_KEY?.trim()) {
      return "openai";
    }
  }

  return "gemini";
}

export async function processImageWithVision(imageUrl: string): Promise<VisionResult> {
  const provider = resolveProvider();

  if (provider === "openai") {
    return withTimeout(processImageWithOpenAi(imageUrl), AI_TIMEOUT_MS + 1000, "OpenAI");
  }

  return withTimeout(processImageWithGemini(imageUrl), AI_TIMEOUT_MS + 1000, "Gemini");
}

export async function processImageWithRetry(imageUrl: string, retries = 2): Promise<VisionResult> {
  const provider = resolveProvider();

  if (provider === "openai") {
    const openAiKey = process.env.OPENAI_API_KEY?.trim();
    if (!openAiKey || !openAiKey.startsWith("sk-")) {
      return fallbackVisionResult();
    }
  }

  if (provider === "gemini") {
    const geminiKey = process.env.GEMINI_API_KEY?.trim();
    if (!geminiKey || !geminiKey.startsWith("AIza")) {
      return fallbackVisionResult();
    }
  }

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

  console.error("Falha no processamento IA, aplicando fallback.", {
    provider,
    error: lastError,
  });
  return fallbackVisionResult();
}
