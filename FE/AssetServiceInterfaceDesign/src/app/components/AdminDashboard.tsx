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
  Settings,
  X,
  Save,
  AlertCircle,
  Activity,
  PieChart,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import type { AssetRecord } from "../../types/asset";
import { ASSET_CATEGORIES } from "../../types/asset";
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
                🛡️ Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Xin chào, <span className="font-bold text-primary">{user?.name}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="bg-card/50 hover:bg-card border border-border hover:border-primary/50 text-foreground px-4 py-2 rounded-lg transition-all flex items-center gap-2 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)]">
                <Settings className="w-5 h-5" />
                Cài đặt
              </button>
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
                    {order.total.toLocaleString("vi-VN")}đ
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
                      ? "Free"
                      : `${asset.price.toLocaleString("vi-VN")}đ`}
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

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      };
      localStorage.setItem("users", JSON.stringify(usersObj));
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
            {filteredUsers.map((user) => (
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
                  {user.totalSpent.toLocaleString("vi-VN")}đ
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

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <Modal onClose={() => setShowEditModal(false)} title="Chỉnh sửa User">
          <div className="space-y-4">
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
            <button
              onClick={handleSaveEdit}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(0,217,255,0.3)]"
            >
              <Save className="w-5 h-5" />
              Lưu thay đổi
            </button>
          </div>
        </Modal>
      )}

      {/* View Modal */}
      {viewingUser && (
        <Modal onClose={() => setViewingUser(null)} title="Chi tiết User">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">ID</p>
                <p className="text-foreground font-medium font-mono">{viewingUser.id}</p>
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
                <p className="text-foreground font-medium">{viewingUser.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="text-foreground font-medium">{viewingUser.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Credits</p>
                <p className="text-foreground font-bold text-lg font-mono">{viewingUser.credits}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tổng chi tiêu</p>
                <p className="text-foreground font-bold text-lg font-mono">
                  {viewingUser.totalSpent.toLocaleString("vi-VN")}đ
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground mb-1">Ngày đăng ký</p>
                <p className="text-foreground font-medium">{viewingUser.registeredAt}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
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
  const [editingAsset, setEditingAsset] = useState<AssetData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const reload = () => {
    setAssets(getApprovedAssets());
    setPendingAssets(getPendingAssets());
  };

  useEffect(() => {
    reload();
    window.addEventListener("assetsUpdated", reload);
    return () => window.removeEventListener("assetsUpdated", reload);
  }, [setAssets]);

  const filteredAssets = assets.filter((asset) =>
    asset.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (asset: AssetData) => {
    setEditingAsset({ ...asset });
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    if (!editingAsset) return;
    updateAsset(editingAsset.id, {
      title: editingAsset.title,
      category: editingAsset.category as AssetRecord["category"],
      price: editingAsset.price,
      rating: editingAsset.rating,
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
    if (!confirm("Từ chối asset này?")) return;
    rejectAsset(id);
    reload();
  };

  return (
    <div className="space-y-8">
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
            {pendingAssets.map((asset) => (
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
        </div>
      )}

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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)] transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-foreground mb-1">{asset.title}</h3>
                  <p className="text-sm text-muted-foreground">{asset.category}</p>
                </div>
                {asset.isFree && (
                  <span className="px-2 py-1 bg-success/20 text-success rounded-full text-xs font-bold">
                    FREE
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  {asset.downloads}
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {asset.rating}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-bold text-foreground font-mono">
                  {asset.isFree ? "Miễn phí" : `${asset.price.toLocaleString("vi-VN")}đ`}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(asset)}
                    className="text-warning hover:text-warning/80 transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showEditModal && editingAsset && (
          <Modal onClose={() => setShowEditModal(false)} title="Chỉnh sửa Asset">
            <AssetForm asset={editingAsset} onChange={setEditingAsset} onSave={handleSaveEdit} />
          </Modal>
        )}
      </div>
    </div>
  );
}

function AssetForm({
  asset,
  onChange,
  onSave,
}: {
  asset: Partial<AssetData>;
  onChange: (asset: any) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Tên Asset</label>
        <input
          type="text"
          value={asset.title || ""}
          onChange={(e) => onChange({ ...asset, title: e.target.value })}
          className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">Danh mục</label>
        <select
          value={asset.category || "3D Model"}
          onChange={(e) => onChange({ ...asset, category: e.target.value })}
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
          <label className="block text-sm font-medium text-muted-foreground mb-2">Giá (đ)</label>
          <input
            type="number"
            value={asset.price || 0}
            onChange={(e) =>
              onChange({ ...asset, price: parseInt(e.target.value) || 0 })
            }
            className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">Rating</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={asset.rating || 0}
            onChange={(e) =>
              onChange({ ...asset, rating: parseFloat(e.target.value) || 0 })
            }
            className="w-full bg-card border border-border rounded-lg px-4 py-2 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isFree"
          checked={asset.isFree || false}
          onChange={(e) => onChange({ ...asset, isFree: e.target.checked })}
          className="w-5 h-5 rounded bg-card border-border"
        />
        <label htmlFor="isFree" className="text-sm text-muted-foreground">
          Miễn phí
        </label>
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

// Orders Management Component
function OrdersManagement({
  searchQuery,
  setSearchQuery,
  orders,
  setOrders,
}: {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  orders: Order[];
  setOrders: (orders: Order[]) => void;
}) {
  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {filteredOrders.map((order) => (
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
              <p className="text-sm text-muted-foreground mb-2">Sản phẩm:</p>
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
                  {order.total.toLocaleString("vi-VN")}đ
                </p>
              </div>
              <div className="flex items-center gap-2">
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
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(0,217,255,0.1)] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">{pkg.name}</h3>
                <p className="text-3xl font-bold text-primary mb-1 font-mono">
                  {pkg.price.toLocaleString("vi-VN")}đ
                </p>
                <p className="text-sm text-muted-foreground">
                  {pkg.credits === -1 ? "Unlimited credits" : `${pkg.credits} credits`}
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
                  {pkg.revenue.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingPackage && (
        <Modal onClose={() => setShowEditModal(false)} title="Chỉnh sửa gói">
          <PackageForm
            pkg={editingPackage}
            onChange={setEditingPackage}
            onSave={handleSaveEdit}
          />
        </Modal>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} title="Thêm gói mới">
          <PackageForm
            pkg={newPackage as PackageData}
            onChange={(pkg) => setNewPackage(pkg)}
            onSave={handleAddPackage}
          />
        </Modal>
      )}
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
            Giá (đ)
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