import type { DesignTokens } from "@/lib/types";

export function buildCatalogPrintCss(tokens: DesignTokens) {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');

    @page {
      size: A4;
      margin: 0;
    }

    :root {
      --gregory-bg: ${tokens.colors.background};
      --gregory-stage: #d9d0c8;
      --gregory-stage-shadow: rgba(31, 22, 16, 0.18);
      --gregory-paper: #fbf8f3;
      --gregory-paper-alt: #f6f1ea;
      --gregory-paper-line: rgba(73, 53, 38, 0.12);
      --gregory-panel: rgba(255, 252, 248, 0.82);
      --gregory-text-primary: ${tokens.colors.text_primary};
      --gregory-text-secondary: #6c625b;
      --gregory-accent: ${tokens.colors.accent_burgundy};
      --gregory-divider: rgba(73, 53, 38, 0.18);
      --gregory-gold: #9d7f5f;
      --gregory-cover-ink: #241915;
      --gregory-font-title: '${tokens.typography.title_font_family}', serif;
      --gregory-font-body: '${tokens.typography.body_font_family}', sans-serif;
      --gregory-font-meta: '${tokens.typography.metadata_font_family}', sans-serif;
      --page-width: 210mm;
      --page-height: 297mm;
      --page-pad-top: ${tokens.layout.page_margin_top_mm}mm;
      --page-pad-right: ${tokens.layout.page_margin_right_mm}mm;
      --page-pad-bottom: ${tokens.layout.page_margin_bottom_mm}mm;
      --page-pad-left: ${tokens.layout.page_margin_left_mm}mm;
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
      background: var(--gregory-stage);
      color: var(--gregory-text-primary);
      font-family: var(--gregory-font-body);
      font-size: ${tokens.typography.body_font_size_px}px;
      line-height: ${tokens.typography.body_line_height};
    }

    body {
      min-height: 100vh;
    }

    .catalog-root {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0;
    }

    .catalog-page {
      position: relative;
      width: var(--page-width);
      min-height: var(--page-height);
      padding: var(--page-pad-top) var(--page-pad-right) var(--page-pad-bottom) var(--page-pad-left);
      display: flex;
      flex-direction: column;
      background:
        radial-gradient(circle at top right, rgba(157, 127, 95, 0.16), transparent 34%),
        radial-gradient(circle at left center, rgba(138, 3, 3, 0.08), transparent 40%),
        linear-gradient(180deg, var(--gregory-paper) 0%, #fffdf9 56%, var(--gregory-paper-alt) 100%);
      overflow: hidden;
      break-after: page;
      page-break-after: always;
    }

    .catalog-page:last-child {
      break-after: auto;
      page-break-after: auto;
    }

    .catalog-page::before {
      content: "";
      position: absolute;
      inset: 10mm;
      border: 1px solid rgba(157, 127, 95, 0.18);
      pointer-events: none;
    }

    .catalog-cover {
      justify-content: center;
      text-align: center;
      background:
        radial-gradient(circle at top center, rgba(157, 127, 95, 0.22), transparent 28%),
        radial-gradient(circle at bottom left, rgba(138, 3, 3, 0.1), transparent 34%),
        linear-gradient(160deg, #f6efe7 0%, #fffaf5 48%, #f2e8df 100%);
    }

    .catalog-cover__eyebrow {
      margin: 0 0 10px;
      font-family: var(--gregory-font-meta);
      font-size: 11px;
      letter-spacing: 0.42em;
      text-transform: uppercase;
      color: var(--gregory-gold);
    }

    .catalog-cover__title {
      margin: 0;
      font-family: var(--gregory-font-title);
      font-size: clamp(38px, 4.4vw, 58px);
      line-height: 0.95;
      letter-spacing: -0.04em;
      color: var(--gregory-cover-ink);
    }

    .catalog-cover__divider {
      width: 70px;
      height: 1px;
      margin: 22px auto;
      background: linear-gradient(90deg, transparent 0%, var(--gregory-gold) 50%, transparent 100%);
    }

    .catalog-cover__deck {
      margin: 0 auto;
      max-width: 118mm;
      color: var(--gregory-text-secondary);
      font-size: 16px;
      line-height: 1.6;
    }

    .product-spread__content {
      display: grid;
      grid-template-columns: minmax(0, 1.22fr) minmax(72mm, 0.78fr);
      gap: 11mm;
      flex: 1;
      min-height: 0;
      align-items: stretch;
    }

    .product-spread--split-right .product-spread__media {
      order: 2;
    }

    .product-spread--split-right .product-spread__panel {
      order: 1;
    }

    .product-spread--hero .product-spread__content {
      grid-template-columns: 1fr;
      gap: 8mm;
    }

    .product-spread__media {
      display: flex;
      min-height: 0;
    }

    .product-spread__frame {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: 188mm;
      padding: 9mm 8mm;
      border: 1px solid var(--gregory-paper-line);
      background:
        linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(246, 241, 234, 0.95)),
        repeating-linear-gradient(
          135deg,
          rgba(157, 127, 95, 0.035) 0,
          rgba(157, 127, 95, 0.035) 10px,
          transparent 10px,
          transparent 20px
        );
      box-shadow:
        inset 0 0 0 1px rgba(255, 255, 255, 0.6),
        0 24px 50px rgba(52, 37, 26, 0.08);
      overflow: hidden;
    }

    .product-spread__frame::before {
      content: "";
      position: absolute;
      inset: 7mm;
      border: 1px solid rgba(157, 127, 95, 0.12);
      pointer-events: none;
    }

    .product-spread--hero .product-spread__frame {
      min-height: 170mm;
    }

    .product-image {
      display: block;
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      object-position: center;
      filter: saturate(1.02) contrast(1.02);
    }

    .product-spread__panel {
      position: relative;
      display: flex;
      min-width: 0;
    }

    .product-spread__panel::before {
      content: "";
      position: absolute;
      left: -5.5mm;
      top: 8mm;
      bottom: 8mm;
      width: 1px;
      background: linear-gradient(180deg, transparent 0%, rgba(157, 127, 95, 0.35) 16%, rgba(157, 127, 95, 0.35) 84%, transparent 100%);
    }

    .product-spread--hero .product-spread__panel::before {
      display: none;
    }

    .product-panel__surface {
      position: relative;
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 0;
      padding: 11mm 9mm;
      background: var(--gregory-panel);
      border: 1px solid rgba(157, 127, 95, 0.16);
      box-shadow: 0 16px 34px rgba(37, 27, 19, 0.05);
      backdrop-filter: blur(8px);
    }

    .product-spread--hero .product-panel__surface {
      padding-top: 9mm;
    }

    .product-panel__eyebrow {
      margin: 0 0 8px;
      font-family: var(--gregory-font-meta);
      font-size: 11px;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      color: var(--gregory-gold);
    }

    .sku {
      margin: 0 0 16px;
      font-family: var(--gregory-font-meta);
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--gregory-text-secondary);
    }

    .product-name {
      margin: 0 0 16px;
      font-family: var(--gregory-font-title);
      font-size: clamp(26px, 3vw, 38px);
      line-height: 1;
      letter-spacing: -0.04em;
      color: var(--gregory-text-primary);
    }

    .description {
      margin: 0;
      color: var(--gregory-text-secondary);
      font-size: 15px;
      line-height: 1.7;
    }

    .product-pricing {
      margin-top: auto;
      padding-top: 11mm;
      display: flex;
      flex-direction: column;
      gap: 5mm;
    }

    .discount-pill {
      align-self: flex-start;
      padding: 2.4mm 4.4mm;
      border-radius: 999px;
      background: var(--gregory-accent);
      color: #fffaf6;
      font-family: var(--gregory-font-meta);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }

    .price-row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 10px 16px;
    }

    .price-old {
      color: rgba(79, 65, 55, 0.68);
      text-decoration: line-through;
      font-size: 15px;
      font-weight: 500;
    }

    .price-final {
      font-size: clamp(26px, 3vw, 34px);
      line-height: 1;
      font-weight: ${tokens.typography.price_font_weight};
      color: var(--gregory-accent);
      letter-spacing: -0.03em;
    }

    .price-final--consult {
      color: var(--gregory-text-primary);
      font-size: 22px;
    }

    .product-meta {
      margin-top: 8mm;
      padding-top: 4.5mm;
      border-top: 1px solid rgba(157, 127, 95, 0.18);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .product-meta__label {
      font-family: var(--gregory-font-meta);
      font-size: 11px;
      letter-spacing: 0.24em;
      text-transform: uppercase;
      color: var(--gregory-text-secondary);
    }

    .sizes {
      color: var(--gregory-text-primary);
      font-size: 14px;
      line-height: 1.55;
    }

    .section-footer {
      margin-top: 8mm;
      padding-top: 4mm;
      border-top: 1px solid rgba(157, 127, 95, 0.18);
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      font-family: var(--gregory-font-meta);
      font-size: 11px;
      color: var(--gregory-text-secondary);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .section-footer__brand {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .section-footer__page {
      flex-shrink: 0;
      color: var(--gregory-text-primary);
    }

    @media screen {
      html,
      body {
        background: var(--gregory-stage);
      }

      .catalog-root {
        gap: 26px;
        padding: 22px 0 30px;
      }

      .catalog-page {
        box-shadow: 0 30px 80px var(--gregory-stage-shadow);
      }
    }

    @media print {
      html,
      body {
        background: var(--gregory-bg);
      }

      .catalog-root {
        gap: 0;
        padding: 0;
      }

      .catalog-page {
        box-shadow: none;
      }
    }
  `;
}
