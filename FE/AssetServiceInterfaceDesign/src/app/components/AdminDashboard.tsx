import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";
import { Link, useSearchParams } from "react-router";
import { BeamPanel } from "./BeamPanel";
import {
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Search,
  Plus,
  DollarSign,
  UserCheck,
  Download,
  BarChart3,
  X,
  Save,
  AlertCircle,
  Activity,
  PieChart,
  CheckCircle,
  Clock,
  Loader2,
  Coins,
  Star,
  Upload,
  ImageIcon,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../../utils/notify";
import {
  isAssetOrderType,
  isBankTransferAwaitingConfirmation,
  isUnreportedBankTransferCheckout,
  orderTypeDisplayLabel,
} from "../../utils/orderType";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { AssetPreviewGallery } from "./AssetPreviewGallery";
import ClientPagination, { getPageSlice } from "./ui/ClientPagination";
import { ConfirmActionDialog } from "./ui/ConfirmActionDialog";
import { ScrollableTabBar } from "./ui/ScrollableTabBar";
import type { AssetRecord } from "../../types/asset";
import { LICENSE_OPTIONS, type AssetCategory } from "../../types/asset";
import { ART_STYLE_OPTIONS, type ArtStyleValue } from "../../constants/artStyles";
import {
  fetchAdminOverview,
  fetchAdminSubscriptionPlans,
  createAdminSubscriptionPlan,
  updateAdminSubscriptionPlan,
  deleteAdminSubscriptionPlan,
  hardDeleteAdminSubscriptionPlan,
  fetchAdminUsers,
  fetchAdminUserDetail,
  fetchAdminAssets,
  getAdminAssetUploadUrl,
  registerAdminAssetImage,
  updateAdminUser,
  deleteAdminUser,
  updateAdminAsset,
  deleteAdminAsset,
  fetchAdminAnalyticsRevenue,
  fetchAdminAnalyticsUsers,
  fetchAdminAnalyticsAssets,
  fetchAdminAnalyticsOrders,
  fetchAdminAnalyticsAiUsage,
} from "../../api/admin";
import type {
  AdminAnalyticsAiUsage,
  AdminAnalyticsAssets,
  AdminAnalyticsOrders,
  AdminAnalyticsRevenue,
  AdminAnalyticsUsers,
  AdminOverview,
  AdminUser,
  AdminUserDetail,
} from "../../api/types/admin";
import {
  buildAdminUpdateBody,
  mapAssetDetailToEditRecord,
} from "../../api/adminAssetEdit";
import { fetchCategories, fetchTagGroups } from "../../api/lookup";
import type { AssetImageItem, CategoryItem, TagGroupItem } from "../../api/types/marketplace";
import {
  fetchAdminCreditPacks,
  createAdminCreditPack,
  updateAdminCreditPack,
  deleteAdminCreditPack,
  hardDeleteAdminCreditPack,
  type CreditPackItem,
} from "../../api/creditPacks";
import type { SubscriptionPlan } from "../../api/types/billing";
import {
  emptyPlanDraft,
  PLAN_SLUG_OPTIONS,
  SUBSCRIPTION_PLAN_TEMPLATES,
  type PlanSlug,
  type SubscriptionPlanDraft,
  hasPaidSubscription,
} from "../../constants/subscriptionPlanTemplates";
import { CREDIT_PACKS_FALLBACK } from "../../constants/creditPacks";
import { fetchAllOrders, updateOrderStatus } from "../../api/orders";
import type { Order as CommerceOrder } from "../../api/types/commerce";
import { ApiError } from "../../api/client";
import { componentClasses } from "../../constants/theme";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import {
  approveAsset as apiApproveAsset,
  rejectAsset as apiRejectAsset,
  fetchAssetById,
  fetchPendingAssets,
  uploadToSignedUrl,
} from "../../api/assets";
import { mapAssetListItem } from "../../api/mappers";
import {
  AreaChart,
  Area,
  ComposedChart,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  type TooltipProps,
} from "recharts";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

type Tab = "overview" | "users" | "assets" | "orders" | "packages";

const PLAN_CHART_COLORS: Record<string, string> = {
  free: "#64748b",
  student: "#00d9ff",
  indie: "#a855f7",
  pro: "#f59e0b",
};

const CHART_BAR_CURSOR = { fill: "rgba(148, 163, 184, 0.07)" } as const;

/** Tooltip tối — màu chữ inline để không bị light-mode CSS ghi đè. */
function AdminChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  const displayLabel =
    labelFormatter != null && label != null ? labelFormatter(label, payload) : label;

  return (
    <div
      className="admin-chart-tooltip"
      style={{
        backgroundColor: "#0f172a",
        border: "1px solid #334155",
        borderRadius: 8,
        padding: "8px 12px",
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
      }}
    >
      {displayLabel != null && String(displayLabel) !== "" && (
        <p style={{ color: "#f8fafc", fontWeight: 600, margin: "0 0 6px", fontSize: 12 }}>
          {displayLabel}
        </p>
      )}
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
        {payload.map((entry, index) => {
          const formatted = formatter
            ? formatter(entry.value as number, entry.name ?? "", entry, index, payload)
            : null;
          const [valueText, nameText] = Array.isArray(formatted)
            ? formatted
            : [entry.value, entry.name];
          const accent = (entry.color as string) || "#e2e8f0";

          return (
            <li key={`${String(entry.dataKey)}-${index}`} style={{ fontSize: 12, lineHeight: 1.45 }}>
              <span style={{ color: "#cbd5e1" }}>{nameText}</span>
              <span style={{ color: "#64748b" }}>: </span>
              <span style={{ color: accent, fontWeight: 600 }}>{valueText}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function normalizeUserPlanKey(subscription?: string): string {
  const raw = (subscription ?? "free").toLowerCase().trim();
  if (!raw || raw === "free" || raw.includes("miễn phí") || raw.includes("mien phi")) return "free";
  if (raw.includes("student")) return "student";
  if (raw.includes("indie")) return "indie";
  if (raw.includes("pro")) return "pro";
  return raw;
}

const USER_PLAN_LABELS: Record<string, string> = {
  free: "Miễn phí",
  student: "STUDENT",
  indie: "INDIE",
  pro: "PRO",
};

function orderTypeStatLabel(orderType: string): string {
  const key = orderType.toLowerCase().replace(/_/g, "");
  if (key === "subscription") return "Gói đăng ký";
  if (key === "creditpack") return "Nạp xu";
  if (key === "asset") return "Mua asset";
  return orderType;
}

function analyticsRangeDays(days: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}

function formatChartDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatVndShort(vnd: number): string {
  if (vnd >= 1_000_000) return `${(vnd / 1_000_000).toFixed(1)}tr`;
  if (vnd >= 1_000) return `${Math.round(vnd / 1_000)}k`;
  return vnd.toLocaleString("vi-VN");
}

interface UserData {
  id: string;
  email: string;
  name: string;
  credits: number;
  role: string;
  status: string;
  registeredAt: string;
  totalSpent: number;
  subscription?: "student" | "indie" | "pro";
  subscriptionLabel?: string;
  subscriptionExpiry?: string; // ISO date string
  avatarDataUrl?: string | null;
}

function mapAdminUserToUserData(u: AdminUser | AdminUserDetail): UserData {
  const planLabel = u.subscriptionPlan ?? undefined;
  const slug = planLabel?.toLowerCase();
  const knownSubs = ["student", "indie", "pro"] as const;
  const subscription = knownSubs.find((s) => slug === s || slug?.includes(s));
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    credits: u.walletBalance,
    role: u.role,
    status: u.status,
    registeredAt: u.createdAt.split("T")[0],
    totalSpent: u.totalSpentVnd,
    subscription,
    subscriptionLabel: planLabel,
  };
}

const USER_STATUS_LABELS: Record<string, string> = {
  active: "Hoạt động",
  banned: "Đã khóa",
  pending: "Chờ duyệt",
};

interface Order {
  id: string;
  orderCode: string;
  userId: string;
  userName: string;
  userEmail?: string;
  orderType: string;
  items: string[];
  totalVnd: number;
  totalXu: number;
  status: "completed" | "pending" | "cancelled";
  date: string;
  transferReportedAt?: string | null;
}

function mapApiOrderToAdmin(o: CommerceOrder): Order {
  return {
    id: o.id,
    orderCode: o.orderCode,
    userId: o.userId ?? "",
    userName: o.userName ?? o.userEmail ?? o.items[0]?.itemName ?? "—",
    userEmail: o.userEmail ?? undefined,
    orderType: o.orderType,
    items: o.items.map((i) => i.itemName),
    totalVnd: o.totalVnd,
    totalXu: o.totalXu,
    status: o.status.toLowerCase() as Order["status"],
    date: o.createdAt.split("T")[0],
    transferReportedAt: o.transferReportedAt ?? null,
  };
}

function orderNeedsAdminConfirmation(order: Order): boolean {
  return isBankTransferAwaitingConfirmation(order);
}

function formatAdminOrderAmount(order: Order): string {
  if (isAssetOrderType(order.orderType)) {
    return `${order.totalXu.toLocaleString("vi-VN")} xu`;
  }
  return `${order.totalVnd.toLocaleString("vi-VN")}đ`;
}

function orderStatusBadgeClass(status: Order["status"]): string {
  if (status === "completed") return componentClasses.badgeSuccess;
  if (status === "pending") return componentClasses.badgeWarning;
  return componentClasses.badgeDestructive;
}

function orderStatusLabel(status: Order["status"]): string {
  if (status === "completed") return "Hoàn thành";
  if (status === "pending") return "Chờ xác nhận CK";
  return "Đã hủy";
}

function orderTypeLabel(orderType: string): string {
  return orderTypeDisplayLabel(orderType);
}

interface AssetData extends Pick<
  AssetRecord,
  "id" | "title" | "category" | "price" | "rating" | "downloads" | "isFree"
> {}

const ADMIN_TABS: Tab[] = ["overview", "users", "assets", "orders", "packages"];

function tabFromSearchParams(params: URLSearchParams): Tab {
  const raw = params.get("tab");
  return ADMIN_TABS.includes(raw as Tab) ? (raw as Tab) : "overview";
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>(() => tabFromSearchParams(searchParams));
  const [searchQuery, setSearchQuery] = useState("");

  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === "overview") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab }, { replace: true });
    }
  };

  useEffect(() => {
    setActiveTab(tabFromSearchParams(searchParams));
  }, [searchParams]);

  // Admin data from BE
  const [users, setUsers] = useState<UserData[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [packages, setPackages] = useState<SubscriptionPlan[]>([]);
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [marketplaceAssets, setMarketplaceAssets] = useState<AssetData[]>([]);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<AdminAnalyticsRevenue | null>(null);
  const [usersAnalytics, setUsersAnalytics] = useState<AdminAnalyticsUsers | null>(null);
  const [assetsAnalytics, setAssetsAnalytics] = useState<AdminAnalyticsAssets | null>(null);
  const [ordersAnalytics, setOrdersAnalytics] = useState<AdminAnalyticsOrders | null>(null);
  const [aiUsageAnalytics, setAiUsageAnalytics] = useState<AdminAnalyticsAiUsage | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const reloadPackagesFromApi = async () => {
    try {
      const plans = await fetchAdminSubscriptionPlans();
      setPackages([...plans].sort((a, b) => a.sortOrder - b.sortOrder));
    } catch {
      toast.error("Không tải được danh sách gói dịch vụ");
    }
  };

  const reloadOrdersFromApi = useCallback(async () => {
    try {
      const ordersRes = await fetchAllOrders(1, 100);
      setOrders(ordersRes.data.map(mapApiOrderToAdmin));
    } catch {
      /* im lặng khi poll nền — lỗi lớn đã toast ở load dashboard */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setDashboardLoading(true);
      try {
        const range = analyticsRangeDays(7);
        const userRange = analyticsRangeDays(30);
        const [
          overviewRes,
          usersRes,
          ordersRes,
          plans,
          assetsRes,
          pendingRes,
          revenueRes,
          usersAnalyticsRes,
          assetsAnalyticsRes,
          ordersAnalyticsRes,
          aiUsageRes,
        ] = await Promise.all([
          fetchAdminOverview(),
          fetchAdminUsers(1, 100),
          fetchAllOrders(1, 100),
          fetchAdminSubscriptionPlans(),
          fetchAdminAssets(1, 100, "approved"),
          fetchPendingAssets(1, 100),
          fetchAdminAnalyticsRevenue(range.from, range.to),
          fetchAdminAnalyticsUsers(userRange.from, userRange.to),
          fetchAdminAnalyticsAssets(),
          fetchAdminAnalyticsOrders(),
          fetchAdminAnalyticsAiUsage(range.from, range.to),
        ]);
        if (cancelled) return;

        setOverview(overviewRes);
        setRevenueAnalytics(revenueRes);
        setUsersAnalytics(usersAnalyticsRes);
        setAssetsAnalytics(assetsAnalyticsRes);
        setOrdersAnalytics(ordersAnalyticsRes);
        setAiUsageAnalytics(aiUsageRes);

        setUsers(usersRes.data.map(mapAdminUserToUserData));

        setOrders(ordersRes.data.map(mapApiOrderToAdmin));

        setPackages([...plans].sort((a, b) => a.sortOrder - b.sortOrder));

        const approved = assetsRes.data.map(mapAssetListItem);
        const pending = pendingRes.data.map(mapAssetListItem);
        const toAssetData = (a: ReturnType<typeof mapAssetListItem>): AssetData => ({
          id: a.id,
          title: a.title,
          category: a.category as AssetCategory,
          price: a.price,
          rating: a.rating,
          downloads: a.downloads,
          isFree: a.isFree,
        });
        setMarketplaceAssets(approved.map(toAssetData));
        setAssets([...pending, ...approved].map(toAssetData));
      } catch {
        toast.error("Không tải được dữ liệu admin. Vui lòng thử lại.");
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Đơn pending có thể tạo sau khi dashboard load — poll để khớp badge thông báo
  useEffect(() => {
    if (!user || user.role !== "admin") return;

    void reloadOrdersFromApi();
    const timer = window.setInterval(() => void reloadOrdersFromApi(), 30_000);

    const onVisible = () => {
      if (document.visibilityState === "visible") void reloadOrdersFromApi();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [user, reloadOrdersFromApi]);

  useEffect(() => {
    if (activeTab === "orders") void reloadOrdersFromApi();
  }, [activeTab, reloadOrdersFromApi]);

  useEffect(() => {
    const reload = async () => {
      try {
        const [assetsRes, pendingRes] = await Promise.all([
          fetchAdminAssets(1, 100, "approved"),
          fetchPendingAssets(1, 100),
        ]);
        const approved = assetsRes.data.map(mapAssetListItem);
        const pending = pendingRes.data.map(mapAssetListItem);
        const toAssetData = (a: ReturnType<typeof mapAssetListItem>): AssetData => ({
          id: a.id,
          title: a.title,
          category: a.category as AssetCategory,
          price: a.price,
          rating: a.rating,
          downloads: a.downloads,
          isFree: a.isFree,
        });
        setMarketplaceAssets(approved.map(toAssetData));
        setAssets([...pending, ...approved].map(toAssetData));
      } catch {
        /* ignore */
      }
    };
    const handler = () => reload();
    window.addEventListener("assetsUpdated", handler);
    return () => window.removeEventListener("assetsUpdated", handler);
  }, []);

  useEffect(() => {
    if (activeTab === "packages") {
      reloadPackagesFromApi();
    }
  }, [activeTab]);

  const completedSubscriptionOrders =
    ordersAnalytics?.byType.find((t) => t.orderType === "subscription")?.count ??
    orders.filter((o) => o.status === "completed" && o.orderType === "subscription").length;
  const completedCreditPackOrders =
    ordersAnalytics?.byType.find((t) => t.orderType === "credit_pack")?.count ??
    orders.filter((o) => o.status === "completed" && o.orderType === "credit_pack").length;

  const stats = [
    {
      label: "Tổng người dùng",
      value: overview?.totalUsers ?? users.filter((u) => u.role === "customer").length,
      icon: <Users className="w-6 h-6" />,
      color: "from-primary to-primary/80",
      change: `${overview?.activeUsers ?? 0} hoạt động`,
      detail: `${users.filter((u) => hasPaidSubscription(u.subscription)).length} có subscription`,
    },
    {
      label: "Tổng Assets",
      value: overview?.totalAssets ?? marketplaceAssets.length,
      icon: <Package className="w-6 h-6" />,
      color: "from-secondary to-secondary/80",
      change: `${overview?.pendingAssets ?? 0} chờ duyệt`,
      detail: `${marketplaceAssets.filter((a) => a.isFree).length} miễn phí · ${marketplaceAssets.filter((a) => !a.isFree).length} trả phí`,
    },
    {
      label: "Đơn hàng",
      value: overview?.totalOrders ?? orders.length,
      icon: <ShoppingCart className="w-6 h-6" />,
      color: "from-success to-success/80",
      change: `${orders.filter((o) => o.status === "completed").length} hoàn thành`,
      detail: `${orders.filter(orderNeedsAdminConfirmation).length} chờ xác nhận CK`,
    },
    {
      label: "Doanh thu",
      value: formatVndShort(overview?.revenueVnd ?? revenueAnalytics?.totalRevenueVnd ?? 0),
      icon: <DollarSign className="w-6 h-6" />,
      color: "from-warning to-warning/80",
      change: `${formatVndShort(revenueAnalytics?.totalRevenueVnd ?? 0)} / 7 ngày`,
      detail: `${completedSubscriptionOrders} gói dịch vụ · ${completedCreditPackOrders} nạp xu`,
    },
  ];

  return (
    <div className="min-h-screen py-6 sm:py-8">
      <div className={componentClasses.container}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Xin chào, <span className="font-bold text-primary">{user?.name}</span>
              </p>
            </div>
          </div>

          <ScrollableTabBar
            activeId={activeTab}
            onSelect={(id) => selectTab(id as Tab)}
            items={[
              { id: "overview", label: "Tổng quan", icon: <BarChart3 className="w-4 h-4" /> },
              { id: "users", label: "Người dùng", icon: <Users className="w-4 h-4" /> },
              { id: "assets", label: "Assets", icon: <Package className="w-4 h-4" /> },
              {
                id: "orders",
                label: "Đơn hàng",
                icon: <ShoppingCart className="w-4 h-4" />,
                badge: orders.filter(orderNeedsAdminConfirmation).length,
              },
              { id: "packages", label: "Gói dịch vụ", icon: <CreditCard className="w-4 h-4" /> },
            ]}
          />
        </div>

        {/* Content */}
        {activeTab === "overview" && (
          <OverviewTab
            stats={stats}
            orders={orders}
            assets={assets}
            users={users}
            revenueAnalytics={revenueAnalytics}
            usersAnalytics={usersAnalytics}
            assetsAnalytics={assetsAnalytics}
            ordersAnalytics={ordersAnalytics}
            aiUsageAnalytics={aiUsageAnalytics}
            loading={dashboardLoading}
          />
        )}

        {activeTab === "users" && (
          <UsersManagement
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setOverviewUsers={setUsers}
          />
        )}

        {activeTab === "assets" && (
          <AssetsManagement
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            assets={assets}
            setAssets={setAssets}
          />
        )}

        {activeTab === "orders" && (
          <OrdersManagement
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            orders={orders}
            setOrders={setOrders}
            users={users}
            onReload={reloadOrdersFromApi}
          />
        )}

        {activeTab === "packages" && (
          <div className="space-y-8">
            <PackagesManagement
              packages={packages}
              setPackages={setPackages}
              onReload={reloadPackagesFromApi}
            />
            <CreditPacksManagement />
          </div>
        )}

      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({
  stats,
  orders,
  assets,
  users,
  revenueAnalytics,
  usersAnalytics,
  assetsAnalytics,
  ordersAnalytics,
  aiUsageAnalytics,
  loading,
}: {
  stats: Array<{
    label: string;
    value: string | number;
    icon: ReactNode;
    color: string;
    change: string;
    detail?: string;
  }>;
  orders: Order[];
  assets: AssetData[];
  users: UserData[];
  revenueAnalytics: AdminAnalyticsRevenue | null;
  usersAnalytics: AdminAnalyticsUsers | null;
  assetsAnalytics: AdminAnalyticsAssets | null;
  ordersAnalytics: AdminAnalyticsOrders | null;
  aiUsageAnalytics: AdminAnalyticsAiUsage | null;
  loading: boolean;
}) {
  const revenueData =
    revenueAnalytics?.byDay.map((d) => ({
      date: formatChartDay(d.date),
      revenue: Math.round(d.count / 1000),
      revenueVnd: d.count,
    })) ?? [];

  const packageCounts = users.reduce<Record<string, number>>((acc, u) => {
    const key = normalizeUserPlanKey(u.subscription);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const packageData = Object.entries(packageCounts).map(([slug, value]) => ({
    id: `pkg-${slug}`,
    name: USER_PLAN_LABELS[slug] ?? slug.toUpperCase(),
    value,
    color: PLAN_CHART_COLORS[slug] ?? "#64748b",
  }));

  const subscriptionPurchases = (ordersAnalytics?.purchasesByPlan ?? []).filter(
    (p) => p.category === "subscription"
  );
  const creditPackPurchases = (ordersAnalytics?.purchasesByPlan ?? []).filter(
    (p) => p.category === "credit_pack"
  );
  const purchaseChartData = subscriptionPurchases.map((p) => ({
    name: p.itemName,
    count: p.count,
    revenueVnd: p.revenueVnd,
    color: PLAN_CHART_COLORS[p.planSlug ?? ""] ?? "#64748b",
  }));
  const completedByType = ordersAnalytics?.byType ?? [];

  const userGrowthData =
    usersAnalytics?.registrationsByDay.map((d) => ({
      date: formatChartDay(d.date),
      users: d.count,
    })) ?? [];

  const assetsByCategory =
    assetsAnalytics?.byCategory.map((c) => ({
      category: c.categoryName,
      count: c.assetCount,
    })) ??
    assets.reduce(
      (acc, asset) => {
        const existing = acc.find((item) => item.category === asset.category);
        if (existing) existing.count++;
        else acc.push({ category: asset.category, count: 1 });
        return acc;
      },
      [] as { category: string; count: number }[]
    );

  const orderStatusSummary =
    ordersAnalytics?.byStatus.map((s) => `${s.status}: ${s.count}`).join(" · ") ?? "";

  const aiUsageByDay =
    aiUsageAnalytics?.byDay.map((d) => ({
      date: formatChartDay(d.date),
      messages: d.messages,
      xu: d.xuCharged,
      tokens: d.tokens,
    })) ?? [];

  const aiUsageByUser =
    aiUsageAnalytics?.byUser
      .map((u) => ({
        name: (u.userName || u.email).split("@")[0],
        fullName: u.userName || u.email,
        messages: u.messageCount,
        xu: u.totalXuCharged,
        tokens: u.totalTokens,
      }))
      .filter((u) => u.xu > 0) ?? [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <BeamPanel
            key={stat.label}
            beam={3.5 + index * 0.2}
            className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6 hover:scale-105 transition-all hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`bg-gradient-to-r ${stat.color} p-3 rounded-xl text-primary-foreground shadow-lg`}
              >
                {stat.icon}
              </div>
              <span className="text-success text-sm font-bold">
                {stat.change}
              </span>
            </div>
            <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-foreground font-mono">{stat.value}</p>
            {stat.detail && (
              <p className="text-sm text-muted-foreground mt-1">{stat.detail}</p>
            )}
          </BeamPanel>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6 hover:border-primary/50 transition-all" beam={4.8}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Doanh thu 7 ngày qua
            </h3>
            <span className="text-muted-foreground text-sm font-mono">
              {formatVndShort(revenueAnalytics?.totalRevenueVnd ?? 0)}
            </span>
          </div>
          {revenueData.length === 0 ? (
            <p className="text-muted-foreground text-sm py-16 text-center">Chưa có doanh thu trong khoảng này.</p>
          ) : (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00d9ff" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#00d9ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" unit="k" />
              <Tooltip
                content={<AdminChartTooltip />}
                formatter={(value: number, _name, item) => [
                  `${(item.payload.revenueVnd as number).toLocaleString("vi-VN")}đ`,
                  "Doanh thu",
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#00d9ff"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </BeamPanel>

        {/* Package Distribution Pie Chart */}
        <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6 hover:border-primary/50 transition-all" beam={5}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <PieChart className="w-5 h-5 text-secondary" />
              Gói đang dùng (user)
            </h3>
            <span className="text-xs text-muted-foreground">Theo subscription hiện tại</span>
          </div>
          {packageData.length === 0 ? (
            <p className="text-muted-foreground text-sm py-16 text-center">Chưa có dữ liệu user.</p>
          ) : (
          <ResponsiveContainer width="100%" height={250}>
            <RePieChart>
              <Pie
                data={packageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                isAnimationActive={false}
              >
                {packageData.map((entry) => (
                  <Cell key={entry.id} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<AdminChartTooltip />} />
            </RePieChart>
          </ResponsiveContainer>
          )}
        </BeamPanel>
      </div>

      {/* Purchased packages */}
      <div className="grid lg:grid-cols-2 gap-6">
        <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6" beam={4.9}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Gói đăng ký đã mua
            </h3>
            <span className="text-xs text-muted-foreground">Đơn hoàn thành</span>
          </div>
          {completedByType.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {completedByType.map((t) => (
                <span
                  key={t.orderType}
                  className="text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-foreground"
                >
                  {orderTypeStatLabel(t.orderType)}:{" "}
                  <strong className="text-primary">{t.count}</strong>
                </span>
              ))}
            </div>
          )}
          {purchaseChartData.length === 0 ? (
            <p className="text-muted-foreground text-sm py-12 text-center">
              Chưa có đơn gói đăng ký hoàn thành.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={purchaseChartData} barCategoryGap="20%" maxBarSize={56}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" allowDecimals={false} width={32} />
                <Tooltip
                  content={<AdminChartTooltip />}
                  cursor={CHART_BAR_CURSOR}
                  formatter={(value: number) => [value, "Số đơn"]}
                  labelFormatter={(label) => `Gói ${label}`}
                />
                <Bar dataKey="count" name="Số đơn" radius={[8, 8, 0, 0]} activeBar={{ opacity: 0.85 }}>
                  {purchaseChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </BeamPanel>

        <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6" beam={5}>
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Coins className="w-5 h-5 text-warning" />
            Chi tiết gói đã mua
          </h3>
          {(ordersAnalytics?.purchasesByPlan ?? []).length === 0 ? (
            <p className="text-muted-foreground text-sm py-12 text-center">Chưa có dữ liệu mua gói.</p>
          ) : (
            <>
              <div className="md:hidden space-y-2">
                {[...subscriptionPurchases, ...creditPackPurchases].map((row) => (
                  <div
                    key={`${row.category}-${row.itemName}`}
                    className={componentClasses.listCard}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {row.category === "subscription" ? "Đăng ký" : "Nạp xu"}
                        </p>
                        <p className="font-medium text-foreground truncate">{row.itemName}</p>
                      </div>
                      <p className="font-mono text-sm text-primary shrink-0">
                        {row.revenueVnd.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 font-mono">
                      {row.count} đơn hoàn thành
                    </p>
                  </div>
                ))}
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-left">
                      <th className="pb-2 pr-3 font-medium">Loại</th>
                      <th className="pb-2 pr-3 font-medium">Tên gói</th>
                      <th className="pb-2 pr-3 font-medium text-right">Số lượng</th>
                      <th className="pb-2 font-medium text-right">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionPurchases.map((row) => (
                      <tr key={`sub-${row.itemName}`} className="border-b border-border/50">
                        <td className="py-2.5 pr-3 text-muted-foreground">Đăng ký</td>
                        <td className="py-2.5 pr-3 font-medium text-foreground">{row.itemName}</td>
                        <td className="py-2.5 pr-3 text-right font-mono">{row.count}</td>
                        <td className="py-2.5 text-right font-mono">
                          {row.revenueVnd.toLocaleString("vi-VN")}đ
                        </td>
                      </tr>
                    ))}
                    {creditPackPurchases.map((row) => (
                      <tr key={`credit-${row.itemName}`} className="border-b border-border/50">
                        <td className="py-2.5 pr-3 text-muted-foreground">Nạp xu</td>
                        <td className="py-2.5 pr-3 font-medium text-foreground">{row.itemName}</td>
                        <td className="py-2.5 pr-3 text-right font-mono">{row.count}</td>
                        <td className="py-2.5 text-right font-mono">
                          {row.revenueVnd.toLocaleString("vi-VN")}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </BeamPanel>
      </div>

      {/* AI Usage */}
      <div className="grid lg:grid-cols-2 gap-6">
        <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6 hover:border-primary/50 transition-all" beam={5.1}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              AssetBox AI (7 ngày)
            </h3>
            <span className="text-muted-foreground text-sm font-mono">
              {aiUsageAnalytics?.totalXuCharged ?? 0} xu · {aiUsageAnalytics?.totalMessages ?? 0} tin
            </span>
          </div>
          {aiUsageByDay.length === 0 ? (
            <p className="text-muted-foreground text-sm py-16 text-center">Chưa có dữ liệu AI trong khoảng này.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <ComposedChart data={aiUsageByDay}>
                <defs>
                  <linearGradient id="colorAiXu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" allowDecimals={false} />
                <Tooltip
                  content={<AdminChartTooltip />}
                  formatter={(value: number, name: string) => [
                    value,
                    name === "xu" ? "Xu tiêu" : name === "messages" ? "Tin AI" : "Token",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="xu"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAiXu)"
                />
                <Line type="monotone" dataKey="messages" stroke="#00d9ff" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
          <p className="text-xs text-muted-foreground mt-3">
            {aiUsageAnalytics?.activeSessions ?? 0} phiên · ~{aiUsageAnalytics?.totalTokens ?? 0} token ước tính
          </p>
        </BeamPanel>

        <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6 hover:border-primary/50 transition-all" beam={5.15}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Coins className="w-5 h-5 text-secondary" />
              Top user dùng AI
            </h3>
            <span className="text-xs text-muted-foreground">Theo xu tiêu</span>
          </div>
          {aiUsageByUser.length === 0 ? (
            <p className="text-muted-foreground text-sm py-16 text-center">Chưa có user dùng AI.</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={aiUsageByUser}
                layout="vertical"
                margin={{ left: 4, right: 20, top: 4, bottom: 4 }}
                barCategoryGap="18%"
                maxBarSize={28}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#64748b"
                  allowDecimals={false}
                  domain={[0, "dataMax"]}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#64748b"
                  width={108}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  content={<AdminChartTooltip />}
                  cursor={CHART_BAR_CURSOR}
                  formatter={(value: number, name: string) => {
                    if (name === "Xu tiêu") return [`${value} xu`, "Xu tiêu"];
                    return [value, name];
                  }}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullName ?? _
                  }
                />
                <Bar
                  dataKey="xu"
                  name="Xu tiêu"
                  fill="#a855f7"
                  radius={[0, 8, 8, 0]}
                  activeBar={{ fill: "#c084fc" }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </BeamPanel>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6 hover:border-primary/50 transition-all" beam={5.2}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Tăng trưởng người dùng (30 ngày)
            </h3>
            <span className="text-muted-foreground text-sm font-mono">
              {usersAnalytics?.totalUsers ?? 0} tổng
            </span>
          </div>
          {userGrowthData.length === 0 ? (
            <p className="text-muted-foreground text-sm py-16 text-center">Chưa có đăng ký mới.</p>
          ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" allowDecimals={false} />
              <Tooltip content={<AdminChartTooltip />} />
              <Line
                type="monotone"
                dataKey="users"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          )}
        </BeamPanel>

        {/* Assets by Category Bar Chart */}
        <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6 hover:border-primary/50 transition-all" beam={5.4}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-warning" />
              Assets theo danh mục
            </h3>
            {orderStatusSummary ? (
              <span className="text-xs text-muted-foreground hidden lg:inline max-w-[40%] truncate">
                {orderStatusSummary}
              </span>
            ) : null}
          </div>
          {assetsByCategory.length === 0 ? (
            <p className="text-muted-foreground text-sm py-16 text-center">Chưa có asset.</p>
          ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={assetsByCategory} barCategoryGap="20%" maxBarSize={56}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" allowDecimals={false} width={32} />
              <Tooltip
                content={<AdminChartTooltip />}
                cursor={CHART_BAR_CURSOR}
                formatter={(value: number) => [value, "Số asset"]}
              />
              <Bar
                dataKey="count"
                name="Số asset"
                fill="#f59e0b"
                radius={[8, 8, 0, 0]}
                activeBar={{ fill: "#fbbf24" }}
              />
            </BarChart>
          </ResponsiveContainer>
          )}
        </BeamPanel>
      </div>

      {/* Recent Orders & Top Assets */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6" beam={4.6}>
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Đơn hàng gần đây
          </h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="bg-card border border-border rounded-xl p-4 hover:bg-card/80 hover:border-primary/50 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-foreground font-mono">{order.orderCode}</p>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      order.status === "completed"
                        ? "bg-success/20 text-success"
                        : order.status === "pending"
                        ? "bg-warning/20 text-warning"
                        : "bg-destructive/20 text-destructive"
                    }`}
                  >
                    {order.status === "completed"
                      ? "Hoàn thành"
                      : order.status === "pending"
                      ? "Đang xử lý"
                      : "Đã hủy"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{order.userName}</p>
                <p className="text-sm text-foreground mb-2">
                  {order.items.join(", ")}
                </p>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-primary font-mono">
                    {formatAdminOrderAmount(order)}
                  </p>
                  <p className="text-xs text-muted-foreground">{order.date}</p>
                </div>
              </div>
            ))}
          </div>
        </BeamPanel>

        {/* Top Assets */}
        <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6" beam={4.8}>
          <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-secondary" />
            Assets bán chạy
          </h3>
          <div className="space-y-3">
            {assets
              .sort((a, b) => b.downloads - a.downloads)
              .slice(0, 5)
              .map((asset, index) => (
                <div
                  key={asset.id}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:bg-card/80 hover:border-primary/50 transition-all"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${
                    index === 0 ? "from-warning to-warning/80" :
                    index === 1 ? "from-muted to-muted/80" :
                    index === 2 ? "from-destructive to-destructive/80" :
                    "from-secondary to-secondary/80"
                  } rounded-lg flex items-center justify-center text-primary-foreground font-bold shadow-lg`}>
                    #{index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{asset.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Download className="w-4 h-4" />
                      {asset.downloads} downloads
                    </div>
                  </div>
                  <p className="font-bold text-primary font-mono">
                    {asset.isFree
                      ? "Miễn phí"
                      : `${asset.price.toLocaleString("vi-VN")} xu`}
                  </p>
                </div>
              ))}
          </div>
        </BeamPanel>
      </div>
    </div>
  );
}

// Users Management Component
function UsersManagement({
  searchQuery,
  setSearchQuery,
  setOverviewUsers,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  /** Patch overview snapshot only — never replace with paged list (breaks "có subscription"). */
  setOverviewUsers: Dispatch<SetStateAction<UserData[]>>;
}) {
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewDetail, setViewDetail] = useState<AdminUserDetail | null>(null);
  const [viewOrders, setViewOrders] = useState<Order[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [listUsers, setListUsers] = useState<UserData[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [includeBanned, setIncludeBanned] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));

  const loadUsers = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetchAdminUsers(
        page,
        pageSize,
        searchQuery.trim() || undefined,
        undefined,
        includeBanned
      );
      const mapped = res.data.map(mapAdminUserToUserData);
      setListUsers(mapped);
      setTotalUsers(res.total);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Không tải được danh sách user");
    } finally {
      setListLoading(false);
    }
  }, [page, pageSize, searchQuery, includeBanned]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadUsers();
    }, searchQuery.trim() ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadUsers, searchQuery]);

  const handleEdit = (user: UserData) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const openView = async (user: UserData) => {
    setViewDetail(null);
    setViewOrders([]);
    setViewLoading(true);
    try {
      const [detail, ordersRes] = await Promise.all([
        fetchAdminUserDetail(user.id),
        fetchAllOrders(1, 50, user.id),
      ]);
      setViewDetail(detail);
      setViewOrders(ordersRes.data.map(mapApiOrderToAdmin));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Không tải được chi tiết user");
    } finally {
      setViewLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    const original = listUsers.find((u) => u.id === editingUser.id);
    if (!original) return;

    const body: { role?: string; status?: string; walletBalance?: number } = {};
    if (original.role !== editingUser.role) body.role = editingUser.role;
    if (original.status !== editingUser.status) body.status = editingUser.status;
    if (original.credits !== editingUser.credits) body.walletBalance = editingUser.credits;

    if (Object.keys(body).length === 0) {
      toast.info("Không có thay đổi nào");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateAdminUser(editingUser.id, body);
      const mapped = mapAdminUserToUserData(updated);
      setListUsers((prev) => prev.map((u) => (u.id === mapped.id ? mapped : u)));
      setOverviewUsers((prev) => prev.map((u) => (u.id === mapped.id ? mapped : u)));
      toast.success("Đã cập nhật user trên BE");
      setShowEditModal(false);
      setEditingUser(null);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Cập nhật user thất bại");
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminUser(deleteTarget.id);
      toast.success("Đã khóa tài khoản user");
      setOverviewUsers((prev) =>
        prev.map((u) => (u.id === deleteTarget.id ? { ...u, status: "banned" } : u))
      );
      setDeleteTarget(null);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Khóa tài khoản thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const renderUserActions = (user: UserData) => (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={() => void openView(user)}
        className={`${componentClasses.iconButton} text-primary`}
        title="Xem chi tiết"
      >
        <Eye className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => handleEdit(user)}
        className={`${componentClasses.iconButton} text-warning`}
        title="Chỉnh sửa"
      >
        <Edit className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => setDeleteTarget(user)}
        className={`${componentClasses.iconButton} text-destructive`}
        title="Khóa tài khoản"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );

  const renderPlanBadge = (user: UserData) => {
    const label =
      user.subscriptionLabel ??
      (user.subscription ? user.subscription.toUpperCase() : "FREE");
    const slug = user.subscription;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold ${
          slug === "pro"
            ? "bg-warning/20 text-warning"
            : slug === "indie"
            ? "bg-secondary/20 text-secondary"
            : slug === "student"
            ? "bg-primary/20 text-primary"
            : "bg-muted/20 text-muted-foreground"
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6" beam={4.2}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Quản lý người dùng</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeBanned}
              onChange={(e) => {
                setIncludeBanned(e.target.checked);
                setPage(1);
              }}
              className="rounded border-border"
            />
            Hiện tài khoản đã khóa
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm tên, email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-3 relative">
        {listLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        {!listLoading && listUsers.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">Không tìm thấy user nào.</p>
        )}
        {!listLoading &&
          listUsers.map((user) => (
            <div key={user.id} className={componentClasses.listCard}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground truncate flex items-center gap-2">
                    {user.name}
                    {user.status === "banned" && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/20 text-destructive shrink-0">
                        KHÓA
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
                {renderUserActions(user)}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {renderPlanBadge(user)}
                <span
                  className={`px-2.5 py-1 rounded-full font-bold ${
                    user.role === "admin"
                      ? "bg-destructive/20 text-destructive"
                      : "bg-success/20 text-success"
                  }`}
                >
                  {user.role}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-muted/20 text-foreground font-mono">
                  {user.credits} xu
                </span>
              </div>
            </div>
          ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto relative">
        {listLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-xl">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-muted-foreground font-medium py-3 px-4">ID</th>
              <th className="text-left text-muted-foreground font-medium py-3 px-4">Tên</th>
              <th className="text-left text-muted-foreground font-medium py-3 px-4">Email</th>
              <th className="text-left text-muted-foreground font-medium py-3 px-4">Credits</th>
              <th className="text-left text-muted-foreground font-medium py-3 px-4">Gói</th>
              <th className="text-left text-muted-foreground font-medium py-3 px-4">Role</th>
              <th className="text-right text-muted-foreground font-medium py-3 px-4">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {!listLoading && listUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                  Không tìm thấy user nào.
                </td>
              </tr>
            ) : (
              listUsers.map((user) => (
                <tr key={user.id} className="border-b border-border/50 hover:bg-card/50">
                  <td className="py-4 px-4 text-muted-foreground font-mono text-xs">{user.id}</td>
                  <td className="py-4 px-4 text-foreground font-medium">
                    <span className="inline-flex items-center gap-2">
                      {user.name}
                      {user.status === "banned" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/20 text-destructive">
                          KHÓA
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">{user.email}</td>
                  <td className="py-4 px-4 text-foreground font-bold font-mono">{user.credits}</td>
                  <td className="py-4 px-4">{renderPlanBadge(user)}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.role === "admin"
                          ? "bg-destructive/20 text-destructive"
                          : "bg-success/20 text-success"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end">{renderUserActions(user)}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ClientPagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <ConfirmActionDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
        title="Khóa tài khoản?"
        description={
          <>
            Bạn sắp khóa tài khoản{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.name}</span>{" "}
            <span className="font-mono text-xs">({deleteTarget?.email})</span>. User sẽ không đăng
            nhập được; có thể mở khóa lại trong phần chỉnh sửa.
          </>
        }
        confirmLabel="Khóa tài khoản"
        loading={deleting}
        onConfirm={confirmDeleteUser}
      />

      {/* Edit Drawer */}
      <Sheet
        open={showEditModal && !!editingUser}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditModal(false);
            setEditingUser(null);
          }
        }}
      >
        {editingUser && (
          <SheetContent className="p-0 sm:max-w-2xl">
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b border-border p-6">
                <SheetTitle>Chỉnh sửa User</SheetTitle>
                <SheetDescription className="hidden sm:block">
                  Cập nhật thông tin người dùng
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Email
                      </label>
                      <input
                        type="text"
                        value={editingUser.email}
                        disabled
                        className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground/70 font-mono focus:outline-none disabled:opacity-70"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Đã chi (read-only)
                      </label>
                      <input
                        type="text"
                        value={`${(editingUser.totalSpent || 0).toLocaleString("vi-VN")}đ`}
                        disabled
                        className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground/70 font-mono focus:outline-none disabled:opacity-70"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Tên
                    </label>
                    <input
                      type="text"
                      value={editingUser.name}
                      disabled
                      className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground/70 focus:outline-none disabled:opacity-70"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Tên chỉ user tự đổi ở Profile.</p>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Credits
                      </label>
                      <input
                        type="number"
                        value={editingUser.credits}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            credits: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Role
                      </label>
                      <select
                        value={editingUser.role}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, role: e.target.value })
                        }
                        className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="customer">Customer</option>
                        <option value="seller">Seller</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Trạng thái
                      </label>
                      <select
                        value={editingUser.status}
                        onChange={(e) =>
                          setEditingUser({ ...editingUser, status: e.target.value })
                        }
                        className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="active">Hoạt động</option>
                        <option value="banned">Đã khóa</option>
                        <option value="pending">Chờ duyệt</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-xl p-4">
                    <p className="text-sm font-semibold text-muted-foreground mb-3">
                      Gói dịch vụ
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Subscription
                        </label>
                        <input
                          type="text"
                          value={
                            editingUser.subscriptionLabel ??
                            editingUser.subscription?.toUpperCase() ??
                            "FREE"
                          }
                          disabled
                          className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground/70 focus:outline-none disabled:opacity-70"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Đổi gói qua flow checkout subscription.</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Hết hạn (optional)
                        </label>
                        <input
                          type="date"
                          value={
                            editingUser.subscriptionExpiry
                              ? new Date(editingUser.subscriptionExpiry).toISOString().slice(0, 10)
                              : ""
                          }
                          disabled
                          className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground/70 font-mono focus:outline-none disabled:opacity-70"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="w-full bg-gradient-to-r from-[var(--cta-from)] to-[var(--cta-to)] hover:brightness-95 text-primary-foreground py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(0,217,255,0.3)] disabled:opacity-60"
                  >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      {/* View Drawer */}
      <Sheet
        open={viewLoading || !!viewDetail}
        onOpenChange={(open) => {
          if (!open) {
            setViewDetail(null);
            setViewOrders([]);
          }
        }}
      >
        <SheetContent className="p-0 sm:max-w-2xl">
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-border p-6">
              <SheetTitle>Chi tiết User</SheetTitle>
              <SheetDescription className="hidden sm:block">
                Dữ liệu từ API admin
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6">
              {viewLoading || !viewDetail ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-muted-foreground text-sm">Đang tải chi tiết...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">ID</p>
                      <p className="text-foreground font-medium font-mono text-xs break-all">
                        {viewDetail.id}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Username</p>
                      <p className="text-foreground font-medium font-mono">{viewDetail.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Role</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          viewDetail.role === "admin"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-primary/20 text-primary"
                        }`}
                      >
                        {viewDetail.role}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Trạng thái</p>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-muted/30 text-foreground">
                        {USER_STATUS_LABELS[viewDetail.status] ?? viewDetail.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tên</p>
                      <p className="text-foreground font-medium">{viewDetail.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <p className="text-foreground font-medium">{viewDetail.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Credits</p>
                      <p className="text-foreground font-bold text-lg font-mono">
                        {viewDetail.walletBalance}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Gói hiện tại</p>
                      <p className="text-foreground font-medium">
                        {viewDetail.subscriptionPlan ?? "FREE"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tổng chi tiêu</p>
                      <p className="text-foreground font-bold text-lg font-mono">
                        {viewDetail.totalSpentVnd.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Ngày đăng ký</p>
                      <p className="text-foreground font-medium">
                        {viewDetail.createdAt.split("T")[0]}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Số đơn hàng</p>
                      <p className="text-foreground font-bold font-mono">{viewDetail.orderCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Assets trong thư viện</p>
                      <p className="text-foreground font-bold font-mono">{viewDetail.assetCount}</p>
                    </div>
                  </div>

                  {(() => {
                    const assetOrders = viewOrders.filter((o) => isAssetOrderType(o.orderType));
                    return (
                      <div className="space-y-4 pt-2">
                        <div className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-foreground">Đơn hàng gần đây</h4>
                            <span className="text-sm text-muted-foreground font-mono">
                              {viewDetail.orderCount} đơn (hiển thị {viewOrders.length})
                            </span>
                          </div>
                          {viewOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Chưa có đơn hàng nào.</p>
                          ) : (
                            <div className="space-y-3">
                              {viewOrders.slice(0, 8).map((o) => (
                                <div
                                  key={o.id}
                                  className="bg-card border border-border rounded-lg p-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-foreground font-mono font-bold">{o.orderCode}</p>
                                    <span className="text-sm font-bold text-primary font-mono">
                                      {formatAdminOrderAmount(o)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {o.date} • {o.items.length} sản phẩm • {o.status}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {o.items.join(", ")}
                                  </p>
                                </div>
                              ))}
                              {viewDetail.orderCount > viewOrders.length && (
                                <p className="text-xs text-muted-foreground">
                                  Còn {viewDetail.orderCount - viewOrders.length} đơn khác.
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-foreground">Đơn mua asset</h4>
                            <span className="text-sm text-muted-foreground font-mono">
                              {assetOrders.length} đơn
                            </span>
                          </div>
                          {assetOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Chưa có đơn mua asset.</p>
                          ) : (
                            <div className="space-y-3">
                              {assetOrders.slice(0, 6).map((o) => (
                                <div
                                  key={o.id}
                                  className="bg-card border border-border rounded-lg p-3"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="font-bold text-foreground truncate font-mono">
                                        {o.orderCode}
                                      </p>
                                      <p className="text-xs text-muted-foreground line-clamp-2">
                                        {o.items.join(", ")}
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="text-xs text-muted-foreground">{o.date}</p>
                                      <p className="text-xs font-mono text-primary">
                                        {formatAdminOrderAmount(o)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </BeamPanel>
  );
}

// Assets Management Component
function AssetsManagement({
  searchQuery,
  setSearchQuery,
  assets,
  setAssets,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  assets: AssetData[];
  setAssets: (assets: AssetData[]) => void;
}) {
  const [pendingAssets, setPendingAssets] = useState<AssetRecord[]>([]);
  const [approvedAssetRecords, setApprovedAssetRecords] = useState<AssetRecord[]>([]);
  const [editingAsset, setEditingAsset] = useState<AssetRecord | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [rejectingAsset, setRejectingAsset] = useState<AssetRecord | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [viewingApprovedAsset, setViewingApprovedAsset] = useState<AssetRecord | null>(null);
  const [pendingPage, setPendingPage] = useState(1);
  const [approvedPage, setApprovedPage] = useState(1);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tagGroups, setTagGroups] = useState<TagGroupItem[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pendingPageSize = 6;
  const approvedPageSize = 12;

  const reload = async () => {
    try {
      const [pendingRes, approvedRes] = await Promise.all([
        fetchPendingAssets(1, 100),
        fetchAdminAssets(1, 100, "approved"),
      ]);
      const toRecord = (a: ReturnType<typeof mapAssetListItem>): AssetRecord => ({
        id: a.id,
        title: a.title,
        shortDescription: a.title,
        fullDescription: "",
        category: a.category as AssetRecord["category"],
        tags: a.tags,
        engineSupport: { unity: true, unreal: false, godot: false },
        version: "1.0.0",
        fileSize: "—",
        features: { rigged: false, animated: false, pbr: false, vrReady: false },
        priceType: a.isFree ? "free" : "paid",
        price: a.price,
        license: "Standard License",
        isFree: a.isFree,
        rating: a.rating,
        downloads: a.downloads,
        status: "pending_review",
        submittedAt: new Date().toISOString(),
        creatorName: a.author,
        thumbnailPreview: a.thumbnailUrl ?? undefined,
      });
      const pending = pendingRes.data.map(mapAssetListItem).map(toRecord);
      const approved = approvedRes.data.map(mapAssetListItem).map((a) => ({
        ...toRecord(a),
        status: "approved" as const,
      }));
      setPendingAssets(pending);
      setApprovedAssetRecords(approved);
      setAssets(
        [...pending, ...approved].map((a) => ({
          id: a.id,
          title: a.title,
          category: a.category,
          price: a.price,
          rating: a.rating,
          downloads: a.downloads,
          isFree: a.isFree,
        }))
      );
    } catch {
      toast.error("Không tải lại danh sách asset");
    }
  };

  useEffect(() => {
    reload();
    window.addEventListener("assetsUpdated", reload);
    return () => window.removeEventListener("assetsUpdated", reload);
  }, [setAssets]);

  useEffect(() => {
    Promise.all([fetchCategories(), fetchTagGroups()])
      .then(([cats, groups]) => {
        setCategories(cats);
        setTagGroups(groups);
      })
      .catch(() => {});
  }, []);

  const filteredApprovedAssets = approvedAssetRecords.filter((asset) =>
    asset.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const { paged: pagedPendingAssets, totalPages: pendingTotalPages } = getPageSlice(
    pendingAssets,
    pendingPage,
    pendingPageSize
  );
  const { paged: pagedApprovedAssets, totalPages: approvedTotalPages } = getPageSlice(
    filteredApprovedAssets,
    approvedPage,
    approvedPageSize
  );

  const loadAssetDetailRecord = async (asset: AssetRecord): Promise<AssetRecord> => {
    const detail = await fetchAssetById(asset.id);
    return mapAssetDetailToEditRecord(detail);
  };

  const handleViewFromRecord = async (asset: AssetRecord) => {
    setViewingApprovedAsset(asset);
    try {
      const record = await loadAssetDetailRecord(asset);
      setViewingApprovedAsset(record);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Không tải được chi tiết asset");
      setViewingApprovedAsset(null);
    }
  };

  const handleEditFromRecord = async (asset: AssetRecord) => {
    setViewingApprovedAsset(null);
    setLoadingEdit(true);
    try {
      setEditingAsset(await loadAssetDetailRecord(asset));
      setShowEditModal(true);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Không tải được chi tiết asset");
    } finally {
      setLoadingEdit(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingAsset) return;
    if (!editingAsset.title.trim()) {
      toast.error("Tên asset không được để trống");
      return;
    }
    if (!editingAsset.categoryId) {
      toast.error("Chọn danh mục asset");
      return;
    }
    if (!editingAsset.isFree && editingAsset.price < 1) {
      toast.error("Giá trả phí tối thiểu 1 xu");
      return;
    }

    setSavingEdit(true);
    try {
      await updateAdminAsset(editingAsset.id, buildAdminUpdateBody(editingAsset, tagGroups));
      toast.success("Đã cập nhật asset");
      setShowEditModal(false);
      setEditingAsset(null);
      await reload();
      window.dispatchEvent(new CustomEvent("assetsUpdated"));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Cập nhật asset thất bại");
    } finally {
      setSavingEdit(false);
    }
  };

  const requestDeleteAsset = (asset: { id: string; title: string }) => {
    setDeleteTarget({ id: asset.id, title: asset.title });
  };

  const confirmDeleteAsset = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminAsset(deleteTarget.id);
      toast.success("Đã xóa asset");
      setDeleteTarget(null);
      if (viewingApprovedAsset?.id === deleteTarget.id) {
        setViewingApprovedAsset(null);
      }
      await reload();
      window.dispatchEvent(new CustomEvent("assetsUpdated"));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Xóa asset thất bại");
    } finally {
      setDeleting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await apiApproveAsset(id);
      toast.success("Đã duyệt asset");
      window.dispatchEvent(new CustomEvent("assetsUpdated"));
    } catch {
      toast.error("Duyệt asset thất bại");
    }
  };

  const handleReject = (id: string) => {
    const found = pendingAssets.find((a) => a.id === id) || null;
    if (!found) {
      toast.error("Không tìm thấy asset để từ chối");
      return;
    }
    setRejectingAsset(found);
    setRejectReason("");
  };

  return (
    <div className="space-y-8">
      {/* Pending Assets */}
      {pendingAssets.length > 0 && (
        <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-warning/30 rounded-2xl p-6" beam={4.4}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Pending Assets</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {pendingAssets.length} asset chờ duyệt — xem preview, approve hoặc reject
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pagedPendingAssets.map((asset) => (
              <div
                key={asset.id}
                className="bg-card border border-warning/20 rounded-xl p-4 hover:border-warning/40 transition-all"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden mb-3 border border-border bg-muted/30">
                  <ImageWithFallback
                    src={
                      asset.thumbnailPreview ||
                      `https://source.unsplash.com/400x300/?${encodeURIComponent(asset.title)}`
                    }
                    alt={asset.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground truncate">{asset.title}</h3>
                    <p className="text-sm text-muted-foreground">{asset.category}</p>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 bg-warning/20 text-warning rounded-full text-xs font-bold">
                    pending
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{asset.shortDescription}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {asset.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 rounded bg-secondary/10 text-secondary">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground font-mono mb-1">
                  ZIP: {asset.zipFileName || "—"}
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  by {asset.creatorName || "Unknown"} · {new Date(asset.submittedAt).toLocaleDateString("vi-VN")}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(asset.id)}
                    className="flex-1 bg-success/20 hover:bg-success/30 text-success py-2 rounded-lg text-sm font-bold transition-all"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(asset.id)}
                    className="flex-1 bg-destructive/20 hover:bg-destructive/30 text-destructive py-2 rounded-lg text-sm font-bold transition-all"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>

          <ClientPagination
            page={pendingPage}
            totalPages={pendingTotalPages}
            onPageChange={setPendingPage}
          />
        </BeamPanel>
      )}

      {/* Reject drawer (with reason) */}
      <Sheet
        open={!!rejectingAsset}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingAsset(null);
            setRejectReason("");
          }
        }}
      >
        {rejectingAsset && (
          <SheetContent className="p-0 sm:max-w-2xl">
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b border-border p-6">
                <SheetTitle>Từ chối asset</SheetTitle>
                <SheetDescription className="hidden sm:block">
                  Lý do sẽ được lưu để BE/FE dùng lại khi kết nối thật
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-1">Asset</p>
                  <p className="text-foreground font-bold">{rejectingAsset.title}</p>
                  <p className="text-xs text-muted-foreground">{rejectingAsset.category}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Lý do từ chối (tuỳ chọn)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={5}
                    className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Ví dụ: Thiếu ảnh thumbnail, mô tả chưa rõ, file ZIP không hợp lệ..."
                  />
                </div>
              </div>

              <div className="border-t border-border p-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingAsset(null);
                    setRejectReason("");
                  }}
                  className="flex-1 bg-card hover:bg-card/80 border border-border text-foreground py-3 rounded-lg font-bold transition-all"
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!rejectingAsset) return;
                    try {
                      await apiRejectAsset(rejectingAsset.id, rejectReason || "Không đạt yêu cầu");
                      toast.success("Đã từ chối asset");
                      setRejectingAsset(null);
                      setRejectReason("");
                      reload();
                    } catch {
                      toast.error("Từ chối asset thất bại");
                    }
                  }}
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-primary-foreground py-3 rounded-lg font-bold transition-all"
                >
                  Từ chối
                </button>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      {/* Approved Assets */}
      <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6" beam={4.6}>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h2 className="text-2xl font-bold text-foreground">Quản lý Assets</h2>
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
            <Link
              to="/add-asset"
              className="bg-gradient-to-r from-[var(--cta-from)] to-[var(--cta-to)] hover:brightness-95 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:shadow-[0_0_30px_rgba(0,217,255,0.3)]"
            >
              <Plus className="w-5 h-5" />
              Add Asset
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {pagedApprovedAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border rounded-xl overflow-hidden hover:scale-105 transition-all group border-border hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]"
            >
              {/* Preview Image (sync with Marketplace card) */}
              <div
                className="relative aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden cursor-pointer"
                onClick={() => void handleViewFromRecord(asset)}
              >
                <ImageWithFallback
                  src={
                    asset.thumbnailPreview ||
                    `https://source.unsplash.com/400x300/?${encodeURIComponent(
                      asset.title
                    )}`
                  }
                  alt={asset.title}
                  className="w-full h-full object-cover transform-gpu will-change-transform group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg">
                    <Eye className="w-4 h-4" />
                    Xem chi tiết
                  </div>
                </div>

                {asset.isFree && (
                  <div className="absolute top-3 left-3 bg-success text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    MIỄN PHÍ
                  </div>
                )}

                <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm text-foreground px-3 py-1 rounded-full text-xs flex items-center gap-1 font-mono">
                  <Download className="w-3 h-3" />
                  {asset.downloads}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {asset.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {asset.creatorName || "AssetBox"}
                  </p>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium text-foreground">
                      {asset.rating}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    ({asset.downloads} downloads)
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {[asset.category, ...asset.tags].slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Price + Actions */}
                <div className="pt-3 border-t border-border">
                  <p className="text-xl font-bold text-foreground mb-3 font-mono">
                    {asset.isFree ? "Miễn phí" : `${asset.price.toLocaleString("vi-VN")} xu`}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditFromRecord(asset)}
                      className="flex-1 bg-card hover:bg-card/80 border border-border hover:border-primary/50 text-foreground py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                    >
                      <Edit className="w-4 h-4" />
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => requestDeleteAsset(asset)}
                      className="flex-1 bg-destructive/10 hover:bg-destructive/15 border border-destructive/30 text-destructive py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      Xoá
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <ClientPagination
          page={approvedPage}
          totalPages={approvedTotalPages}
          onPageChange={setApprovedPage}
        />

        {/* Approved asset detail drawer (sync with Marketplace drawer, read-only) */}
        <Sheet
          open={!!viewingApprovedAsset}
          onOpenChange={(open) => {
            if (!open) setViewingApprovedAsset(null);
          }}
        >
          {viewingApprovedAsset && (
            <SheetContent className="flex h-dvh max-h-dvh flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
              <div className="flex min-h-0 flex-1 flex-col">
                <SheetHeader className="shrink-0 border-b border-border p-6">
                  <SheetTitle className="text-2xl font-bold text-foreground">
                    {viewingApprovedAsset.title}
                  </SheetTitle>
                  <SheetDescription className="text-muted-foreground">
                    by {viewingApprovedAsset.creatorName || "AssetBox"}
                  </SheetDescription>
                </SheetHeader>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
                  <AssetImagesSection
                    mode="view"
                    asset={viewingApprovedAsset}
                    previewImages={viewingApprovedAsset.previewImages ?? []}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <TrendingUp className="w-5 h-5 text-warning" />
                        <span className="text-2xl font-bold text-foreground">
                          {viewingApprovedAsset.rating}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Rating</p>
                    </div>
                    <div className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Download className="w-5 h-5 text-primary" />
                        <span className="text-2xl font-bold text-foreground font-mono">
                          {viewingApprovedAsset.downloads}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Downloads</p>
                    </div>
                    <div className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-xl p-4 text-center">
                      <div className="mb-2">
                        <span className="text-2xl font-bold text-primary font-mono">
                          {viewingApprovedAsset.isFree
                            ? "Miễn phí"
                            : `${viewingApprovedAsset.price.toLocaleString("vi-VN")} xu`}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Price</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3">Mô tả</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {viewingApprovedAsset.fullDescription || viewingApprovedAsset.shortDescription || "—"}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-primary/10 border border-primary/30 text-primary rounded-full text-sm">
                        {viewingApprovedAsset.category}
                      </span>
                      {viewingApprovedAsset.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-card border border-border text-foreground rounded-full text-sm hover:border-primary/50 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-border p-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleEditFromRecord(viewingApprovedAsset)}
                    className="flex-1 bg-gradient-to-r from-[var(--cta-from)] to-[var(--cta-to)] hover:brightness-95 text-primary-foreground py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Edit className="w-5 h-5" />
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewingApprovedAsset(null);
                      setTimeout(() => requestDeleteAsset(viewingApprovedAsset), 0);
                    }}
                    className="flex-1 bg-destructive/10 hover:bg-destructive/15 border border-destructive/30 text-destructive py-3 rounded-lg font-bold transition-all"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            </SheetContent>
          )}
        </Sheet>

        <Sheet
          open={showEditModal && !!editingAsset}
          onOpenChange={(open) => {
            if (!open) {
              setShowEditModal(false);
              setEditingAsset(null);
            }
          }}
        >
          {editingAsset && (
            <SheetContent className="flex h-dvh max-h-dvh flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
              <div className="flex min-h-0 flex-1 flex-col">
                <SheetHeader className="shrink-0 border-b border-border p-6 pb-4">
                  <SheetTitle>Chỉnh sửa Asset</SheetTitle>
                  <SheetDescription>
                    Cập nhật thumbnail và thông tin hiển thị trên marketplace
                  </SheetDescription>
                </SheetHeader>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  <div className="space-y-6 p-6">
                    <AssetImagesSection
                      mode="edit"
                      asset={editingAsset}
                      previewImages={editingAsset.previewImages ?? []}
                      onAssetUpdated={(updated) => {
                        setEditingAsset(updated);
                        setApprovedAssetRecords((prev) =>
                          prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)),
                        );
                      }}
                    />
                    <AssetForm
                      asset={editingAsset}
                      onChange={setEditingAsset}
                      categories={categories}
                      tagGroups={tagGroups}
                      scrollTags={false}
                    />
                  </div>
                </div>

                <div className="shrink-0 border-t border-border bg-background p-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingAsset(null);
                    }}
                    disabled={savingEdit}
                    className="flex-1 bg-card hover:bg-card/80 border border-border text-foreground py-3 rounded-lg font-bold transition-all disabled:opacity-60"
                  >
                    Huỷ
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={savingEdit}
                    className="flex-1 bg-gradient-to-r from-[var(--cta-from)] to-[var(--cta-to)] hover:brightness-95 text-primary-foreground py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {savingEdit ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Lưu
                  </button>
                </div>
              </div>
            </SheetContent>
          )}
        </Sheet>

        {loadingEdit && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-lg">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <span className="text-sm text-foreground">Đang mở form chỉnh sửa...</span>
            </div>
          </div>
        )}

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
              khỏi marketplace. Nếu chưa có ai mua, bản ghi sẽ bị xóa hẳn khỏi database để dọn dữ
              liệu lỗi.
            </>
          }
          confirmLabel="Xóa asset"
          loading={deleting}
          onConfirm={confirmDeleteAsset}
        />
      </BeamPanel>
    </div>
  );
}

/** Khung ảnh đồng bộ với card / gallery trên trang Chợ Assets */
const MARKETPLACE_IMAGE_FRAME =
  "relative aspect-video w-full rounded-xl overflow-hidden border border-border bg-gradient-to-br from-primary/10 to-secondary/10";

function AssetImagesSection({
  asset,
  previewImages,
  mode,
  onAssetUpdated,
}: {
  asset: AssetRecord;
  previewImages: AssetImageItem[];
  mode: "view" | "edit";
  onAssetUpdated?: (asset: AssetRecord) => void | Promise<void>;
}) {
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);
  const previewAddInputRef = useRef<HTMLInputElement>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingPreview, setUploadingPreview] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<AssetImageItem | null>(
    previewImages[0] ?? null,
  );

  useEffect(() => {
    setSelectedPreview((current) => {
      if (previewImages.length === 0) return null;
      if (current && previewImages.some((img) => img.id === current.id)) return current;
      return previewImages[0];
    });
  }, [previewImages]);

  const withCacheBust = (url: string, token: string) => {
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}v=${encodeURIComponent(token)}`;
  };
  const thumbnailSrc = asset.thumbnailPreview
    ? withCacheBust(asset.thumbnailPreview, asset.thumbnailPreview)
    : `https://source.unsplash.com/400x300/?${encodeURIComponent(asset.title)}`;
  const refreshAssetImages = async () => {
    const detail = await fetchAssetById(asset.id);
    const updated = mapAssetDetailToEditRecord(detail);
    await onAssetUpdated?.(updated);
    return updated;
  };

  const handleImageUpload = async (
    file: File,
    kind: "thumbnail" | "preview",
    options?: { replaceImageId?: string; sortOrder?: number },
  ) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Chọn file ảnh PNG, JPG hoặc WEBP");
      return;
    }

    const setUploading = kind === "thumbnail" ? setUploadingThumbnail : setUploadingPreview;
    setUploading(true);
    try {
      const meta = await getAdminAssetUploadUrl(
        asset.id,
        "image",
        file.name,
        file.type,
        file.size,
      );
      await uploadToSignedUrl(meta.uploadUrl, file, file.type);
      await registerAdminAssetImage(asset.id, {
        storagePath: meta.storagePath,
        altText: kind === "thumbnail" ? asset.title : `${asset.title} preview`,
        sortOrder: options?.sortOrder ?? selectedPreview?.sortOrder ?? 0,
        isThumbnail: kind === "thumbnail",
        replaceImageId: options?.replaceImageId ?? (kind === "preview" ? selectedPreview?.id : undefined),
      });
      await refreshAssetImages();
      toast.success(kind === "thumbnail" ? "Đã cập nhật ảnh đại diện" : "Đã cập nhật ảnh preview");
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : kind === "thumbnail"
            ? "Upload ảnh đại diện thất bại"
            : "Upload ảnh preview thất bại",
      );
    } finally {
      setUploading(false);
    }
  };

  const renderChangeImageButton = (
    kind: "thumbnail" | "preview",
    uploading: boolean,
    hasImage: boolean,
    inputRef: RefObject<HTMLInputElement | null>,
  ) => (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImageUpload(file, kind, kind === "preview" ? { replaceImageId: selectedPreview?.id } : undefined);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-primary/30 rounded-xl p-3.5 hover:border-primary/60 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm font-medium text-foreground disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            Đang tải lên...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 text-primary" />
            {hasImage
              ? kind === "preview" && selectedPreview
                ? `Đổi ảnh preview #${previewImages.findIndex((img) => img.id === selectedPreview.id) + 1}`
                : "Đổi ảnh"
              : "Tải ảnh"}
          </>
        )}
      </button>
    </>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Ảnh đại diện</p>
        <div className={MARKETPLACE_IMAGE_FRAME}>
          <ImageWithFallback
            key={thumbnailSrc}
            src={thumbnailSrc}
            alt={`${asset.title} — ảnh đại diện`}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {asset.isFree && mode === "view" && (
            <div className="absolute top-3 left-3 bg-success text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              MIỄN PHÍ
            </div>
          )}
          {!asset.thumbnailPreview && mode === "edit" && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <p className="text-sm text-muted-foreground px-4 text-center">
                Chưa có ảnh đại diện
              </p>
            </div>
          )}
        </div>
        {mode === "edit" &&
          renderChangeImageButton(
            "thumbnail",
            uploadingThumbnail,
            !!asset.thumbnailPreview,
            thumbnailInputRef,
          )}
      </div>

      <div className="space-y-3">
        <p className="text-sm font-semibold text-foreground">Ảnh preview</p>
        {previewImages.length > 0 ? (
          <AssetPreviewGallery
            images={previewImages}
            assetTitle={asset.title}
            onActiveChange={mode === "edit" ? (_index, image) => setSelectedPreview(image) : undefined}
          />
        ) : (
          <div className={MARKETPLACE_IMAGE_FRAME}>
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <p className="text-sm text-muted-foreground px-4 text-center">Chưa có ảnh preview</p>
            </div>
          </div>
        )}
        {mode === "edit" && (
          <>
            {previewImages.length > 0 && selectedPreview && (
              <p className="text-xs text-muted-foreground">
                Đang chọn ảnh {previewImages.findIndex((img) => img.id === selectedPreview.id) + 1}/
                {previewImages.length} — bấm « » hoặc chấm tròn để chọn ảnh cần thay. Các ảnh khác giữ nguyên.
              </p>
            )}
            {renderChangeImageButton(
              "preview",
              uploadingPreview,
              previewImages.length > 0,
              previewInputRef,
            )}
            {previewImages.length > 0 && previewImages.length < 15 && (
              <>
                <input
                  ref={previewAddInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleImageUpload(file, "preview", {
                        sortOrder: previewImages.length,
                        replaceImageId: undefined,
                      });
                    }
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  disabled={uploadingPreview}
                  onClick={() => previewAddInputRef.current?.click()}
                  className="w-full border border-border rounded-xl p-3 hover:border-primary/40 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm text-muted-foreground disabled:opacity-60"
                >
                  <Plus className="w-4 h-4" />
                  Thêm ảnh preview (tối đa 15)
                </button>
              </>
            )}
          </>
        )}
      </div>

      {mode === "edit" && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 shrink-0" />
          PNG, JPG, WEBP · lưu trên Supabase Storage
        </p>
      )}
    </div>
  );
}

function AssetForm({
  asset,
  onChange,
  categories,
  tagGroups,
  scrollTags = true,
}: {
  asset: AssetRecord;
  onChange: (asset: AssetRecord) => void;
  categories: CategoryItem[];
  tagGroups: TagGroupItem[];
  scrollTags?: boolean;
}) {
  const toggleTag = (tagName: string) => {
    const has = asset.tags.includes(tagName);
    onChange({
      ...asset,
      tags: has ? asset.tags.filter((t) => t !== tagName) : [...asset.tags, tagName],
    });
  };

  return (
    <div className="space-y-6">
      {/* Basic */}
      <div className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-5 space-y-4">
        <h3 className="text-lg font-bold text-foreground">Thông tin cơ bản</h3>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Tên Asset
          </label>
          <input
            type="text"
            value={asset.title}
            onChange={(e) => onChange({ ...asset, title: e.target.value })}
            className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Danh mục
          </label>
          <select
            value={asset.categoryId ?? ""}
            onChange={(e) => {
              const selected = categories.find((c) => c.id === e.target.value);
              onChange({
                ...asset,
                categoryId: e.target.value,
                category: (selected?.name as AssetRecord["category"]) ?? asset.category,
              });
            }}
            className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Chọn danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-background/40 border border-border rounded-lg px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Rating (tự động)</p>
            <p className="text-lg font-bold text-foreground font-mono flex items-center gap-1">
              <Star className="w-4 h-4 fill-warning text-warning" />
              {asset.rating}
            </p>
          </div>
          <div className="bg-background/40 border border-border rounded-lg px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Downloads (tự động)</p>
            <p className="text-lg font-bold text-foreground font-mono">{asset.downloads}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-5 space-y-4">
        <h3 className="text-lg font-bold text-foreground">Mô tả</h3>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Mô tả ngắn
          </label>
          <textarea
            value={asset.shortDescription}
            onChange={(e) => onChange({ ...asset, shortDescription: e.target.value })}
            rows={3}
            className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Mô tả chi tiết
          </label>
          <textarea
            value={asset.fullDescription}
            onChange={(e) => onChange({ ...asset, fullDescription: e.target.value })}
            rows={6}
            className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-foreground">Tags</h3>
            <p className="text-sm text-muted-foreground">
              Đã chọn <span className="font-mono text-primary font-semibold">{asset.tags.length}</span> tag
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...asset, tags: [] })}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Xoá tất cả
          </button>
        </div>

        <div
          className={cn(
            "space-y-4 rounded-xl border border-border bg-background/40 p-4",
            scrollTags && "max-h-[420px] overflow-y-auto",
          )}
        >
          {tagGroups.map((group) => (
            <div key={group.id}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag) => {
                  const selected = asset.tags.includes(tag.name);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.name)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all ${
                        selected
                          ? "bg-primary/20 text-primary border-primary/50 shadow-[0_0_12px_rgba(0,217,255,0.15)]"
                          : "bg-card/60 text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      {selected && <CheckCircle className="w-3 h-3" />}
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engine & license */}
      <div className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-5 space-y-4">
        <h3 className="text-lg font-bold text-foreground">Engine & giấy phép</h3>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Engine hỗ trợ
          </label>
          <div className="flex flex-wrap gap-6">
            {(
              [
                ["unity", "Unity"],
                ["unreal", "Unreal"],
                ["godot", "Godot"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={asset.engineSupport[key]}
                  onChange={(e) =>
                    onChange({
                      ...asset,
                      engineSupport: { ...asset.engineSupport, [key]: e.target.checked },
                    })
                  }
                  className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Phong cách nghệ thuật
          </label>
          <select
            value={asset.artStyle ?? ""}
            onChange={(e) =>
              onChange({
                ...asset,
                artStyle: (e.target.value as ArtStyleValue) || undefined,
              })
            }
            className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">— Không chọn —</option>
            {ART_STYLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Giấy phép
          </label>
          <select
            value={asset.license}
            onChange={(e) =>
              onChange({ ...asset, license: e.target.value as AssetRecord["license"] })
            }
            className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {LICENSE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Phiên bản
          </label>
          <input
            type="text"
            value={asset.version}
            onChange={(e) => onChange({ ...asset, version: e.target.value })}
            placeholder="1.0.0"
            className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>

      {/* Features */}
      <div className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-5 space-y-4">
        <h3 className="text-lg font-bold text-foreground">Tính năng asset</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {(
            [
              ["rigged", "Rigged (có xương)"],
              ["animated", "Animated (có animation)"],
              ["pbr", "PBR materials"],
              ["vrReady", "VR ready"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2 cursor-pointer select-none p-3 rounded-lg border border-border bg-background/40"
            >
              <input
                type="checkbox"
                checked={asset.features[key]}
                onChange={(e) =>
                  onChange({
                    ...asset,
                    features: { ...asset.features, [key]: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm text-foreground">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-5 space-y-4">
        <h3 className="text-lg font-bold text-foreground">Giá</h3>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={asset.isFree}
            onChange={(e) =>
              onChange({
                ...asset,
                isFree: e.target.checked,
                priceType: e.target.checked ? "free" : "paid",
                price: e.target.checked ? 0 : asset.price,
              })
            }
            className="w-5 h-5 rounded bg-card border-border"
          />
          <span className="text-sm text-muted-foreground">Miễn phí</span>
        </label>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Giá (xu)
          </label>
          <input
            type="number"
            min="0"
            value={asset.isFree ? 0 : asset.price}
            disabled={asset.isFree}
            onChange={(e) => onChange({ ...asset, price: parseInt(e.target.value) || 0 })}
            className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-60"
          />
        </div>
      </div>
    </div>
  );
}

// Orders Management Component
function OrdersManagement({
  searchQuery,
  setSearchQuery,
  orders,
  setOrders,
  users,
  onReload,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  users: UserData[];
  onReload?: () => Promise<void>;
}) {
  const { refreshUserData } = useAuth();
  const [pendingPage, setPendingPage] = useState(1);
  const [confirmedPage, setConfirmedPage] = useState(1);
  const pageSize = 5;
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);

  const filteredOrders = orders.filter(
    (order) =>
      order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false),
  );

  const pendingOrders = filteredOrders.filter(orderNeedsAdminConfirmation);
  const confirmedOrders = filteredOrders.filter(
    (o) => !orderNeedsAdminConfirmation(o) && !isUnreportedBankTransferCheckout(o),
  );

  const { paged: pagedPending, totalPages: pendingTotalPages } = getPageSlice(
    pendingOrders,
    pendingPage,
    pageSize,
  );
  const { paged: pagedConfirmed, totalPages: confirmedTotalPages } = getPageSlice(
    confirmedOrders,
    confirmedPage,
    pageSize,
  );

  useEffect(() => {
    setPendingPage(1);
    setConfirmedPage(1);
  }, [searchQuery]);

  useEffect(() => {
    void onReload?.();
  }, [onReload]);

  const handleConfirm = async (orderId: string) => {
    setActionOrderId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, "completed");
      setOrders(orders.map((o) => (o.id === orderId ? mapApiOrderToAdmin(updated) : o)));
      await refreshUserData();
      toast.success("Đã xác nhận thanh toán — gói/xu đã được kích hoạt cho khách");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Không xác nhận được đơn");
    } finally {
      setActionOrderId(null);
    }
  };

  const confirmCancelOrder = async () => {
    if (!cancelTarget) return;

    setActionOrderId(cancelTarget.id);
    try {
      const updated = await updateOrderStatus(cancelTarget.id, "cancelled");
      setOrders(orders.map((o) => (o.id === cancelTarget.id ? mapApiOrderToAdmin(updated) : o)));
      toast.success("Đã hủy đơn hàng");
      setCancelTarget(null);
      if (viewingOrder?.id === cancelTarget.id) {
        setViewingOrder(mapApiOrderToAdmin(updated));
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Không hủy được đơn");
    } finally {
      setActionOrderId(null);
    }
  };

  const pendingCount = pendingOrders.length;
  const confirmedCount = confirmedOrders.length;

  const renderOrderCard = (order: Order) => (
    <div
      key={order.id}
      className={cn(
        componentClasses.cardSimple,
        "p-5 hover:scale-100",
        order.status === "pending" && "border-warning/40 bg-warning/5",
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="font-bold text-foreground text-lg font-mono">{order.orderCode}</h3>
            <span className={orderStatusBadgeClass(order.status)}>
              {orderStatusLabel(order.status)}
            </span>
            <span className={componentClasses.badgePrimary}>{orderTypeLabel(order.orderType)}</span>
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {order.userName}
            {order.userEmail ? ` • ${order.userEmail}` : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{order.date}</p>
        </div>
        <p className="text-2xl font-bold text-primary font-mono shrink-0">
          {formatAdminOrderAmount(order)}
        </p>
      </div>

      <div className="bg-background/50 border border-border rounded-lg p-4 mb-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Sản phẩm ({order.items.length})
        </p>
        <ul className="space-y-1">
          {order.items.map((item, index) => (
            <li key={`${order.id}-item-${index}`} className="text-sm text-foreground">
              • {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setViewingOrder(order)}>
          <Eye className="w-4 h-4" />
          Chi tiết
        </Button>
        {order.status === "pending" && (
          <>
            <Button
              variant="success"
              size="sm"
              onClick={() => handleConfirm(order.id)}
              disabled={actionOrderId === order.id}
            >
              <UserCheck className="w-4 h-4" />
              {actionOrderId === order.id ? "Đang xử lý..." : "Xác nhận CK"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCancelTarget(order)}
              disabled={actionOrderId === order.id}
            >
              Hủy
            </Button>
          </>
        )}
      </div>
    </div>
  );

  const renderOrderColumn = (
    title: string,
    subtitle: string,
    icon: ReactNode,
    count: number,
    badgeClass: string,
    items: Order[],
    page: number,
    totalPages: number,
    onPageChange: (p: number) => void,
    emptyMessage: string,
    columnClass?: string,
  ) => (
    <section
      className={cn(
        "flex flex-col min-h-[320px] rounded-xl border border-border bg-background/30",
        columnClass,
      )}
    >
      <div className="flex items-start justify-between gap-3 p-4 border-b border-border">
        <div className="flex items-start gap-3 min-w-0">
          <div className="shrink-0 w-10 h-10 rounded-lg border border-border bg-card flex items-center justify-center">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
        <span className={cn("shrink-0 px-2.5 py-1 rounded-full text-xs font-bold", badgeClass)}>
          {count}
        </span>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{emptyMessage}</p>
          </div>
        ) : (
          items.map(renderOrderCard)
        )}
      </div>

      {totalPages > 1 && (
        <div className="px-4 pb-4">
          <ClientPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </div>
      )}
    </section>
  );

  return (
    <BeamPanel className={cn(componentClasses.card, "hover:scale-100 md:hover:scale-100 p-6")} beam={4.4}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quản lý đơn hàng</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Đối soát chuyển khoản và kích hoạt gói cho khách
          </p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className={componentClasses.badgeWarning}>
              {pendingCount} chờ xác nhận
            </span>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Mã đơn, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(componentClasses.input, "pl-10 w-full sm:w-64")}
            />
          </div>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Chưa có đơn hàng phù hợp</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {renderOrderColumn(
            "Chưa xác nhận",
            "Đơn mới — chờ đối soát chuyển khoản",
            <Clock className="w-5 h-5 text-warning" />,
            pendingCount,
            "bg-warning/20 text-warning border border-warning/30",
            pagedPending,
            pendingPage,
            pendingTotalPages,
            setPendingPage,
            "Không có đơn chờ xác nhận",
            "border-warning/30",
          )}
          {renderOrderColumn(
            "Đã xác nhận",
            "Đơn hoàn thành hoặc đã hủy",
            <CheckCircle className="w-5 h-5 text-success" />,
            confirmedCount,
            "bg-success/20 text-success border border-success/30",
            pagedConfirmed,
            confirmedPage,
            confirmedTotalPages,
            setConfirmedPage,
            "Chưa có đơn đã xử lý",
            "border-success/30",
          )}
        </div>
      )}

      <Sheet
        open={!!viewingOrder}
        onOpenChange={(open) => {
          if (!open) setViewingOrder(null);
        }}
      >
        {viewingOrder && (
          <SheetContent className="p-0 sm:max-w-2xl">
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b border-border p-6">
                <SheetTitle>Chi tiết đơn hàng</SheetTitle>
                <SheetDescription className="hidden sm:block">
                  Xem thông tin đơn và người mua
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {(() => {
                  const buyer = users.find((u) => u.id === viewingOrder.userId);
                  return (
                    <div className={cn(componentClasses.cardSimple, "p-5 hover:scale-100")}>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                        Người mua
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-background border border-border shrink-0">
                          {buyer?.avatarDataUrl ? (
                            <img
                              src={buyer.avatarDataUrl}
                              alt={buyer.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground font-bold">
                              {(buyer?.name || viewingOrder.userName).slice(0, 1).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-foreground truncate">
                            {buyer?.name || viewingOrder.userName}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {buyer?.email || viewingOrder.userEmail || `ID: ${viewingOrder.userId}`}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={orderStatusBadgeClass(viewingOrder.status)}>
                              {orderStatusLabel(viewingOrder.status)}
                            </span>
                            {buyer?.subscription ? (
                              <span className={componentClasses.badgePrimary}>
                                {buyer.subscription.toUpperCase()}
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-muted/20 text-muted-foreground">
                                FREE
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className={cn(componentClasses.cardSimple, "p-5 hover:scale-100")}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Chi tiết đơn
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-background/50 border border-border rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">Mã đơn</p>
                      <p className="font-mono font-bold text-foreground">{viewingOrder.orderCode}</p>
                    </div>
                    <div className="bg-background/50 border border-border rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">Ngày</p>
                      <p className="font-bold text-foreground">{viewingOrder.date}</p>
                    </div>
                    <div className="bg-background/50 border border-border rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">Loại</p>
                      <p className="font-semibold text-foreground">
                        {orderTypeLabel(viewingOrder.orderType)}
                      </p>
                    </div>
                    <div className="bg-background/50 border border-border rounded-lg p-4">
                      <p className="text-xs text-muted-foreground mb-1">Tổng tiền</p>
                      <p className="text-xl font-bold text-primary font-mono">
                        {formatAdminOrderAmount(viewingOrder)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 bg-background/50 border border-border rounded-lg p-4">
                    <p className="text-xs text-muted-foreground mb-2">Sản phẩm</p>
                    <ul className="text-sm text-foreground space-y-1">
                      {viewingOrder.items.map((item, index) => (
                        <li key={`${viewingOrder.id}-drawer-item-${index}`}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {viewingOrder.status === "pending" && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                    <Button
                      variant="success"
                      className="flex-1 sm:flex-none"
                      onClick={() => {
                        handleConfirm(viewingOrder.id);
                        setViewingOrder(null);
                      }}
                      disabled={actionOrderId === viewingOrder.id}
                    >
                      <UserCheck className="w-4 h-4" />
                      {actionOrderId === viewingOrder.id ? "Đang xử lý..." : "Xác nhận CK"}
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1 sm:flex-none"
                      onClick={() => setCancelTarget(viewingOrder)}
                      disabled={actionOrderId === viewingOrder.id}
                    >
                      Hủy đơn
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      <ConfirmActionDialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open && !actionOrderId) setCancelTarget(null);
        }}
        title="Hủy đơn hàng?"
        description={
          <>
            Bạn sắp hủy đơn{" "}
            <span className="font-mono font-semibold text-foreground">{cancelTarget?.orderCode}</span>{" "}
            của <span className="font-semibold text-foreground">{cancelTarget?.userName}</span>.
          </>
        }
        confirmLabel="Hủy đơn"
        loading={!!cancelTarget && actionOrderId === cancelTarget.id}
        onConfirm={confirmCancelOrder}
      />
    </BeamPanel>
  );
}

function formatPlanCredits(pkg: SubscriptionPlan): string {
  if (pkg.isUnlimited) return "Không giới hạn xu";
  if (pkg.creditsMonthly && pkg.creditsMonthly > 0) return `${pkg.creditsMonthly} xu/tháng`;
  if (pkg.slug === "free") return `${pkg.creditsMonthly ?? 100} xu khi đăng ký`;
  return "—";
}

// Packages Management Component
function PackagesManagement({
  packages,
  setPackages,
  onReload,
}: {
  packages: SubscriptionPlan[];
  setPackages: (packages: SubscriptionPlan[]) => void;
  onReload: () => Promise<void>;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const [saving, setSaving] = useState(false);
  const [editingPackage, setEditingPackage] = useState<SubscriptionPlan | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPackage, setNewPackage] = useState<SubscriptionPlanDraft>(emptyPlanDraft());
  const [deleteTarget, setDeleteTarget] = useState<SubscriptionPlan | null>(null);

  const existingSlugs = new Set(packages.map((p) => p.slug));

  const handleEdit = (pkg: SubscriptionPlan) => {
    setEditingPackage({ ...pkg, features: [...pkg.features] });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPackage) return;
    if (!editingPackage.name.trim()) {
      toast.error("Vui lòng nhập tên gói");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateAdminSubscriptionPlan(editingPackage.id, {
        name: editingPackage.name.trim(),
        description: editingPackage.description?.trim() || null,
        priceVnd: editingPackage.priceVnd,
        creditsMonthly: editingPackage.isUnlimited ? null : editingPackage.creditsMonthly,
        isUnlimited: editingPackage.isUnlimited,
        features: editingPackage.features.filter((f) => f.trim()),
        sortOrder: editingPackage.sortOrder,
        isActive: editingPackage.isActive,
      });
      setPackages(
        packages
          .map((p) => (p.id === updated.id ? updated : p))
          .sort((a, b) => a.sortOrder - b.sortOrder)
      );
      toast.success("Đã cập nhật gói dịch vụ");
      setShowEditModal(false);
      setEditingPackage(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cập nhật gói thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPackage = async () => {
    if (!newPackage.name.trim()) {
      toast.error("Vui lòng nhập tên gói");
      return;
    }
    if (existingSlugs.has(newPackage.slug)) {
      toast.error(`Slug "${newPackage.slug}" đã tồn tại — chọn slug khác hoặc chỉnh sửa gói hiện có`);
      return;
    }

    setSaving(true);
    try {
      const created = await createAdminSubscriptionPlan({
        slug: newPackage.slug,
        name: newPackage.name.trim(),
        description: newPackage.description?.trim() || null,
        priceVnd: newPackage.priceVnd,
        creditsMonthly: newPackage.isUnlimited ? null : newPackage.creditsMonthly,
        isUnlimited: newPackage.isUnlimited,
        features: newPackage.features.filter((f) => f.trim()),
        sortOrder: newPackage.sortOrder,
        isActive: newPackage.isActive,
      });
      setPackages([...packages, created].sort((a, b) => a.sortOrder - b.sortOrder));
      toast.success("Đã thêm gói dịch vụ");
      setShowAddModal(false);
      setNewPackage(emptyPlanDraft());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Thêm gói thất bại");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const isPermanent = !deleteTarget.isActive;

    setSaving(true);
    try {
      if (isPermanent) {
        await hardDeleteAdminSubscriptionPlan(deleteTarget.id);
        setPackages(packages.filter((p) => p.id !== deleteTarget.id));
        toast.success(`Đã xóa vĩnh viễn gói "${deleteTarget.name}"`);
      } else {
        await deleteAdminSubscriptionPlan(deleteTarget.id);
        await onReload();
        toast.success(`Đã ẩn gói "${deleteTarget.name}"`);
      }
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xóa gói thất bại");
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (slug: PlanSlug) => {
    const template = SUBSCRIPTION_PLAN_TEMPLATES[slug];
    setNewPackage({ ...template, features: [...template.features] });
  };

  const { paged: pagedPackages, totalPages } = getPageSlice(packages, page, pageSize);

  return (
    <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6" beam={4.5}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Quản lý gói dịch vụ</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gói đăng ký tháng (FREE / STUDENT / PRO) — đồng bộ trang Gói dịch vụ
          </p>
        </div>
        <button
          onClick={() => {
            setNewPackage(emptyPlanDraft());
            setShowAddModal(true);
          }}
          disabled={saving}
          className="bg-gradient-to-r from-[var(--cta-from)] to-[var(--cta-to)] hover:brightness-95 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:shadow-[0_0_30px_rgba(0,217,255,0.3)] disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          Thêm gói mới
        </button>
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Chưa có gói nào. Bấm &quot;Thêm gói mới&quot; và chọn mẫu free/student/indie/pro.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pagedPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-card border rounded-xl p-6 transition-all hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)] ${
                pkg.isActive ? "border-border" : "border-destructive/40 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {pkg.slug}
                    </span>
                    {!pkg.isActive && (
                      <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                        Đã ẩn
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">#{pkg.sortOrder}</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">{pkg.name}</h3>
                  {pkg.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{pkg.description}</p>
                  )}
                  <p className="text-2xl font-bold text-primary font-mono">
                    {pkg.priceVnd > 0
                      ? `${pkg.priceVnd.toLocaleString("vi-VN")}đ/tháng`
                      : "Miễn phí"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{formatPlanCredits(pkg)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleEdit(pkg)}
                    disabled={saving}
                    className="text-warning hover:text-warning/80 transition-colors disabled:opacity-50"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(pkg)}
                    disabled={saving}
                    className="text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                    aria-label={`Ẩn gói ${pkg.name}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <ul className="space-y-1 pt-4 border-t border-border">
                {(pkg.features.length > 0 ? pkg.features : ["Chưa có tính năng"]).slice(0, 4).map((f, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{f}</span>
                  </li>
                ))}
                {pkg.features.length > 4 && (
                  <li className="text-xs text-muted-foreground">+{pkg.features.length - 4} tính năng khác</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}

      <ClientPagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !saving) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-card border-border sm:max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto sm:mx-0 mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-foreground text-xl">
              {deleteTarget?.isActive ? "Ẩn gói dịch vụ?" : "Xóa vĩnh viễn gói?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left text-muted-foreground">
                {deleteTarget?.isActive ? (
                  <>
                    <p>
                      Bạn sắp ẩn gói{" "}
                      <span className="font-semibold text-foreground">{deleteTarget.name}</span>{" "}
                      <span className="font-mono text-xs bg-muted/30 px-1.5 py-0.5 rounded">
                        {deleteTarget.slug}
                      </span>
                      . Gói sẽ không còn hiển thị trên trang Gói dịch vụ.
                    </p>
                    <div className="rounded-lg border border-border bg-background/50 px-3 py-2 text-sm">
                      <p className="text-foreground font-medium mb-1">Lưu ý</p>
                      <ul className="list-disc list-inside space-y-0.5 text-xs">
                        <li>Dữ liệu vẫn được giữ trên hệ thống (soft-delete)</li>
                        <li>Bấm xóa lần nữa khi gói đã ẩn để xóa hẳn khỏi database</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <>
                    <p>
                      Gói{" "}
                      <span className="font-semibold text-foreground">{deleteTarget?.name}</span>{" "}
                      <span className="font-mono text-xs bg-muted/30 px-1.5 py-0.5 rounded">
                        {deleteTarget?.slug}
                      </span>{" "}
                      sẽ bị <strong className="text-destructive">xóa hẳn</strong> khỏi database.
                    </p>
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
                      <p className="text-foreground font-medium mb-1">Không thể hoàn tác</p>
                      <p className="text-xs">
                        Chỉ xóa được khi không còn user subscription hoặc đơn hàng tham chiếu gói này.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel
              disabled={saving}
              className="border-border hover:bg-muted/50"
            >
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {deleteTarget?.isActive ? "Ẩn gói" : "Xóa vĩnh viễn"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet
        open={showEditModal && !!editingPackage}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditModal(false);
            setEditingPackage(null);
          }
        }}
      >
        {editingPackage && (
          <SheetContent className="p-0 sm:max-w-2xl">
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b border-border p-6">
                <SheetTitle>Chỉnh sửa gói — {editingPackage.slug}</SheetTitle>
                <SheetDescription className="hidden sm:block">
                  Slug không đổi sau khi tạo. Các field khác đồng bộ lên trang Gói dịch vụ.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-6">
                <PackageForm
                  mode="edit"
                  draft={editingPackage}
                  onChange={(d) => setEditingPackage({ ...editingPackage, ...d })}
                  onSave={handleSaveEdit}
                  saving={saving}
                />
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      <Sheet
        open={showAddModal}
        onOpenChange={(open) => {
          if (!open) setShowAddModal(false);
        }}
      >
        {showAddModal && (
          <SheetContent className="p-0 sm:max-w-2xl">
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b border-border p-6">
                <SheetTitle>Thêm gói mới</SheetTitle>
                <SheetDescription className="hidden sm:block">
                  Chọn mẫu theo trang Gói dịch vụ rồi chỉnh trước khi lưu.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Mẫu nhanh (theo Pricing)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PLAN_SLUG_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={existingSlugs.has(opt.value) || saving}
                        onClick={() => applyTemplate(opt.value)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-border hover:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {opt.label}
                        {existingSlugs.has(opt.value) ? " ✓" : ""}
                      </button>
                    ))}
                  </div>
                </div>
                <PackageForm
                  mode="create"
                  draft={newPackage}
                  existingSlugs={existingSlugs}
                  onChange={(d) => setNewPackage({ ...newPackage, ...d })}
                  onSave={handleAddPackage}
                  saving={saving}
                />
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </BeamPanel>
  );
}

type CreditPackDraft = {
  id: string;
  name: string;
  credits: number;
  priceVnd: number;
  discountPercent: number | null;
  sortOrder: number;
  isActive: boolean;
};

function emptyCreditPackDraft(): CreditPackDraft {
  return {
    id: "",
    name: "",
    credits: 200,
    priceVnd: 29_000,
    discountPercent: null,
    sortOrder: 0,
    isActive: true,
  };
}

function CreditPacksManagement() {
  const [packs, setPacks] = useState<CreditPackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPack, setEditingPack] = useState<CreditPackItem | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CreditPackItem | null>(null);
  const [newPack, setNewPack] = useState<CreditPackDraft>(emptyCreditPackDraft());

  const existingIds = new Set(packs.map((p) => p.id));

  const reload = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminCreditPacks();
      setPacks([...data].sort((a, b) => a.sortOrder - b.sortOrder));
    } catch {
      toast.error("Không tải được gói mua thêm xu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const handleEdit = (pack: CreditPackItem) => {
    setEditingPack({ ...pack });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingPack) return;
    if (!editingPack.name.trim()) {
      toast.error("Vui lòng nhập tên gói");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateAdminCreditPack(editingPack.id, {
        name: editingPack.name.trim(),
        credits: editingPack.credits,
        priceVnd: editingPack.priceVnd,
        discountPercent: editingPack.discountPercent,
        sortOrder: editingPack.sortOrder,
        isActive: editingPack.isActive,
      });
      setPacks((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setShowEditModal(false);
      setEditingPack(null);
      toast.success("Đã cập nhật gói xu");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!newPack.id.trim() || !newPack.name.trim()) {
      toast.error("Nhập mã gói (id) và tên");
      return;
    }
    if (existingIds.has(newPack.id.trim().toLowerCase())) {
      toast.error(`Mã gói "${newPack.id}" đã tồn tại`);
      return;
    }
    setSaving(true);
    try {
      const created = await createAdminCreditPack({
        id: newPack.id.trim().toLowerCase(),
        name: newPack.name.trim(),
        credits: newPack.credits,
        priceVnd: newPack.priceVnd,
        discountPercent: newPack.discountPercent,
        sortOrder: newPack.sortOrder,
        isActive: newPack.isActive,
      });
      setPacks((prev) => [...prev, created].sort((a, b) => a.sortOrder - b.sortOrder));
      setShowAddModal(false);
      setNewPack(emptyCreditPackDraft());
      toast.success("Đã thêm gói xu");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Thêm gói thất bại");
    } finally {
      setSaving(false);
    }
  };

  const applyCreditPackTemplate = (template: (typeof CREDIT_PACKS_FALLBACK)[number]) => {
    setNewPack({
      id: template.id,
      name: template.name ?? "",
      credits: template.credits,
      priceVnd: template.priceVnd,
      discountPercent: template.discountPercent ?? null,
      sortOrder: template.sortOrder ?? 0,
      isActive: true,
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (deleteTarget.isActive) {
        await deleteAdminCreditPack(deleteTarget.id);
        await reload();
        toast.success(`Đã ẩn gói "${deleteTarget.name}"`);
      } else {
        await hardDeleteAdminCreditPack(deleteTarget.id);
        setPacks((prev) => prev.filter((p) => p.id !== deleteTarget.id));
        toast.success(`Đã xóa gói "${deleteTarget.name}"`);
      }
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xóa gói thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BeamPanel className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6" beam={4.7}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Coins className="w-6 h-6 text-success" />
            Gói mua thêm xu
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Hiển thị tại mục &quot;Hoặc mua thêm xu&quot; trên trang Gói dịch vụ — thanh toán một lần
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setNewPack(emptyCreditPackDraft());
            setShowAddModal(true);
          }}
          disabled={saving}
          className="bg-gradient-to-r from-[var(--cta-from)] to-[var(--cta-to)] hover:brightness-95 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:shadow-[0_0_30px_rgba(0,217,255,0.3)] disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          Thêm gói xu
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : packs.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Chưa có gói xu — bấm &quot;Thêm gói xu&quot; để tạo mới.</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className={`bg-card border rounded-xl p-6 transition-all hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)] ${
                pack.isActive ? "border-border" : "border-destructive/40 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {pack.id}
                    </span>
                    {!pack.isActive && (
                      <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                        Đã ẩn
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">#{pack.sortOrder}</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1">{pack.name}</h3>
                  <p className="text-2xl font-bold text-primary font-mono">
                    {pack.priceVnd.toLocaleString("vi-VN")}đ
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {pack.credits.toLocaleString("vi-VN")} xu
                    {pack.discountPercent != null && pack.discountPercent > 0 && (
                      <span className="ml-2 text-warning font-medium">-{pack.discountPercent}%</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleEdit(pack)}
                    disabled={saving}
                    className="text-warning hover:text-warning/80 transition-colors disabled:opacity-50"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(pack)}
                    disabled={saving}
                    className="text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
                    aria-label={`Ẩn gói ${pack.name}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !saving) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent className="bg-card border-border sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {deleteTarget?.isActive ? "Ẩn gói xu?" : "Xóa vĩnh viễn gói xu?"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <p className="text-muted-foreground text-sm">
                Gói <strong className="text-foreground">{deleteTarget?.name}</strong>{" "}
                <span className="font-mono text-xs">({deleteTarget?.id})</span>
                {deleteTarget?.isActive
                  ? " sẽ không còn hiển thị trên trang Gói dịch vụ."
                  : " sẽ bị xóa hẳn khỏi database."}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving} className="border-border hover:bg-muted/50">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {saving ? "Đang xử lý..." : deleteTarget?.isActive ? "Ẩn gói" : "Xóa vĩnh viễn"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet
        open={showEditModal && !!editingPack}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditModal(false);
            setEditingPack(null);
          }
        }}
      >
        {editingPack && (
          <SheetContent className="p-0 sm:max-w-2xl">
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b border-border p-6">
                <SheetTitle>Chỉnh sửa gói xu — {editingPack.id}</SheetTitle>
                <SheetDescription className="hidden sm:block">
                  Mã gói không đổi sau khi tạo. Thay đổi đồng bộ lên trang Gói dịch vụ.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-6">
                <CreditPackForm
                  mode="edit"
                  draft={editingPack}
                  onChange={(d) => setEditingPack({ ...editingPack, ...d })}
                  onSave={handleSaveEdit}
                  saving={saving}
                />
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      <Sheet
        open={showAddModal}
        onOpenChange={(open) => {
          if (!open) setShowAddModal(false);
        }}
      >
        {showAddModal && (
          <SheetContent className="p-0 sm:max-w-2xl">
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b border-border p-6">
                <SheetTitle>Thêm gói xu</SheetTitle>
                <SheetDescription className="hidden sm:block">
                  Chọn mẫu nhanh hoặc nhập thủ công trước khi lưu.
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Mẫu nhanh (theo Pricing)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CREDIT_PACKS_FALLBACK.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        disabled={existingIds.has(tpl.id) || saving}
                        onClick={() => applyCreditPackTemplate(tpl)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-border hover:border-primary/50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {tpl.name} ({tpl.priceVnd.toLocaleString("vi-VN")}đ)
                        {existingIds.has(tpl.id) ? " ✓" : ""}
                      </button>
                    ))}
                  </div>
                </div>
                <CreditPackForm
                  mode="create"
                  draft={newPack}
                  existingIds={existingIds}
                  onChange={(d) => setNewPack({ ...newPack, ...d })}
                  onSave={handleAdd}
                  saving={saving}
                />
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </BeamPanel>
  );
}

function CreditPackForm({
  mode,
  draft,
  existingIds,
  onChange,
  onSave,
  saving,
}: {
  mode: "create" | "edit";
  draft: CreditPackDraft | CreditPackItem;
  existingIds?: Set<string>;
  onChange: (patch: Partial<CreditPackDraft>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      {mode === "create" && (
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Mã gói (id) *
          </label>
          <input
            className={cn(componentClasses.input, "font-mono")}
            placeholder="pack-500"
            value={draft.id}
            onChange={(e) => onChange({ id: e.target.value })}
          />
          {existingIds?.has(draft.id.trim().toLowerCase()) && (
            <p className="text-xs text-destructive mt-1">Mã gói đã tồn tại</p>
          )}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Tên hiển thị *</label>
        <input
          className={componentClasses.input}
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Số xu *</label>
          <input
            type="number"
            className={componentClasses.input}
            value={draft.credits}
            onChange={(e) => onChange({ credits: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Giá (VND) *</label>
          <input
            type="number"
            className={componentClasses.input}
            value={draft.priceVnd}
            onChange={(e) => onChange({ priceVnd: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">% giảm (hiển thị)</label>
          <input
            type="number"
            className={componentClasses.input}
            value={draft.discountPercent ?? ""}
            onChange={(e) =>
              onChange({
                discountPercent: e.target.value === "" ? null : parseInt(e.target.value, 10),
              })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Thứ tự</label>
          <input
            type="number"
            className={componentClasses.input}
            value={draft.sortOrder}
            onChange={(e) => onChange({ sortOrder: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.isActive}
          onChange={(e) => onChange({ isActive: e.target.checked })}
        />
        Hiển thị trên trang Gói dịch vụ
      </label>
      <Button
        type="button"
        variant="gradient"
        className="w-full"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang lưu...
          </>
        ) : mode === "create" ? (
          "Thêm gói xu"
        ) : (
          "Lưu thay đổi"
        )}
      </Button>
    </div>
  );
}

function PackageForm({
  mode,
  draft,
  existingSlugs,
  onChange,
  onSave,
  saving,
}: {
  mode: "create" | "edit";
  draft: SubscriptionPlanDraft | SubscriptionPlan;
  existingSlugs?: Set<string>;
  onChange: (patch: Partial<SubscriptionPlanDraft>) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const featuresText = draft.features.join("\n");

  return (
    <div className="space-y-4">
      {mode === "create" && (
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Slug *</label>
          <select
            value={draft.slug}
            onChange={(e) => {
              const slug = e.target.value as PlanSlug;
              onChange(SUBSCRIPTION_PLAN_TEMPLATES[slug] ?? { slug });
            }}
            className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {PLAN_SLUG_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={existingSlugs?.has(opt.value)}>
                {opt.label}
                {existingSlugs?.has(opt.value) ? " (đã có)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Tên gói *</label>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Mô tả</label>
        <textarea
          value={draft.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={2}
          className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Giá (VND/tháng)</label>
          <input
            type="number"
            min={0}
            value={draft.priceVnd}
            onChange={(e) => onChange({ priceVnd: parseInt(e.target.value, 10) || 0 })}
            className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Thứ tự hiển thị</label>
          <input
            type="number"
            min={0}
            value={draft.sortOrder}
            onChange={(e) => onChange({ sortOrder: parseInt(e.target.value, 10) || 0 })}
            className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.isUnlimited}
          onChange={(e) =>
            onChange({
              isUnlimited: e.target.checked,
              creditsMonthly: e.target.checked ? null : draft.creditsMonthly ?? 0,
            })
          }
          className="rounded border-border"
        />
        <span className="text-sm text-foreground">Xu không giới hạn (indie/pro)</span>
      </label>

      {!draft.isUnlimited && (
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Xu/tháng</label>
          <input
            type="number"
            min={0}
            value={draft.creditsMonthly ?? 0}
            onChange={(e) => onChange({ creditsMonthly: parseInt(e.target.value, 10) || 0 })}
            className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Tính năng (mỗi dòng một mục)
        </label>
        <textarea
          value={featuresText}
          onChange={(e) =>
            onChange({
              features: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean),
            })
          }
          rows={5}
          placeholder={"100 xu miễn phí khi đăng ký\nGợi ý assets cơ bản\n..."}
          className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.isActive}
          onChange={(e) => onChange({ isActive: e.target.checked })}
          className="rounded border-border"
        />
        <span className="text-sm text-foreground">Hiển thị trên trang Gói dịch vụ (isActive)</span>
      </label>

      <button
        onClick={onSave}
        disabled={saving}
        className="w-full bg-gradient-to-r from-[var(--cta-from)] to-[var(--cta-to)] hover:brightness-95 text-primary-foreground py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(0,217,255,0.3)] disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {saving ? "Đang lưu..." : "Lưu"}
      </button>
    </div>
  );
}

// Modal Component
function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background border border-border rounded-2xl p-6 z-50 max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,217,255,0.2)]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}