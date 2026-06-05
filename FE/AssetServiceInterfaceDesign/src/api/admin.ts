import { apiRequest } from "./client";
import type {
  AdminAnalyticsAssets,
  AdminAnalyticsOrders,
  AdminAnalyticsRevenue,
  AdminAnalyticsUsers,
  AdminOverview,
  AdminUser,
} from "./types/admin";
import type { SubscriptionPlan } from "./types/billing";
import type { AssetListItem } from "./types/marketplace";
import type { PagedResponse } from "./types/common";

interface PlanListResponse {
  data: SubscriptionPlan[];
}

export async function fetchAdminOverview(): Promise<AdminOverview> {
  return apiRequest<AdminOverview>("/admin/overview");
}

export async function fetchAdminUsers(
  page = 1,
  pageSize = 50,
  search?: string,
  role?: string
): Promise<PagedResponse<AdminUser>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) params.set("search", search);
  if (role) params.set("role", role);
  return apiRequest<PagedResponse<AdminUser>>(`/admin/users?${params}`);
}

export async function updateAdminUser(
  id: string,
  body: { role?: string; status?: string; walletBalance?: number }
): Promise<AdminUser> {
  return apiRequest<AdminUser>(`/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminUser(id: string): Promise<void> {
  return apiRequest<void>(`/admin/users/${id}`, { method: "DELETE" });
}

export async function patchWalletBalance(
  userId: string,
  balance: number,
  reason?: string
): Promise<{ balance: number; isUnlimited: boolean }> {
  return apiRequest(`/wallets/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ balance, reason }),
  });
}

export async function fetchAdminAssets(
  page = 1,
  pageSize = 50,
  status?: string,
  search?: string
): Promise<PagedResponse<AssetListItem>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  return apiRequest<PagedResponse<AssetListItem>>(`/admin/assets?${params}`);
}

export async function fetchAdminSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const res = await apiRequest<PlanListResponse>("/admin/subscription-plans");
  return res.data ?? [];
}

export async function createAdminSubscriptionPlan(body: Record<string, unknown>): Promise<SubscriptionPlan> {
  return apiRequest<SubscriptionPlan>("/admin/subscription-plans", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminSubscriptionPlan(
  id: string,
  body: Record<string, unknown>
): Promise<SubscriptionPlan> {
  return apiRequest<SubscriptionPlan>(`/admin/subscription-plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminSubscriptionPlan(id: string): Promise<void> {
  return apiRequest<void>(`/admin/subscription-plans/${id}`, { method: "DELETE" });
}

export async function fetchAdminAnalyticsRevenue(
  from?: string,
  to?: string
): Promise<AdminAnalyticsRevenue> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const q = params.toString();
  return apiRequest<AdminAnalyticsRevenue>(`/admin/analytics/revenue${q ? `?${q}` : ""}`);
}

export async function fetchAdminAnalyticsUsers(): Promise<AdminAnalyticsUsers> {
  return apiRequest<AdminAnalyticsUsers>("/admin/analytics/users");
}

export async function fetchAdminAnalyticsAssets(): Promise<AdminAnalyticsAssets> {
  return apiRequest<AdminAnalyticsAssets>("/admin/analytics/assets");
}

export async function fetchAdminAnalyticsOrders(): Promise<AdminAnalyticsOrders> {
  return apiRequest<AdminAnalyticsOrders>("/admin/analytics/orders");
}
