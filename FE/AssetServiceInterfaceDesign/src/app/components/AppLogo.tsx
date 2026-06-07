import { cn } from "./ui/utils";

export const APP_NAME = "AssetBox";
export const LOGO_ICON_SRC = "/images/logo-icon.png";

type AppLogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
};

const sizeConfig = {
  sm: { mark: "size-10 p-1", text: "text-sm", gap: "gap-2" },
  md: { mark: "size-[3.25rem] p-1 px-1.5", text: "text-lg", gap: "gap-2.5" },
  lg: { mark: "size-16 md:size-[4.5rem] p-2", text: "text-2xl md:text-[1.75rem]", gap: "gap-3" },
} as const;

export function AppLogo({
  size = "md",
  showText = true,
  className,
  iconClassName,
  textClassName,
}: AppLogoProps) {
  const cfg = sizeConfig[size];

  return (
    <span
      className={cn("app-logo inline-flex items-center", cfg.gap, className)}
      aria-label={showText ? undefined : APP_NAME}
      role={showText ? undefined : "img"}
    >
      <span className={cn("app-logo-mark shrink-0", cfg.mark)}>
        <img
          src={LOGO_ICON_SRC}
          alt=""
          aria-hidden
          className={cn(
            "max-h-full max-w-full object-contain object-center transition-transform duration-200 group-hover:scale-[1.03]",
            iconClassName,
          )}
        />
      </span>
      {showText && (
        <span className={cn("app-logo-wordmark whitespace-nowrap", cfg.text, textClassName)}>
          {APP_NAME}
        </span>
      )}
    </span>
  );
}
