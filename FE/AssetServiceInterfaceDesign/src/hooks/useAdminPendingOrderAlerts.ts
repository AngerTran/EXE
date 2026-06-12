import { useCallback, useEffect, useState } from "react";
import type { AppUser } from "../api/auth";
import { fetchPendingOrdersForAdmin } from "../api/orders";
import type { Order } from "../api/types/commerce";
import {
  isBankTransferAwaitingConfirmation,
  normalizeOrderType,
} from "../utils/orderType";

const POLL_MS = 30_000;

function isAwaitingAdminConfirmation(order: Order): boolean {
  return isBankTransferAwaitingConfirmation(order);
}

function orderLabel(order: Order): string {
  const itemName = order.items?.[0]?.itemName;
  if (itemName) return itemName;
  const type = normalizeOrderType(order.orderType);
  if (type === "subscription") return "Gói đăng ký";
  if (type === "creditpack") return "Gói nạp xu";
  return order.orderCode;
}

/**
 * Poll số đơn CK chờ admin xác nhận (badge nav).
 * Thông báo chi tiết do Supabase trigger → bảng notifications → API /notifications.
 */
export function useAdminPendingOrderAlerts(user: AppUser | null) {
  const [pendingCount, setPendingCount] = useState(0);

  const poll = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    if (document.visibilityState === "hidden") return;

    try {
      const res = await fetchPendingOrdersForAdmin();
      const awaiting = res.data.filter(isAwaitingAdminConfirmation);
      setPendingCount(awaiting.length);
    } catch {
      /* im lặng — admin có thể đang offline BE */
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      setPendingCount(0);
      return;
    }

    void poll();
    const timer = window.setInterval(() => void poll(), POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [user, poll]);

  return { pendingCount };
}

export { orderLabel, isAwaitingAdminConfirmation };
