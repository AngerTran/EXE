import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { Clock, ShoppingCart, CreditCard, Package, ListChecks } from "lucide-react";
import { ClientPagination, getPageSlice } from "./ui/ClientPagination";

type OrderStatus = "completed" | "pending" | "cancelled";

interface Order {
  id: string;
  userId: string;
  userName: string;
  items: string[];
  total: number;
  status: OrderStatus;
  date: string; // yyyy-mm-dd
}

function statusLabel(status: OrderStatus) {
  switch (status) {
    case "completed":
      return { label: "Hoàn thành", className: "bg-success/20 text-success" };
    case "pending":
      return { label: "Đang xử lý", className: "bg-warning/20 text-warning" };
    case "cancelled":
      return { label: "Đã hủy", className: "bg-destructive/20 text-destructive" };
  }
}

export default function MyOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) return;
    const raw = localStorage.getItem("admin_orders");
    const all: Order[] = raw ? JSON.parse(raw) : [];
    const mine = all.filter((o) => o.userId === user.id);
    mine.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    setOrders(mine);
  }, [user]);

  const totals = useMemo(() => {
    const completed = orders.filter((o) => o.status === "completed");
    const totalSpent = completed.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalItems = completed.reduce((sum, o) => sum + (o.items?.length || 0), 0);
    return { totalSpent, totalItems, count: completed.length };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.items.join(", ").toLowerCase().includes(q) ||
        o.date.toLowerCase().includes(q)
    );
  }, [orders, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const pageSize = 6;
  const { paged: pagedOrders, totalPages } = getPageSlice(filtered, page, pageSize);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-8">
            <Package className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Vui lòng đăng nhập</h2>
            <p className="text-muted-foreground mb-6">Đăng nhập để xem lịch sử mua.</p>
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
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
                <ShoppingCart className="w-8 h-8 text-primary" />
                Lịch sử mua
              </h1>
              <p className="text-muted-foreground">Xem chi tiết các đơn hàng (gói dịch vụ & asset) bạn đã thanh toán.</p>
            </div>

            <div className="flex gap-3">
              <Link
                to="/my-assets"
                className="bg-card hover:bg-card/80 border border-border hover:border-primary/50 text-foreground px-4 py-2 rounded-lg transition-all font-medium"
              >
                Về thư viện
              </Link>
              <Link
                to="/marketplace"
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-4 py-2 rounded-lg transition-all font-bold hover:shadow-[0_0_30px_rgba(0,217,255,0.4)]"
              >
                Marketplace
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Đơn hàng</p>
                <p className="text-2xl font-bold text-foreground font-mono">{totals.count}</p>
              </div>
              <div className="bg-primary/20 border border-primary/30 p-3 rounded-lg">
                <ListChecks className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tổng chi tiêu</p>
                <p className="text-2xl font-bold text-foreground font-mono">
                  {totals.totalSpent.toLocaleString("vi-VN")} xu
                </p>
              </div>
              <div className="bg-success/20 border border-success/30 p-3 rounded-lg">
                <CreditCard className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Số món</p>
                <p className="text-2xl font-bold text-foreground font-mono">{totals.totalItems}</p>
              </div>
              <div className="bg-warning/20 border border-warning/30 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Tìm theo mã đơn, ngày hoặc tên sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-12 max-w-md mx-auto">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Chưa có lịch sử mua</h3>
              <p className="text-muted-foreground mb-6">Hãy mua gói hoặc asset để đơn hàng được lưu lại.</p>
              <Link
                to="/pricing"
                className="inline-block bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-6 py-3 rounded-lg font-bold transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(0,217,255,0.5)]"
              >
                Xem gói dịch vụ
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {pagedOrders.map((order) => {
              const st = statusLabel(order.status);
              return (
                <div
                  key={order.id}
                  className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                    <div>
                      <p className="font-bold text-foreground font-mono">{order.id}</p>
                      <p className="text-muted-foreground mt-1">{order.date}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-xs font-bold ${st.className}`}>
                      {st.label}
                    </span>
                  </div>

                  <div className="bg-card border border-border/60 rounded-xl p-4 mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Chi tiết:</p>
                    <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                      {order.items.map((it, idx) => (
                        <li key={`${order.id}-it-${idx}`}>{it}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <p className="text-muted-foreground">Tổng tiền</p>
                    <p className="text-2xl font-bold text-primary font-mono">
                      {order.total.toLocaleString("vi-VN")} xu
                    </p>
                  </div>
                </div>
              );
            })}

            <ClientPagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}

