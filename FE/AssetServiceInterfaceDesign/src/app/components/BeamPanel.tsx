import * as React from "react";
import { BorderBeam } from "./BorderBeam";
import { cn } from "./ui/utils";

type BeamPanelProps = React.ComponentProps<"div"> & {
  /** false to disable; number for custom duration (seconds) */
  beam?: boolean | number;
  contentClassName?: string;
};

/**
 * Bordered panel with a light streak traveling along the perimeter.
 */
export function BeamPanel({
  className,
  beam = true,
  contentClassName,
  children,
  ...props
}: BeamPanelProps) {
  const duration = typeof beam === "number" ? beam : 4;

  return (
    <div className={cn("relative overflow-visible", className)} {...props}>
      <div className={cn("relative z-[1] h-full w-full", contentClassName)}>{children}</div>
      {beam !== false && <BorderBeam duration={duration} />}
    </div>
  );
}
