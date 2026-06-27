import { apiRequest } from "./client";
import type { AssetListItem } from "./types/marketplace";
import type { PagedResponse } from "./types/common";

export interface SellerStats {
  totalAssets: number;
  approvedCount: number;
  pendingReviewCount: number;
  rejectedCount: number;
  draftCount: number;
  totalDownloads: number;
}

export interface SellerEarningsSummary {
  totalGrossXu: number;
  totalPlatformFeeXu: number;
  totalNetXu: number;
  saleCount: number;
}

export interface SellerMe {
  userId: string;
  email: string;
  username: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  bio?: string | null;
  sellerWebsiteUrl?: string | null;
  sellerIsTrusted: boolean;
  sellerStatus?: string | null;
  sellerAppliedAt?: string | null;
  sellerApprovedAt?: string | null;
  stats: SellerStats;
  earnings: SellerEarningsSummary;
}

export interface SellerAssetsResponse {
  stats: SellerStats;
  assets: PagedResponse<AssetListItem>;
}

export interface SellerApplyBody {
  reason?: string;
  portfolioUrl?: string;
}

export interface SellerApplyResult {
  userId: string;
  role: string;
  activatedAt: string;
}

export interface SellerEarningItem {
  id: string;
  orderId: string;
  orderCode: string;
  assetId: string;
  assetTitle: string;
  grossXu: number;
  platformFeeXu: number;
  netXu: number;
  status: string;
  createdAt: string;
}

export interface SellerEarningsResponse {
  summary: SellerEarningsSummary;
  items: PagedResponse<SellerEarningItem>;
}

export async function fetchSellerMe(): Promise<SellerMe> {
  return apiRequest<SellerMe>("/seller/me");
}

export async function fetchSellerAssets(page = 1, pageSize = 20): Promise<SellerAssetsResponse> {
  return apiRequest<SellerAssetsResponse>(`/seller/assets?page=${page}&pageSize=${pageSize}`);
}

export async function updateSellerProfile(body: {
  name?: string;
  bio?: string;
  sellerWebsiteUrl?: string;
}): Promise<SellerMe> {
  return apiRequest<SellerMe>("/seller/profile", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function applySeller(body: SellerApplyBody = {}): Promise<SellerApplyResult> {
  return apiRequest<SellerApplyResult>("/seller/apply", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchSellerEarnings(page = 1, pageSize = 20): Promise<SellerEarningsResponse> {
  return apiRequest<SellerEarningsResponse>(`/seller/earnings?page=${page}&pageSize=${pageSize}`);
}

export function assetStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case "approved":
      return "Đã duyệt";
    case "pending_review":
      return "Chờ duyệt";
    case "rejected":
      return "Từ chối";
    case "draft":
      return "Nháp";
    default:
      return status;
  }
}

export function assetStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case "approved":
      return "bg-success/15 text-success border-success/30";
    case "pending_review":
      return "bg-warning/15 text-warning border-warning/30";
    case "rejected":
      return "bg-destructive/15 text-destructive border-destructive/30";
    default:
      return "bg-muted/15 text-muted-foreground border-border";
  }
}
