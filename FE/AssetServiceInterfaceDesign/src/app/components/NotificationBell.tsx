import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import {
  Bell,
  BellOff,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Trash2,
  CheckCheck,
  ShoppingCart,
  CreditCard,
  ArrowRight,
  Shield,
} from "lucide-react";
import { notificationStore } from "../../stores/notificationStore";
import type { AppNotification, AppNotificationType } from "../../types/notification";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";

const typeIcon: Record<AppNotificationType, typeof Info> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const typeClass: Record<AppNotificationType, string> = {
  success: "text-success bg-success/15 border-success/30",
  error: "text-destructive bg-destructive/15 border-destructive/30",
  warning: "text-warning bg-warning/15 border-warning/30",
  info: "text-primary bg-primary/15 border-primary/30",
};

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotificationRow({
  item,
  onRead,
}: {
  item: AppNotification;
  onRead: (id: string) => void;
}) {
  const navigate = useNavigate();
  const Icon = typeIcon[item.type];

  const handleClick = () => {
    onRead(item.id);
    if (item.actionUrl) navigate(item.actionUrl);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group w-full text-left rounded-xl border p-3.5 transition-all",
        "hover:border-primary/40 hover:bg-primary/5 hover:shadow-[0_0_20px_rgba(0,217,255,0.08)]",
        item.read
          ? "border-border/50 bg-white/95 dark:bg-card/70 backdrop-blur-lg opacity-75"
          : "border-primary/30 bg-gradient-to-r from-primary/10 to-transparent",
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "relative shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center",
            typeClass[item.type],
          )}
        >
          <Icon className="w-4.5 h-4.5" />
          {!item.read && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground leading-snug pr-2">{item.title}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-3">
              {item.description}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground/70 mt-2 font-mono tabular-nums">
            {formatTime(item.createdAt)}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </button>
  );
}

type NotificationBellProps = {
  adminPendingOrders?: number;
};

export function NotificationBell({ adminPendingOrders = 0 }: NotificationBellProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>(() => notificationStore.getItems());
  const unread = items.filter((n) => !n.read).length;
  const isAdmin = user?.role === "admin";
  const badgeCount = unread;

  useEffect(() => notificationStore.subscribe(() => setItems(notificationStore.getItems())), []);

  useEffect(() => {
    if (!user) {
      notificationStore.reset();
      return;
    }
    void notificationStore.refreshFromApi();
    const timer = window.setInterval(() => void notificationStore.refreshFromApi(), 30_000);
    return () => window.clearInterval(timer);
  }, [user?.id]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      void notificationStore.refreshFromApi();
      void notificationStore.markAllRead();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative flex items-center justify-center w-10 h-10 rounded-lg border transition-all",
            "bg-white dark:bg-card border-border",
            "hover:border-primary/50 hover:shadow-[0_0_16px_rgba(0,217,255,0.2)]",
            open && "border-primary/60 shadow-[0_0_16px_rgba(0,217,255,0.25)]",
          )}
          title="Thông báo"
          aria-label={`Thông báo${badgeCount > 0 ? `, ${badgeCount} chưa đọc` : ""}`}
        >
          <Bell className={cn("w-4 h-4", badgeCount > 0 ? "text-primary" : "text-foreground")} />
          {badgeCount > 0 && (
            <span
              className={cn(
                "absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
                "flex items-center justify-center border-2 border-background shadow-sm",
                isAdmin && adminPendingOrders > 0 && unread === 0
                  ? "bg-warning text-warning-foreground"
                  : "bg-destructive text-destructive-foreground",
              )}
            >
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:max-w-[400px] flex flex-col gap-0 p-0 border-l border-border bg-background"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border bg-gradient-to-b from-primary/5 to-transparent text-left space-y-3">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="flex items-center gap-3 min-w-0">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-lg font-bold text-foreground">Thông báo</SheetTitle>
                <SheetDescription className="text-xs mt-0.5 leading-relaxed">
                  Gói dịch vụ, xu, mua asset và hoạt động tài khoản
                </SheetDescription>
              </div>
            </div>
          </div>

          {(unread > 0 || items.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              {unread > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/15 text-primary border border-primary/25">
                  {unread} chưa đọc
                </span>
              )}
              {isAdmin && adminPendingOrders > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-warning/15 text-warning border border-warning/30">
                  {adminPendingOrders} đơn chờ CK
                </span>
              )}
            </div>
          )}

          {items.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 text-xs border-border hover:border-primary/40 hover:bg-primary/5"
                onClick={() => notificationStore.markAllRead()}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đã đọc tất cả
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => notificationStore.clearAll()}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa tất cả
              </Button>
            </div>
          )}
        </SheetHeader>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-border flex items-center justify-center mb-4">
                <BellOff className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-semibold text-foreground">Chưa có thông báo</p>
              <p className="text-xs text-muted-foreground mt-2 max-w-[260px] leading-relaxed">
                Thông báo sẽ xuất hiện khi bạn mua asset, hết xu, hoặc gói sắp hết hạn.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <NotificationRow
                key={item.id}
                item={item}
                onRead={(id) => notificationStore.markRead(id)}
              />
            ))
          )}
        </div>

        {/* Footer actions */}
        <div className="px-4 py-4 border-t border-border bg-white/95 dark:bg-card/70 backdrop-blur-lg space-y-2.5">
          {isAdmin ? (
            <>
              {adminPendingOrders > 0 && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-warning/10 border border-warning/25 text-warning">
                  <ShoppingCart className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-medium leading-snug">
                    {adminPendingOrders} đơn chuyển khoản cần xác nhận
                  </p>
                </div>
              )}
              <Button
                variant="gradient"
                className="w-full h-10"
                asChild
                onClick={() => setOpen(false)}
              >
                <Link to="/admin?tab=orders">
                  <Shield className="w-4 h-4" />
                  Đơn hàng chờ xác nhận
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full h-9 text-sm"
                asChild
                onClick={() => setOpen(false)}
              >
                <Link to="/admin">Mở Admin Dashboard</Link>
              </Button>
            </>
          ) : (
            <Button
              variant="gradient"
              className="w-full h-10"
              asChild
              onClick={() => setOpen(false)}
            >
              <Link to="/pricing">
                <CreditCard className="w-4 h-4" />
                Xem gói dịch vụ
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
