import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Trash2,
  CheckCheck,
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
  const Icon = typeIcon[item.type];
  return (
    <button
      type="button"
      onClick={() => onRead(item.id)}
      className={cn(
        "w-full text-left rounded-xl border p-3 transition-colors hover:bg-muted/40",
        item.read ? "border-border/60 opacity-80" : "border-primary/25 bg-primary/5",
      )}
    >
      <div className="flex gap-3">
        <div
          className={cn(
            "shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center",
            typeClass[item.type],
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground leading-snug">{item.title}</p>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
          )}
          <p className="text-[11px] text-muted-foreground/80 mt-1.5 font-mono">
            {formatTime(item.createdAt)}
          </p>
        </div>
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

  useEffect(() => notificationStore.subscribe(() => setItems(notificationStore.getItems())), []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) notificationStore.markAllRead();
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="relative flex items-center justify-center w-10 h-10 bg-white dark:bg-card border border-border rounded-lg hover:bg-white dark:hover:bg-card/80 hover:border-primary/50 transition-all"
          title="Thông báo"
          aria-label={`Thông báo${unread > 0 ? `, ${unread} chưa đọc` : ""}`}
        >
          <Bell className="w-4 h-4 text-foreground" />
          {(unread > 0 || (isAdmin && adminPendingOrders > 0)) && (
            <span
              className={cn(
                "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-background",
                isAdmin && adminPendingOrders > 0 && unread === 0
                  ? "bg-warning text-warning-foreground"
                  : "bg-destructive text-destructive-foreground",
              )}
            >
              {isAdmin && adminPendingOrders > 0
                ? adminPendingOrders > 9
                  ? "9+"
                  : adminPendingOrders
                : unread > 9
                  ? "9+"
                  : unread}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border text-left">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Thông báo
          </SheetTitle>
          <SheetDescription>
            Gói dịch vụ, xu, mua asset, AI và các hoạt động khác.
          </SheetDescription>
          {items.length > 0 && (
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => notificationStore.markAllRead()}
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Đánh dấu đã đọc
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs text-destructive hover:text-destructive"
                onClick={() => notificationStore.clearAll()}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Xóa tất cả
              </Button>
            </div>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Chưa có thông báo</p>
              <p className="text-xs mt-1 max-w-[240px]">
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
        <div className="px-6 py-4 border-t border-border bg-muted/20 space-y-2">
          {isAdmin && adminPendingOrders > 0 && (
            <p className="text-xs text-warning font-medium">
              {adminPendingOrders} đơn chờ xác nhận chuyển khoản
            </p>
          )}
          <Link
            to={isAdmin ? "/admin?tab=orders" : "/pricing"}
            onClick={() => setOpen(false)}
            className="text-sm text-primary hover:underline font-medium"
          >
            {isAdmin ? "Mở Admin → Đơn hàng →" : "Xem gói dịch vụ →"}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
