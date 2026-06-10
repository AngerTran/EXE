import { apiRequest } from "./client";
import type {
  AdminAnalyticsAiUsage,
  AdminAnalyticsAssets,
  AdminAnalyticsOrders,
  AdminAnalyticsRevenue,
  AdminAnalyticsUsers,
  AdminAuditLog,
  AdminOverview,
  AdminUser,
  AdminUserDetail,
  ContactInquiry,
} from "./types/admin";
import type { SubscriptionPlan } from "./types/billing";
import type { AssetListItem, UploadUrlMeta } from "./types/marketplace";
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
  role?: string,
  includeBanned = false
): Promise<PagedResponse<AdminUser>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) params.set("search", search);
  if (role) params.set("role", role);
  if (includeBanned) params.set("includeBanned", "true");
  return apiRequest<PagedResponse<AdminUser>>(`/admin/users?${params}`);
}

export async function fetchAdminUserDetail(id: string): Promise<AdminUserDetail> {
  return apiRequest<AdminUserDetail>(`/admin/users/${id}`);
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

export interface AdminUpdateAssetBody {
  title?: string;
  shortDescription?: string;
  fullDescription?: string;
  categoryId?: string;
  tagIds?: string[];
  priceType?: "free" | "paid";
  priceVnd?: number;
  priceXu?: number;
  license?: string;
  engineUnity?: boolean;
  engineUnreal?: boolean;
  engineGodot?: boolean;
  featureRigged?: boolean;
  featureAnimated?: boolean;
  featurePbr?: boolean;
  featureVrReady?: boolean;
  version?: string;
  thumbnailUrl?: string | null;
  artStyle?: string;
}

export async function updateAdminAsset(id: string, body: AdminUpdateAssetBody) {
  return apiRequest<import("./types/marketplace").AssetDetail>(`/admin/assets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminAsset(id: string): Promise<void> {
  return apiRequest<void>(`/admin/assets/${id}`, { method: "DELETE" });
}

export async function getAdminAssetUploadUrl(
  assetId: string,
  kind: "file" | "image",
  fileName: string,
  contentType: string,
  fileSizeBytes: number,
): Promise<UploadUrlMeta> {
  return apiRequest<UploadUrlMeta>(`/admin/assets/${assetId}/upload-url`, {
    method: "POST",
    body: JSON.stringify({ kind, fileName, contentType, fileSizeBytes }),
  });
}

export async function registerAdminAssetImage(
  assetId: string,
  body: {
    storagePath: string;
    altText?: string;
    sortOrder?: number;
    isThumbnail?: boolean;
    replaceImageId?: string;
  },
): Promise<void> {
  await apiRequest(`/admin/assets/${assetId}/images`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchAdminSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const res = await apiRequest<PlanListResponse>("/admin/subscription-plans");
  return res.data ?? [];
}

export interface AdminCreateSubscriptionPlanRequest {
  slug: string;
  name: string;
  description?: string | null;
  priceVnd: number;
  creditsMonthly?: number | null;
  isUnlimited: boolean;
  features?: string[];
  sortOrder?: number;
  isActive?: boolean;
}

export interface AdminUpdateSubscriptionPlanRequest {
  name?: string;
  description?: string | null;
  priceVnd?: number;
  creditsMonthly?: number | null;
  isUnlimited?: boolean;
  features?: string[];
  sortOrder?: number;
  isActive?: boolean;
}

export async function createAdminSubscriptionPlan(
  body: AdminCreateSubscriptionPlanRequest
): Promise<SubscriptionPlan> {
  return apiRequest<SubscriptionPlan>("/admin/subscription-plans", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminSubscriptionPlan(
  id: string,
  body: AdminUpdateSubscriptionPlanRequest
): Promise<SubscriptionPlan> {
  return apiRequest<SubscriptionPlan>(`/admin/subscription-plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminSubscriptionPlan(id: string): Promise<void> {
  return apiRequest<void>(`/admin/subscription-plans/${id}`, { method: "DELETE" });
}

/** Xóa vĩnh viễn khỏi DB — chỉ khi gói đã ẩn và không còn user/đơn hàng tham chiếu. */
export async function hardDeleteAdminSubscriptionPlan(id: string): Promise<void> {
  return apiRequest<void>(`/admin/subscription-plans/${id}/permanent`, { method: "DELETE" });
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

export async function fetchAdminAnalyticsAiUsage(
  from?: string,
  to?: string
): Promise<AdminAnalyticsAiUsage> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const q = params.toString();
  return apiRequest<AdminAnalyticsAiUsage>(`/admin/analytics/ai-usage${q ? `?${q}` : ""}`);
}

export async function fetchAdminContactInquiries(
  page = 1,
  pageSize = 20,
  status?: string
): Promise<PagedResponse<ContactInquiry>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (status) params.set("status", status);
  return apiRequest<PagedResponse<ContactInquiry>>(`/admin/contact-inquiries?${params}`);
}

export async function updateAdminContactInquiry(
  id: string,
  status: string
): Promise<ContactInquiry> {
  return apiRequest<ContactInquiry>(`/admin/contact-inquiries/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchAdminAuditLogs(
  page = 1,
  pageSize = 30,
  userId?: string,
  action?: string
): Promise<PagedResponse<AdminAuditLog>> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (userId) params.set("userId", userId);
  if (action) params.set("action", action);
  return apiRequest<PagedResponse<AdminAuditLog>>(`/admin/audit-logs?${params}`);
}
