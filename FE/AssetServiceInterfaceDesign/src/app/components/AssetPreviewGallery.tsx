import { useEffect, useState, type ReactNode } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "./ui/carousel";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { cn } from "./ui/utils";
import type { AssetImageItem } from "../../api/types/marketplace";

interface AssetPreviewGalleryProps {
  images: AssetImageItem[];
  loading?: boolean;
  assetTitle: string;
  overlay?: ReactNode;
  /** Gọi khi người dùng chuyển slide — dùng để chọn ảnh cần thay trong form admin */
  onActiveChange?: (index: number, image: AssetImageItem) => void;
}

export function AssetPreviewGallery({
  images,
  loading = false,
  assetTitle,
  overlay,
  onActiveChange,
}: AssetPreviewGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      const index = api.selectedScrollSnap();
      setCurrent(index);
      const image = images[index];
      if (image) onActiveChange?.(index, image);
    };
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, images, onActiveChange]);

  useEffect(() => {
    setCurrent(0);
    api?.scrollTo(0, true);
  }, [images, api]);

  if (loading) {
    return (
      <div
        className="w-full aspect-video rounded-xl bg-muted/30 animate-pulse border border-border"
        aria-hidden
      />
    );
  }

  if (images.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="relative px-10">
        {overlay && (
          <div className="pointer-events-none absolute top-3 left-12 z-10">{overlay}</div>
        )}
        <Carousel setApi={setApi} opts={{ loop: images.length > 1 }}>
          <CarouselContent className="-ml-2">
            {images.map((image, index) => (
              <CarouselItem key={image.id} className="pl-2 basis-full">
                <div className="relative w-full aspect-video rounded-xl border border-border bg-gradient-to-br from-primary/5 to-secondary/5 overflow-hidden">
                  <ImageWithFallback
                    src={image.storagePath}
                    alt={image.altText?.trim() || `${assetTitle} preview ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          {images.length > 1 && (
            <>
              <CarouselPrevious className="left-0 top-1/2 -translate-y-1/2 size-9 border-border bg-card/95 shadow-md hover:bg-card" />
              <CarouselNext className="right-0 top-1/2 -translate-y-1/2 size-9 border-border bg-card/95 shadow-md hover:bg-card" />
            </>
          )}
        </Carousel>
      </div>

      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 flex-wrap">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === current
                  ? "w-6 bg-primary"
                  : "w-2 bg-muted-foreground/35 hover:bg-muted-foreground/55"
              )}
              aria-label={`Xem ảnh ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
