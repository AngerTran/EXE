import { useEffect, useRef } from "react";
import type { AppUser } from "../api/auth";
import {
  notifySubscriptionExpired,
  notifySubscriptionExpiringSoon,
  notifyLowCredits,
} from "../utils/notify";

const PAID_PLANS = new Set(["student", "indie", "pro"]);

function daysUntil(iso: string): number {
  const end = new Date(iso);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / 86_400_000);
}

export function useSubscriptionAlerts(user: AppUser | null) {
  const prevPlanRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      prevPlanRef.current = null;
      return;
    }

    const plan = user.subscription ?? "free";
    const prev = prevPlanRef.current;

    if (prev && PAID_PLANS.has(prev) && plan === "free") {
      const key = `assetbox:sub-expired:${user.id}:${prev}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        notifySubscriptionExpired(prev);
      }
    }

    if (
      user.subscriptionExpiry &&
      PAID_PLANS.has(plan) &&
      daysUntil(user.subscriptionExpiry) > 0 &&
      daysUntil(user.subscriptionExpiry) <= 7
    ) {
      const key = `assetbox:sub-expiring:${user.id}:${user.subscriptionExpiry}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        notifySubscriptionExpiringSoon(daysUntil(user.subscriptionExpiry), plan);
      }
    }

    if (!user.isUnlimited && user.credits > 0 && user.credits < 5) {
      const key = `assetbox:low-xu:${user.id}:${user.credits}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        notifyLowCredits(user.credits);
      }
    }

    prevPlanRef.current = plan;
  }, [user]);
}
