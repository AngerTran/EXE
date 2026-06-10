import { cn } from "./ui/utils";

const SIZE = {
  sm: { num: "text-sm font-bold", unit: "text-xs" },
  md: { num: "text-base font-bold", unit: "text-sm" },
  lg: { num: "text-xl font-extrabold", unit: "text-base" },
  xl: { num: "text-2xl font-extrabold", unit: "text-lg" },
} as const;

export type XuPriceSize = keyof typeof SIZE;

export const xuPriceClass =
  "font-mono text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]";

type XuPriceProps = {
  amount: number;
  size?: XuPriceSize;
  className?: string;
};

export function XuPrice({ amount, size = "md", className }: XuPriceProps) {
  const s = SIZE[size];

  return (
    <span className={cn("inline-flex items-baseline gap-1 tabular-nums", xuPriceClass, className)}>
      <span className={s.num}>{amount.toLocaleString("vi-VN")}</span>
      <span className={cn(s.unit, "font-bold uppercase tracking-wide text-amber-200/95")}>xu</span>
    </span>
  );
}
