import { clamp } from "@/lib/utils";

export function calculateFinalPrice(
  originalPrice: number,
  discountPercent: number | null | undefined,
): number {
  const discount = clamp(discountPercent ?? 0, 0, 100);
  const final = originalPrice * (1 - discount / 100);
  return Math.round(final * 100) / 100;
}

export function formatCurrencyBRL(value: number | null | undefined): string {
  const normalized = Number.isFinite(value) ? Number(value) : 0;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(normalized);
}

export function parseNumberInput(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
