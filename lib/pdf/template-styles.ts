import type { DesignTokens } from "@/lib/types";

export function buildCatalogPrintCss(tokens: DesignTokens) {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');

    @page {
      size: A4;
      margin: ${tokens.layout.page_margin_top_mm}mm ${tokens.layout.page_margin_right_mm}mm ${tokens.layout.page_margin_bottom_mm}mm ${tokens.layout.page_margin_left_mm}mm;
    }

    :root {
      --gregory-bg: ${tokens.colors.background};
      --gregory-text-primary: ${tokens.colors.text_primary};
      --gregory-text-secondary: ${tokens.colors.text_secondary};
      --gregory-accent: ${tokens.colors.accent_burgundy};
      --gregory-divider: ${tokens.colors.divider};
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      background: var(--gregory-bg);
      color: var(--gregory-text-primary);
      font-family: '${tokens.typography.body_font_family}', sans-serif;
      font-size: ${tokens.typography.body_font_size_px}px;
      line-height: ${tokens.typography.body_line_height};
    }

    .catalog-root {
      width: 100%;
      position: relative;
      counter-reset: page;
      padding-bottom: 14mm;
    }

    .catalog-cover {
      min-height: calc(297mm - ${tokens.layout.page_margin_top_mm + tokens.layout.page_margin_bottom_mm}mm);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
      break-after: page;
      background: linear-gradient(145deg, #fff 0%, #f8f6f4 100%);
      border: 1px solid ${tokens.colors.divider};
      padding: 36px;
    }

    .catalog-cover h1 {
      font-family: '${tokens.typography.title_font_family}', serif;
      font-size: clamp(30px, 4vw, 52px);
      margin: 0 0 12px;
      letter-spacing: -0.02em;
      color: var(--gregory-text-primary);
    }

    .catalog-cover p {
      margin: 0;
      max-width: 560px;
      color: var(--gregory-text-secondary);
      font-size: 16px;
    }

    .product-spread {
      display: grid;
      grid-template-columns: ${Math.round(tokens.layout.image_column_ratio * 100)}fr ${Math.round(tokens.layout.info_column_ratio * 100)}fr;
      gap: 24px;
      margin-bottom: ${tokens.layout.product_vertical_gap_px}px;
      break-inside: avoid;
      page-break-inside: avoid;
      align-items: stretch;
      min-height: 180mm;
      background: #fff;
      border: 1px solid ${tokens.colors.divider};
      padding: 18px;
    }

    .product-spread--full {
      grid-template-columns: 1fr;
      min-height: 240mm;
      padding: 0;
      border: none;
      background: transparent;
      gap: 16px;
    }

    .product-image {
      width: 100%;
      height: 100%;
      min-height: 320px;
      object-fit: cover;
      background: #f4f4f4;
    }

    .product-spread--full .product-image {
      min-height: 230mm;
      border: 1px solid ${tokens.colors.divider};
    }

    .product-info {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      padding: 6px 2px;
      background: #fff;
      min-width: 0;
    }

    .sku {
      font-family: '${tokens.typography.metadata_font_family}', sans-serif;
      font-size: ${tokens.typography.metadata_font_size_px}px;
      letter-spacing: ${tokens.components.sku_tracking_em}em;
      color: var(--gregory-text-secondary);
      text-transform: uppercase;
      margin-bottom: 12px;
      white-space: nowrap;
    }

    .product-name {
      font-family: '${tokens.typography.title_font_family}', serif;
      font-weight: ${tokens.typography.title_font_weight};
      font-size: ${tokens.typography.title_font_size_px}px;
      letter-spacing: ${tokens.typography.title_letter_spacing_em}em;
      margin: 0 0 ${tokens.components.product_name_margin_bottom_px}px;
    }

    .description {
      font-style: italic;
      margin: 0 0 ${tokens.components.description_margin_bottom_px}px;
      color: var(--gregory-text-primary);
      max-width: 90%;
    }

    .price-stack {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 12px;
    }

    .price-old {
      color: var(--gregory-text-secondary);
      text-decoration: line-through;
      font-size: 15px;
      font-weight: 500;
    }

    .price-final {
      font-family: '${tokens.typography.price_font_family}', sans-serif;
      font-size: ${tokens.typography.price_font_size_px}px;
      font-weight: ${tokens.typography.price_font_weight};
      color: var(--gregory-accent);
    }

    .price-final--single {
      color: var(--gregory-text-primary);
    }

    .sizes {
      border-top: 1px solid ${tokens.components.sizes_border_top_color};
      padding-top: ${tokens.components.sizes_padding_top_px}px;
      margin-top: auto;
      font-size: 13px;
      color: var(--gregory-text-primary);
      white-space: nowrap;
    }

    .catalog-footer {
      position: fixed;
      bottom: 6mm;
      left: 0;
      right: 0;
      text-align: center;
      color: var(--gregory-text-secondary);
      font-size: ${tokens.components.footer_font_size_px}px;
      font-family: '${tokens.typography.metadata_font_family}', sans-serif;
    }

    .catalog-page-number::after {
      content: counter(page);
    }

    @media print {
      .catalog-footer {
        display: block;
      }
    }
  `;
}
