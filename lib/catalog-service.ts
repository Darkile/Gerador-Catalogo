import { calculateFinalPrice } from "@/lib/price";
import { sanitizeAiText, sanitizeSizeList } from "@/lib/sanitize";
import type { CatalogWithProducts, EditableProductInput } from "@/lib/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function createCatalog({
  title,
  coverEnabled,
  userId,
}: {
  title: string;
  coverEnabled: boolean;
  userId?: string;
}) {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("catalogs")
    .insert({
      title,
      cover_enabled: coverEnabled,
      created_by: userId ?? null,
      status: "draft",
      token_overrides: {},
    })
    .select("id, title, cover_enabled, token_overrides")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getCatalogById(catalogId: string): Promise<CatalogWithProducts> {
  const supabase = getSupabaseAdminClient();

  const { data: catalog, error: catalogError } = await supabase
    .from("catalogs")
    .select("*")
    .eq("id", catalogId)
    .single();

  if (catalogError || !catalog) {
    throw catalogError ?? new Error("Catálogo não encontrado.");
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .eq("catalog_id", catalogId)
    .order("position", { ascending: true });

  if (productsError) {
    throw productsError;
  }

  return {
    ...catalog,
    products,
  } as CatalogWithProducts;
}

export async function replaceCatalogProducts(
  catalogId: string,
  products: EditableProductInput[],
) {
  const supabase = getSupabaseAdminClient();

  const normalized = products
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((product, index) => ({
      id: product.id,
      catalog_id: catalogId,
      position: index,
      image_path: product.image_path,
      image_url: product.image_url,
      image_ratio: product.image_ratio,
      sku: sanitizeAiText(product.sku || ""),
      product_type: sanitizeAiText(product.product_type || ""),
      description: sanitizeAiText(product.description || ""),
      original_price: Number(product.original_price ?? 0),
      discount_percent: Number(product.discount_percent ?? 0),
      final_price: calculateFinalPrice(
        Number(product.original_price ?? 0),
        Number(product.discount_percent ?? 0),
      ),
      sizes: sanitizeSizeList(product.sizes || ""),
      ai_status: product.ai_status ?? "pending",
      ai_error: product.ai_error,
      updated_at: new Date().toISOString(),
    }));

  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .eq("catalog_id", catalogId);

  if (deleteError) {
    throw deleteError;
  }

  if (normalized.length > 0) {
    const { error: insertError } = await supabase
      .from("products")
      .insert(normalized);

    if (insertError) {
      throw insertError;
    }
  }

  const { error: updateCatalogError } = await supabase
    .from("catalogs")
    .update({
      status: "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", catalogId);

  if (updateCatalogError) {
    throw updateCatalogError;
  }
}
