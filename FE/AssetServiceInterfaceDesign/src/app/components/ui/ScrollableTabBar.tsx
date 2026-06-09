import type { ReactNode } from "react";
import { cn } from "./utils";

export interface ScrollableTabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  badge?: number;
}

interface ScrollableTabBarProps {
  items: ScrollableTabItem[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}

/**
 * Horizontal tab bar with touch-friendly scroll + snap.
 * Matches native mobile tab patterns for future app reuse.
 */
export function ScrollableTabBar({
  items,
  activeId,
  onSelect,
  className,
  activeClassName = "bg-gradient-to-r from-[var(--cta-from)] to-[var(--cta-to)] text-primary-foreground shadow-[0_0_30px_rgba(0,217,255,0.3)]",
  inactiveClassName = "bg-white/95 dark:bg-card/70 backdrop-blur-lg text-muted-foreground border border-border hover:border-primary/50",
}: ScrollableTabBarProps) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-2 scroll-snap-x scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent",
        className
      )}
      role="tablist"
    >
      {items.map((tab) => {
        const isActive = activeId === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.id)}
            className={cn(
              "scroll-snap-item shrink-0 px-4 sm:px-6 py-3 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 min-h-[var(--touch-min)] text-sm font-medium",
              isActive ? activeClassName : inactiveClassName
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.badge != null && tab.badge > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-warning text-warning-foreground text-[10px] font-bold flex items-center justify-center">
                {tab.badge > 9 ? "9+" : tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
