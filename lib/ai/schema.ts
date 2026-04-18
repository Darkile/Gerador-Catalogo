export const visionSchema = {
  name: "catalog_product_vision",
  strict: true,
  schema: {
    type: "object",
    properties: {
      product_type: {
        type: "string",
        description: "Tipo principal da peça de moda em português (ex.: vestido midi, blazer, calça alfaiataria).",
      },
      description: {
        type: "string",
        description: "Descrição editorial curta em português com 2-3 frases e sem emojis.",
      },
    },
    required: ["product_type", "description"],
    additionalProperties: false,
  },
} as const;
