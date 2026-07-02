import { toast as sonnerToast, type ExternalToast } from "sonner";
import { getAccessToken } from "../api/client";
import { notificationStore } from "../stores/notificationStore";
import type { AppNotificationType } from "../types/notification";

type NotifyOptions = ExternalToast & {
  /** Bắt buộc hiện popup toast kể cả đã đăng nhập (lỗi form, v.v.) */
  showToast?: boolean;
  actionUrl?: string;
};

function isLoggedIn(): boolean {
  return Boolean(getAccessToken());
}

/** Chỉ ghi vào chuông thông báo — không popup bên ngoài. */
export function notifyPanel(input: {
  type: AppNotificationType;
  title: string;
  description?: string;
  actionUrl?: string;
  id?: string;
}) {
  return notificationStore.push(input);
}

function record(type: AppNotificationType, message: string, data?: NotifyOptions) {
  const description =
    typeof data?.description === "string" ? data.description : undefined;
  notificationStore.push({
    type,
    title: message,
    description,
    actionUrl: data?.actionUrl,
  });
}

function wrap(
  type: AppNotificationType,
  fn: (message: string, data?: ExternalToast) => string | number,
) {
  return (message: string, data?: NotifyOptions) => {
    record(type, message, data);
    // Đã đăng nhập: mặc định chỉ chuông, không popup toast
    if (isLoggedIn() && !data?.showToast) return 0;
    return fn(message, data);
  };
}

/** Toast thao tác — khi đã login ghi vào chuông; popup chỉ khi showToast hoặc chưa login. */
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

/** Toast lỗi luôn hiện popup (kể cả đã đăng nhập) — dùng cho form / upload quan trọng. */
export function toastError(title: string, description?: string) {
  return toast.error(title, {
    showToast: true,
    description,
    duration: description && description.length > 100 ? 14000 : 9000,
  });
}

export function notifySubscriptionExpired(planLabel?: string) {
  const label = planLabel ? planLabel.toUpperCase() : "đăng ký";
  notifyPanel({
    type: "warning",
    title: `Gói ${label} đã hết hạn`,
    description: "Tài khoản đã về gói Free. Nâng cấp lại tại trang Gói dịch vụ.",
    actionUrl: "/pricing",
    id: `sub-expired-${label}`,
  });
}

export function notifySubscriptionExpiringSoon(daysLeft: number, planLabel: string) {
  notifyPanel({
    type: "info",
    title: `Gói ${planLabel.toUpperCase()} sắp hết hạn`,
    description: `Còn ${daysLeft} ngày. Gia hạn tại Gói dịch vụ để giữ quyền lợi.`,
    actionUrl: "/pricing",
    id: `sub-expiring-${planLabel}-${daysLeft}`,
  });
}

export function notifyLowCredits(credits: number) {
  notifyPanel({
    type: "warning",
    title: "Xu sắp hết",
    description: `Bạn còn ${credits} xu. Nạp thêm hoặc nâng cấp gói tại Gói dịch vụ.`,
    actionUrl: "/pricing",
    id: `low-xu-${credits}`,
  });
}
