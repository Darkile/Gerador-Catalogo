export const visionSchema = {
  name: "catalog_product_vision",
  strict: true,
  schema: {
    type: "object",
    properties: {
      product_type: {
        type: "string",
        description: "Tipo principal da peça em português, curto e específico, baseado apenas no que aparece na foto.",
      },
      description: {
        type: "string",
        description: "Descrição editorial curta em português com 2-3 frases, específica para a peça da imagem e sem emojis.",
      },
      visual_attributes: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Categoria principal observada. Use string vazia se não estiver claro.",
          },
          length: {
            type: "string",
            description: "Comprimento observado, como curto, midi ou longo. Use string vazia se não der para identificar.",
          },
          silhouette: {
            type: "string",
            description: "Modelagem ou silhueta visível. Use string vazia se não estiver claro.",
          },
          sleeves: {
            type: "string",
            description: "Tipo ou comprimento da manga visível. Use string vazia se não estiver claro.",
          },
          neckline: {
            type: "string",
            description: "Decote observado. Use string vazia se não estiver claro.",
          },
          pattern: {
            type: "string",
            description: "Estampa ou ausência de estampa percebida. Use string vazia se não estiver claro.",
          },
          texture: {
            type: "string",
            description: "Textura, efeito visual ou superfície percebida. Use string vazia se não estiver claro.",
          },
          details: {
            type: "string",
            description: "Detalhes de acabamento ou construção observáveis, como pregas, recortes, botões ou amarrações.",
          },
          standout: {
            type: "string",
            description: "Elemento visual de maior destaque na peça. Use string vazia se não houver um destaque claro.",
          },
        },
        required: [
          "category",
          "length",
          "silhouette",
          "sleeves",
          "neckline",
          "pattern",
          "texture",
          "details",
          "standout",
        ],
      },
    },
    required: ["product_type", "description", "visual_attributes"],
  },
} as const;
