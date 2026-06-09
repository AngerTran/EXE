import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import {
  CheckCircle,
  ArrowLeft,
  Shield,
  Clock,
  AlertCircle,
  Package,
  Loader2,
  Coins,
  Library,
} from "lucide-react";
import { toast } from "../../utils/notify";
import { ApiError } from "../../api/client";
import { fetchCart, clearCart } from "../../api/cart";
import { createAssetOrder } from "../../api/orders";
import { fetchAssetById } from "../../api/assets";
import { mapAssetListItem, type MarketplaceAsset } from "../../api/mappers";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { componentClasses } from "../../constants/theme";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { BeamPanel } from "./BeamPanel";
import { UnlimitedXuIcon } from "./UnlimitedXuIcon";
import { formatWalletBalance } from "../../utils/helpers";

export default function AssetsCheckout() {
  const [searchParams] = useSearchParams();
  const assetIdsParam = searchParams.get("assets") || "";
  const buyNowAssetIds = useMemo(
    () => assetIdsParam.split(",").map((id) => id.trim()).filter(Boolean),
    [assetIdsParam]
  );
  const isFromCart = buyNowAssetIds.length === 0;

  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [selectedAssets, setSelectedAssets] = useState<MarketplaceAsset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  const walletBalance = user?.credits ?? 0;
  const isUnlimited = user?.isUnlimited ?? false;
  const totalPrice = selectedAssets.reduce(
    (sum, asset) => sum + (asset.isFree ? 0 : asset.price),
    0
  );
  const freeItemsCount = selectedAssets.filter((asset) => asset.isFree).length;
  const paidItemsCount = selectedAssets.length - freeItemsCount;
  const balanceAfterPurchase = walletBalance - totalPrice;
  const hasEnoughXu = isUnlimited || totalPrice === 0 || walletBalance >= totalPrice;
  const isFreeOnly = totalPrice === 0;
  const proNoCharge = isUnlimited && totalPrice > 0;

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingAssets(true);
      try {
        if (isFromCart) {
          const cart = await fetchCart();
          if (cart.items.length === 0) {
            navigate("/marketplace");
            return;
          }
          const mapped: MarketplaceAsset[] = cart.items.map((item) => ({
            id: item.assetId,
            title: item.asset.title,
            category: item.asset.categoryName,
            price: item.asset.isFree ? 0 : item.lineTotalVnd,
            rating: 0,
            downloads: 0,
            preview: item.asset.thumbnailUrl || item.asset.title,
            author: "",
            tags: [],
            isFree: item.asset.isFree,
            thumbnailUrl: item.asset.thumbnailUrl,
          }));
          if (!cancelled) setSelectedAssets(mapped);
        } else {
          const details = await Promise.all(
            buyNowAssetIds.map((id) => fetchAssetById(id))
          );
          const mapped = details.map(mapAssetListItem);
          if (mapped.length === 0) {
            navigate("/marketplace");
            return;
          }
          if (!cancelled) setSelectedAssets(mapped);
        }
      } catch {
        if (!cancelled) navigate("/marketplace");
      } finally {
        if (!cancelled) setLoadingAssets(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, assetIdsParam, navigate]);

  const handlePurchase = async () => {
    if (selectedAssets.length === 0 || !hasEnoughXu) return;
    setIsProcessing(true);

    try {
      await createAssetOrder(isFromCart ? undefined : buyNowAssetIds);

      try {
        await clearCart();
      } catch {
        /* cart có thể đã trống */
      }

      await refreshUserData();
      setIsProcessing(false);
      setShowSuccess(true);
      setTimeout(() => navigate("/my-assets"), 10000);
    } catch (error) {
      setIsProcessing(false);
      if (error instanceof ApiError && error.code === "insufficient_credits") {
        toast.error("Không đủ xu. Vui lòng nạp thêm hoặc đăng ký gói để nhận xu.");
        return;
      }
      toast.error(error instanceof ApiError ? error.message : "Mua asset thất bại");
    }
  };

  if (!user || loadingAssets) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (selectedAssets.length === 0) {
    return null;
  }

  if (showSuccess) {
    const successGridBg =
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMGQ5ZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI4YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyOGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==";

    return (
      <div className="relative min-h-screen flex items-center justify-center py-12 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: `url('${successGridBg}')` }}
        />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />

        <div className="relative max-w-lg w-full">
          <BeamPanel
            className={cn(componentClasses.card, "overflow-hidden hover:scale-100 p-0")}
            contentClassName="overflow-hidden rounded-2xl"
            beam={4}
          >
            <div className="p-8 pb-6 text-center">
              <div className="w-16 h-16 bg-success/20 border border-success/30 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-9 h-9 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                {isFreeOnly ? "Đã thêm vào thư viện" : "Mua thành công"}
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                Bạn đã {isFreeOnly ? "thêm vào thư viện" : "mua"}{" "}
                <span className="font-semibold text-foreground">{selectedAssets.length}</span> asset
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                {isFreeOnly ? (
                  <span className="text-success font-medium">Không trừ xu</span>
                ) : proNoCharge ? (
                  <span className="text-success font-medium">Gói Pro — không trừ xu</span>
                ) : (
                  <>
                    Đã trừ{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {totalPrice.toLocaleString("vi-VN")} xu
                    </span>
                  </>
                )}
              </p>
              <div className="bg-muted/30 border border-border rounded-xl p-4 text-left">
                <div className="flex items-center gap-2 text-foreground mb-1">
                  <Library className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold">Bước tiếp theo</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Vào <strong className="text-foreground">Thư viện</strong> và nhấn{" "}
                  <strong className="text-foreground">Tải xuống</strong> để lấy file về máy.
                </p>
              </div>
            </div>

            <div className="relative h-44 border-y border-border/60 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/25 via-secondary/20 to-primary/25" />
              <div
                className="absolute inset-0 opacity-40 mix-blend-overlay"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
              <div className="absolute inset-0 bg-background/55 backdrop-blur-[1px]" />
              <div className="relative z-10 flex h-full items-center justify-center gap-3 px-6 py-4">
                {selectedAssets.slice(0, 4).map((asset) => (
                  <div
                    key={asset.id}
                    className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-white/20 shadow-lg ring-1 ring-primary/20"
                    title={asset.title}
                  >
                    <ImageWithFallback
                      src={
                        asset.thumbnailUrl ||
                        `https://source.unsplash.com/200x200/?${encodeURIComponent(asset.preview)}`
                      }
                      alt={asset.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
                {selectedAssets.length > 4 && (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-primary/40 bg-card/80 text-sm font-bold text-primary">
                    +{selectedAssets.length - 4}
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 pt-6 text-center">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="gradient" asChild>
                  <Link to="/my-assets">Mở thư viện</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/orders">Lịch sử mua</Link>
                </Button>
              </div>
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-4">
                <Clock className="w-3.5 h-3.5" />
                Tự chuyển sang Thư viện sau 10 giây...
              </p>
            </div>
          </BeamPanel>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(componentClasses.page, "px-4")}>
      <div className="max-w-6xl mx-auto">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại Chợ Assets
        </Link>

        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2">
            <BeamPanel className={cn(componentClasses.card, "p-6 sm:p-8 hover:scale-100")} beam={4.2}>
              <h2 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
                {isFreeOnly ? (
                  <Library className="w-5 h-5 text-primary" />
                ) : (
                  <Package className="w-5 h-5 text-primary" />
                )}
                {isFreeOnly ? "Thêm vào thư viện" : "Xác nhận mua bằng xu"}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                {isFreeOnly
                  ? "Asset sẽ được lưu vào thư viện — tải file xuống máy sau tại trang Thư viện."
                  : "Xu trong ví sẽ được trừ ngay khi xác nhận."}
              </p>

              <div className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <Coins className="w-7 h-7 text-primary shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Số dư ví xu
                        </p>
                        <p className="text-xl font-bold text-foreground font-mono flex items-center gap-2 min-h-8">
                          {isUnlimited ? (
                            <UnlimitedXuIcon size="md" />
                          ) : (
                            formatWalletBalance(walletBalance)
                          )}
                        </p>
                      </div>
                    </div>
                    {totalPrice > 0 && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Cần thanh toán
                        </p>
                        <p className="text-xl font-bold text-primary font-mono">
                          {totalPrice.toLocaleString("vi-VN")} xu
                        </p>
                      </div>
                    )}
                  </div>
                  {proNoCharge && (
                    <p className="mt-3 text-xs text-success">
                      Gói Pro — mua asset trả phí không trừ xu trong ví.
                    </p>
                  )}
                  {totalPrice > 0 && hasEnoughXu && !isUnlimited && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Còn lại:{" "}
                      <span className="font-mono font-medium text-foreground">
                        {balanceAfterPurchase.toLocaleString("vi-VN")} xu
                      </span>
                    </p>
                  )}
                  {totalPrice > 0 && !hasEnoughXu && (
                    <p className="mt-3 text-xs text-destructive">
                      Thiếu {(totalPrice - walletBalance).toLocaleString("vi-VN")} xu.{" "}
                      <Link to="/pricing" className="underline font-medium">
                        Nâng cấp gói
                      </Link>
                    </p>
                  )}
                </div>

                {isFreeOnly ? (
                  <div className="bg-success/10 border border-success/25 rounded-xl p-5 flex items-start gap-3">
                    <Library className="w-8 h-8 text-success shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">
                        {selectedAssets.length} asset miễn phí
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Không trừ xu. Sau khi xác nhận, mở Thư viện để tải file ZIP về máy.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-secondary/10 border border-secondary/25 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Asset trả phí mua bằng <strong className="text-foreground">xu</strong>.
                      Asset trả bằng xu trong ví; gói subscription thanh toán chuyển khoản.
                    </p>
                  </div>
                )}

                <div className="bg-muted/20 border border-border rounded-xl p-4 flex items-start gap-3">
                  <Shield className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Giao dịch an toàn</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Asset xuất hiện ngay trong thư viện sau khi xác nhận.
                    </p>
                  </div>
                </div>

                <Button
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  onClick={handlePurchase}
                  disabled={isProcessing || !hasEnoughXu}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : isFreeOnly ? (
                    <>
                      <Library className="w-4 h-4" />
                      Thêm vào thư viện
                    </>
                  ) : (
                    `Mua bằng ${totalPrice.toLocaleString("vi-VN")} xu`
                  )}
                </Button>
              </div>
            </BeamPanel>
          </div>

          <div className="lg:col-span-1">
            <BeamPanel
              className={cn(
                componentClasses.card,
                "p-5 lg:sticky lg:top-24 hover:scale-100 flex flex-col"
              )}
              contentClassName="flex flex-col"
              beam={3.8}
            >
              <h3 className="text-base font-bold text-foreground mb-4">Đơn hàng</h3>

              <div className="space-y-3 max-h-[min(50vh,320px)] overflow-y-auto pr-1 mb-4">
                {selectedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className={cn(componentClasses.cardSimple, "p-3 flex gap-3 hover:scale-100")}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg overflow-hidden shrink-0">
                      <ImageWithFallback
                        src={`https://source.unsplash.com/200x200/?${encodeURIComponent(
                          asset.preview
                        )}`}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {asset.title}
                      </h4>
                      {asset.author && (
                        <p className="text-xs text-muted-foreground truncate">{asset.author}</p>
                      )}
                      <p
                        className={cn(
                          "text-xs font-semibold mt-1",
                          asset.isFree ? "text-success" : "text-foreground font-mono"
                        )}
                      >
                        {asset.isFree ? "Miễn phí" : `${asset.price.toLocaleString("vi-VN")} xu`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Số lượng</span>
                  <span className="text-foreground font-medium">{selectedAssets.length}</span>
                </div>
                {freeItemsCount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Miễn phí</span>
                    <span className="text-success font-medium">{freeItemsCount} (0 xu)</span>
                  </div>
                )}
                {paidItemsCount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Trả phí</span>
                    <span className="text-foreground font-mono">{paidItemsCount} asset</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-border">
                  <span className="font-semibold text-foreground">Tổng trừ xu</span>
                  <span className="text-lg font-bold text-primary font-mono">
                    {totalPrice.toLocaleString("vi-VN")} xu
                  </span>
                </div>
              </div>

              <div className="mt-4 bg-warning/10 border border-warning/25 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Tải file ZIP về máy tại trang Thư viện sau khi hoàn tất.
                </p>
              </div>
            </BeamPanel>
          </div>
        </div>
      </div>
    </div>
  );
}
