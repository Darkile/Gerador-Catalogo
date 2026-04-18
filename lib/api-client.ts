import type { CatalogWithProducts, EditableProductInput } from "@/lib/types";

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `Erro HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function apiCreateCatalog(payload: {
  title: string;
  coverEnabled: boolean;
}) {
  const response = await fetch("/api/catalogs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<{ catalog: { id: string; title: string; cover_enabled: boolean } }>(response);
}

export async function apiListCatalogs(limit = 20) {
  const response = await fetch(`/api/catalogs?limit=${limit}`, {
    method: "GET",
    cache: "no-store",
  });

  return parseJsonResponse<{
    catalogs: Array<{
      id: string;
      title: string;
      status: "draft" | "processing" | "ready" | "error";
      cover_enabled: boolean;
      pdf_path: string | null;
      product_count: number;
      updated_at: string;
      created_at: string;
    }>;
  }>(response);
}

export async function apiGetCatalog(catalogId: string) {
  const response = await fetch(`/api/catalogs/${catalogId}`, {
    method: "GET",
    cache: "no-store",
  });

  return parseJsonResponse<{ catalog: CatalogWithProducts }>(response);
}

export async function apiPatchCatalog(
  catalogId: string,
  payload: {
    title?: string;
    cover_enabled?: boolean;
    token_overrides?: Record<string, unknown>;
  },
) {
  const response = await fetch(`/api/catalogs/${catalogId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseJsonResponse<{ ok: boolean }>(response);
}

export async function apiDeleteCatalog(catalogId: string) {
  const response = await fetch(`/api/catalogs/${catalogId}`, {
    method: "DELETE",
  });

  return parseJsonResponse<{ ok: boolean }>(response);
}

export async function apiSaveProducts(catalogId: string, products: EditableProductInput[]) {
  const response = await fetch(`/api/catalogs/${catalogId}/products`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ products }),
  });

  return parseJsonResponse<{ ok: boolean }>(response);
}

export async function apiStartAiProcessing(catalogId: string) {
  const response = await fetch("/api/process-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ catalogId }),
  });

  return parseJsonResponse<{ jobId: string; total: number; message: string }>(response);
}

export async function apiGetAiStatus(jobId: string) {
  const response = await fetch(`/api/process-image?jobId=${jobId}`, {
    method: "GET",
    cache: "no-store",
  });

  return parseJsonResponse<{
    job: {
      id: string;
      status: "queued" | "processing" | "completed" | "failed";
      total_items: number;
      completed_items: number;
      failed_items: number;
    };
    progress: number;
    products: Array<{
      id: string;
      ai_status: "pending" | "queued" | "processing" | "done" | "failed";
      ai_error: string | null;
      product_type: string;
      sku: string;
    }>;
  }>(response);
}

export async function apiGeneratePdf(catalogId: string) {
  const response = await fetch("/api/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ catalogId }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Não foi possível gerar PDF.");
  }

  return response.blob();
}
