export type AiStatus = "pending" | "queued" | "processing" | "done" | "failed";

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

export interface TypographyTokens {
  title_font_family: string;
  title_font_weight: number;
  title_font_size_px: number;
  title_letter_spacing_em: number;
  body_font_family: string;
  body_font_weight: number;
  body_font_size_px: number;
  body_line_height: number;
  metadata_font_family: string;
  metadata_font_weight: number;
  metadata_font_size_px: number;
  price_font_family: string;
  price_font_weight: number;
  price_font_size_px: number;
}

export interface ColorTokens {
  background: string;
  text_primary: string;
  text_secondary: string;
  accent_burgundy: string;
  divider: string;
}

export interface LayoutTokens {
  page_margin_top_mm: number;
  page_margin_right_mm: number;
  page_margin_bottom_mm: number;
  page_margin_left_mm: number;
  product_vertical_gap_px: number;
  image_column_ratio: number;
  info_column_ratio: number;
}

export interface ComponentTokens {
  sku_tracking_em: number;
  product_name_margin_bottom_px: number;
  description_margin_bottom_px: number;
  sizes_padding_top_px: number;
  sizes_border_top_color: string;
  footer_text: string;
  footer_font_size_px: number;
}

export interface DesignTokens {
  typography: TypographyTokens;
  colors: ColorTokens;
  layout: LayoutTokens;
  components: ComponentTokens;
}

export type DesignTokenOverrides = DeepPartial<DesignTokens>;

export interface Product {
  id: string;
  catalog_id: string;
  position: number;
  image_path: string;
  image_url: string;
  image_ratio: number | null;
  sku: string;
  product_type: string;
  description: string;
  original_price: number;
  discount_percent: number;
  final_price: number;
  sizes: string;
  ai_status: AiStatus;
  ai_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface EditableProductInput {
  id: string;
  position: number;
  image_path: string;
  image_url: string;
  image_ratio: number | null;
  sku: string;
  product_type: string;
  description: string;
  original_price: number;
  discount_percent: number;
  final_price: number;
  sizes: string;
  ai_status: AiStatus;
  ai_error: string | null;
}

export interface Catalog {
  id: string;
  title: string;
  status: "draft" | "processing" | "ready" | "error";
  cover_enabled: boolean;
  token_overrides: DesignTokenOverrides;
  pdf_path: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CatalogWithProducts extends Catalog {
  products: Product[];
}

export interface VisionAttributes {
  category: string;
  length: string;
  silhouette: string;
  sleeves: string;
  neckline: string;
  pattern: string;
  texture: string;
  details: string;
  standout: string;
}

export interface AiJob {
  id: string;
  catalog_id: string;
  total_items: number;
  completed_items: number;
  failed_items: number;
  status: "queued" | "processing" | "completed" | "failed";
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisionResult {
  product_type: string;
  description: string;
  visual_attributes: VisionAttributes;
}
