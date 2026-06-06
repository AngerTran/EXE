import { useEffect, useRef, useState } from "react";
import { fetchOrderById } from "../api/orders";
import { useAuth } from "../app/contexts/AuthContext";

const DEFAULT_INTERVAL_MS = 8000;

export function usePollOrderCompletion(
  orderId: string | null | undefined,
  enabled: boolean,
  options?: {
    intervalMs?: number;
    onCompleted?: () => void;
  }
) {
  const { refreshUserData } = useAuth();
  const [isCompleted, setIsCompleted] = useState(false);
  const completedRef = useRef(false);
  const onCompletedRef = useRef(options?.onCompleted);
  onCompletedRef.current = options?.onCompleted;

  useEffect(() => {
    if (!enabled || !orderId) return;

    let cancelled = false;
    const intervalMs = options?.intervalMs ?? DEFAULT_INTERVAL_MS;

    const check = async () => {
      if (completedRef.current) return;
      try {
        const order = await fetchOrderById(orderId);
        if (cancelled || order.status !== "completed") return;

        completedRef.current = true;
        setIsCompleted(true);
        await refreshUserData();
        onCompletedRef.current?.();
      } catch {
        /* ignore transient polling errors */
      }
    };

    void check();
    const timerId = window.setInterval(() => void check(), intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(timerId);
    };
  }, [orderId, enabled, refreshUserData, options?.intervalMs]);

  return isCompleted;
}
