import { cn } from "./ui/utils";

const UNLIMITED_XU_SRC = "/images/unlimited-xu.png";

type UnlimitedXuIconProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  title?: string;
};

const sizeClass = {
  sm: "h-5",
  md: "h-7",
  lg: "h-10",
} as const;

/** Infinity badge for Pro / unlimited xu wallet display. */
export function UnlimitedXuIcon({
  className,
  size = "sm",
  title = "Xu không giới hạn",
}: UnlimitedXuIconProps) {
  return (
    <img
      src={UNLIMITED_XU_SRC}
      alt={title}
      title={title}
      className={cn("w-auto object-contain shrink-0", sizeClass[size], className)}
    />
  );
}
