import { useState, useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router";
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
  Loader2,
  Coins,
  Star,
  Upload,
  ImageIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import ClientPagination, { getPageSlice } from "./ui/ClientPagination";
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
  fetchAdminAssets,
  patchWalletBalance,
  updateAdminUser,
  deleteAdminUser,
  updateAdminAsset,
  deleteAdminAsset,
  fetchAdminAnalyticsRevenue,
  fetchAdminAnalyticsUsers,
  fetchAdminAnalyticsAssets,
  fetchAdminAnalyticsOrders,
} from "../../api/admin";
import type {
  AdminAnalyticsAssets,
  AdminAnalyticsOrders,
  AdminAnalyticsRevenue,
  AdminAnalyticsUsers,
  AdminOverview,
} from "../../api/types/admin";
import {
  buildAdminUpdateBody,
  mapAssetDetailToEditRecord,
} from "../../api/adminAssetEdit";
import { fetchCategories, fetchTagGroups } from "../../api/lookup";
import type { CategoryItem, TagGroupItem } from "../../api/types/marketplace";
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
  getAssetUploadUrl,
  registerAssetImage,
  uploadToSignedUrl,
} from "../../api/assets";
import { mapAssetListItem } from "../../api/mappers";
import {
  AreaChart,
  Area,
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
  registeredAt: string;
  totalSpent: number;
  subscription?: "student" | "indie" | "pro";
  subscriptionExpiry?: string; // ISO date string
  avatarDataUrl?: string | null;
}

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
  };
}

function formatAdminOrderAmount(order: Order): string {
  if (order.orderType === "asset") {
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

interface AssetData extends Pick<
  AssetRecord,
  "id" | "title" | "category" | "price" | "rating" | "downloads" | "isFree"
> {}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // Admin data from BE
  const [users, setUsers] = useState<UserData[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [packages, setPackages] = useState<SubscriptionPlan[]>([]);
  const [assets, setAssets] = useState<AssetData[]>([]);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState<AdminAnalyticsRevenue | null>(null);
  const [usersAnalytics, setUsersAnalytics] = useState<AdminAnalyticsUsers | null>(null);
  const [assetsAnalytics, setAssetsAnalytics] = useState<AdminAnalyticsAssets | null>(null);
  const [ordersAnalytics, setOrdersAnalytics] = useState<AdminAnalyticsOrders | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const reloadPackagesFromApi = async () => {
    try {
      const plans = await fetchAdminSubscriptionPlans();
      setPackages([...plans].sort((a, b) => a.sortOrder - b.sortOrder));
    } catch {
      toast.error("Không tải được danh sách gói dịch vụ");
    }
  };

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
        ]);
        if (cancelled) return;

        setOverview(overviewRes);
        setRevenueAnalytics(revenueRes);
        setUsersAnalytics(usersAnalyticsRes);
        setAssetsAnalytics(assetsAnalyticsRes);
        setOrdersAnalytics(ordersAnalyticsRes);

        setUsers(
          usersRes.data.map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            credits: u.walletBalance,
            role: u.role,
            registeredAt: u.createdAt.split("T")[0],
            totalSpent: u.totalSpentVnd,
            subscription: u.subscriptionPlan as UserData["subscription"],
          }))
        );

        setOrders(ordersRes.data.map(mapApiOrderToAdmin));

        setPackages([...plans].sort((a, b) => a.sortOrder - b.sortOrder));

        const approved = assetsRes.data.map(mapAssetListItem);
        const pending = pendingRes.data.map(mapAssetListItem);
        setAssets(
          [...pending, ...approved].map((a) => ({
            id: a.id,
            title: a.title,
            category: a.category as AssetCategory,
            price: a.price,
            rating: a.rating,
            downloads: a.downloads,
            isFree: a.isFree,
          }))
        );
      } catch {
        toast.error("Không tải được dữ liệu admin — kiểm tra BE và quyền admin");
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const reload = async () => {
      try {
        const [assetsRes, pendingRes] = await Promise.all([
          fetchAdminAssets(1, 100, "approved"),
          fetchPendingAssets(1, 100),
        ]);
        const approved = assetsRes.data.map(mapAssetListItem);
        const pending = pendingRes.data.map(mapAssetListItem);
        setAssets(
          [...pending, ...approved].map((a) => ({
            id: a.id,
            title: a.title,
            category: a.category as AssetCategory,
            price: a.price,
            rating: a.rating,
            downloads: a.downloads,
            isFree: a.isFree,
          }))
        );
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
      value: overview?.totalAssets ?? assets.length,
      icon: <Package className="w-6 h-6" />,
      color: "from-secondary to-secondary/80",
      change: `${overview?.pendingAssets ?? 0} chờ duyệt`,
      detail: `${assets.filter((a) => a.isFree).length} miễn phí · ${assets.filter((a) => !a.isFree).length} trả phí`,
    },
    {
      label: "Đơn hàng",
      value: overview?.totalOrders ?? orders.length,
      icon: <ShoppingCart className="w-6 h-6" />,
      color: "from-success to-success/80",
      change: `${orders.filter((o) => o.status === "completed").length} hoàn thành`,
      detail: `${orders.filter((o) => o.status === "pending").length} đang xử lý`,
    },
    {
      label: "Doanh thu",
      value: formatVndShort(overview?.revenueVnd ?? revenueAnalytics?.totalRevenueVnd ?? 0),
      icon: <DollarSign className="w-6 h-6" />,
      color: "from-warning to-warning/80",
      change: `${formatVndShort(revenueAnalytics?.totalRevenueVnd ?? 0)} / 7 ngày`,
      detail: `${overview?.totalDownloads ?? 0} lượt tải asset`,
    },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: "overview", label: "Tổng quan", icon: <BarChart3 className="w-4 h-4" /> },
              { id: "users", label: "Người dùng", icon: <Users className="w-4 h-4" /> },
              { id: "assets", label: "Assets", icon: <Package className="w-4 h-4" /> },
              { id: "orders", label: "Đơn hàng", icon: <ShoppingCart className="w-4 h-4" /> },
              { id: "packages", label: "Gói dịch vụ", icon: <CreditCard className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`px-6 py-3 rounded-xl whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-[0_0_30px_rgba(0,217,255,0.3)]"
                    : "bg-card/50 text-muted-foreground hover:bg-card border border-border hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
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
            loading={dashboardLoading}
          />
        )}

        {activeTab === "users" && (
          <UsersManagement
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            users={users}
            setUsers={setUsers}
            orders={orders}
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
  loading: boolean;
}) {
  const revenueData =
    revenueAnalytics?.byDay.map((d) => ({
      date: formatChartDay(d.date),
      revenue: Math.round(d.count / 1000),
      revenueVnd: d.count,
    })) ?? [];

  const packageCounts = users.reduce<Record<string, number>>((acc, u) => {
    const key = (u.subscription || "free").toLowerCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const packageData = Object.entries(packageCounts).map(([name, value]) => ({
    id: `pkg-${name}`,
    name: name.toUpperCase(),
    value,
    color: PLAN_CHART_COLORS[name] ?? "#64748b",
  }));

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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground">Đang tải thống kê từ BE...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:scale-105 transition-all hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]"
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
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/50 transition-all">
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
                formatter={(value: number, _name, item) => [
                  `${(item.payload.revenueVnd as number).toLocaleString("vi-VN")}đ`,
                  "Doanh thu",
                ]}
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  color: "#f8f9fa",
                }}
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
        </div>

        {/* Package Distribution Pie Chart */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <PieChart className="w-5 h-5 text-secondary" />
              Phân bổ gói dịch vụ
            </h3>
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
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  color: "#f8f9fa",
                }}
              />
            </RePieChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/50 transition-all">
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
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  color: "#f8f9fa",
                }}
              />
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
        </div>

        {/* Assets by Category Bar Chart */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/50 transition-all">
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
            <BarChart data={assetsByCategory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="category" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  color: "#f8f9fa",
                }}
              />
              <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Orders & Top Assets */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
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
        </div>

        {/* Top Assets */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
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
        </div>
      </div>
    </div>
  );
}

// Users Management Component
function UsersManagement({
  searchQuery,
  setSearchQuery,
  users,
  setUsers,
  orders,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  users: UserData[];
  setUsers: (users: UserData[]) => void;
  orders: Order[];
}) {
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserData | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const { paged: pagedUsers, totalPages } = getPageSlice(filteredUsers, page, pageSize);

  const handleEdit = (user: UserData) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    const original = users.find((u) => u.id === editingUser.id);
    if (!original) return;

    setSaving(true);
    try {
      if (original.role !== editingUser.role) {
        await updateAdminUser(editingUser.id, { role: editingUser.role });
      }
      if (original.credits !== editingUser.credits) {
        await patchWalletBalance(editingUser.id, editingUser.credits, "Admin dashboard adjustment");
      }
      setUsers(users.map((u) => (u.id === editingUser.id ? editingUser : u)));
      toast.success("Đã cập nhật user trên BE");
      setShowEditModal(false);
      setEditingUser(null);
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
      setUsers(users.filter((u) => u.id !== deleteTarget.id));
      toast.success("Đã xóa user");
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Xóa user thất bại");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Quản lý người dùng</h2>
        <div className="flex gap-3">
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
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-muted-foreground font-medium py-3 px-4">ID</th>
              <th className="text-left text-muted-foreground font-medium py-3 px-4">Tên</th>
              <th className="text-left text-muted-foreground font-medium py-3 px-4">Email</th>
              <th className="text-left text-muted-foreground font-medium py-3 px-4">Credits</th>
              <th className="text-left text-muted-foreground font-medium py-3 px-4">Gói</th>
              <th className="text-left text-muted-foreground font-medium py-3 px-4">Role</th>
              <th className="text-left text-muted-foreground font-medium py-3 px-4">Đã chi</th>
              <th className="text-right text-muted-foreground font-medium py-3 px-4">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {pagedUsers.map((user) => (
              <tr key={user.id} className="border-b border-border/50 hover:bg-card/50">
                <td className="py-4 px-4 text-muted-foreground font-mono">{user.id}</td>
                <td className="py-4 px-4 text-foreground font-medium">{user.name}</td>
                <td className="py-4 px-4 text-muted-foreground">{user.email}</td>
                <td className="py-4 px-4 text-foreground font-bold font-mono">{user.credits}</td>
                <td className="py-4 px-4">
                  {user.subscription ? (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        user.subscription === "pro"
                          ? "bg-warning/20 text-warning"
                          : user.subscription === "indie"
                          ? "bg-secondary/20 text-secondary"
                          : user.subscription === "student"
                          ? "bg-primary/20 text-primary"
                          : "bg-muted/20 text-muted-foreground"
                      }`}
                    >
                      {user.subscription.toUpperCase()}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-muted/20 text-muted-foreground">
                      FREE
                    </span>
                  )}
                </td>
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
                <td className="py-4 px-4 text-foreground font-mono">
                  {user.totalSpent.toLocaleString("vi-VN")} xu
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setViewingUser(user)}
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-warning hover:text-warning/80 transition-colors"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(user)}
                      className="text-destructive hover:text-destructive/80 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ClientPagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <ConfirmActionDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
        title="Xóa người dùng?"
        description={
          <>
            Bạn sắp xóa{" "}
            <span className="font-semibold text-foreground">{deleteTarget?.name}</span>{" "}
            <span className="font-mono text-xs">({deleteTarget?.email})</span>. Hành động này không
            thể hoàn tác.
          </>
        }
        confirmLabel="Xóa user"
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

                  <div className="grid sm:grid-cols-2 gap-4">
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
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="bg-card/50 border border-border rounded-xl p-4">
                    <p className="text-sm font-semibold text-muted-foreground mb-3">
                      Gói dịch vụ
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-2">
                          Subscription
                        </label>
                        <select
                          value={editingUser.subscription || ""}
                          disabled
                          className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground/70 focus:outline-none disabled:opacity-70"
                        >
                          <option value="">FREE</option>
                          <option value="student">STUDENT (29k)</option>
                          <option value="indie">INDIE (legacy)</option>
                          <option value="pro">PRO (99k)</option>
                        </select>
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
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(0,217,255,0.3)] disabled:opacity-60"
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
        open={!!viewingUser}
        onOpenChange={(open) => {
          if (!open) setViewingUser(null);
        }}
      >
        {viewingUser && (
          <SheetContent className="p-0 sm:max-w-2xl">
            <div className="flex h-full flex-col">
              <SheetHeader className="border-b border-border p-6">
                <SheetTitle>Chi tiết User</SheetTitle>
                <SheetDescription className="hidden sm:block">
                  Thông tin tổng quan
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">ID</p>
                      <p className="text-foreground font-medium font-mono">
                        {viewingUser.id}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Role</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          viewingUser.role === "admin"
                            ? "bg-destructive/20 text-destructive"
                            : "bg-primary/20 text-primary"
                        }`}
                      >
                        {viewingUser.role}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tên</p>
                      <p className="text-foreground font-medium">
                        {viewingUser.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Email</p>
                      <p className="text-foreground font-medium">
                        {viewingUser.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Credits</p>
                      <p className="text-foreground font-bold text-lg font-mono">
                        {viewingUser.credits}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Tổng chi tiêu
                      </p>
                      <p className="text-foreground font-bold text-lg font-mono">
                        {viewingUser.totalSpent.toLocaleString("vi-VN")}đ
                      </p>
                    </div>

                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">
                        Ngày đăng ký
                      </p>
                      <p className="text-foreground font-medium">
                        {viewingUser.registeredAt}
                      </p>
                    </div>
                  </div>

                  {(() => {
                    const userOrders = orders
                      .filter((o) => o.userId === viewingUser.id)
                      .sort((a, b) => (a.date < b.date ? 1 : -1));

                    const assetOrders = userOrders.filter((o) => o.orderType === "asset");

                    return (
                      <div className="space-y-4 pt-2">
                        <div className="bg-card/50 border border-border rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-foreground">Đơn hàng</h4>
                            <span className="text-sm text-muted-foreground font-mono">
                              {userOrders.length} đơn
                            </span>
                          </div>
                          {userOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              Chưa có đơn hàng nào.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {userOrders.slice(0, 5).map((o) => (
                                <div
                                  key={o.id}
                                  className="bg-card border border-border rounded-lg p-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-foreground font-mono font-bold">
                                      {o.orderCode}
                                    </p>
                                    <span className="text-sm font-bold text-primary font-mono">
                                      {formatAdminOrderAmount(o)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {o.date} • {o.items.length} sản phẩm
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {o.items.join(", ")}
                                  </p>
                                </div>
                              ))}
                              {userOrders.length > 5 && (
                                <p className="text-xs text-muted-foreground">
                                  +{userOrders.length - 5} đơn khác (xem trong tab Đơn hàng).
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="bg-card/50 border border-border rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-foreground">Đơn mua asset</h4>
                            <span className="text-sm text-muted-foreground font-mono">
                              {assetOrders.length} đơn
                            </span>
                          </div>
                          {assetOrders.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              Chưa có đơn mua asset từ BE.
                            </p>
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
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
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
  const [autoApprove, setAutoApprove] = useState(() => localStorage.getItem("admin_auto_approve") === "true");
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

  const handleEditFromRecord = async (asset: AssetRecord) => {
    setLoadingEdit(true);
    try {
      const detail = await fetchAssetById(asset.id);
      setEditingAsset(mapAssetDetailToEditRecord(detail));
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
      {/* Auto-approve toggle */}
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-foreground">Thiết lập duyệt asset</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Bật Auto-approve để asset do admin submit được duyệt ngay; user khác vẫn chờ duyệt.
            </p>
          </div>
          <label className="flex items-center gap-3 select-none">
            <input
              type="checkbox"
              checked={autoApprove}
              onChange={(e) => {
                const next = e.target.checked;
                setAutoApprove(next);
                localStorage.setItem("admin_auto_approve", String(next));
                toast.success(next ? "Đã bật Auto-approve" : "Đã tắt Auto-approve");
              }}
              className="w-5 h-5 rounded bg-card border-border"
            />
            <span className="text-foreground font-medium">Auto-approve (admin submit)</span>
          </label>
        </div>
      </div>

      {/* Pending Assets */}
      {pendingAssets.length > 0 && (
        <div className="bg-card/50 backdrop-blur-sm border border-warning/30 rounded-2xl p-6">
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
                {asset.thumbnailPreview && (
                  <img
                    src={asset.thumbnailPreview}
                    alt={asset.title}
                    className="w-full h-32 object-cover rounded-lg mb-3 border border-border"
                  />
                )}
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
        </div>
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
                <div className="bg-card/50 border border-border rounded-xl p-4">
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
      <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
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
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:shadow-[0_0_30px_rgba(0,217,255,0.3)]"
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
              className="bg-card/50 backdrop-blur-sm border rounded-xl overflow-hidden hover:scale-105 transition-all group border-border hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]"
            >
              {/* Preview Image (sync with Marketplace card) */}
              <div
                className="relative aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden cursor-pointer"
                onClick={() => setViewingApprovedAsset(asset)}
              >
                <ImageWithFallback
                  src={
                    asset.thumbnailPreview ||
                    `https://source.unsplash.com/400x300/?${encodeURIComponent(
                      asset.title
                    )}`
                  }
                  alt={asset.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
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
                    {asset.creatorName || "GameAssets Store"}
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
            <SheetContent className="p-0 sm:max-w-2xl">
              <div className="flex h-full flex-col">
                <SheetHeader className="border-b border-border p-6">
                  <SheetTitle className="text-2xl font-bold text-foreground">
                    {viewingApprovedAsset.title}
                  </SheetTitle>
                  <SheetDescription className="text-muted-foreground">
                    by {viewingApprovedAsset.creatorName || "GameAssets Store"}
                  </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
                    <ImageWithFallback
                      src={
                        viewingApprovedAsset.thumbnailPreview ||
                        `https://source.unsplash.com/800x600/?${encodeURIComponent(
                          viewingApprovedAsset.title
                        )}`
                      }
                      alt={viewingApprovedAsset.title}
                      className="w-full h-full object-cover"
                    />
                    {viewingApprovedAsset.isFree && (
                      <div className="absolute top-4 left-4 bg-success text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        MIỄN PHÍ
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-card/50 border border-border rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <TrendingUp className="w-5 h-5 text-warning" />
                        <span className="text-2xl font-bold text-foreground">
                          {viewingApprovedAsset.rating}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Rating</p>
                    </div>
                    <div className="bg-card/50 border border-border rounded-xl p-4 text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <Download className="w-5 h-5 text-primary" />
                        <span className="text-2xl font-bold text-foreground font-mono">
                          {viewingApprovedAsset.downloads}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Downloads</p>
                    </div>
                    <div className="bg-card/50 border border-border rounded-xl p-4 text-center">
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
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
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
            <SheetContent className="p-0 sm:max-w-2xl">
              <div className="flex h-full flex-col">
                <SheetHeader className="border-b border-border p-6">
                  <SheetTitle>Chỉnh sửa Asset</SheetTitle>
                  <SheetDescription className="hidden sm:block">
                    Cập nhật thông tin hiển thị trong marketplace
                  </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6">
                  <AssetForm
                    asset={editingAsset}
                    onChange={setEditingAsset}
                    categories={categories}
                    tagGroups={tagGroups}
                  />
                </div>

                <div className="border-t border-border p-6 flex gap-3">
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
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {savingEdit ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Lưu
                  </button>
                </div>
              </div>
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
              <span className="font-semibold text-foreground">{deleteTarget?.title}</span> sẽ bị xóa
              khỏi marketplace. Hành động này không thể hoàn tác.
            </>
          }
          confirmLabel="Xóa asset"
          loading={deleting}
          onConfirm={confirmDeleteAsset}
        />
      </div>
    </div>
  );
}

function AssetForm({
  asset,
  onChange,
  categories,
  tagGroups,
}: {
  asset: AssetRecord;
  onChange: (asset: AssetRecord) => void;
  categories: CategoryItem[];
  tagGroups: TagGroupItem[];
}) {
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);

  const handleThumbnailUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Chọn file ảnh PNG, JPG hoặc WEBP");
      return;
    }
    setUploadingThumb(true);
    try {
      const meta = await getAssetUploadUrl(asset.id, "Image", file.name, file.type, file.size);
      await uploadToSignedUrl(meta.uploadUrl, file, file.type);
      await registerAssetImage(asset.id, {
        storagePath: meta.storagePath,
        altText: asset.title,
        sortOrder: 0,
        isThumbnail: true,
      });
      const detail = await fetchAssetById(asset.id);
      onChange(mapAssetDetailToEditRecord(detail));
      toast.success("Đã cập nhật ảnh thumbnail");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Upload thumbnail thất bại");
    } finally {
      setUploadingThumb(false);
    }
  };

  const toggleTag = (tagName: string) => {
    const has = asset.tags.includes(tagName);
    onChange({
      ...asset,
      tags: has ? asset.tags.filter((t) => t !== tagName) : [...asset.tags, tagName],
    });
  };

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="space-y-3">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10">
          <ImageWithFallback
            src={
              asset.thumbnailPreview ||
              `https://source.unsplash.com/800x600/?${encodeURIComponent(asset.title)}`
            }
            alt={asset.title}
            className="w-full h-full object-cover"
          />
          {asset.isFree && (
            <div className="absolute top-4 left-4 bg-success text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
              MIỄN PHÍ
            </div>
          )}
        </div>
        <input
          ref={thumbnailInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleThumbnailUpload(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={uploadingThumb}
          onClick={() => thumbnailInputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-xl p-4 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm text-muted-foreground disabled:opacity-60"
        >
          {uploadingThumb ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Đang tải lên...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Tải ảnh thumbnail mới
            </>
          )}
        </button>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 shrink-0" />
          Ảnh lưu trên Supabase Storage — không cần dán URL thủ công.
        </p>
      </div>

      {/* Basic */}
      <div className="bg-card/50 border border-border rounded-2xl p-5 space-y-4">
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
      <div className="bg-card/50 border border-border rounded-2xl p-5 space-y-4">
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
      <div className="bg-card/50 border border-border rounded-2xl p-5 space-y-4">
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

        <div className="space-y-4 rounded-xl border border-border bg-background/40 p-4 max-h-[420px] overflow-y-auto">
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
      <div className="bg-card/50 border border-border rounded-2xl p-5 space-y-4">
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
      <div className="bg-card/50 border border-border rounded-2xl p-5 space-y-4">
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
      <div className="bg-card/50 border border-border rounded-2xl p-5 space-y-4">
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
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  users: UserData[];
}) {
  const { refreshUserData } = useAuth();
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [actionOrderId, setActionOrderId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const filteredOrders = orders.filter(
    (order) =>
      order.orderCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );
  const { paged: pagedOrders, totalPages } = getPageSlice(filteredOrders, page, pageSize);

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

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className={cn(componentClasses.card, "hover:scale-100 p-6")}>
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

      {pagedOrders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Chưa có đơn hàng phù hợp</p>
        </div>
      ) : (
      <div className="space-y-4">
        {pagedOrders.map((order) => (
          <div
            key={order.id}
            className={cn(
              componentClasses.cardSimple,
              "p-5 hover:scale-100",
              order.status === "pending" && "border-warning/40 bg-warning/5"
            )}
          >
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h3 className="font-bold text-foreground text-lg font-mono">{order.orderCode}</h3>
                  <span className={orderStatusBadgeClass(order.status)}>
                    {orderStatusLabel(order.status)}
                  </span>
                  <span className={componentClasses.badgePrimary}>
                    {order.orderType === "subscription" ? "Gói DV" : "Asset"}
                  </span>
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
        ))}
      </div>
      )}

      <ClientPagination page={page} totalPages={totalPages} onPageChange={setPage} />

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
                        {viewingOrder.orderType === "subscription" ? "Gói dịch vụ" : "Asset"}
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
    </div>
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
    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
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
          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:shadow-[0_0_30px_rgba(0,217,255,0.3)] disabled:opacity-50"
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
    </div>
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
    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
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
          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:shadow-[0_0_30px_rgba(0,217,255,0.3)] disabled:opacity-50"
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
    </div>
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
        className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(0,217,255,0.3)] disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {saving ? "Đang lưu..." : "Lưu"}
      </button>
    </div>
  );
}

// Modal Component
function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Xác nhận",
  loading = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && loading) return;
        onOpenChange(next);
      }}
    >
      <AlertDialogContent className="bg-card border-border sm:max-w-md">
        <AlertDialogHeader>
          <div className="mx-auto sm:mx-0 mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <AlertDialogTitle className="text-foreground text-xl">{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground leading-relaxed">{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel disabled={loading} className="border-border hover:bg-muted/50">
            Đóng
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {confirmLabel}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

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