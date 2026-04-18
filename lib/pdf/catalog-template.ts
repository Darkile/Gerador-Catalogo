import type { Catalog, DesignTokens } from "@/lib/types";
import { buildCatalogPresentation, type CatalogRenderableProduct } from "@/lib/catalog-presentation";
import { escapeHtml } from "@/lib/pdf/html";
import { buildCatalogPrintCss } from "@/lib/pdf/template-styles";

function renderFooter(footerText: string, pageLabel: string) {
  return `
    <div class="section-footer">
      <span class="section-footer__brand">${escapeHtml(footerText)}</span>
      <span class="section-footer__page">Pág. ${escapeHtml(pageLabel)}</span>
    </div>
  `;
}

function renderCover(title: string, deck: string, footerText: string, pageLabel: string) {
  return `
    <section class="catalog-page catalog-cover">
      <p class="catalog-cover__eyebrow">Gregory Editorial</p>
      <h1 class="catalog-cover__title">${escapeHtml(title)}</h1>
      <div class="catalog-cover__divider"></div>
      <p class="catalog-cover__deck">${escapeHtml(deck)}</p>
      ${renderFooter(footerText, pageLabel)}
    </section>
  `;
}

function renderProduct(
  product: ReturnType<typeof buildCatalogPresentation>["products"][number],
  footerText: string,
) {
  return `
    <article class="catalog-page product-spread product-spread--${product.variant}">
      <div class="product-spread__content">
        <div class="product-spread__media">
          <div class="product-spread__frame">
            <img class="product-image" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.image_alt)}" />
          </div>
        </div>
        <div class="product-spread__panel">
          <div class="product-panel__surface">
            <p class="product-panel__eyebrow">${escapeHtml(product.editorial_label)}</p>
            <p class="sku">SKU ${escapeHtml(product.sku)}</p>
            <h2 class="product-name">${escapeHtml(product.product_type)}</h2>
            <p class="description">${escapeHtml(product.description)}</p>
            <div class="product-pricing">
              ${product.discount_label ? `<span class="discount-pill">${escapeHtml(product.discount_label)}</span>` : ""}
              <div class="price-row">
                ${product.original_price_label ? `<span class="price-old">${escapeHtml(product.original_price_label)}</span>` : ""}
                <span class="price-final ${product.has_price ? "" : "price-final--consult"}">${escapeHtml(product.final_price_label)}</span>
              </div>
            </div>
            <div class="product-meta">
              <span class="product-meta__label">Tamanhos</span>
              <span class="sizes">${escapeHtml(product.sizes_label)}</span>
            </div>
          </div>
        </div>
      </div>
      ${renderFooter(footerText, product.page_label)}
    </article>
  `;
}

export function renderCatalogHtml({
  catalog,
  products,
  tokens,
}: {
  catalog: Pick<Catalog, "title" | "cover_enabled">;
  products: CatalogRenderableProduct[];
  tokens: DesignTokens;
}) {
  const presentation = buildCatalogPresentation({
    catalog,
    products,
    footerText: tokens.components.footer_text || "Gregory Moda • Edição editorial",
  });

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(presentation.title)}</title>
        <style>${buildCatalogPrintCss(tokens)}</style>
      </head>
      <body>
        <main class="catalog-root">
          ${presentation.cover_enabled ? renderCover(presentation.title, presentation.cover_deck, presentation.footer_text, presentation.cover_page_label) : ""}
          ${presentation.products.map((product) => renderProduct(product, presentation.footer_text)).join("\n")}
        </main>
      </body>
    </html>
  `;
}
