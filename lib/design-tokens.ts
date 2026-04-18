import baseTokensJson from "@/design/gregory-design-tokens.json";
import type { DesignTokenOverrides, DesignTokens } from "@/lib/types";

const baseTokens = baseTokensJson as DesignTokens;

export function mergeDesignTokens(
  overrides?: DesignTokenOverrides | null,
): DesignTokens {
  if (!overrides) {
    return baseTokens;
  }

  return {
    typography: {
      ...baseTokens.typography,
      ...(overrides.typography ?? {}),
    },
    colors: {
      ...baseTokens.colors,
      ...(overrides.colors ?? {}),
    },
    layout: {
      ...baseTokens.layout,
      ...(overrides.layout ?? {}),
    },
    components: {
      ...baseTokens.components,
      ...(overrides.components ?? {}),
    },
  };
}

export function designTokensToCssVariables(tokens: DesignTokens): string {
  return `
    :root {
      --gregory-bg: ${tokens.colors.background};
      --gregory-text-primary: ${tokens.colors.text_primary};
      --gregory-text-secondary: ${tokens.colors.text_secondary};
      --gregory-accent: ${tokens.colors.accent_burgundy};
      --gregory-divider: ${tokens.colors.divider};
      --gregory-font-title: '${tokens.typography.title_font_family}', serif;
      --gregory-font-body: '${tokens.typography.body_font_family}', sans-serif;
      --gregory-font-meta: '${tokens.typography.metadata_font_family}', sans-serif;
      --gregory-size-title: ${tokens.typography.title_font_size_px}px;
      --gregory-size-body: ${tokens.typography.body_font_size_px}px;
      --gregory-size-meta: ${tokens.typography.metadata_font_size_px}px;
      --gregory-size-price: ${tokens.typography.price_font_size_px}px;
      --gregory-page-margin-top: ${tokens.layout.page_margin_top_mm}mm;
      --gregory-page-margin-right: ${tokens.layout.page_margin_right_mm}mm;
      --gregory-page-margin-bottom: ${tokens.layout.page_margin_bottom_mm}mm;
      --gregory-page-margin-left: ${tokens.layout.page_margin_left_mm}mm;
    }
  `;
}
