import { apiRequest } from "./client";
import type { UserAssetDetail, UserAssetItem } from "./types/commerce";

export async function fetchUserAssets(): Promise<UserAssetItem[]> {
  return apiRequest<UserAssetItem[]>("/user-assets");
}

export async function fetchUserAssetDetail(assetId: string): Promise<UserAssetDetail> {
  return apiRequest<UserAssetDetail>(`/user-assets/${assetId}`);
}

export async function downloadUserAsset(assetId: string): Promise<UserAssetDetail> {
  return apiRequest<UserAssetDetail>(`/user-assets/${assetId}/download`, {
    method: "POST",
  });
}
