import { useEffect, useMemo, useRef, useState } from "react";
import {
  Coins,
  CreditCard,
  History,
  Loader2,
  Save,
  Shield,
  ShoppingCart,
  Sparkles,
  Upload,
  User,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { componentClasses } from "../../constants/theme";
import { toast } from "../../utils/notify";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import {
  cancelSubscription,
  fetchMySubscription,
  fetchSubscriptionHistory,
} from "../../api/subscriptions";
import { fetchMyWalletTransactions } from "../../api/wallets";
import type { SubscriptionHistoryItem, SubscriptionMe, WalletTransaction } from "../../api/types/billing";
import { useAuth, getUserAvatarSrc } from "../contexts/AuthContext";
import { formatWalletBalance } from "../../utils/helpers";
import { UnlimitedXuIcon } from "./UnlimitedXuIcon";
import { BeamPanel } from "./BeamPanel";
import ClientPagination, { getPageSlice } from "./ui/ClientPagination";

const PROFILE_LIST_PAGE_SIZE = 5;
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

function formatSubscription(sub: string | null | undefined) {
  if (!sub || sub === "free") return "FREE";
  return sub.toUpperCase();
}

function subscriptionStatusLabel(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "active") return { label: "Đang hoạt động", className: "bg-success/20 text-success" };
  if (normalized === "cancelled" || normalized === "canceled") {
    return { label: "Đã hủy", className: "bg-destructive/20 text-destructive" };
  }
  if (normalized === "expired") return { label: "Hết hạn", className: "bg-muted text-muted-foreground" };
  return { label: status, className: "bg-warning/20 text-warning" };
}

function walletTxLabel(type: string) {
  switch (type) {
    case "AssetPurchase":
      return "Mua asset";
    case "AiUsage":
      return "Dùng AI";
    case "Bonus":
      return "Thưởng";
    case "Purchase":
      return "Nạp xu";
    case "Refund":
      return "Hoàn xu";
    case "SubscriptionGrant":
      return "Gói đăng ký";
    default:
      return type;
  }
}

export default function Profile() {
  const { user, updateProfile, refreshUserData } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [subscription, setSubscription] = useState<SubscriptionMe | null>(null);
  const [subHistory, setSubHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [subHistoryPage, setSubHistoryPage] = useState(1);
  const [subLoading, setSubLoading] = useState(true);
  const [cancellingSub, setCancellingSub] = useState(false);
  const [cancelSubDialogOpen, setCancelSubDialogOpen] = useState(false);

  const [walletTx, setWalletTx] = useState<WalletTransaction[]>([]);
  const [walletPage, setWalletPage] = useState(1);
  const [walletTotalPages, setWalletTotalPages] = useState(1);
  const [walletLoading, setWalletLoading] = useState(true);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setSubLoading(true);
      try {
        const [sub, history] = await Promise.all([
          fetchMySubscription().catch(() => null),
          fetchSubscriptionHistory().catch(() => []),
        ]);
        if (!cancelled) {
          setSubscription(sub);
          setSubHistory(history);
        }
      } finally {
        if (!cancelled) setSubLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setWalletLoading(true);
      try {
        const res = await fetchMyWalletTransactions(walletPage, PROFILE_LIST_PAGE_SIZE);
        if (!cancelled) {
          setWalletTx(res.data);
          setWalletTotalPages(Math.max(1, Math.ceil(res.total / res.pageSize)));
        }
      } catch {
        if (!cancelled) setWalletTx([]);
      } finally {
        if (!cancelled) setWalletLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, walletPage]);

  const subscriptionLabel = useMemo(() => {
    if (subscription?.planName) return subscription.planName.toUpperCase();
    if (subscription?.planSlug) return formatSubscription(subscription.planSlug);
    return formatSubscription(user?.subscription ?? "free");
  }, [subscription, user?.subscription]);

  const subscriptionExpiry = subscription?.expiredAt ?? user?.subscriptionExpiry;
  const canCancelSub =
    subscription?.status?.toLowerCase() === "active" &&
    subscription.planSlug &&
    subscription.planSlug !== "free";

  const avatarSrc = getUserAvatarSrc(user);

  if (!user) return null;

  const handlePickAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }
    if (file.size > 1_500_000) {
      toast.error("Ảnh quá lớn (tối đa 1.5MB)");
      return;
    }

    setUploadingAvatar(true);
    try {
      await updateProfile({ avatarFile: file });
      await refreshUserData();
      toast.success("Đã cập nhật avatar");
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Không upload được avatar";
      toast.error(msg);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      await updateProfile({ avatarUrl: "" });
      await refreshUserData();
      toast.message("Đã xoá avatar");
    } catch {
      toast.error("Không xoá được avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Tên không được để trống");
      return;
    }
    if (trimmed === user.name) {
      toast.message("Không có thay đổi để lưu");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ name: trimmed });
      await refreshUserData();
      toast.success("Đã cập nhật hồ sơ");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!canCancelSub) return;

    setCancellingSub(true);
    try {
      await cancelSubscription();
      await refreshUserData();
      const [sub, history] = await Promise.all([
        fetchMySubscription().catch(() => null),
        fetchSubscriptionHistory().catch(() => []),
      ]);
      setSubscription(sub);
      setSubHistory(history);
      setSubHistoryPage(1);
      setCancelSubDialogOpen(false);
      toast.success("Đã hủy gói đăng ký");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Không hủy được gói");
    } finally {
      setCancellingSub(false);
    }
  };

  const subStatus = subscription ? subscriptionStatusLabel(subscription.status) : null;

  const {
    paged: pagedSubHistory,
    totalPages: subHistoryTotalPages,
    page: safeSubHistoryPage,
  } = useMemo(
    () => getPageSlice(subHistory, subHistoryPage, PROFILE_LIST_PAGE_SIZE),
    [subHistory, subHistoryPage]
  );

  useEffect(() => {
    if (subHistoryPage !== safeSubHistoryPage) {
      setSubHistoryPage(safeSubHistoryPage);
    }
  }, [subHistoryPage, safeSubHistoryPage]);

  return (
    <div className={`${componentClasses.page} min-h-[calc(100dvh-8rem)]`}>
      <div className={`${componentClasses.container} space-y-6`}>
        {/* Hero — full width */}
        <BeamPanel
          className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6 sm:p-8 overflow-hidden relative"
          beam={4}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
            <div className="flex items-center gap-5 sm:gap-6 shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-primary/30 bg-card flex items-center justify-center shadow-[0_0_24px_rgba(0,217,255,0.15)]">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 lg:hidden">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{user.name}</h1>
                <p className="text-sm text-muted-foreground font-mono truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              <div className="hidden lg:block">
                <p className="text-sm text-primary font-medium mb-1">Hồ sơ người dùng</p>
                <h1 className="text-2xl xl:text-3xl font-bold text-foreground">{user.name}</h1>
                <p className="text-muted-foreground font-mono text-sm mt-1 truncate">{user.email}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/15 text-primary border border-primary/25">
                  {subscriptionLabel}
                </span>
                {subStatus && (
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${subStatus.className}`}>
                    {subStatus.label}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-secondary/15 text-secondary border border-secondary/25 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  {user.role.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-stretch lg:w-48 xl:w-56 shrink-0">
              <Link
                to="/orders"
                className="flex-1 lg:flex-none bg-gradient-to-r from-[var(--cta-from)] to-[var(--cta-to)] text-primary-foreground px-4 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Lịch sử mua
              </Link>
              <Link
                to="/pricing"
                className="flex-1 lg:flex-none bg-card border border-border hover:border-primary/50 text-foreground px-4 py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-primary" />
                Nâng cấp gói
              </Link>
            </div>
          </div>
        </BeamPanel>

        {/* Stat strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Xu trong ví",
              icon: <Coins className="w-5 h-5 text-warning" />,
              value: user.isUnlimited ? (
                <UnlimitedXuIcon size="md" />
              ) : (
                <span className="text-2xl font-bold font-mono tabular-nums">
                  {formatWalletBalance(user.credits, false)}
                </span>
              ),
            },
            {
              label: "Gói hiện tại",
              icon: <CreditCard className="w-5 h-5 text-primary" />,
              value: (
                <span className="text-xl font-bold text-primary font-mono">{subscriptionLabel}</span>
              ),
              sub: subscriptionExpiry
                ? `Hết hạn ${new Date(subscriptionExpiry).toLocaleDateString("vi-VN")}`
                : undefined,
            },
            {
              label: "Vai trò",
              icon: <Shield className="w-5 h-5 text-secondary" />,
              value: (
                <span className="text-xl font-bold font-mono">{user.role.toUpperCase()}</span>
              ),
            },
            {
              label: "AssetBox AI",
              icon: <Sparkles className="w-5 h-5 text-primary" />,
              value: (
                <Link to="/dashboard" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                  Mở chat <ChevronRight className="w-4 h-4" />
                </Link>
              ),
            },
          ].map((stat) => (
            <BeamPanel
              key={stat.label}
              className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-xl p-4 sm:p-5"
              beam={3.5}
            >
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                {stat.icon}
                {stat.label}
              </div>
              <div className="text-foreground">{stat.value}</div>
              {"sub" in stat && stat.sub && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">{stat.sub}</p>
              )}
            </BeamPanel>
          ))}
        </div>

        {/* Edit + quick actions */}
        <div className="grid lg:grid-cols-12 gap-6">
          <BeamPanel
            className="lg:col-span-8 bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6 sm:p-8"
            beam={4.2}
          >
            <h2 className="text-xl font-bold text-foreground mb-6">Thông tin cơ bản</h2>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-muted-foreground mb-3">
                  Avatar
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-border bg-card/50">
                  <div className="w-20 h-20 rounded-xl overflow-hidden border border-border bg-card flex items-center justify-center shrink-0">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                    <button
                      type="button"
                      onClick={handlePickAvatar}
                      disabled={uploadingAvatar}
                      className="bg-card hover:bg-card/80 border border-border hover:border-primary/50 text-foreground px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingAvatar ? "Đang tải..." : "Tải ảnh lên"}
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={!avatarSrc || uploadingAvatar}
                      className="bg-card hover:bg-card/80 border border-border text-muted-foreground px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Xoá
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground sm:ml-auto sm:max-w-[200px]">
                    Hiển thị trên header và hồ sơ. Tối đa 1.5MB.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
                <input
                  value={user.email}
                  disabled
                  className="w-full bg-background/50 border border-border rounded-lg px-4 py-2.5 text-muted-foreground font-mono text-sm opacity-90"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Tên hiển thị
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto sm:min-w-[200px] bg-gradient-to-r from-[var(--cta-from)] to-[var(--cta-to)] hover:brightness-95 disabled:opacity-50 text-primary-foreground px-8 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  {saving ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </BeamPanel>

          <BeamPanel
            className="lg:col-span-4 bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6 space-y-3"
            beam={3.8}
          >
            <h2 className="text-xl font-bold text-foreground mb-2">Truy cập nhanh</h2>
            {[
              { to: "/my-assets", label: "Thư viện assets", desc: "Assets đã mua & tải" },
              { to: "/marketplace", label: "Chợ Assets", desc: "Khám phá thêm" },
              { to: "/dashboard", label: "AssetBox AI", desc: "Chat tìm asset" },
              { to: "/orders", label: "Đơn hàng", desc: "Lịch sử thanh toán" },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-card/50 hover:border-primary/40 hover:bg-card transition-colors group"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
              </Link>
            ))}
          </BeamPanel>
        </div>

        <div className="grid xl:grid-cols-2 gap-6">
        <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6" beam={4.5}>
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Gói đăng ký
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Chi tiết gói hiện tại và lịch sử đăng ký từ hệ thống.
              </p>
            </div>
            {canCancelSub && (
              <button
                type="button"
                onClick={() => setCancelSubDialogOpen(true)}
                disabled={cancellingSub}
                className="bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-destructive px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Hủy gói
              </button>
            )}
          </div>

          {subLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {subscription ? (
                <div className="bg-card border border-border rounded-xl p-4 grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Tên gói</p>
                    <p className="font-bold text-foreground">{subscription.planName ?? subscription.planSlug ?? "Free"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Trạng thái</p>
                    <p className="font-bold text-foreground capitalize">{subscription.status}</p>
                  </div>
                  {subscription.startedAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Bắt đầu</p>
                      <p className="font-mono text-foreground">
                        {new Date(subscription.startedAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  )}
                  {subscription.creditsMonthly != null && (
                    <div>
                      <p className="text-sm text-muted-foreground">Xu/tháng</p>
                      <p className="font-mono text-foreground">
                        {subscription.isUnlimited ? "Không giới hạn" : subscription.creditsMonthly}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Bạn đang dùng gói miễn phí.</p>
              )}

              {subHistory.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Lịch sử gói
                  </p>
                  <div className="space-y-2">
                    {pagedSubHistory.map((item) => {
                      const st = subscriptionStatusLabel(item.status);
                      return (
                        <div
                          key={item.id}
                          className="bg-card border border-border/60 rounded-xl p-4 flex items-start justify-between gap-4 flex-wrap"
                        >
                          <div>
                            <p className="font-bold text-foreground">{item.planName}</p>
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              {new Date(item.startedAt).toLocaleDateString("vi-VN")}
                              {item.expiredAt
                                ? ` → ${new Date(item.expiredAt).toLocaleDateString("vi-VN")}`
                                : ""}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${st.className}`}>
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {subHistoryTotalPages > 1 && (
                    <ClientPagination
                      page={subHistoryPage}
                      totalPages={subHistoryTotalPages}
                      onPageChange={setSubHistoryPage}
                    />
                  )}
                </div>
              )}

              {!subscription && subHistory.length === 0 && (
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
                >
                  Xem các gói dịch vụ
                </Link>
              )}
            </div>
          )}
        </BeamPanel>

        <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6" beam={4.8}>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-2">
            <Coins className="w-5 h-5 text-warning" />
            Lịch sử xu
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Các giao dịch cộng/trừ xu trên ví của bạn.
          </p>

          {walletLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : walletTx.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">
              Chưa có giao dịch xu nào.
            </p>
          ) : (
            <div className="space-y-3">
              {walletTx.map((tx) => {
                const isCredit = tx.amount > 0;
                return (
                  <div
                    key={tx.id}
                    className="bg-card border border-border/60 rounded-xl p-4 flex items-start justify-between gap-4 flex-wrap"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-foreground">{walletTxLabel(tx.type)}</p>
                      {tx.description && (
                        <p className="text-sm text-muted-foreground mt-1 truncate">{tx.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {new Date(tx.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold font-mono ${
                          isCredit ? "text-success" : "text-destructive"
                        }`}
                      >
                        {isCredit ? "+" : ""}
                        {tx.amount} xu
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        Số dư: {tx.balanceAfter}
                      </p>
                    </div>
                  </div>
                );
              })}

              {walletTotalPages > 1 && (
                <ClientPagination page={walletPage} totalPages={walletTotalPages} onPageChange={setWalletPage} />
              )}
            </div>
          )}
        </BeamPanel>
        </div>
      </div>

      <AlertDialog
        open={cancelSubDialogOpen}
        onOpenChange={(open) => {
          if (!cancellingSub) setCancelSubDialogOpen(open);
        }}
      >
        <AlertDialogContent className="bg-card border-border sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 border border-destructive/30">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center text-foreground text-xl">
              Hủy gói đăng ký?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground text-center">
                <p>
                  Bạn sắp hủy gói{" "}
                  <span className="font-bold text-primary font-mono">{subscriptionLabel}</span>.
                </p>
                {subscriptionExpiry && (
                  <p>
                    Quyền lợi vẫn dùng được đến{" "}
                    <span className="font-semibold text-foreground">
                      {new Date(subscriptionExpiry).toLocaleDateString("vi-VN")}
                    </span>
                    .
                  </p>
                )}
                <p className="text-xs rounded-lg border border-warning/30 bg-warning/10 text-warning px-3 py-2 text-left">
                  Xu đã cấp không được hoàn lại. Sau khi hết hạn, tài khoản sẽ về gói Free.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2 sm:justify-center">
            <AlertDialogCancel disabled={cancellingSub} className="border-border hover:bg-muted/50">
              Giữ gói
            </AlertDialogCancel>
            <button
              type="button"
              onClick={() => void handleCancelSubscription()}
              disabled={cancellingSub}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {cancellingSub ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang hủy...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Xác nhận hủy gói
                </>
              )}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
