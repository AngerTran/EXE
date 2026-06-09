import { useCallback, useEffect, useRef, useState } from "react";
import type { AppUser } from "../api/auth";
import { fetchPendingOrdersForAdmin } from "../api/orders";
import type { Order } from "../api/types/commerce";
import { notifyAdminPendingOrder } from "../utils/notify";

const POLL_MS = 30_000;
const SEEN_STORAGE_PREFIX = "assetbox:admin-seen-pending:";

function loadSeenIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`${SEEN_STORAGE_PREFIX}${userId}`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveSeenIds(userId: string, seen: Set<string>) {
  const trimmed = [...seen].slice(-200);
  localStorage.setItem(`${SEEN_STORAGE_PREFIX}${userId}`, JSON.stringify(trimmed));
}

function isAwaitingAdminConfirmation(order: Order): boolean {
  const type = order.orderType?.toLowerCase();
  return type === "subscription" || type === "credit_pack";
}

function orderLabel(order: Order): string {
  const itemName = order.items?.[0]?.itemName;
  if (itemName) return itemName;
  if (order.orderType === "subscription") return "Gói đăng ký";
  if (order.orderType === "credit_pack") return "Gói nạp xu";
  return order.orderCode;
}

/**
 * Poll API đơn pending khi admin đang đăng nhập.
 * Phù hợp chuyển khoản ngân hàng — không cần WebSocket.
 */
export function useAdminPendingOrderAlerts(user: AppUser | null) {
  const [pendingCount, setPendingCount] = useState(0);
  const seenRef = useRef<Set<string>>(new Set());

  const poll = useCallback(async () => {
    if (!user || user.role !== "admin") return;
    if (document.visibilityState === "hidden") return;

    try {
      const res = await fetchPendingOrdersForAdmin();
      const awaiting = res.data.filter(isAwaitingAdminConfirmation);
      setPendingCount(awaiting.length);

      let changed = false;
      for (const order of awaiting) {
        if (seenRef.current.has(order.id)) continue;
        seenRef.current.add(order.id);
        changed = true;
        notifyAdminPendingOrder(order);
      }
      if (changed) saveSeenIds(user.id, seenRef.current);
    } catch {
      /* im lặng — admin có thể đang offline BE */
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      seenRef.current = new Set();
      setPendingCount(0);
      return;
    }

    seenRef.current = loadSeenIds(user.id);

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
