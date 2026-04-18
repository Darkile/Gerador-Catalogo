"use client";

import type { DesignTokens } from "@/lib/types";
import { formatCurrencyBRL } from "@/lib/price";
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
  return (
    <div className="mx-auto max-h-[75vh] w-full max-w-5xl overflow-y-auto rounded-md border border-neutral-200 bg-neutral-50 p-6">
      <div className="space-y-6">
        {coverEnabled ? (
          <section className="rounded-md border border-neutral-200 bg-white px-8 py-12 text-center">
            <h1
              className="mb-2"
              style={{
                fontFamily: `'${tokens.typography.title_font_family}', serif`,
                fontSize: `${tokens.typography.title_font_size_px}px`,
              }}
            >
              {title}
            </h1>
            <p className="text-sm text-neutral-500">
              Pré-visualização editorial do catálogo antes da geração final em PDF.
            </p>
          </section>
        ) : null}

        {products
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((product) => {
            const hasDiscount = product.discount_percent > 0;
            return (
              <article
                key={product.id}
                className="grid gap-4 rounded-md border border-neutral-200 bg-white p-4 md:grid-cols-[2fr_1fr]"
              >
                <img
                  src={product.image_url}
                  alt={product.product_type || "Produto"}
                  className="h-72 w-full rounded-sm object-cover"
                />
                <div className="flex flex-col">
                  <p className="mb-2 text-xs uppercase tracking-[0.14em] text-neutral-500">
                    SKU {product.sku || "--"}
                  </p>
                  <h2
                    className="mb-3"
                    style={{
                      fontFamily: `'${tokens.typography.title_font_family}', serif`,
                      fontSize: `${Math.max(tokens.typography.title_font_size_px - 6, 20)}px`,
                    }}
                  >
                    {product.product_type || "Produto sem nome"}
                  </h2>
                  <p className="mb-4 text-sm italic leading-relaxed text-neutral-800">
                    {product.description || "Descrição não preenchida."}
                  </p>
                  <div className="mb-3 flex items-baseline gap-3">
                    {hasDiscount ? (
                      <span className="text-sm text-neutral-500 line-through">
                        {formatCurrencyBRL(product.original_price)}
                      </span>
                    ) : null}
                    <span
                      className={hasDiscount ? "text-xl font-semibold" : "text-xl font-semibold text-neutral-900"}
                      style={{ color: hasDiscount ? tokens.colors.accent_burgundy : undefined }}
                    >
                      {formatCurrencyBRL(product.final_price || product.original_price)}
                    </span>
                  </div>
                  <p className="mt-auto border-t border-neutral-200 pt-3 text-xs text-neutral-700">
                    Tam: {product.sizes || "A definir"}
                  </p>
                </div>
              </article>
            );
          })}
      </div>
    </div>
  );
}
