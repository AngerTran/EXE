import { toast as sonnerToast, type ExternalToast } from "sonner";
import { notificationStore } from "../stores/notificationStore";
import type { AppNotificationType } from "../types/notification";

function record(type: AppNotificationType, message: string, data?: ExternalToast) {
  const description =
    typeof data?.description === "string" ? data.description : undefined;
  notificationStore.push({ type, title: message, description });
}

function wrap(
  type: AppNotificationType,
  fn: (message: string, data?: ExternalToast) => string | number,
) {
  return (message: string, data?: ExternalToast) => {
    record(type, message, data);
    return fn(message, data);
  };
}

/** Drop-in replacement for `sonner` toast — adds icons (via Toaster) + notification history. */
export const toast = {
  success: wrap("success", sonnerToast.success),
  error: wrap("error", sonnerToast.error),
  warning: wrap("warning", sonnerToast.warning),
  info: wrap("info", sonnerToast.info),
  message: wrap("info", sonnerToast.message),
  loading: wrap("info", sonnerToast.loading),
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom,
};

export const notify = toast;

export function notifySubscriptionExpired(planLabel?: string) {
  const label = planLabel ? planLabel.toUpperCase() : "đăng ký";
  toast.warning(`Gói ${label} đã hết hạn`, {
    description: "Tài khoản đã về gói Free. Nâng cấp lại tại trang Gói dịch vụ.",
    duration: 9000,
  });
}

export function notifySubscriptionExpiringSoon(daysLeft: number, planLabel: string) {
  toast.info(`Gói ${planLabel.toUpperCase()} sắp hết hạn`, {
    description: `Còn ${daysLeft} ngày. Gia hạn tại Gói dịch vụ để giữ quyền lợi.`,
    duration: 7000,
  });
}

export function notifyLowCredits(credits: number) {
  toast.warning("Xu sắp hết", {
    description: `Bạn còn ${credits} xu. Nạp thêm hoặc nâng cấp gói tại Gói dịch vụ.`,
    duration: 6000,
  });
}

export function notifyAdminPendingOrder(order: {
  orderCode: string;
  orderType: string;
  totalVnd: number;
  userName?: string | null;
  userEmail?: string | null;
  items?: { itemName: string }[];
}) {
  const itemName = order.items?.[0]?.itemName;
  const isSubscription = order.orderType?.toLowerCase() === "subscription";
  const title = isSubscription
    ? "Đơn mua gói chờ xác nhận"
    : "Đơn nạp xu chờ xác nhận";
  const plan = itemName ?? (isSubscription ? "Gói đăng ký" : "Gói xu");
  const buyer = order.userName || order.userEmail || "Khách hàng";
  const amount = `${order.totalVnd.toLocaleString("vi-VN")}đ`;

  // Chỉ lưu vào chuông thông báo — không popup toast (admin đã có badge + panel).
  notificationStore.push({
    type: "warning",
    title,
    description: `${buyer} · ${plan} · ${order.orderCode} · ${amount}. Vào Admin → Đơn hàng để xác nhận.`,
  });
}
