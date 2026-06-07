import { cn } from "./ui/utils";

const PLAN_BADGE: Record<
  string,
  { label: string; className: string }
> = {
  free: {
    label: "FREE",
    className: "bg-muted/80 text-muted-foreground border-border",
  },
  student: {
    label: "STUDENT",
    className: "bg-primary/15 text-primary border-primary/35",
  },
  indie: {
    label: "INDIE",
    className: "bg-secondary/15 text-secondary border-secondary/35",
  },
  pro: {
    label: "PRO",
    className: "bg-warning/20 text-warning border-warning/40",
  },
};

type SubscriptionPlanBadgeProps = {
  plan?: string | null;
  className?: string;
  title?: string;
};

export function SubscriptionPlanBadge({
  plan,
  className,
  title,
}: SubscriptionPlanBadgeProps) {
  const slug = (plan ?? "free").toLowerCase();
  const meta = PLAN_BADGE[slug] ?? PLAN_BADGE.free;

  return (
    <span
      className={cn(
        "px-2 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wide whitespace-nowrap",
        meta.className,
        className
      )}
      title={title ?? `Gói hiện tại: ${meta.label}`}
    >
      {meta.label}
    </span>
  );
}
