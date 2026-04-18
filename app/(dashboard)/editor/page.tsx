"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileDown, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import { CatalogPreview } from "@/components/catalog/catalog-preview";
import { PdfPreviewModal } from "@/components/catalog/pdf-preview-modal";
import {
  apiCreateCatalog,
  apiGeneratePdf,
  apiGetAiStatus,
  apiGetCatalog,
  apiPatchCatalog,
  apiSaveProducts,
  apiStartAiProcessing,
} from "@/lib/api-client";
import { mergeDesignTokens } from "@/lib/design-tokens";
import { formatCurrencyBRL } from "@/lib/price";
import { buildCatalogPdfFilename } from "@/lib/pdf/file-name";
import { useCatalogStore } from "@/stores/catalog-store";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export default function EditorPage() {
  const router = useRouter();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    catalogId,
    catalogTitle,
    coverEnabled,
    tokenOverrides,
    products,
    aiJobId,
    aiStatus,
    setCatalogMeta,
    setProducts,
    updateProduct,
    removeProduct,
    reorderProduct,
    setAiState,
  } = useCatalogStore();

  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [aiProgress, setAiProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const mergedTokens = useMemo(() => mergeDesignTokens(tokenOverrides), [tokenOverrides]);

  useGSAP(() => {
    // Anima o Header do dashboard
    gsap.from(".anim-editor-header", {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: "power4.out",
    });

    // ScrollTrigger para os Cards dos Produtos (Bento grid style)
    const cards = gsap.utils.toArray<HTMLElement>(".anim-product-card");
    cards.forEach((card) => {
      gsap.fromTo(card,
        { y: 60, opacity: 0, scale: 0.98 },
        {
          scrollTrigger: {
            trigger: card,
            start: "top bottom-=80", // Começa um pouco antes de aparecer
            toggleActions: "play none none reverse"
          },
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
          clearProps: "all"
        }
      );
    });
  }, { scope: containerRef, dependencies: [products] });

  useEffect(() => {
    if (!catalogId) {
      return;
    }

    let cancelled = false;
    setIsLoadingCatalog(true);

    apiGetCatalog(catalogId)
      .then(({ catalog }) => {
        if (cancelled) {
          return;
        }

        setCatalogMeta({
          catalogId: catalog.id,
          catalogTitle: catalog.title,
          coverEnabled: catalog.cover_enabled,
          tokenOverrides: catalog.token_overrides ?? {},
        });

        setProducts(
          catalog.products.map((product, index) => ({
            id: product.id,
            position: index,
            image_path: product.image_path,
            image_url: product.image_url,
            image_ratio: product.image_ratio,
            sku: product.sku ?? "",
            product_type: product.product_type ?? "",
            description: product.description ?? "",
            original_price: Number(product.original_price ?? 0),
            discount_percent: Number(product.discount_percent ?? 0),
            final_price: Number(product.final_price ?? 0),
            sizes: product.sizes ?? "",
            ai_status: product.ai_status,
            ai_error: product.ai_error,
          })),
        );
      })
      .catch((error) => {
        if (!cancelled) {
          setStatusError(error instanceof Error ? error.message : "Falha ao carregar catálogo.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingCatalog(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [catalogId, setCatalogMeta, setProducts]);

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  async function ensureCatalog() {
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

  async function saveCatalog() {
    setStatusError(null);
    setStatusMessage(null);
    setIsSaving(true);

    try {
      const resolvedCatalogId = await ensureCatalog();

      await apiPatchCatalog(resolvedCatalogId, {
        title: catalogTitle,
        cover_enabled: coverEnabled,
        token_overrides: tokenOverrides as Record<string, unknown>,
      });

      await apiSaveProducts(
        resolvedCatalogId,
        products
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((product, index) => ({
            ...product,
            position: index,
          })),
      );

      setStatusMessage("Catálogo salvo com sucesso.");
      return resolvedCatalogId;
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Falha ao salvar catálogo.");
      throw error;
    } finally {
      setIsSaving(false);
    }
  }

  async function refreshCatalog(catalogIdToLoad: string) {
    const { catalog } = await apiGetCatalog(catalogIdToLoad);
    setCatalogMeta({
      catalogId: catalog.id,
      catalogTitle: catalog.title,
      coverEnabled: catalog.cover_enabled,
      tokenOverrides: catalog.token_overrides ?? {},
    });
    setProducts(
      catalog.products.map((product, index) => ({
        id: product.id,
        position: index,
        image_path: product.image_path,
        image_url: product.image_url,
        image_ratio: product.image_ratio,
        sku: product.sku ?? "",
        product_type: product.product_type ?? "",
        description: product.description ?? "",
        original_price: Number(product.original_price ?? 0),
        discount_percent: Number(product.discount_percent ?? 0),
        final_price: Number(product.final_price ?? 0),
        sizes: product.sizes ?? "",
        ai_status: product.ai_status,
        ai_error: product.ai_error,
      })),
    );
  }

  async function handleProcessAi() {
    if (products.length === 0) {
      setStatusError("Envie imagens antes de processar com IA.");
      return;
    }

    setStatusError(null);
    setStatusMessage(null);
    setIsProcessingAi(true);

    try {
      const resolvedCatalogId = await saveCatalog();
      const result = await apiStartAiProcessing(resolvedCatalogId);
      setAiState({ aiJobId: result.jobId, aiStatus: "processing" });
      setAiProgress(0);

      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }

      pollingRef.current = setInterval(async () => {
        try {
          const status = await apiGetAiStatus(result.jobId);
          setAiProgress(status.progress);
          const mappedStatus =
            status.job.status === "completed"
              ? "completed"
              : status.job.status === "failed"
                ? "failed"
                : "processing";

          setAiState({ aiStatus: mappedStatus });

          if (status.job.status === "completed" || status.job.status === "failed") {
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
            }
            await refreshCatalog(resolvedCatalogId);
            setStatusMessage(
              status.job.status === "completed"
                ? "Processamento IA concluído."
                : "Processamento IA finalizado com falhas. Verifique os itens.",
            );
            setIsProcessingAi(false);
          }
        } catch (error) {
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
          }
          setStatusError(error instanceof Error ? error.message : "Falha ao consultar status da IA.");
          setIsProcessingAi(false);
        }
      }, 2500);
    } catch {
      setIsProcessingAi(false);
    }
  }

  async function handleGeneratePdf() {
    if (products.length === 0) {
      setStatusError("Não há produtos para gerar PDF.");
      return;
    }

    setStatusError(null);
    setStatusMessage(null);
    setIsGeneratingPdf(true);

    try {
      const resolvedCatalogId = await saveCatalog();
      const blob = await apiGeneratePdf(resolvedCatalogId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = buildCatalogPdfFilename(new Date());
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setStatusMessage("PDF gerado e download iniciado.");
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Falha ao gerar PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <div ref={containerRef} className="space-y-12 pb-24">
      <Card className="anim-editor-header border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle>Editor de Catálogo</CardTitle>
          <CardDescription>
            Complete SKU, preços, tamanhos e ajustes editoriais. O desconto é calculado automaticamente a partir do preço original e do preço final.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
            <div className="space-y-2">
              <Label htmlFor="editor-title">Título do catálogo</Label>
              <Input
                id="editor-title"
                value={catalogTitle}
                onChange={(event) => setCatalogMeta({ catalogTitle: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accent-color">Cor de destaque</Label>
              <Input
                id="accent-color"
                type="color"
                value={mergedTokens.colors.accent_burgundy}
                onChange={(event) =>
                  setCatalogMeta({
                    tokenOverrides: {
                      ...tokenOverrides,
                      colors: {
                        ...(tokenOverrides.colors ?? {}),
                        accent_burgundy: event.target.value,
                      },
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title-size">Tamanho título (px)</Label>
              <Input
                id="title-size"
                type="number"
                min={24}
                max={40}
                value={mergedTokens.typography.title_font_size_px}
                onChange={(event) =>
                  setCatalogMeta({
                    tokenOverrides: {
                      ...tokenOverrides,
                      typography: {
                        ...(tokenOverrides.typography ?? {}),
                        title_font_size_px: Number(event.target.value) || 30,
                      },
                    },
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
            <Button className="w-full sm:w-auto text-[10px] sm:text-xs uppercase tracking-widest h-10 sm:h-9" type="button" variant={coverEnabled ? "default" : "outline"} onClick={() => setCatalogMeta({ coverEnabled: !coverEnabled })}>
              {coverEnabled ? "Capa: On" : "Capa: Off"}
            </Button>
            <Button className="w-full sm:w-auto text-[10px] sm:text-xs uppercase tracking-widest h-10 sm:h-9" type="button" variant="outline" onClick={() => router.push("/upload")}>Add Imagens</Button>
            <Button className="w-full sm:w-auto text-[10px] sm:text-xs uppercase tracking-widest h-10 sm:h-9" type="button" variant="outline" onClick={() => setPreviewOpen(true)}>Ver PDF</Button>
            <Button className="w-full sm:w-auto text-[10px] sm:text-xs uppercase tracking-widest h-10 sm:h-9" type="button" onClick={handleProcessAi} disabled={isProcessingAi || isSaving || products.length === 0}>
              {isProcessingAi ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3" />}
              Processar IA
            </Button>
            <Button className="w-full sm:w-auto text-[10px] sm:text-xs uppercase tracking-widest h-10 sm:h-9" type="button" onClick={handleGeneratePdf} disabled={isGeneratingPdf || isSaving || products.length === 0}>
              {isGeneratingPdf ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <FileDown className="mr-2 h-3 w-3" />}
              Gerar PDF
            </Button>
            <Button className="w-full sm:w-auto text-[10px] sm:text-xs uppercase tracking-widest h-10 sm:h-9" type="button" variant="secondary" onClick={saveCatalog} disabled={isSaving}>
              {isSaving ? <Spinner className="mr-2 h-3 w-3" /> : null}
              Salvar
            </Button>
          </div>

          {aiStatus !== "idle" ? (
            <div className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span>Status IA: {aiStatus}</span>
                <span>{aiProgress}%</span>
              </div>
              <Progress value={aiProgress} />
              {aiJobId ? <p className="text-xs text-neutral-500">Job: {aiJobId}</p> : null}
            </div>
          ) : null}

          {statusMessage ? <p className="text-sm text-emerald-700">{statusMessage}</p> : null}
          {statusError ? <p className="text-sm text-red-700">{statusError}</p> : null}
        </CardContent>
      </Card>

      {isLoadingCatalog ? (
        <Card>
          <CardContent className="flex items-center gap-2 py-8 text-sm text-neutral-600">
            <Spinner />
            Carregando dados do catálogo...
          </CardContent>
        </Card>
      ) : null}

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-neutral-600">
            Nenhum produto carregado. Faça upload em <strong>/upload</strong> para começar.
          </CardContent>
        </Card>
      ) : (
        <section className="editor-grid gap-8 lg:gap-12 mt-8 lg:mt-12">
          {products
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((product, index) => (
              <Card key={product.id} className="anim-product-card overflow-hidden border-border bg-transparent shadow-none hover:border-foreground/30 transition-all duration-500">
                <CardHeader className="bg-neutral-50/50 pb-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-2">
                    <div>
                      <CardTitle className="text-base">Produto #{index + 1}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2">
                        <Badge>{product.ai_status}</Badge>
                        {product.ai_error ? <span className="text-red-700">{product.ai_error}</span> : null}
                      </CardDescription>
                    </div>
                    <div className="flex w-full sm:w-auto gap-1">
                      <Button className="flex-1 sm:flex-initial" type="button" variant="ghost" size="sm" onClick={() => reorderProduct(product.id, "up")}>↑</Button>
                      <Button className="flex-1 sm:flex-initial" type="button" variant="ghost" size="sm" onClick={() => reorderProduct(product.id, "down")}>↓</Button>
                      <Button className="flex-1 sm:flex-initial" type="button" variant="ghost" size="sm" onClick={() => removeProduct(product.id)}>Remover</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex h-56 items-center justify-center rounded border border-neutral-200 bg-neutral-50 p-4">
                    <img src={product.image_url} alt={`Produto ${index + 1}`} className="h-full w-full object-contain" />
                  </div>

                  <div className="space-y-1">
                    <Label>SKU</Label>
                    <Input value={product.sku} onChange={(event) => updateProduct(product.id, { sku: event.target.value })} />
                  </div>

                  <div className="space-y-1">
                    <Label>Tipo de produto</Label>
                    <Input
                      value={product.product_type}
                      onChange={(event) => updateProduct(product.id, { product_type: event.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Descrição</Label>
                    <Textarea
                      value={product.description}
                      onChange={(event) => updateProduct(product.id, { description: event.target.value })}
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label>Preço original</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={product.original_price}
                        onChange={(event) =>
                          updateProduct(product.id, {
                            original_price: Number(event.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Preço final</Label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={product.final_price}
                        onChange={(event) =>
                          updateProduct(product.id, {
                            final_price: Number(event.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Desconto calculado</Label>
                      <Input value={`${percentFormatter.format(product.discount_percent)}%`} readOnly />
                    </div>
                  </div>

                  <p className="text-xs text-neutral-500">
                    Visual comercial: {formatCurrencyBRL(product.final_price)}
                  </p>

                  <div className="space-y-1">
                    <Label>Tamanhos</Label>
                    <Input value={product.sizes} onChange={(event) => updateProduct(product.id, { sizes: event.target.value })} />
                  </div>
                </CardContent>
              </Card>
            ))}
        </section>
      )}

      <PdfPreviewModal open={previewOpen} onClose={() => setPreviewOpen(false)}>
        <CatalogPreview
          title={catalogTitle}
          products={products}
          coverEnabled={coverEnabled}
          tokens={mergedTokens}
        />
      </PdfPreviewModal>
    </div>
  );
}
