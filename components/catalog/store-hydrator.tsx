"use client";

import { useEffect, useRef } from "react";
import type { CatalogWithProducts } from "@/lib/types";
import { useCatalogStore, type EditableProduct } from "@/stores/catalog-store";

function toEditableProducts(catalog: CatalogWithProducts): EditableProduct[] {
  return catalog.products
    .sort((a, b) => a.position - b.position)
    .map((product, index) => ({
      id: product.id,
      position: index,
      image_path: product.image_path,
      image_url: product.image_url,
      image_ratio: product.image_ratio,
      sku: product.sku ?? "",
      product_type: product.product_type ?? "",
      description: product.description ?? "",
      original_price: Number(product.original_price ?? 0),
      discount_percent: Number(product.discount_percent ?? 0),
      final_price: Number(product.final_price ?? 0),
      sizes: product.sizes ?? "",
      ai_status: product.ai_status,
      ai_error: product.ai_error,
    }));
}

export function CatalogStoreHydrator({
  catalog,
}: {
  catalog: CatalogWithProducts | null;
}) {
  const initializedRef = useRef(false);
  const setCatalogMeta = useCatalogStore((state) => state.setCatalogMeta);
  const setProducts = useCatalogStore((state) => state.setProducts);

  useEffect(() => {
    if (!catalog || initializedRef.current) {
      return;
    }

    setCatalogMeta({
      catalogId: catalog.id,
      catalogTitle: catalog.title,
      coverEnabled: catalog.cover_enabled,
      tokenOverrides: catalog.token_overrides ?? {},
    });
    setProducts(toEditableProducts(catalog));
    initializedRef.current = true;
  }, [catalog, setCatalogMeta, setProducts]);

  return null;
}
