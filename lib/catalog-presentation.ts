import { formatCurrencyBRL } from "@/lib/price";
import type { Catalog, EditableProductInput } from "@/lib/types";

export type CatalogRenderableProduct = Pick<
  EditableProductInput,
  | "id"
  | "position"
  | "image_url"
  | "image_ratio"
  | "sku"
  | "product_type"
  | "description"
  | "original_price"
  | "discount_percent"
  | "final_price"
  | "sizes"
>;

export type ProductSpreadVariant = "split-left" | "split-right" | "hero";

export interface CatalogPresentationProduct {
  id: string;
  image_url: string;
  image_alt: string;
  variant: ProductSpreadVariant;
  editorial_label: string;
  sku: string;
  product_type: string;
  description: string;
  has_discount: boolean;
  has_price: boolean;
  discount_label: string | null;
  original_price_label: string | null;
  final_price_label: string;
  sizes_label: string;
  page_label: string;
}

export interface CatalogPresentation {
  title: string;
  cover_enabled: boolean;
  cover_deck: string;
  footer_text: string;
  cover_page_label: string;
  products: CatalogPresentationProduct[];
}

function normalizeFooterText(value: string | null | undefined) {
  if (!value || /Ã|â€¢/.test(value)) {
    return "Gregory Moda • Edição editorial";
  }

  return value;
}

function formatDiscountPercent(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function resolveSpreadVariant(
  product: CatalogRenderableProduct,
  index: number,
): ProductSpreadVariant {
  const ratio = Number(product.image_ratio ?? 0);

  if (ratio > 1.72 || (ratio > 0 && ratio < 0.68)) {
    return "hero";
  }

  return index % 2 === 0 ? "split-left" : "split-right";
}

export function buildCatalogPresentation({
  catalog,
  products,
  footerText,
}: {
  catalog: Pick<Catalog, "title" | "cover_enabled">;
  products: CatalogRenderableProduct[];
  footerText: string;
}): CatalogPresentation {
  const orderedProducts = [...products].sort((a, b) => a.position - b.position);
  const coverOffset = catalog.cover_enabled ? 1 : 0;

  return {
    title: catalog.title || "Catálogo Gregory",
    cover_enabled: catalog.cover_enabled,
    cover_deck:
      "Imagens integrais, direção de arte refinada e apresentação comercial com leitura mais clara de preço e desconto.",
    footer_text: normalizeFooterText(footerText),
    cover_page_label: "01",
    products: orderedProducts.map((product, index) => {
      const hasPrice = Number(product.original_price) > 0 || Number(product.final_price) > 0;
      const hasDiscount = hasPrice && Number(product.discount_percent) > 0;
      const pageNumber = index + 1 + coverOffset;

      return {
        id: product.id,
        image_url: product.image_url,
        image_alt: product.product_type || `Produto ${index + 1}`,
        variant: resolveSpreadVariant(product, index),
        editorial_label: `Editorial ${String(index + 1).padStart(2, "0")}`,
        sku: product.sku || "--",
        product_type: product.product_type || "Peça em destaque",
        description: product.description || "Descrição editorial em revisão.",
        has_discount: hasDiscount,
        has_price: hasPrice,
        discount_label: hasDiscount ? `-${formatDiscountPercent(product.discount_percent)}%` : null,
        original_price_label: hasDiscount ? formatCurrencyBRL(product.original_price) : null,
        final_price_label: hasPrice
          ? formatCurrencyBRL(product.final_price || product.original_price)
          : "Sob consulta",
        sizes_label: product.sizes || "Consulte grade disponível",
        page_label: String(pageNumber).padStart(2, "0"),
      };
    }),
  };
}
