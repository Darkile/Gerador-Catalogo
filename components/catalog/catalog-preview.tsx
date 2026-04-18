"use client";

import { useMemo } from "react";
import type { DesignTokens } from "@/lib/types";
import { renderCatalogHtml } from "@/lib/pdf/catalog-template";
import type { EditableProduct } from "@/stores/catalog-store";

export function CatalogPreview({
  title,
  products,
  coverEnabled,
  tokens,
}: {
  title: string;
  products: EditableProduct[];
  coverEnabled: boolean;
  tokens: DesignTokens;
}) {
  const html = useMemo(() => renderCatalogHtml({
    catalog: {
      title,
      cover_enabled: coverEnabled,
    },
    products,
    tokens,
  }), [coverEnabled, products, title, tokens]);

  return (
    <iframe
      title="Pré-visualização do catálogo"
      srcDoc={html}
      className="h-[75vh] w-full rounded-md border border-neutral-200 bg-white"
    />
  );
}
