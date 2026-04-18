"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { ArrowDown, ArrowUp, ImagePlus, Trash2, UploadCloud } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { apiCreateCatalog, apiDeleteCatalog, apiListCatalogs, apiSaveProducts } from "@/lib/api-client";
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
    resetAll,
  } = useCatalogStore();

  const [pendingFiles, setPendingFiles] = useState<PendingUploadFile[]>([]);
  const [recentCatalogs, setRecentCatalogs] = useState<RecentCatalog[]>([]);
  const [isLoadingRecentCatalogs, setIsLoadingRecentCatalogs] = useState(false);
  const [deletingCatalogId, setDeletingCatalogId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(".anim-fade-up", {
      y: 40,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: "power4.out",
    });
  }, { scope: containerRef });

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

  async function handleDeleteCatalog(catalog: RecentCatalog) {
    const confirmed = window.confirm(`Excluir o histórico "${catalog.title}"? Esta ação não pode ser desfeita.`);
    if (!confirmed) {
      return;
    }

    setErrorMessage(null);
    setDeletingCatalogId(catalog.id);

    try {
      await apiDeleteCatalog(catalog.id);
      setRecentCatalogs((current) => current.filter((item) => item.id !== catalog.id));

      if (catalogId === catalog.id) {
        resetAll();
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao excluir catálogo.");
    } finally {
      setDeletingCatalogId(null);
    }
  }

  return (
    <div ref={containerRef} className="space-y-10">
      <Card className="anim-fade-up border-neutral-200">
        <CardHeader>
          <CardTitle className="text-4xl font-serif tracking-tight text-neutral-900">Upload de Imagens</CardTitle>
          <CardDescription className="tracking-wide">
            Envie até 50 fotos para iniciar a sua curadoria.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
            className={`flex w-full cursor-pointer flex-col items-center justify-center border-b-2 p-8 py-12 md:p-24 transition-all duration-700 ${
              isDragActive ? "scale-[1.01] border-b-neutral-900" : "border-b-neutral-200 hover:border-b-neutral-900"
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud className="mb-5 h-8 w-8 text-neutral-500" />
            <h3 className="mb-2 text-2xl md:text-3xl text-center font-serif text-neutral-900">Solte as imagens aqui</h3>
            <p className="text-xs md:text-sm text-center font-medium uppercase tracking-[0.2em] text-muted-foreground">Ou clique para navegar</p>
            <p className="mt-6 text-[10px] uppercase tracking-wider text-neutral-400">JPG ou PNG • alta resolução</p>
          </div>

          {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-neutral-600">{totalSelected} arquivo(s) prontos para envio</p>
            <Button className="w-full sm:w-auto" type="button" variant="outline" onClick={() => setPendingFiles([])} disabled={pendingFiles.length === 0}>
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
            <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {pendingFiles.map((item, index) => (
                <div key={item.localId} className="group relative overflow-hidden transition-all duration-700 hover:-translate-y-2">
                  <div className="relative flex aspect-[3/4] items-center justify-center bg-neutral-100">
                    <img
                      src={item.previewUrl}
                      alt={`Prévia ${index + 1}`}
                      className="h-full w-full object-contain transition-all duration-700 group-hover:scale-[1.01]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <span className="absolute left-4 top-4 bg-white/80 px-3 py-1 text-xs font-serif italic text-neutral-900 backdrop-blur-md">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-b border-transparent pb-2 transition-colors group-hover:border-neutral-200">
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-neutral-100" onClick={() => moveFile(item.localId, "up")}>
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-neutral-100" onClick={() => moveFile(item.localId, "down")}>
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:text-red-700" onClick={() => removeFile(item.localId)}>
                      <Trash2 className="h-3 w-3" />
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

          <div className="mt-12 grid grid-cols-1 sm:flex sm:flex-row sm:justify-end gap-4 border-t border-neutral-100 pt-8">
            <Button type="button" variant="ghost" className="w-full uppercase tracking-widest text-xs" onClick={() => router.push("/editor")}>
              Pular para editor
            </Button>
            <Button type="button" className="w-full sm:w-auto px-8 text-xs uppercase tracking-widest" onClick={handleUpload} disabled={!canUpload}>
              {isUploading ? <Spinner className="mr-2" /> : null}
              Finalizar seleção
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="anim-fade-up border-neutral-200">
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-neutral-900">Projetos Anteriores</CardTitle>
          <CardDescription>Retome ou exclua catálogos já salvos.</CardDescription>
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
                  <div className="w-full grid grid-cols-2 sm:flex sm:flex-row items-center gap-2">
                    <Button type="button" variant="ghost" className="w-full uppercase tracking-widest text-[10px]" onClick={() => handleResumeCatalog(catalog)}>
                      Retomar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="w-full uppercase tracking-widest text-[10px]"
                      onClick={() => handleDeleteCatalog(catalog)}
                      disabled={deletingCatalogId === catalog.id}
                    >
                      {deletingCatalogId === catalog.id ? "Excluindo..." : "Excluir"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
