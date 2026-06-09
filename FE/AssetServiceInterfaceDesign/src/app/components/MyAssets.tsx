import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  Package,
  Download,
  Search,
  Filter,
  Calendar,
  Star,
  ExternalLink,
  FileText,
  Image,
  Music,
  Video,
  Folder,
  CheckCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../../utils/notify";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ClientPagination, getPageSlice } from "./ui/ClientPagination";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { fetchUserAssets, downloadUserAssetFile, removeUserAssetFromLibrary } from "../../api/userAssets";
import { mapUserAssetToUi, type PurchasedAssetUi } from "../../api/mappers";
import { ApiError } from "../../api/client";

function assetThumbnailSrc(asset: PurchasedAssetUi): string {
  if (asset.thumbnailUrl) return asset.thumbnailUrl;
  return `https://source.unsplash.com/400x300/?${encodeURIComponent(asset.title)}`;
}

export default function MyAssets() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [purchasedAssets, setPurchasedAssets] = useState<PurchasedAssetUi[]>([]);
  const [viewingAsset, setViewingAsset] = useState<PurchasedAssetUi | null>(null);
  const [assetToRemove, setAssetToRemove] = useState<PurchasedAssetUi | null>(null);
  const [removing, setRemoving] = useState(false);
  const [downloadProgressById, setDownloadProgressById] = useState<
    Record<string, number>
  >({});
  const downloadIntervalsRef = useRef<Record<string, number>>({});

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const items = await fetchUserAssets();
        if (!cancelled) setPurchasedAssets(items.map(mapUserAssetToUi));
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof ApiError ? error.message : "Không tải được thư viện");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    return () => {
      const ids = Object.keys(downloadIntervalsRef.current);
      ids.forEach((id) => {
        window.clearInterval(downloadIntervalsRef.current[id]);
      });
      downloadIntervalsRef.current = {};
    };
  }, []);

  const categories = [
    { id: "all", label: "Tất cả", icon: <Folder className="w-4 h-4" /> },
    { id: "2D Characters", label: "2D Characters", icon: <Image className="w-4 h-4" /> },
    { id: "2D Environments", label: "2D Environments", icon: <Image className="w-4 h-4" /> },
    { id: "UI/UX", label: "UI/UX", icon: <FileText className="w-4 h-4" /> },
    { id: "Sound Effects", label: "Sound Effects", icon: <Music className="w-4 h-4" /> },
    { id: "Music", label: "Music", icon: <Music className="w-4 h-4" /> },
    { id: "3D Models", label: "3D Models", icon: <Package className="w-4 h-4" /> },
    { id: "Animations", label: "Animations", icon: <Video className="w-4 h-4" /> },
  ];

  const filteredAssets = purchasedAssets.filter((asset) => {
    const matchesSearch = asset.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || asset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedCategory]);

  const pageSize = 12;
  const { paged: pagedAssets, totalPages } = getPageSlice(filteredAssets, page, pageSize);

  const handleDownload = async (asset: PurchasedAssetUi) => {
    if (downloadIntervalsRef.current[asset.id]) return;

    setDownloadProgressById((prev) => ({ ...prev, [asset.id]: 0 }));
    toast.message(`Đang tải "${asset.title}"...`);

    try {
      await downloadUserAssetFile(asset.id, `${asset.title.replace(/[^\w\s-]/g, "").trim() || "asset"}.zip`);
      setPurchasedAssets((prev) =>
        prev.map((a) =>
          a.id === asset.id ? { ...a, downloadCount: a.downloadCount + 1 } : a
        )
      );
      setDownloadProgressById((prev) => ({ ...prev, [asset.id]: 100 }));
      toast.success(`Đã tải "${asset.title}"`);

      window.setTimeout(() => {
        setDownloadProgressById((after) => {
          const { [asset.id]: _removed, ...rest } = after;
          return rest;
        });
      }, 400);
    } catch (error) {
      setDownloadProgressById((after) => {
        const { [asset.id]: _removed, ...rest } = after;
        return rest;
      });
      toast.error(error instanceof ApiError ? error.message : "Tải xuống thất bại");
    }
  };

  const handleConfirmRemove = async () => {
    if (!assetToRemove || removing) return;

    setRemoving(true);
    try {
      await removeUserAssetFromLibrary(assetToRemove.id);
      setPurchasedAssets((prev) => prev.filter((a) => a.id !== assetToRemove.id));
      if (viewingAsset?.id === assetToRemove.id) setViewingAsset(null);
      toast.success(`Đã xóa "${assetToRemove.title}" khỏi thư viện`);
      setAssetToRemove(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Không xóa được asset");
    } finally {
      setRemoving(false);
    }
  };

  const totalSpent = purchasedAssets.reduce((sum, asset) => sum + asset.price, 0);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-8">
            <Package className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Vui lòng đăng nhập
            </h2>
            <p className="text-muted-foreground mb-6">
              Đăng nhập để xem thư viện assets của bạn
            </p>
            <Link
              to="/auth"
              className="inline-block bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,217,255,0.5)]"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <Package className="w-8 h-8 text-primary" />
                Thư viện của tôi
              </h1>
              <p className="text-muted-foreground">
                Quản lý và tải xuống các assets bạn đã mua
              </p>
            </div>
            <Link
              to="/marketplace"
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(0,217,255,0.5)]"
            >
              Khám phá thêm
            </Link>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tổng assets</p>
                  <p className="text-2xl font-bold text-foreground font-mono">
                    {purchasedAssets.length}
                  </p>
                </div>
                <div className="bg-primary/20 border border-primary/30 p-3 rounded-lg">
                  <Package className="w-6 h-6 text-primary" />
                </div>
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tổng chi tiêu</p>
                  <p className="text-2xl font-bold text-foreground font-mono">
                    {totalSpent.toLocaleString("vi-VN")} xu
                  </p>
                </div>
                <div className="bg-success/20 border border-success/30 p-3 rounded-lg">
                  <Download className="w-6 h-6 text-success" />
                </div>
              </div>
            </div>
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Lượt tải</p>
                  <p className="text-2xl font-bold text-foreground font-mono">
                    {purchasedAssets.reduce(
                      (sum, asset) => sum + asset.downloadCount,
                      0
                    )}
                  </p>
                </div>
                <div className="bg-warning/20 border border-warning/30 p-3 rounded-lg">
                  <Star className="w-6 h-6 text-warning" />
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Tìm kiếm assets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Assets Grid */}
        {filteredAssets.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-12 max-w-md mx-auto">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">
                {purchasedAssets.length === 0
                  ? "Chưa có assets nào"
                  : "Không tìm thấy kết quả"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {purchasedAssets.length === 0
                  ? "Hãy khám phá marketplace để tìm assets phù hợp với dự án của bạn"
                  : "Thử tìm kiếm với từ khóa khác"}
              </p>
              <Link
                to="/marketplace"
                className="inline-block bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,217,255,0.5)]"
              >
                Đi tới Chợ Assets
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pagedAssets.map((asset) => (
              (() => {
                const progress = downloadProgressById[asset.id];
                const isDownloading = typeof progress === "number";

                return (
              <div
                key={asset.id}
                className="bg-card/50 backdrop-blur-sm border border-border rounded-xl overflow-hidden hover:scale-105 transition-all group hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]"
              >
                {/* Preview Image (match Marketplace card) */}
                <div
                  className="relative aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden cursor-pointer"
                  onClick={() => setViewingAsset(asset)}
                >
                  <ImageWithFallback
                    src={assetThumbnailSrc(asset)}
                    alt={asset.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg">
                      <ExternalLink className="w-4 h-4" />
                      Xem chi tiết
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                      <CheckCircle className="w-3 h-3" />
                      ĐÃ SỞ HỮU
                    </div>
                    {asset.isDelisted && (
                      <div className="bg-warning/90 text-warning-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        Ngừng bán
                      </div>
                    )}
                  </div>
                  <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm text-foreground px-3 py-1 rounded-full text-xs flex items-center gap-1 font-mono">
                    <Download className="w-3 h-3" />
                    {asset.downloadCount}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                      {asset.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{asset.category}</p>
                  </div>

                  {/* Purchased info (keep essentials) */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Mua ngày
                      </span>
                      <span className="font-medium text-foreground font-mono">
                        {asset.purchaseDate}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Folder className="w-4 h-4" />
                        File
                      </span>
                      <span className="font-medium text-foreground font-mono">
                        {asset.fileType} • {asset.fileSize}
                      </span>
                    </div>
                  </div>

                  {/* Actions (match Marketplace buttons) */}
                  <div className="pt-3 border-t border-border">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(asset)}
                        disabled={isDownloading}
                        className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 disabled:from-primary/50 disabled:to-secondary/50 text-primary-foreground py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,217,255,0.4)] disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <Download className="w-4 h-4" />
                        {isDownloading ? "Đang tải..." : "Tải xuống"}
                      </button>
                      <button
                        onClick={() => setViewingAsset(asset)}
                        className="flex-1 bg-card hover:bg-card/80 border border-border hover:border-primary/50 text-foreground py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Chi tiết
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAssetToRemove(asset)}
                      className="mt-2 w-full text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center justify-center gap-1 py-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa khỏi thư viện
                    </button>
                  </div>

                  {isDownloading && (
                    <div className="bg-card/50 border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                          Tiến trình tải
                        </span>
                        <span className="text-xs font-bold text-primary font-mono">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary h-full transition-all duration-300 shadow-[0_0_10px_rgba(0,217,255,0.35)]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
                );
              })()
            ))}
          </div>
        )}

        {filteredAssets.length > 0 && (
          <ClientPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      {/* Asset detail drawer (stay on MyAssets) */}
      <Sheet
        open={!!viewingAsset}
        onOpenChange={(open) => {
          if (!open) setViewingAsset(null);
        }}
      >
        {viewingAsset && (
          <SheetContent className="p-0 sm:max-w-2xl">
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b border-border p-6">
                <SheetTitle className="text-2xl font-bold text-foreground">
                  {viewingAsset.title}
                </SheetTitle>
                <SheetDescription className="text-muted-foreground">
                  Asset đã mua • {viewingAsset.category}
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Preview (match Marketplace layout) */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 border border-border">
                  <ImageWithFallback
                    src={assetThumbnailSrc(viewingAsset)}
                    alt={viewingAsset.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                      <CheckCircle className="w-4 h-4" />
                      ĐÃ SỞ HỮU
                    </div>
                    {viewingAsset.isDelisted && (
                      <div className="bg-warning/90 text-warning-foreground px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        Ngừng bán trên Chợ Assets
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats (keep only necessary for purchased asset) */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-card/50 border border-border rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Download className="w-5 h-5 text-primary" />
                      <span className="text-2xl font-bold text-foreground font-mono">
                        {viewingAsset.downloadCount}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Lượt tải</p>
                  </div>
                  <div className="bg-card/50 border border-border rounded-xl p-4 text-center">
                    <div className="mb-2">
                      <span className="text-2xl font-bold text-foreground font-mono">
                        {viewingAsset.fileSize}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Dung lượng</p>
                  </div>
                  <div className="bg-card/50 border border-border rounded-xl p-4 text-center">
                    <div className="mb-2">
                      <span className="text-2xl font-bold text-primary font-mono">
                        {viewingAsset.price === 0
                          ? "Miễn phí"
                          : `${viewingAsset.price.toLocaleString("vi-VN")} xu`}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">Giá</p>
                  </div>
                </div>

                {/* Description (shortened) */}
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-3">Mô tả</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Bạn đã mua <span className="text-foreground font-semibold">{viewingAsset.title}</span>. Đây là phiên bản đã cấp quyền sử dụng cho mục đích cá nhân và thương mại.
                  </p>
                </div>

                {/* Tags (keep minimal) */}
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-primary/10 border border-primary/30 text-primary rounded-full text-sm">
                      {viewingAsset.category}
                    </span>
                    <span className="px-3 py-1 bg-card border border-border text-foreground rounded-full text-sm hover:border-primary/50 transition-colors">
                      {viewingAsset.fileType}
                    </span>
                    <span className="px-3 py-1 bg-card border border-border text-foreground rounded-full text-sm hover:border-primary/50 transition-colors">
                      Mua ngày: {viewingAsset.purchaseDate}
                    </span>
                  </div>
                </div>

                {viewingAsset.isDelisted && (
                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                    <p className="text-foreground text-sm">
                      Asset này đã bị gỡ khỏi Chợ Assets nhưng bạn vẫn giữ quyền tải xuống vì đã mua trước đó.
                    </p>
                  </div>
                )}

                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                  <p className="text-foreground text-sm">
                    <strong>Lưu ý:</strong> Bạn có quyền sử dụng asset này cho dự án
                    cá nhân và thương mại. Không được phân phối lại hoặc bán asset này.
                  </p>
                </div>
              </div>

              <div className="border-t border-border p-6 space-y-3">
                <button
                  onClick={() => handleDownload(viewingAsset)}
                  disabled={typeof downloadProgressById[viewingAsset.id] === "number"}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 disabled:from-primary/50 disabled:to-secondary/50 text-primary-foreground py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                >
                  <Download className="w-5 h-5" />
                  {typeof downloadProgressById[viewingAsset.id] === "number"
                    ? "Đang tải..."
                    : "Tải xuống"}
                </button>
                <button
                  type="button"
                  onClick={() => setAssetToRemove(viewingAsset)}
                  className="w-full border border-border hover:border-destructive/50 text-muted-foreground hover:text-destructive py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Xóa khỏi thư viện
                </button>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      <AlertDialog
        open={!!assetToRemove}
        onOpenChange={(open) => {
          if (!open && !removing) setAssetToRemove(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa khỏi thư viện?</AlertDialogTitle>
            <AlertDialogDescription>
              {assetToRemove
                ? `"${assetToRemove.title}" sẽ bị gỡ khỏi thư viện của bạn. Hành động này không hoàn xu và không xóa asset trên hệ thống.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Hủy</AlertDialogCancel>
            <button
              type="button"
              onClick={handleConfirmRemove}
              disabled={removing}
              className="inline-flex items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {removing ? "Đang xóa..." : "Xóa"}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
