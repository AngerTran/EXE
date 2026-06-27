import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Store,
  Package,
  Upload,
  Download,
  Clock,
  CheckCircle2,
  Coins,
  Loader2,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "../../utils/notify";
import { ApiError } from "../../api/client";
import { deleteAsset } from "../../api/assets";
import {
  assetStatusClass,
  assetStatusLabel,
  fetchSellerAssets,
  fetchSellerEarnings,
  fetchSellerMe,
  updateSellerProfile,
  type SellerMe,
} from "../../api/seller";
import { mapAssetListItem } from "../../api/mappers";
import { useAuth } from "../contexts/AuthContext";
import { BeamPanel } from "./BeamPanel";
import { ScrollableTabBar } from "./ui/ScrollableTabBar";
import ClientPagination from "./ui/ClientPagination";
import { XuPrice } from "./XuPrice";
import { componentClasses } from "../../constants/theme";
import { SellerMyAssetsTab } from "./SellerMyAssetsTab";

type Tab = "overview" | "assets" | "earnings" | "profile";

function canSellerEditAsset(status?: string): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "draft" || s === "pending_review" || s === "rejected";
}

function StatCard({
  label,
  value,
  icon,
  accent = "primary",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "primary" | "success" | "warning" | "secondary";
}) {
  const colors = {
    primary: "text-primary border-primary/30 bg-primary/10",
    success: "text-success border-success/30 bg-success/10",
    warning: "text-warning border-warning/30 bg-warning/10",
    secondary: "text-secondary border-secondary/30 bg-secondary/10",
  };
  return (
    <BeamPanel className="bg-white/95 dark:bg-card/70 border border-border rounded-xl p-5" beam={3.5}>
      <div className={`inline-flex p-2 rounded-lg border mb-3 ${colors[accent]}`}>{icon}</div>
      <p className="text-2xl font-bold text-foreground font-mono">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </BeamPanel>
  );
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [me, setMe] = useState<SellerMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [assetsPage, setAssetsPage] = useState(1);
  const [assetsTotal, setAssetsTotal] = useState(0);
  const [assets, setAssets] = useState<ReturnType<typeof mapAssetListItem>[]>([]);
  const [earningsPage, setEarningsPage] = useState(1);
  const [earningsTotal, setEarningsTotal] = useState(0);
  const [earnings, setEarnings] = useState<Awaited<ReturnType<typeof fetchSellerEarnings>> | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [profileWebsite, setProfileWebsite] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadMe = useCallback(async () => {
    const data = await fetchSellerMe();
    setMe(data);
    setProfileName(data.name);
    setProfileBio(data.bio ?? "");
    setProfileWebsite(data.sellerWebsiteUrl ?? "");
    return data;
  }, []);

  const reloadAssets = useCallback(async () => {
    const res = await fetchSellerAssets(assetsPage, 10);
    setAssets(res.assets.data.map(mapAssetListItem));
    setAssetsTotal(res.assets.total);
    await loadMe();
  }, [assetsPage, loadMe]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!cancelled) await loadMe();
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof ApiError ? error.message : "Không tải được Seller Hub");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMe]);

  useEffect(() => {
    if (activeTab !== "assets" && activeTab !== "overview") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchSellerAssets(assetsPage, 10);
        if (!cancelled) {
          setAssets(res.assets.data.map(mapAssetListItem));
          setAssetsTotal(res.assets.total);
        }
      } catch {
        if (!cancelled) toast.error("Không tải được danh sách asset");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, assetsPage]);

  useEffect(() => {
    if (activeTab !== "earnings") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchSellerEarnings(earningsPage, 15);
        if (!cancelled) {
          setEarnings(res);
          setEarningsTotal(res.items.total);
        }
      } catch {
        if (!cancelled) toast.error("Không tải được doanh thu");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, earningsPage]);

  const handleDeleteAsset = async (assetId: string, title: string) => {
    if (!window.confirm(`Xóa asset "${title}"? Hành động không hoàn tác.`)) return;
    setDeletingId(assetId);
    try {
      await deleteAsset(assetId);
      toast.success("Đã xóa asset");
      await reloadAssets();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Xóa thất bại");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const updated = await updateSellerProfile({
        name: profileName.trim() || undefined,
        bio: profileBio,
        sellerWebsiteUrl: profileWebsite,
      });
      setMe(updated);
      toast.success("Đã cập nhật hồ sơ seller");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Lưu thất bại");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading || !me) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = me.stats;

  return (
    <div className="min-h-screen py-8">
      <div className={componentClasses.container}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Store className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Seller Hub</h1>
            </div>
            <p className="text-muted-foreground">
              Xin chào, <span className="text-primary font-semibold">{user?.name}</span>
              {me.username && (
                <>
                  {" "}
                  ·{" "}
                  <Link to={`/creator/${me.username}`} className="text-primary hover:underline inline-flex items-center gap-1">
                    Trang creator <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </>
              )}
            </p>
          </div>
          <Link
            to="/seller/upload"
            className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-bold ${componentClasses.ctaGradientInteractive}`}
          >
            <Upload className="w-4 h-4" />
            Upload asset
          </Link>
        </div>

        <ScrollableTabBar
          activeId={activeTab}
          onSelect={(id) => setActiveTab(id as Tab)}
          items={[
            { id: "overview", label: "Tổng quan", icon: <Store className="w-4 h-4" /> },
            { id: "assets", label: "Asset của tôi", icon: <Package className="w-4 h-4" />, badge: stats.pendingReviewCount || undefined },
            { id: "earnings", label: "Doanh thu xu", icon: <Coins className="w-4 h-4" /> },
            { id: "profile", label: "Hồ sơ", icon: <Pencil className="w-4 h-4" /> },
          ]}
        />

        <div className="mt-8 space-y-8">
          {(activeTab === "overview" || activeTab === "assets") && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Tổng asset" value={stats.totalAssets} icon={<Package className="w-5 h-5" />} />
              <StatCard label="Đã duyệt" value={stats.approvedCount} icon={<CheckCircle2 className="w-5 h-5" />} accent="success" />
              <StatCard label="Chờ duyệt" value={stats.pendingReviewCount} icon={<Clock className="w-5 h-5" />} accent="warning" />
              <StatCard label="Tổng download" value={stats.totalDownloads} icon={<Download className="w-5 h-5" />} accent="secondary" />
            </div>
          )}

          {activeTab === "assets" && (
            <SellerMyAssetsTab sellerName={me.name} sellerUsername={me.username} />
          )}

          {activeTab === "overview" && (
            <BeamPanel className="bg-white/95 dark:bg-card/70 border border-border rounded-xl p-6" beam={3.8}>
              <h2 className="text-lg font-bold text-foreground mb-4">Doanh thu (xu)</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng bán</p>
                  <p className="text-xl font-bold font-mono text-foreground">{me.earnings.totalGrossXu} xu</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phí platform</p>
                  <p className="text-xl font-bold font-mono text-muted-foreground">-{me.earnings.totalPlatformFeeXu} xu</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bạn nhận</p>
                  <p className="text-xl font-bold font-mono text-success">{me.earnings.totalNetXu} xu</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">{me.earnings.saleCount} giao dịch bán</p>
            </BeamPanel>
          )}

          {activeTab === "overview" && (
            <BeamPanel className="bg-white/95 dark:bg-card/70 border border-border rounded-xl overflow-hidden" beam={3.8}>
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Asset đã upload</h2>
                {activeTab === "overview" && assetsTotal > 5 && (
                  <button type="button" onClick={() => setActiveTab("assets")} className="text-sm text-primary hover:underline">
                    Xem tất cả
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-muted-foreground">
                    <tr>
                      <th className="text-left p-4 font-medium">Tên</th>
                      <th className="text-left p-4 font-medium">Giá</th>
                      <th className="text-left p-4 font-medium">Download</th>
                      <th className="text-left p-4 font-medium">Trạng thái</th>
                      <th className="text-right p-4 font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.slice(0, 5).map((asset) => (
                      <tr key={asset.id} className="border-t border-border/60">
                        <td className="p-4 font-medium text-foreground">{asset.title}</td>
                        <td className="p-4">
                          {asset.isFree ? (
                            <span className="text-success">Miễn phí</span>
                          ) : (
                            <XuPrice amount={asset.price} size="sm" />
                          )}
                        </td>
                        <td className="p-4 font-mono">{asset.downloads}</td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs border ${assetStatusClass(asset.status ?? "approved")}`}>
                            {assetStatusLabel(asset.status ?? "approved")}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            {canSellerEditAsset(asset.status) ? (
                              <Link
                                to={`/seller/edit/${asset.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10"
                                title="Sửa asset"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Sửa
                              </Link>
                            ) : (
                              <span className="text-xs text-muted-foreground px-2" title="Asset đã duyệt — xóa và upload lại nếu cần thay đổi">
                                —
                              </span>
                            )}
                            <button
                              type="button"
                              disabled={deletingId === asset.id}
                              onClick={() => void handleDeleteAsset(asset.id, asset.title)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                              title="Xóa asset"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {assets.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          Chưa có asset.{" "}
                          <Link to="/seller/upload" className="text-primary hover:underline">
                            Upload ngay
                          </Link>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </BeamPanel>
          )}

          {activeTab === "earnings" && earnings && (
            <BeamPanel className="bg-white/95 dark:bg-card/70 border border-border rounded-xl overflow-hidden" beam={3.8}>
              <div className="p-6 border-b border-border grid sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng nhận</p>
                  <p className="text-2xl font-bold text-success font-mono">{earnings.summary.totalNetXu} xu</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Giao dịch</p>
                  <p className="text-2xl font-bold font-mono">{earnings.summary.saleCount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phí platform</p>
                  <p className="text-2xl font-bold font-mono text-muted-foreground">{earnings.summary.totalPlatformFeeXu} xu</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-muted-foreground">
                    <tr>
                      <th className="text-left p-4">Asset</th>
                      <th className="text-left p-4">Đơn</th>
                      <th className="text-right p-4">Gross</th>
                      <th className="text-right p-4">Net</th>
                      <th className="text-left p-4">Ngày</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.items.data.map((row) => (
                      <tr key={row.id} className="border-t border-border/60">
                        <td className="p-4">{row.assetTitle}</td>
                        <td className="p-4 font-mono text-xs">{row.orderCode}</td>
                        <td className="p-4 text-right font-mono">{row.grossXu}</td>
                        <td className="p-4 text-right font-mono text-success">{row.netXu}</td>
                        <td className="p-4 text-muted-foreground">{row.createdAt.split("T")[0]}</td>
                      </tr>
                    ))}
                    {earnings.items.data.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          Chưa có doanh thu từ bán asset
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {earningsTotal > 15 && (
                <div className="p-4 border-t border-border">
                  <ClientPagination page={earningsPage} pageSize={15} total={earningsTotal} onPageChange={setEarningsPage} />
                </div>
              )}
            </BeamPanel>
          )}

          {activeTab === "profile" && (
            <BeamPanel className="bg-white/95 dark:bg-card/70 border border-border rounded-xl p-6 max-w-2xl" beam={3.8}>
              <h2 className="text-lg font-bold text-foreground mb-6">Hồ sơ storefront</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Tên hiển thị</label>
                  <input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Bio</label>
                  <textarea
                    rows={4}
                    value={profileBio}
                    onChange={(e) => setProfileBio(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground resize-y"
                    placeholder="Giới thiệu về bạn và portfolio..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Website / Portfolio</label>
                  <input
                    value={profileWebsite}
                    onChange={(e) => setProfileWebsite(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground"
                    placeholder="https://..."
                  />
                </div>
                <button
                  type="button"
                  disabled={savingProfile}
                  onClick={() => void handleSaveProfile()}
                  className={`px-6 py-2.5 rounded-lg font-bold ${componentClasses.ctaGradientInteractive} disabled:opacity-60`}
                >
                  {savingProfile ? "Đang lưu..." : "Lưu hồ sơ"}
                </button>
              </div>
            </BeamPanel>
          )}
        </div>
      </div>
    </div>
  );
}
