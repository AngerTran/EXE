import { PackageSearch } from "lucide-react";
import { Link } from "react-router";

export function AiNoAssetsNotice() {
  return (
    <div className="pt-3 border-t border-primary/10">
      <div className="ai-asset-not-found flex gap-3 rounded-xl px-3 py-3">
        <div className="shrink-0 w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
          <PackageSearch className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-foreground">
            Chưa tìm thấy asset phù hợp trên Chợ AssetBox
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Thử mô tả thêm từ khóa (RPG, tileset, pixel, 2D…) hoặc duyệt thủ công trên chợ.
          </p>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-0.5"
          >
            Khám phá Chợ Assets →
          </Link>
        </div>
      </div>
    </div>
  );
}
