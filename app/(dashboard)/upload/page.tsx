"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { ArrowDown, ArrowUp, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { apiCreateCatalog, apiListCatalogs, apiSaveProducts } from "@/lib/api-client";
import { getImageRatio } from "@/lib/image-utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { useCatalogStore, type EditableProduct } from "@/stores/catalog-store";

interface PendingUploadFile {
  localId: string;
  file: File;
  previewUrl: string;
  ratio: number | null;
}

interface RecentCatalog {
  id: string;
  title: string;
  status: "draft" | "processing" | "ready" | "error";
  cover_enabled: boolean;
  pdf_path: string | null;
  product_count: number;
  updated_at: string;
}

const MAX_FILES = 50;
const MAX_SIZE = 5 * 1024 * 1024;

export default function UploadPage() {
  const router = useRouter();
  const {
    catalogId,
    catalogTitle,
    coverEnabled,
    products,
    isUploading,
    uploadProgress,
    setCatalogMeta,
    setUploadState,
    addProducts,
  } = useCatalogStore();

  const [pendingFiles, setPendingFiles] = useState<PendingUploadFile[]>([]);
  const [recentCatalogs, setRecentCatalogs] = useState<RecentCatalog[]>([]);
  const [isLoadingRecentCatalogs, setIsLoadingRecentCatalogs] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      pendingFiles.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, [pendingFiles]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingRecentCatalogs(true);

    apiListCatalogs(8)
      .then((response) => {
        if (!cancelled) {
          setRecentCatalogs(response.catalogs);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Falha ao carregar histórico.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingRecentCatalogs(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }

    setErrorMessage(null);
    const filesWithMeta = await Promise.all(
      acceptedFiles.map(async (file) => ({
        localId: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        ratio: await getImageRatio(file),
      })),
    );

    setPendingFiles((current) => {
      const merged = [...current, ...filesWithMeta].slice(0, MAX_FILES);
      return merged;
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
    maxSize: MAX_SIZE,
    maxFiles: MAX_FILES,
    multiple: true,
  });

  useEffect(() => {
    if (fileRejections.length === 0) {
      return;
    }

    const reason = fileRejections[0]?.errors[0]?.message ?? "Arquivo inválido.";
    setErrorMessage(reason);
  }, [fileRejections]);

  const totalSelected = pendingFiles.length;

  const canUpload = useMemo(() => totalSelected > 0 && !isUploading, [isUploading, totalSelected]);

  const removeFile = useCallback((localId: string) => {
    setPendingFiles((current) => {
      const target = current.find((item) => item.localId === localId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((item) => item.localId !== localId);
    });
  }, []);

  const moveFile = useCallback((localId: string, direction: "up" | "down") => {
    setPendingFiles((current) => {
      const index = current.findIndex((item) => item.localId === localId);
      if (index === -1) {
        return current;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const copy = [...current];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  }, []);

  async function ensureCatalogId() {
    if (catalogId) {
      return catalogId;
    }

    const result = await apiCreateCatalog({
      title: catalogTitle,
      coverEnabled,
    });

    setCatalogMeta({
      catalogId: result.catalog.id,
      catalogTitle: result.catalog.title,
      coverEnabled: result.catalog.cover_enabled,
    });

    return result.catalog.id;
  }

  async function handleUpload() {
    if (!canUpload) {
      return;
    }

    setErrorMessage(null);
    setUploadState({ isUploading: true, progress: 0 });

    try {
      const resolvedCatalogId = await ensureCatalogId();
      const supabase = getSupabaseBrowserClient();
      const bucket = process.env.NEXT_PUBLIC_IMAGE_BUCKET_NAME ?? "catalog-images";

      const uploadedProducts: EditableProduct[] = [];

      for (let index = 0; index < pendingFiles.length; index += 1) {
        const item = pendingFiles[index];
        const extension = item.file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const safeName = slugify(item.file.name.replace(/\.[^/.]+$/, ""));
        const filePath = `${resolvedCatalogId}/${Date.now()}-${index}-${safeName}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, item.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(filePath);

        uploadedProducts.push({
          id: crypto.randomUUID(),
          position: products.length + index,
          image_path: filePath,
          image_url: publicUrl,
          image_ratio: item.ratio,
          sku: "",
          product_type: "",
          description: "",
          original_price: 0,
          discount_percent: 0,
          final_price: 0,
          sizes: "",
          ai_status: "pending",
          ai_error: null,
        });

        setUploadState({
          progress: Math.round(((index + 1) / pendingFiles.length) * 100),
        });
      }

      const mergedProducts = [...products, ...uploadedProducts].map((product, index) => ({
        ...product,
        position: index,
      }));

      addProducts(uploadedProducts);
      await apiSaveProducts(resolvedCatalogId, mergedProducts);

      setPendingFiles([]);
      router.push("/editor");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha no upload para o Storage.");
    } finally {
      setUploadState({ isUploading: false, progress: 0 });
    }
  }

  function handleResumeCatalog(catalog: RecentCatalog) {
    setCatalogMeta({
      catalogId: catalog.id,
      catalogTitle: catalog.title,
      coverEnabled: catalog.cover_enabled,
    });
    router.push("/editor");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload de Imagens</CardTitle>
          <CardDescription>
            Envie até 50 fotos (JPG/PNG, máximo de 5MB por arquivo) para iniciar o catálogo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="catalog-title">Título do catálogo</Label>
              <Input
                id="catalog-title"
                value={catalogTitle}
                onChange={(event) =>
                  setCatalogMeta({
                    catalogTitle: event.target.value,
                  })
                }
                placeholder="Coleção Inverno Gregory"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant={coverEnabled ? "default" : "outline"}
                onClick={() =>
                  setCatalogMeta({
                    coverEnabled: !coverEnabled,
                  })
                }
              >
                {coverEnabled ? "Capa ativada" : "Capa desativada"}
              </Button>
            </div>
          </div>

          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-md border-2 border-dashed p-10 text-center transition-colors ${
              isDragActive ? "border-neutral-900 bg-neutral-100" : "border-neutral-300 bg-white"
            }`}
          >
            <input {...getInputProps()} />
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-neutral-100">
              <UploadCloud className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium">Arraste imagens aqui ou clique para selecionar</p>
            <p className="mt-1 text-xs text-neutral-500">JPG ou PNG • até 5MB • máximo de 50 arquivos</p>
          </div>

          {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}

          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600">{totalSelected} arquivo(s) prontos para envio</p>
            <Button type="button" variant="outline" onClick={() => setPendingFiles([])} disabled={pendingFiles.length === 0}>
              Limpar lista
            </Button>
          </div>

          {isUploading ? (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-xs text-neutral-500">Upload em andamento: {uploadProgress}%</p>
            </div>
          ) : null}

          {pendingFiles.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {pendingFiles.map((item, index) => (
                <div key={item.localId} className="rounded-md border border-neutral-200 bg-white p-2">
                  <div className="relative">
                    <img
                      src={item.previewUrl}
                      alt={`Prévia ${index + 1}`}
                      className="h-40 w-full rounded object-cover"
                    />
                    <span className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white">
                      {index + 1}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-1">
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveFile(item.localId, "up")}> 
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => moveFile(item.localId, "down")}> 
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(item.localId)}>
                      <Trash2 className="h-4 w-4 text-red-700" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">
              <ImagePlus className="h-4 w-4" />
              Nenhuma imagem selecionada.
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push("/editor")}>Ir para editor</Button>
            <Button type="button" onClick={handleUpload} disabled={!canUpload}>
              {isUploading ? <Spinner className="mr-2" /> : null}
              Enviar para catálogo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico Recente</CardTitle>
          <CardDescription>Retome catálogos já salvos no banco de dados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoadingRecentCatalogs ? (
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Spinner />
              Carregando histórico...
            </div>
          ) : recentCatalogs.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum catálogo salvo até o momento.</p>
          ) : (
            <div className="space-y-2">
              {recentCatalogs.map((catalog) => (
                <div
                  key={catalog.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{catalog.title}</p>
                    <p className="text-xs text-neutral-500">
                      {catalog.product_count} produto(s) • status: {catalog.status} • atualizado em{" "}
                      {new Date(catalog.updated_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => handleResumeCatalog(catalog)}>
                    Retomar no editor
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
