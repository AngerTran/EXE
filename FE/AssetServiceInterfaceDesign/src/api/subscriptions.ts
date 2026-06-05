import { apiRequest } from "./client";
import type { SubscriptionMe } from "./types/billing";

export async function fetchMySubscription(): Promise<SubscriptionMe> {
  return apiRequest<SubscriptionMe>("/subscriptions/me");
}

export async function cancelSubscription(): Promise<{ cancelled: boolean }> {
  return apiRequest<{ cancelled: boolean }>("/subscriptions/cancel", { method: "POST" });
}
