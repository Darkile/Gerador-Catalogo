"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { DesignTokenOverrides, EditableProductInput } from "@/lib/types";
import { calculateFinalPrice, normalizePricing } from "@/lib/price";

export type EditableProduct = EditableProductInput;

interface CatalogStoreState {
  catalogId: string | null;
  catalogTitle: string;
  coverEnabled: boolean;
  tokenOverrides: DesignTokenOverrides;
  products: EditableProduct[];
  uploadProgress: number;
  isUploading: boolean;
  aiJobId: string | null;
  aiStatus: "idle" | "queued" | "processing" | "completed" | "failed";
  setCatalogMeta: (payload: {
    catalogId?: string | null;
    catalogTitle?: string;
    coverEnabled?: boolean;
    tokenOverrides?: DesignTokenOverrides;
  }) => void;
  setProducts: (products: EditableProduct[]) => void;
  addProducts: (products: EditableProduct[]) => void;
  updateProduct: (productId: string, patch: Partial<EditableProduct>) => void;
  removeProduct: (productId: string) => void;
  reorderProduct: (productId: string, direction: "up" | "down") => void;
  setUploadState: (payload: { progress?: number; isUploading?: boolean }) => void;
  setAiState: (payload: { aiJobId?: string | null; aiStatus?: CatalogStoreState["aiStatus"] }) => void;
  resetAll: () => void;
}

function normalizePositions(products: EditableProduct[]) {
  return products
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((product, index) => ({ ...product, position: index }));
}

function normalizeProductPricing(product: EditableProduct, patch?: Partial<EditableProduct>) {
  const originalPrice = patch?.original_price ?? product.original_price;
  const finalPrice = patch?.final_price ?? (
    patch?.discount_percent !== undefined
      ? calculateFinalPrice(originalPrice, patch.discount_percent)
      : product.final_price
  );

  return normalizePricing(originalPrice, finalPrice);
}

const initialState = {
  catalogId: null,
  catalogTitle: "Coleção Inverno Gregory",
  coverEnabled: true,
  tokenOverrides: {},
  products: [] as EditableProduct[],
  uploadProgress: 0,
  isUploading: false,
  aiJobId: null,
  aiStatus: "idle" as const,
};

export const useCatalogStore = create<CatalogStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setCatalogMeta: ({ catalogId, catalogTitle, coverEnabled, tokenOverrides }) => {
        set((state) => ({
          catalogId: catalogId ?? state.catalogId,
          catalogTitle: catalogTitle ?? state.catalogTitle,
          coverEnabled: coverEnabled ?? state.coverEnabled,
          tokenOverrides: tokenOverrides ?? state.tokenOverrides,
        }));
      },
      setProducts: (products) => {
        const normalized = normalizePositions(
          products.map((product) => ({
            ...product,
            ...normalizePricing(product.original_price ?? 0, product.final_price ?? 0),
          })),
        );
        set({ products: normalized });
      },
      addProducts: (products) => {
        const merged = [
          ...get().products,
          ...products.map((product) => ({
            ...product,
            ...normalizePricing(product.original_price ?? 0, product.final_price ?? 0),
          })),
        ];
        set({ products: normalizePositions(merged) });
      },
      updateProduct: (productId, patch) => {
        const updated = get().products.map((product) => {
          if (product.id !== productId) {
            return product;
          }

          return {
            ...product,
            ...patch,
            ...normalizeProductPricing(product, patch),
          };
        });

        set({ products: updated });
      },
      removeProduct: (productId) => {
        const filtered = get().products.filter((product) => product.id !== productId);
        set({ products: normalizePositions(filtered) });
      },
      reorderProduct: (productId, direction) => {
        const current = [...get().products].sort((a, b) => a.position - b.position);
        const index = current.findIndex((product) => product.id === productId);

        if (index === -1) {
          return;
        }

        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= current.length) {
          return;
        }

        const [moved] = current.splice(index, 1);
        current.splice(targetIndex, 0, moved);
        set({ products: normalizePositions(current) });
      },
      setUploadState: ({ progress, isUploading }) => {
        set((state) => ({
          uploadProgress: progress ?? state.uploadProgress,
          isUploading: isUploading ?? state.isUploading,
        }));
      },
      setAiState: ({ aiJobId, aiStatus }) => {
        set((state) => ({
          aiJobId: aiJobId !== undefined ? aiJobId : state.aiJobId,
          aiStatus: aiStatus ?? state.aiStatus,
        }));
      },
      resetAll: () => {
        set(initialState);
      },
    }),
    {
      name: "gregory-catalog-draft",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        catalogId: state.catalogId,
        catalogTitle: state.catalogTitle,
        coverEnabled: state.coverEnabled,
        tokenOverrides: state.tokenOverrides,
        products: state.products,
      }),
    },
  ),
);
