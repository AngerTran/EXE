import { apiRequest } from "./client";
import type { SubscriptionHistoryItem, SubscriptionMe } from "./types/billing";

export async function fetchMySubscription(): Promise<SubscriptionMe> {
  return apiRequest<SubscriptionMe>("/subscriptions/me");
}

export async function fetchSubscriptionHistory(): Promise<SubscriptionHistoryItem[]> {
  return apiRequest<SubscriptionHistoryItem[]>("/subscriptions/me/history");
}

export async function cancelSubscription(): Promise<{ cancelled: boolean }> {
  return apiRequest<{ cancelled: boolean }>("/subscriptions/cancel", { method: "POST" });
}
