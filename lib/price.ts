import { clamp } from "@/lib/utils";

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateFinalPrice(
  originalPrice: number,
  discountPercent: number | null | undefined,
): number {
  const normalizedOriginal = Math.max(0, Number(originalPrice) || 0);
  const discount = clamp(discountPercent ?? 0, 0, 100);
  const final = normalizedOriginal * (1 - discount / 100);
  return roundCurrency(final);
}

export function calculateDiscountPercent(
  originalPrice: number | null | undefined,
  finalPrice: number | null | undefined,
): number {
  const normalizedOriginal = Math.max(0, Number(originalPrice) || 0);
  if (normalizedOriginal <= 0) {
    return 0;
  }

  const normalizedFinal = clamp(Number(finalPrice) || 0, 0, normalizedOriginal);
  const discount = ((normalizedOriginal - normalizedFinal) / normalizedOriginal) * 100;
  return roundCurrency(discount);
}

export function normalizePricing(
  originalPrice: number | null | undefined,
  finalPrice: number | null | undefined,
) {
  const normalizedOriginal = roundCurrency(Math.max(0, Number(originalPrice) || 0));
  const normalizedFinal = roundCurrency(
    normalizedOriginal <= 0
      ? 0
      : clamp(Number(finalPrice) || 0, 0, normalizedOriginal),
  );

  return {
    original_price: normalizedOriginal,
    final_price: normalizedFinal,
    discount_percent: calculateDiscountPercent(normalizedOriginal, normalizedFinal),
  };
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
