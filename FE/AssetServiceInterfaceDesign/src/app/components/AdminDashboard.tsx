import { useState, useEffect } from "react";
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
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import ClientPagination, { getPageSlice } from "./ui/ClientPagination";
import type { AssetRecord } from "../../types/asset";
import { ASSET_CATEGORIES, TAG_GROUPS, type AssetCategory } from "../../types/asset";
import {
  getApprovedAssets,
  getPendingAssets,
  approveAsset,
  rejectAsset,
  deleteAsset,
  updateAsset,
} from "../../utils/assetStorage";
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

type Tab = "overview" | "users" | "assets" | "orders" | "packages";

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
  userId: string;
  userName: string;
  items: string[];
  total: number;
  status: "completed" | "pending" | "cancelled";
  date: string;
}

interface PackageData {
  id: string;
  name: string;
  price: number;
  credits: number;
  sales: number;
  revenue: number;
}

interface AssetData extends Pick<
  AssetRecord,
  "id" | "title" | "category" | "price" | "rating" | "downloads" | "isFree"
> {}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [searchQuery, setSearchQuery] = useState("");

  // Load data from localStorage
  const [users, setUsers] = useState<UserData[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [assets, setAssets] = useState<AssetData[]>([]);

  // Function to reload packages from localStorage
  const reloadPackages = () => {
    const packagesData = localStorage.getItem("admin_packages");
    if (packagesData) {
      setPackages(JSON.parse(packagesData));
    }
  };

  useEffect(() => {
    // Load users
    const usersData = localStorage.getItem("users");
    if (usersData) {
      const usersObj = JSON.parse(usersData);
      const usersList = Object.keys(usersObj).map((email) => ({
        id: usersObj[email].id,
        email: email,
        name: usersObj[email].name,
        credits: usersObj[email].credits || 0,
        role: usersObj[email].role || "customer",
        registeredAt: usersObj[email].registeredAt || "2024-01-01",
        totalSpent: usersObj[email].totalSpent || 0,
        subscription: usersObj[email].subscription,
        subscriptionExpiry: usersObj[email].subscriptionExpiry,
        avatarDataUrl: usersObj[email].avatarDataUrl ?? null,
      }));
      setUsers(usersList);
    }

    // Load orders
    const ordersData = localStorage.getItem("admin_orders");
    if (ordersData) {
      setOrders(JSON.parse(ordersData));
    } else {
      const initialOrders = [
        {
          id: "ORD-001",
          userId: "1",
          userName: "Nguyễn Văn A",
          items: ["Fantasy Character Pack", "Modern UI Kit"],
          total: 248000,
          status: "completed" as const,
          date: "2024-02-23",
        },
        {
          id: "ORD-002",
          userId: "2",
          userName: "Trần Thị B",
          items: ["Gói Pro"],
          total: 299000,
          status: "completed" as const,
          date: "2024-02-24",
        },
      ];
      setOrders(initialOrders);
      localStorage.setItem("admin_orders", JSON.stringify(initialOrders));
    }

    // Load packages
    const packagesData = localStorage.getItem("admin_packages");
    if (packagesData) {
      const existingPackages = JSON.parse(packagesData);
      // Check if we need to update to the new package structure
      if (existingPackages.length !== 4 || !existingPackages.find((p: PackageData) => p.name === "STUDENT")) {
        // Update to new packages
        const initialPackages = [
          {
            id: "PKG-001",
            name: "FREE",
            price: 0,
            credits: 10,
            sales: 150,
            revenue: 0,
          },
          {
            id: "PKG-002",
            name: "STUDENT",
            price: 29000,
            credits: 100,
            sales: 89,
            revenue: 2581000,
          },
          {
            id: "PKG-003",
            name: "INDIE",
            price: 99000,
            credits: -1, // unlimited
            sales: 34,
            revenue: 3366000,
          },
          {
            id: "PKG-004",
            name: "PRO",
            price: 199000,
            credits: -1, // unlimited
            sales: 12,
            revenue: 2388000,
          },
        ];
        setPackages(initialPackages);
        localStorage.setItem("admin_packages", JSON.stringify(initialPackages));
      } else {
        setPackages(existingPackages);
      }
    } else {
      const initialPackages = [
        {
          id: "PKG-001",
          name: "FREE",
          price: 0,
          credits: 20,
          sales: 150,
          revenue: 0,
        },
        {
          id: "PKG-002",
          name: "STUDENT",
          price: 29000,
          credits: 100,
          sales: 89,
          revenue: 2581000,
        },
        {
          id: "PKG-003",
          name: "INDIE",
          price: 99000,
          credits: -1, // unlimited
          sales: 34,
          revenue: 3366000,
        },
        {
          id: "PKG-004",
          name: "PRO",
          price: 199000,
          credits: -1, // unlimited
          sales: 12,
          revenue: 2388000,
        },
      ];
      setPackages(initialPackages);
      localStorage.setItem("admin_packages", JSON.stringify(initialPackages));
    }

    // Load assets
    setAssets(getApprovedAssets());
  }, []);

  useEffect(() => {
    const reload = () => setAssets(getApprovedAssets());
    window.addEventListener("assetsUpdated", reload);
    return () => window.removeEventListener("assetsUpdated", reload);
  }, []);

  // Reload packages when switching to packages tab
  useEffect(() => {
    if (activeTab === "packages") {
      reloadPackages();
    }
  }, [activeTab]);

  // Auto-reload packages when window regains focus (admin comes back)
  useEffect(() => {
    const handleFocus = () => {
      if (activeTab === "packages") {
        reloadPackages();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeTab]);

  // Listen for localStorage changes to auto-reload
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'admin_packages') {
        reloadPackages();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Custom event listener for same-window updates
  useEffect(() => {
    const handlePackageUpdate = () => {
      reloadPackages();
    };
    window.addEventListener('packageUpdated', handlePackageUpdate);
    return () => window.removeEventListener('packageUpdated', handlePackageUpdate);
  }, []);

  const stats = [
    {
      label: "Tổng người dùng",
      value: users.filter((u) => u.role === "customer").length,
      icon: <Users className="w-6 h-6" />,
      color: "from-primary to-primary/80",
      change: "+12%",
      detail: `${users.filter((u) => u.subscription && ["student", "indie", "pro"].includes(u.subscription)).length} có subscription`,
    },
    {
      label: "Tổng Assets",
      value: assets.length,
      icon: <Package className="w-6 h-6" />,
      color: "from-secondary to-secondary/80",
      change: `${assets.filter((a) => !a.isFree).length} trả phí`,
      detail: `${assets.filter((a) => a.isFree).length} miễn phí`,
    },
    {
      label: "Đơn hàng",
      value: orders.length,
      icon: <ShoppingCart className="w-6 h-6" />,
      color: "from-success to-success/80",
      change: `${orders.filter((o) => o.status === "completed").length} hoàn thành`,
      detail: `${orders.filter((o) => o.status === "pending").length} đang xử lý`,
    },
    {
      label: "Doanh thu",
      value: `${Math.floor(orders.reduce((sum, o) => sum + (o.status === "completed" ? o.total : 0), 0) / 1000)}k`,
      icon: <DollarSign className="w-6 h-6" />,
      color: "from-warning to-warning/80",
      change: "+18%",
      detail: `${orders.filter((o) => o.status === "completed").length} giao dịch`,
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
          <OverviewTab stats={stats} orders={orders} assets={assets} />
        )}

        {activeTab === "users" && (
          <UsersManagement
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            users={users}
            setUsers={setUsers}
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
          <PackagesManagement packages={packages} setPackages={setPackages} />
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
}: {
  stats: any[];
  orders: Order[];
  assets: AssetData[];
}) {
  // Prepare chart data - Revenue over time (last 7 days)
  const revenueData = [
    { date: "18/03", revenue: 350 },
    { date: "19/03", revenue: 420 },
    { date: "20/03", revenue: 380 },
    { date: "21/03", revenue: 510 },
    { date: "22/03", revenue: 620 },
    { date: "23/03", revenue: 580 },
    { date: "24/03", revenue: 720 },
  ];

  // Package distribution data
  const packageData = [
    { id: "pkg-free", name: "FREE", value: 150, color: "#64748b" },
    { id: "pkg-student", name: "STUDENT", value: 89, color: "#00d9ff" },
    { id: "pkg-indie", name: "INDIE", value: 34, color: "#a855f7" },
    { id: "pkg-pro", name: "PRO", value: 12, color: "#f59e0b" },
  ];

  // Assets by category
  const assetsByCategory = assets.reduce((acc, asset) => {
    const existing = acc.find(item => item.category === asset.category);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ category: asset.category, count: 1 });
    }
    return acc;
  }, [] as { category: string; count: number }[]);

  // User growth data
  const userGrowthData = [
    { month: "T10", users: 45 },
    { month: "T11", users: 78 },
    { month: "T12", users: 120 },
    { month: "T1", users: 198 },
    { month: "T2", users: 252 },
    { month: "T3", users: 285 },
  ];

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
            <span className="text-success text-sm font-bold">+24%</span>
          </div>
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
              <YAxis stroke="#64748b" />
              <Tooltip
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
        </div>

        {/* Package Distribution Pie Chart */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <PieChart className="w-5 h-5 text-secondary" />
              Phân bổ gói dịch vụ
            </h3>
          </div>
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
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-success" />
              Tăng trưởng người dùng
            </h3>
            <span className="text-success text-sm font-bold">+533%</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
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
        </div>

        {/* Assets by Category Bar Chart */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/50 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-warning" />
              Assets theo danh mục
            </h3>
          </div>
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
                  <p className="font-bold text-foreground font-mono">{order.id}</p>
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
                    {order.total.toLocaleString("vi-VN")} xu
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
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  users: UserData[];
  setUsers: (users: UserData[]) => void;
}) {
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewingUser, setViewingUser] = useState<UserData | null>(null);
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

  const handleSaveEdit = () => {
    if (!editingUser) return;

    const updatedUsers = users.map((u) =>
      u.id === editingUser.id ? editingUser : u
    );
    setUsers(updatedUsers);

    // Update localStorage
    const usersData = localStorage.getItem("users");
    if (usersData) {
      const usersObj = JSON.parse(usersData);
      usersObj[editingUser.email] = {
        ...usersObj[editingUser.email],
        name: editingUser.name,
        credits: editingUser.credits,
        role: editingUser.role,
        subscription: editingUser.subscription,
        subscriptionExpiry: editingUser.subscriptionExpiry,
        avatarDataUrl: editingUser.avatarDataUrl ?? usersObj[editingUser.email]?.avatarDataUrl ?? null,
      };
      localStorage.setItem("users", JSON.stringify(usersObj));
    }

    // Keep current session in sync if editing the logged-in user
    const currentUserRaw = localStorage.getItem("currentUser");
    if (currentUserRaw) {
      const current = JSON.parse(currentUserRaw);
      if (current?.id === editingUser.id) {
        const next = {
          ...current,
          name: editingUser.name,
          credits: editingUser.credits,
          role: editingUser.role,
          subscription: editingUser.subscription || "free",
          subscriptionExpiry: editingUser.subscriptionExpiry,
          avatarDataUrl: editingUser.avatarDataUrl ?? current.avatarDataUrl,
        };
        localStorage.setItem("currentUser", JSON.stringify(next));
      }
    }

    setShowEditModal(false);
    setEditingUser(null);
  };

  const handleDelete = (userId: string) => {
    if (!confirm("Bạn có chắc muốn xóa user này?")) return;

    const userToDelete = users.find((u) => u.id === userId);
    if (!userToDelete) return;

    const updatedUsers = users.filter((u) => u.id !== userId);
    setUsers(updatedUsers);

    // Update localStorage
    const usersData = localStorage.getItem("users");
    if (usersData) {
      const usersObj = JSON.parse(usersData);
      delete usersObj[userToDelete.email];
      localStorage.setItem("users", JSON.stringify(usersObj));
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
                      onClick={() => handleDelete(user.id)}
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
                        value={`${(editingUser.totalSpent || 0).toLocaleString("vi-VN")} xu`}
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
                      onChange={(e) =>
                        setEditingUser({ ...editingUser, name: e.target.value })
                      }
                      className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
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
                          onChange={(e) => {
                            const next = e.target.value as "" | "student" | "indie" | "pro";
                            setEditingUser({
                              ...editingUser,
                              subscription: next === "" ? undefined : next,
                            });
                          }}
                          className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="">FREE</option>
                          <option value="student">STUDENT</option>
                          <option value="indie">INDIE</option>
                          <option value="pro">PRO</option>
                        </select>
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
                          onChange={(e) => {
                            const v = e.target.value;
                            setEditingUser({
                              ...editingUser,
                              subscriptionExpiry: v ? new Date(v).toISOString() : undefined,
                            });
                          }}
                          className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveEdit}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(0,217,255,0.3)]"
                  >
                    <Save className="w-5 h-5" />
                    Lưu thay đổi
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
                        {viewingUser.totalSpent.toLocaleString("vi-VN")} xu
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

                  {/* Purchase details (from localStorage demo) */}
                  {(() => {
                    const ordersRaw = localStorage.getItem("admin_orders");
                    const allOrders: Order[] = ordersRaw ? JSON.parse(ordersRaw) : [];
                    const userOrders = allOrders
                      .filter((o) => o.userId === viewingUser.id)
                      .sort((a, b) => (a.date < b.date ? 1 : -1));

                    const purchasedRaw = localStorage.getItem(
                      `purchased_assets_${viewingUser.id}`
                    );
                    const purchasedAssets: Array<{
                      id: string;
                      title: string;
                      category: string;
                      price: number;
                      purchaseDate: string;
                      downloadCount: number;
                      fileSize: string;
                      fileType: string;
                    }> = purchasedRaw ? JSON.parse(purchasedRaw) : [];

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
                                      {o.id}
                                    </p>
                                    <span className="text-sm font-bold text-primary font-mono">
                                      {o.total.toLocaleString("vi-VN")} xu
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
                            <h4 className="font-bold text-foreground">Assets đã mua</h4>
                            <span className="text-sm text-muted-foreground font-mono">
                              {purchasedAssets.length} assets
                            </span>
                          </div>
                          {purchasedAssets.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              Chưa có asset nào được mua.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {purchasedAssets.slice(0, 6).map((a) => (
                                <div
                                  key={a.id}
                                  className="bg-card border border-border rounded-lg p-3"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="font-bold text-foreground truncate">
                                        {a.title}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {a.category} • {a.fileType} • {a.fileSize}
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="text-xs text-muted-foreground">
                                        {a.purchaseDate}
                                      </p>
                                      <p className="text-xs font-mono text-primary">
                                        {a.price.toLocaleString("vi-VN")} xu
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        tải: {a.downloadCount}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {purchasedAssets.length > 6 && (
                                <p className="text-xs text-muted-foreground">
                                  +{purchasedAssets.length - 6} asset khác (xem ở trang Thư viện của user).
                                </p>
                              )}
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
  const pendingPageSize = 6;
  const approvedPageSize = 12;

  const reload = () => {
    setAssets(getApprovedAssets());
    setPendingAssets(getPendingAssets());
    setApprovedAssetRecords(getApprovedAssets());
  };

  useEffect(() => {
    reload();
    window.addEventListener("assetsUpdated", reload);
    return () => window.removeEventListener("assetsUpdated", reload);
  }, [setAssets]);

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

  const handleEditFromRecord = (asset: AssetRecord) => {
    setEditingAsset({ ...asset });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingAsset) return;
    updateAsset(editingAsset.id, {
      title: editingAsset.title,
      shortDescription: editingAsset.shortDescription,
      fullDescription: editingAsset.fullDescription,
      category: editingAsset.category,
      tags: editingAsset.tags,
      price: editingAsset.isFree ? 0 : editingAsset.price,
      rating: editingAsset.rating,
      downloads: editingAsset.downloads,
      isFree: editingAsset.isFree,
      priceType: editingAsset.isFree ? "free" : "paid",
    });
    reload();
    setShowEditModal(false);
    setEditingAsset(null);
  };

  const handleDelete = (assetId: string) => {
    if (!confirm("Bạn có chắc muốn xóa asset này?")) return;
    deleteAsset(assetId);
    reload();
  };

  const handleApprove = (id: string) => {
    approveAsset(id);
    reload();
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
                  onClick={() => {
                    rejectAsset(rejectingAsset.id, rejectReason);
                    toast.success("Đã từ chối asset");
                    setRejectingAsset(null);
                    setRejectReason("");
                    reload();
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
                      onClick={() => handleDelete(asset.id)}
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
                      setTimeout(() => handleDelete(viewingApprovedAsset.id), 0);
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
                  <AssetForm asset={editingAsset} onChange={setEditingAsset} />
                </div>

                <div className="border-t border-border p-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingAsset(null);
                    }}
                    className="flex-1 bg-card hover:bg-card/80 border border-border text-foreground py-3 rounded-lg font-bold transition-all"
                  >
                    Huỷ
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Lưu
                  </button>
                </div>
              </div>
            </SheetContent>
          )}
        </Sheet>
      </div>
    </div>
  );
}

function AssetForm({
  asset,
  onChange,
}: {
  asset: AssetRecord;
  onChange: (asset: any) => void;
}) {
  const toggleTag = (tag: string) => {
    const has = asset.tags.includes(tag);
    onChange({
      ...asset,
      tags: has ? asset.tags.filter((t: string) => t !== tag) : [...asset.tags, tag],
    });
  };

  return (
    <div className="space-y-6">
      {/* Preview */}
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
            value={asset.category}
            onChange={(e) =>
              onChange({ ...asset, category: e.target.value as AssetCategory })
            }
            className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          >
            {ASSET_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Rating
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={asset.rating}
              onChange={(e) =>
                onChange({ ...asset, rating: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Downloads
            </label>
            <input
              type="number"
              min="0"
              value={asset.downloads}
              onChange={(e) =>
                onChange({ ...asset, downloads: parseInt(e.target.value) || 0 })
              }
              className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
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
          {TAG_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.tags.map((tag) => {
                  const selected = asset.tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all ${
                        selected
                          ? "bg-primary/20 text-primary border-primary/50 shadow-[0_0_12px_rgba(0,217,255,0.15)]"
                          : "bg-card/60 text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      {selected && <CheckCircle className="w-3 h-3" />}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
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
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const { paged: pagedOrders, totalPages } = getPageSlice(filteredOrders, page, pageSize);

  const handleConfirm = (orderId: string) => {
    const updatedOrders = orders.map((o) =>
      o.id === orderId ? { ...o, status: "completed" as const } : o
    );
    setOrders(updatedOrders);
    localStorage.setItem("admin_orders", JSON.stringify(updatedOrders));
  };

  const handleCancel = (orderId: string) => {
    if (!confirm("Bạn có chắc muốn hủy đơn hàng này?")) return;

    const updatedOrders = orders.map((o) =>
      o.id === orderId ? { ...o, status: "cancelled" as const } : o
    );
    setOrders(updatedOrders);
    localStorage.setItem("admin_orders", JSON.stringify(updatedOrders));
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Quản lý đơn hàng</h2>
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

      <div className="space-y-4">
        {pagedOrders.map((order) => (
          <div
            key={order.id}
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-foreground text-lg mb-1 font-mono">{order.id}</h3>
                <p className="text-sm text-muted-foreground">{order.userName}</p>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-bold ${
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
            <div className="bg-card/50 border border-border rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Sản phẩm ({order.items.length}):
              </p>
              <ul className="space-y-1">
                {order.items.map((item, index) => (
                  <li key={`${order.id}-item-${index}`} className="text-foreground">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tổng tiền:</p>
                <p className="text-2xl font-bold text-foreground font-mono">
                  {order.total.toLocaleString("vi-VN")} xu
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingOrder(order)}
                  className="bg-card hover:bg-card/80 border border-border hover:border-primary/50 text-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  Chi tiết
                </button>
                {order.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleConfirm(order.id)}
                      className="bg-success hover:bg-success/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    >
                      <UserCheck className="w-4 h-4" />
                      Xác nhận
                    </button>
                    <button
                      onClick={() => handleCancel(order.id)}
                      className="bg-destructive hover:bg-destructive/90 text-primary-foreground px-4 py-2 rounded-lg transition-all hover:shadow-[0_0_20px_rgba(236,72,153,0.3)]"
                    >
                      Hủy
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

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
                    <div className="bg-card/50 border border-border rounded-2xl p-5">
                      <p className="text-sm font-semibold text-muted-foreground mb-3">
                        Thông tin người mua
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-background border border-border">
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
                            {buyer?.email || `User ID: ${viewingOrder.userId}`}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                viewingOrder.status === "completed"
                                  ? "bg-success/20 text-success"
                                  : viewingOrder.status === "pending"
                                  ? "bg-warning/20 text-warning"
                                  : "bg-destructive/20 text-destructive"
                              }`}
                            >
                              {viewingOrder.status === "completed"
                                ? "Hoàn thành"
                                : viewingOrder.status === "pending"
                                ? "Đang xử lý"
                                : "Đã hủy"}
                            </span>
                            {buyer?.subscription ? (
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary">
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

                <div className="bg-card/50 border border-border rounded-2xl p-5">
                  <p className="text-sm font-semibold text-muted-foreground mb-3">
                    Thông tin đơn
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-card border border-border/60 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-1">Mã đơn</p>
                      <p className="font-mono font-bold text-foreground">{viewingOrder.id}</p>
                    </div>
                    <div className="bg-card border border-border/60 rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-1">Ngày</p>
                      <p className="font-bold text-foreground">{viewingOrder.date}</p>
                    </div>
                  </div>

                  <div className="mt-4 bg-card border border-border/60 rounded-xl p-4">
                    <p className="text-xs text-muted-foreground mb-2">Danh sách sản phẩm</p>
                    <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                      {viewingOrder.items.map((item, index) => (
                        <li key={`${viewingOrder.id}-drawer-item-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 flex items-center justify-between bg-card border border-border/60 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground">Tổng tiền</p>
                    <p className="text-2xl font-bold text-primary font-mono">
                      {viewingOrder.total.toLocaleString("vi-VN")} xu
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}

// Packages Management Component
function PackagesManagement({
  packages,
  setPackages,
}: {
  packages: PackageData[];
  setPackages: (packages: PackageData[]) => void;
}) {
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const [editingPackage, setEditingPackage] = useState<PackageData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPackage, setNewPackage] = useState<Partial<PackageData>>({
    name: "",
    price: 0,
    credits: 0,
    sales: 0,
    revenue: 0,
  });

  const handleEdit = (pkg: PackageData) => {
    setEditingPackage({ ...pkg });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingPackage) return;

    const updatedPackages = packages.map((p) =>
      p.id === editingPackage.id ? editingPackage : p
    );
    setPackages(updatedPackages);
    localStorage.setItem("admin_packages", JSON.stringify(updatedPackages));

    setShowEditModal(false);
    setEditingPackage(null);
  };

  const handleAddPackage = () => {
    if (!newPackage.name) {
      alert("Vui lòng nhập tên gói");
      return;
    }

    const pkg: PackageData = {
      id: `PKG-${Date.now()}`,
      name: newPackage.name || "",
      price: newPackage.price || 0,
      credits: newPackage.credits || 0,
      sales: newPackage.sales || 0,
      revenue: newPackage.revenue || 0,
    };

    const updatedPackages = [...packages, pkg];
    setPackages(updatedPackages);
    localStorage.setItem("admin_packages", JSON.stringify(updatedPackages));

    setShowAddModal(false);
    setNewPackage({
      name: "",
      price: 0,
      credits: 0,
      sales: 0,
      revenue: 0,
    });
  };

  const handleDelete = (pkgId: string) => {
    if (!confirm("Bạn c chắc muốn xóa gói này?")) return;

    const updatedPackages = packages.filter((p) => p.id !== pkgId);
    setPackages(updatedPackages);
    localStorage.setItem("admin_packages", JSON.stringify(updatedPackages));
  };

  const { paged: pagedPackages, totalPages } = getPageSlice(packages, page, pageSize);

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Quản lý gói dịch vụ</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:shadow-[0_0_30px_rgba(0,217,255,0.3)]"
        >
          <Plus className="w-5 h-5" />
          Thêm gói mới
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {pagedPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">{pkg.name}</h3>
                <p className="text-3xl font-bold text-primary mb-1 font-mono">
                  {pkg.price.toLocaleString("vi-VN")} xu
                </p>
                <p className="text-sm text-muted-foreground">
                  {pkg.credits === -1 ? "Không giới hạn xu" : `${pkg.credits} xu`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(pkg)}
                  className="text-warning hover:text-warning/80 transition-colors"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(pkg.id)}
                  className="text-destructive hover:text-destructive/80 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Đã bán:</span>
                <span className="text-foreground font-bold font-mono">{pkg.sales} gói</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Doanh thu:</span>
                <span className="text-success font-bold font-mono">
                  {pkg.revenue.toLocaleString("vi-VN")} xu
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ClientPagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Edit Drawer */}
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
                <SheetTitle>Chỉnh sửa gói</SheetTitle>
                <SheetDescription className="hidden sm:block">
                  Cập nhật thông tin gói dịch vụ
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6">
                <PackageForm
                  pkg={editingPackage}
                  onChange={setEditingPackage}
                  onSave={handleSaveEdit}
                />
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>

      {/* Add Drawer */}
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
                  Tạo gói dịch vụ mới
                </SheetDescription>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-6">
                <PackageForm
                  pkg={newPackage as PackageData}
                  onChange={(pkg) => setNewPackage(pkg)}
                  onSave={handleAddPackage}
                />
              </div>
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}

function PackageForm({
  pkg,
  onChange,
  onSave,
}: {
  pkg: Partial<PackageData>;
  onChange: (pkg: any) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Tên gói
        </label>
        <input
          type="text"
          value={pkg.name || ""}
          onChange={(e) => onChange({ ...pkg, name: e.target.value })}
          className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Giá (xu)
          </label>
          <input
            type="number"
            value={pkg.price || 0}
            onChange={(e) =>
              onChange({ ...pkg, price: parseInt(e.target.value) || 0 })
            }
            className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Credits
          </label>
          <input
            type="number"
            value={pkg.credits || 0}
            onChange={(e) =>
              onChange({ ...pkg, credits: parseInt(e.target.value) || 0 })
            }
            className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
      <button
        onClick={onSave}
        className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(0,217,255,0.3)]"
      >
        <Save className="w-5 h-5" />
        Lưu
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