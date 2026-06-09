import { useEffect, useId, useRef, useState } from "react";
import { cn } from "./ui/utils";

type BorderBeamProps = {
  className?: string;
  duration?: number;
};

type FrameDims = {
  /** Full border-box size (offsetWidth × offsetHeight) */
  width: number;
  height: number;
  radius: number;
  /** Half border width — stroke center sits on the CSS border line */
  inset: number;
  borderW: number;
};

function measureFrame(host: HTMLElement): FrameDims | null {
  const width = host.offsetWidth;
  const height = host.offsetHeight;
  if (width <= 0 || height <= 0) return null;

  const style = getComputedStyle(host);
  const borderW = parseFloat(style.borderTopWidth) || 1;
  const inset = borderW / 2;
  const outerR = parseFloat(style.borderTopLeftRadius) || 12;
  const maxR = Math.min((width - borderW) / 2, (height - borderW) / 2);
  const radius = Math.max(0, Math.min(outerR - inset, maxR));

  return { width, height, radius, inset, borderW };
}

/**
 * Light streak traveling along the host card border (pixel-aligned to border-box).
 */
export function BorderBeam({ className, duration = 4 }: BorderBeamProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/:/g, "");
  const glowId = `auth-beam-glow-${uid}`;
  const gradId = `auth-beam-grad-${uid}`;
  const [dims, setDims] = useState<FrameDims | null>(null);

  useEffect(() => {
    const host = svgRef.current?.parentElement;
    if (!host) return;

    const update = () => {
      const next = measureFrame(host);
      if (next) setDims(next);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  const path =
    dims &&
    (() => {
      const { width, height, radius, inset } = dims;
      return {
        x: inset,
        y: inset,
        w: Math.max(0, width - inset * 2),
        h: Math.max(0, height - inset * 2),
        radius,
        width,
        height,
      };
    })();

  const rectProps = path
    ? {
        x: path.x,
        y: path.y,
        width: path.w,
        height: path.h,
        rx: path.radius,
        ry: path.radius,
        fill: "none" as const,
        strokeLinecap: "round" as const,
        pathLength: 100,
      }
    : null;

  return (
    <svg
      ref={svgRef}
      className={cn("border-beam-svg", className)}
      viewBox={path ? `0 0 ${path.width} ${path.height}` : "0 0 1 1"}
      style={
        dims
          ? {
              top: -dims.borderW,
              left: -dims.borderW,
              width: dims.width,
              height: dims.height,
            }
          : undefined
      }
      aria-hidden
    >
      {rectProps && path && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--beam-grad-a)" />
              <stop offset="35%" stopColor="var(--beam-grad-b)" />
              <stop offset="50%" stopColor="var(--beam-grad-c)" />
              <stop offset="65%" stopColor="var(--beam-grad-d)" />
              <stop offset="100%" stopColor="var(--beam-grad-e)" />
            </linearGradient>
            <filter id={glowId} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect
            {...rectProps}
            stroke="var(--beam-trail-stroke)"
            strokeDasharray="14 86"
            className="border-beam-path border-beam-path--trail"
            filter={`url(#${glowId})`}
            style={{ animationDuration: `${duration}s` }}
          />
          <rect
            {...rectProps}
            stroke={`url(#${gradId})`}
            strokeDasharray="8 92"
            className="border-beam-path"
            style={{ animationDuration: `${duration}s` }}
          />
        </>
      )}
    </svg>
  );
}
