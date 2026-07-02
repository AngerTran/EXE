import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  Search,
  Filter,
  Star,
  Download,
  User,
  ShoppingBag,
  ExternalLink,
  Loader2,
  Pencil,
  Trash2,
  X,
  Package,
} from "lucide-react";
import { toast } from "../../utils/notify";
import { ApiError } from "../../api/client";
import { deleteAsset, fetchMyAssetById } from "../../api/assets";
import { fetchCategories } from "../../api/lookup";
import { fetchSellerAssets } from "../../api/seller";
import {
  assetStatusClass,
  assetStatusLabel,
} from "../../api/seller";
import {
  getMarketplaceAssetDescription,
  getMarketplaceAssetFeatures,
  mapAssetDetail,
  mapAssetListItem,
  type MarketplaceAsset,
  type MarketplaceAssetDetail,
} from "../../api/mappers";
import type { CategoryItem } from "../../api/types/marketplace";
import { BeamPanel } from "./BeamPanel";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { AssetPreviewGallery } from "./AssetPreviewGallery";
import { XuPrice } from "./XuPrice";
import ClientPagination from "./ui/ClientPagination";
import { ConfirmActionDialog } from "./ui/ConfirmActionDialog";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { cn } from "./ui/utils";
import { componentClasses } from "../../constants/theme";

const CTA_GRADIENT = componentClasses.ctaGradient;
const CTA_GRADIENT_INTERACTIVE = componentClasses.ctaGradientInteractive;
const PAGE_SIZE = 12;

function canSellerEditAsset(status?: string): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "draft" || s === "pending_review" || s === "rejected";
}

interface SellerMyAssetsTabProps {
  sellerName: string;
  sellerUsername?: string;
}

export function SellerMyAssetsTab({ sellerName, sellerUsername }: SellerMyAssetsTabProps) {
  const [allAssets, setAllAssets] = useState<MarketplaceAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [priceFilter, setPriceFilter] = useState<"all" | "free" | "paid">("all");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [page, setPage] = useState(1);
  const [selectedAsset, setSelectedAsset] = useState<MarketplaceAsset | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<MarketplaceAssetDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const categoryNames = useMemo(
    () => ["Tất cả", ...categories.map((c) => c.name)],
    [categories]
  );

  const loadAssets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSellerAssets(1, 100);
      setAllAssets(res.assets.data.map(mapAssetListItem));
    } catch {
      toast.error("Không tải được danh sách asset");
      setAllAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAssets();
    void fetchCategories()
      .then(setCategories)
      .catch(() => undefined);
  }, [loadAssets]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, priceFilter, selectedCategory]);

  const filteredAssets = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allAssets.filter((asset) => {
      if (q && !asset.title.toLowerCase().includes(q)) return false;
      if (priceFilter === "free" && !asset.isFree) return false;
      if (priceFilter === "paid" && asset.isFree) return false;
      if (selectedCategory !== "Tất cả" && asset.category !== selectedCategory) return false;
      return true;
    });
  }, [allAssets, searchQuery, priceFilter, selectedCategory]);

  const pagedAssets = filteredAssets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const openDetail = async (asset: MarketplaceAsset) => {
    setSelectedAsset(asset);
    setSelectedDetail(null);
    setDetailLoading(true);
    try {
      const detail = await fetchMyAssetById(asset.id);
      setSelectedDetail(mapAssetDetail(detail));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Không tải được chi tiết");
      setSelectedAsset(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAsset(deleteTarget.id);
      toast.success("Đã xóa asset");
      setAllAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      if (selectedAsset?.id === deleteTarget.id) {
        setSelectedAsset(null);
        setSelectedDetail(null);
      }
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Xóa thất bại");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6" beam={4}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm asset của bạn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background/60 border border-border rounded-lg pl-12 pr-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex gap-2">
            {(["all", "free", "paid"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setPriceFilter(filter)}
                className={`px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                  priceFilter === filter
                    ? `${CTA_GRADIENT} shadow-[0_0_20px_rgba(0,217,255,0.3)]`
                    : "bg-card border border-border text-foreground/80 hover:border-primary/50"
                }`}
              >
                {filter === "all" ? "Tất cả" : filter === "free" ? "Miễn phí" : "Trả phí"}
              </button>
            ))}
          </div>
        </div>
      </BeamPanel>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        <div className="flex gap-3 pb-2">
          {categoryNames.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-lg whitespace-nowrap transition-all font-medium ${
                selectedCategory === category
                  ? `${CTA_GRADIENT} scale-105 shadow-[0_0_20px_rgba(0,217,255,0.4)]`
                  : "bg-white dark:bg-card border border-border text-foreground/80 hover:border-primary/50 font-semibold"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <p className="text-muted-foreground">
        <span className="font-bold text-primary font-mono">{filteredAssets.length}</span> asset của bạn
      </p>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Đang tải...</p>
        </div>
      ) : pagedAssets.length > 0 ? (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pagedAssets.map((asset) => (
              <SellerAssetCard
                key={asset.id}
                asset={asset}
                sellerName={sellerName}
                deleting={deleting && deleteTarget?.id === asset.id}
                onViewDetails={() => void openDetail(asset)}
                onDelete={() => setDeleteTarget({ id: asset.id, title: asset.title })}
              />
            ))}
          </div>
          {filteredAssets.length > PAGE_SIZE && (
            <ClientPagination page={page} pageSize={PAGE_SIZE} total={filteredAssets.length} onPageChange={setPage} />
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <Filter className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-foreground mb-2">Không tìm thấy asset</h3>
          <p className="text-muted-foreground mb-6">Thử đổi bộ lọc hoặc upload asset mới</p>
          <Link
            to="/seller/upload"
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold ${CTA_GRADIENT_INTERACTIVE}`}
          >
            <Package className="w-4 h-4" />
            Upload asset
          </Link>
        </div>
      )}

      <Sheet
        open={!!selectedAsset}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAsset(null);
            setSelectedDetail(null);
          }
        }}
      >
        {selectedAsset && (
          <SheetContent className="p-0 sm:max-w-2xl" hideCloseButton>
            <SellerAssetDetailDrawer
              asset={selectedAsset}
              detail={selectedDetail}
              detailLoading={detailLoading}
              sellerName={sellerName}
              sellerUsername={sellerUsername}
              deleting={deleting && deleteTarget?.id === selectedAsset.id}
              onDelete={() => setDeleteTarget({ id: selectedAsset.id, title: selectedAsset.title })}
              onClose={() => {
                setSelectedAsset(null);
                setSelectedDetail(null);
              }}
            />
          </SheetContent>
        )}
      </Sheet>

      <ConfirmActionDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
        title="Xóa asset?"
        description={
          <>
            Asset{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.title}</span> sẽ bị gỡ
            khỏi marketplace. Nếu chưa có ai mua, bản ghi sẽ bị xóa hẳn khỏi database.
          </>
        }
        confirmLabel="Xóa asset"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function SellerAssetCard({
  asset,
  sellerName,
  deleting,
  onViewDetails,
  onDelete,
}: {
  asset: MarketplaceAsset;
  sellerName: string;
  deleting: boolean;
  onViewDetails: () => void;
  onDelete: () => void;
}) {
  const thumbnailSrc =
    asset.thumbnailUrl ||
    `https://source.unsplash.com/400x300/?${encodeURIComponent(asset.preview)}`;
  const editable = canSellerEditAsset(asset.status);

  return (
    <BeamPanel
      beam={3.8}
      contentClassName="overflow-hidden rounded-xl"
      className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-xl hover:scale-105 transition-all group hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]"
    >
      <div
        className="relative aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden cursor-pointer"
        onClick={onViewDetails}
      >
        <ImageWithFallback
          src={thumbnailSrc}
          alt={asset.title}
          className="w-full h-full object-cover transform-gpu will-change-transform group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${CTA_GRADIENT} px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg`}>
            <ExternalLink className="w-4 h-4" />
            Xem chi tiết
          </div>
        </div>
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold border backdrop-blur-sm bg-background/90 ${assetStatusClass(asset.status ?? "approved")}`}
          >
            {assetStatusLabel(asset.status ?? "approved")}
          </span>
        </div>
        <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm text-foreground px-3 py-1 rounded-full text-xs flex items-center gap-1 font-mono">
          <Download className="w-3 h-3" />
          {asset.downloads}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
            {asset.title}
          </h3>
          <p className="text-sm text-muted-foreground">{asset.category}</p>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-warning text-warning" />
              Đánh giá
            </span>
            <span className="font-medium text-foreground font-mono">{asset.rating}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Tác giả
            </span>
            <span className="font-medium text-primary truncate max-w-[55%] text-right">{sellerName}</span>
          </div>
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShoppingBag className="w-4 h-4" />
              Giá
            </span>
            {asset.isFree ? (
              <span className="font-medium text-success">Miễn phí</span>
            ) : (
              <XuPrice amount={asset.price} size="sm" />
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-border flex gap-2">
          {editable ? (
            <Link
              to={`/seller/edit/${asset.id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-card hover:bg-card/80 border border-border hover:border-primary/50 text-foreground py-2.5 rounded-lg text-sm font-medium transition-all"
            >
              <Pencil className="w-4 h-4" />
              Sửa
            </Link>
          ) : (
            <button
              type="button"
              onClick={onViewDetails}
              className="flex-1 bg-card hover:bg-card/80 border border-border hover:border-primary/50 text-foreground py-2.5 rounded-lg text-sm font-medium transition-all"
            >
              Chi tiết
            </button>
          )}
          <button
            type="button"
            disabled={deleting}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 border border-destructive/40 text-destructive hover:bg-destructive/10 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Xóa
          </button>
        </div>
      </div>
    </BeamPanel>
  );
}

function SellerAssetDetailDrawer({
  asset,
  detail,
  detailLoading,
  sellerName,
  sellerUsername,
  deleting,
  onDelete,
  onClose,
}: {
  asset: MarketplaceAsset;
  detail: MarketplaceAssetDetail | null;
  detailLoading: boolean;
  sellerName: string;
  sellerUsername?: string;
  deleting: boolean;
  onDelete: () => void;
  onClose: () => void;
}) {
  const description = getMarketplaceAssetDescription(detail);
  const features = detail ? getMarketplaceAssetFeatures(detail) : [];
  const editable = canSellerEditAsset(asset.status);

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="border-b border-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 pr-2">
            <SheetTitle className="text-2xl font-bold text-foreground">{asset.title}</SheetTitle>
            <SheetDescription className="text-muted-foreground">
              by {sellerName}
              {sellerUsername && (
                <span className="text-muted-foreground/80"> · @{sellerUsername}</span>
              )}
            </SheetDescription>
            <span
              className={`inline-flex mt-2 px-2.5 py-0.5 rounded-full text-xs border ${assetStatusClass(asset.status ?? "approved")}`}
            >
              {assetStatusLabel(asset.status ?? "approved")}
            </span>
          </div>
          <SheetClose
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </SheetClose>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <AssetPreviewGallery
          images={detail?.previewImages ?? []}
          loading={detailLoading}
          assetTitle={asset.title}
        />

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Star className="w-5 h-5 fill-warning text-warning" />
              <span className="text-2xl font-bold">{asset.rating}</span>
            </div>
            <p className="text-sm text-muted-foreground">Đánh giá</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Download className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold font-mono">{asset.downloads}</span>
            </div>
            <p className="text-sm text-muted-foreground">Downloads</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="mb-2 flex justify-center">
              {asset.isFree ? (
                <span className="text-2xl font-bold text-success">Miễn phí</span>
              ) : (
                <XuPrice amount={asset.price} size="xl" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">Giá</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-foreground mb-3">Mô tả</h3>
          {detailLoading ? (
            <div className="h-20 bg-muted/30 rounded-lg animate-pulse" />
          ) : (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {description ?? "Chưa có mô tả"}
            </p>
          )}
        </div>

        {features.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">Tính năng</h3>
            <div className="flex flex-wrap gap-2">
              {features.map((f) => (
                <span key={f} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm border border-primary/20">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {asset.tags.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-foreground mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {asset.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-muted/50 text-muted-foreground text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-6 flex gap-3">
        {editable ? (
          <Link
            to={`/seller/edit/${asset.id}`}
            className={cn("flex-1 py-3 rounded-lg font-bold text-center", CTA_GRADIENT_INTERACTIVE)}
          >
            Sửa asset
          </Link>
        ) : (
          <p className="flex-1 text-sm text-muted-foreground self-center">
            Asset đã duyệt — xóa và upload lại nếu cần thay đổi lớn
          </p>
        )}
        <button
          type="button"
          disabled={deleting}
          onClick={onDelete}
          className="px-6 py-3 rounded-lg font-bold border border-destructive/40 text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          {deleting ? "Đang xóa..." : "Xóa"}
        </button>
      </div>
    </div>
  );
}
