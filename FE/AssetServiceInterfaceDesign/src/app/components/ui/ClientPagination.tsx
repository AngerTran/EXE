import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "./utils";
import { componentClasses } from "../../../constants/theme";

const CTA = componentClasses.ctaGradient;

const PAGE_BTN =
  "inline-flex min-w-9 h-9 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-all";
const PAGE_IDLE =
  "text-foreground/80 hover:bg-white dark:hover:bg-card/80 hover:text-foreground border border-transparent hover:border-primary/40";
const PAGE_ACTIVE = `${CTA} shadow-[0_0_16px_rgba(0,217,255,0.35)] scale-105`;
const NAV_BTN =
  "inline-flex h-9 items-center gap-1 rounded-lg px-2.5 sm:px-3 text-sm font-semibold transition-all border border-border bg-white dark:bg-card/80 text-foreground/90 hover:border-primary/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

function range(from: number, to: number) {
  const out: number[] = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
}

export function getPageSlice<T>(items: T[], page: number, pageSize: number) {
  const safePageSize = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / safePageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * safePageSize;
  const end = start + safePageSize;
  return {
    page: safePage,
    pageSize: safePageSize,
    totalPages,
    paged: items.slice(start, end),
  };
}

export function ClientPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = useMemo(() => {
    if (totalPages <= 1) return [];
    if (totalPages <= 7) return range(1, totalPages);

    const out = new Set<number>();
    out.add(1);
    out.add(totalPages);
    out.add(page);
    out.add(page - 1);
    out.add(page + 1);
    out.add(page - 2);
    out.add(page + 2);

    return Array.from(out)
      .filter((p) => p >= 1 && p <= totalPages)
      .sort((a, b) => a - b);
  }, [page, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center pt-8">
      <nav
        role="navigation"
        aria-label="Phân trang"
        className="inline-flex items-center gap-1 rounded-xl border border-border bg-white/95 dark:bg-card/70 backdrop-blur-lg p-1.5 shadow-md shadow-black/5"
      >
        <button
          type="button"
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className={NAV_BTN}
        >
          <ChevronLeft className="size-4 shrink-0" />
          <span className="hidden sm:inline">Trước</span>
        </button>

        <div className="flex items-center gap-0.5 px-0.5">
          {pages.map((p, i) => {
            const prev = pages[i - 1];
            const showEllipsis = prev !== undefined && p - prev > 1;

            return (
              <span key={p} className="inline-flex items-center gap-0.5">
                {showEllipsis && (
                  <span className="px-1 text-muted-foreground text-sm select-none" aria-hidden>
                    …
                  </span>
                )}
                <button
                  type="button"
                  aria-label={`Trang ${p}`}
                  aria-current={p === page ? "page" : undefined}
                  onClick={() => onPageChange(p)}
                  className={cn(PAGE_BTN, p === page ? PAGE_ACTIVE : PAGE_IDLE)}
                >
                  {p}
                </button>
              </span>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Trang sau"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className={NAV_BTN}
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="size-4 shrink-0" />
        </button>
      </nav>
    </div>
  );
}

export default ClientPagination;
