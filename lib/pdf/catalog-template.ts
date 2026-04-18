import type { Catalog, DesignTokens, Product } from "@/lib/types";
import { formatCurrencyBRL } from "@/lib/price";
import { escapeHtml } from "@/lib/pdf/html";
import { buildCatalogPrintCss } from "@/lib/pdf/template-styles";

function shouldUseFullBleed(product: Product) {
  if (!product.image_ratio) {
    return false;
  }

  return product.image_ratio < 0.78 || product.image_ratio > 1.45;
}

function renderProduct(product: Product) {
  const hasDiscount = Number(product.discount_percent) > 0;
  const fullBleed = shouldUseFullBleed(product);

  return `
    <article class="product-spread ${fullBleed ? "product-spread--full" : ""}">
      <img class="product-image" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.product_type || "Produto")}" />
      <div class="product-info">
        <p class="sku">SKU ${escapeHtml(product.sku || "--")}</p>
        <h2 class="product-name">${escapeHtml(product.product_type || "Produto sem nome")}</h2>
        <p class="description">${escapeHtml(product.description || "Descrição indisponível.")}</p>
        <div class="price-stack">
          ${
            hasDiscount
              ? `<span class="price-old">${formatCurrencyBRL(product.original_price)}</span>
                 <span class="price-final">${formatCurrencyBRL(product.final_price)}</span>`
              : `<span class="price-final price-final--single">${formatCurrencyBRL(product.final_price || product.original_price)}</span>`
          }
        </div>
        <p class="sizes">Tam: ${escapeHtml(product.sizes || "A definir")}</p>
      </div>
    </article>
  `;
}

export function renderCatalogHtml({
  catalog,
  products,
  tokens,
}: {
  catalog: Catalog;
  products: Product[];
  tokens: DesignTokens;
}) {
  const orderedProducts = [...products].sort((a, b) => a.position - b.position);
  const cover = catalog.cover_enabled
    ? `
      <section class="catalog-cover">
        <h1>${escapeHtml(catalog.title || "Catálogo Gregory")}</h1>
        <p>Seleção editorial de inverno com acabamento refinado e elegância atemporal.</p>
      </section>
    `
    : "";

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(catalog.title || "Catálogo Gregory")}</title>
        <style>${buildCatalogPrintCss(tokens)}</style>
      </head>
      <body>
        <main class="catalog-root">
          ${cover}
          ${orderedProducts.map(renderProduct).join("\n")}
        </main>
        <footer class="catalog-footer">
          ${escapeHtml(tokens.components.footer_text)} • Página <span class="catalog-page-number"></span>
        </footer>
      </body>
    </html>
  `;
}
