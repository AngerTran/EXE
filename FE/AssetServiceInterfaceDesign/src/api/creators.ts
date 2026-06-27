import { apiRequest } from "./client";
import type { AssetListItem } from "./types/marketplace";
import type { PagedResponse } from "./types/common";
import type { SellerStats } from "./seller";

export interface CreatorPublic {
  userId: string;
  username: string;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  websiteUrl?: string | null;
  stats: SellerStats;
  memberSince: string;
}

export interface CreatorAssetsResponse {
  creator: CreatorPublic;
  assets: PagedResponse<AssetListItem>;
}

export async function fetchCreator(username: string): Promise<CreatorPublic> {
  return apiRequest<CreatorPublic>(`/creators/${encodeURIComponent(username)}`, { auth: false });
}

export async function fetchCreatorAssets(
  username: string,
  page = 1,
  pageSize = 20
): Promise<CreatorAssetsResponse> {
  return apiRequest<CreatorAssetsResponse>(
    `/creators/${encodeURIComponent(username)}/assets?page=${page}&pageSize=${pageSize}`,
    { auth: false }
  );
}
