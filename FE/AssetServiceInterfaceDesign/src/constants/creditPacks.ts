import type { CreditPackItem } from "../api/creditPacks";

export type CreditPack = {
  id: string;
  name?: string;
  credits: number;
  priceVnd: number;
  discountPercent?: number | null;
  sortOrder?: number;
  isActive?: boolean;
};

/** Fallback khi BE chưa sẵn sàng */
export const CREDIT_PACKS_FALLBACK: CreditPack[] = [
  { id: "pack-200", name: "Gói 200 xu", credits: 200, priceVnd: 29_000, sortOrder: 0 },
  { id: "pack-800", name: "Gói 800 xu", credits: 800, priceVnd: 79_000, discountPercent: 32, sortOrder: 1 },
  { id: "pack-1900", name: "Gói 1.900 xu", credits: 1_900, priceVnd: 150_000, discountPercent: 45, sortOrder: 2 },
];

export function mapCreditPackItem(item: CreditPackItem): CreditPack {
  return {
    id: item.id,
    name: item.name,
    credits: item.credits,
    priceVnd: item.priceVnd,
    discountPercent: item.discountPercent,
    sortOrder: item.sortOrder,
    isActive: item.isActive,
  };
}

export function sortCreditPacks(packs: CreditPack[]): CreditPack[] {
  return [...packs].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function getCreditPackById(packs: CreditPack[], id: string): CreditPack | undefined {
  return packs.find((p) => p.id === id);
}

export function getBaselineUnitPer100(packs: CreditPack[]): number {
  const base = sortCreditPacks(packs)[0] ?? CREDIT_PACKS_FALLBACK[0];
  return (base.priceVnd / base.credits) * 100;
}

export function formatUnitPricePer100(pack: CreditPack): string {
  const unit = (pack.priceVnd / pack.credits) * 100;
  return `${Math.round(unit).toLocaleString("vi-VN")} đ`;
}

export function formatPackPrice(pack: CreditPack): string {
  return `${pack.priceVnd.toLocaleString("vi-VN")}đ`;
}
