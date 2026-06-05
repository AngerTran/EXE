import { apiRequest } from "./client";
import type {
  AssetDetail,
  AssetListItem,
  CreateAssetBody,
  UploadUrlMeta,
} from "./types/marketplace";
import type { PagedResponse } from "./types/common";

export interface AssetQuery {
  search?: string;
  categoryId?: string;
  priceType?: string;
  tag?: string;
  featured?: boolean;
  limit?: number;
  sort?: string;
  order?: string;
  page?: number;
  pageSize?: number;
}

function buildQuery(params: AssetQuery): string {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.categoryId) q.set("categoryId", params.categoryId);
  if (params.priceType) q.set("priceType", params.priceType);
  if (params.tag) q.set("tag", params.tag);
  if (params.featured) q.set("featured", "true");
  if (params.limit) q.set("limit", String(params.limit));
  if (params.sort) q.set("sort", params.sort);
  if (params.order) q.set("order", params.order);
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 20));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export async function fetchAssets(params: AssetQuery = {}): Promise<PagedResponse<AssetListItem>> {
  return apiRequest<PagedResponse<AssetListItem>>(`/assets${buildQuery(params)}`, { auth: false });
}

export async function fetchAssetById(id: string): Promise<AssetDetail> {
  return apiRequest<AssetDetail>(`/assets/${id}`, { auth: false });
}

export async function fetchPendingAssets(page = 1, pageSize = 50): Promise<PagedResponse<AssetListItem>> {
  return apiRequest<PagedResponse<AssetListItem>>(
    `/assets/pending?page=${page}&pageSize=${pageSize}`
  );
}

export async function createAsset(body: CreateAssetBody): Promise<AssetDetail> {
  return apiRequest<AssetDetail>("/assets", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function approveAsset(id: string): Promise<AssetDetail> {
  return apiRequest<AssetDetail>(`/assets/${id}/approve`, { method: "PATCH" });
}

export async function rejectAsset(id: string, reason: string): Promise<AssetDetail> {
  return apiRequest<AssetDetail>(`/assets/${id}/reject`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  });
}

export async function deleteAsset(id: string): Promise<void> {
  return apiRequest<void>(`/assets/${id}`, { method: "DELETE" });
}

export async function getAssetUploadUrl(
  assetId: string,
  kind: "File" | "Image",
  fileName: string,
  contentType: string,
  fileSizeBytes: number
): Promise<UploadUrlMeta> {
  return apiRequest<UploadUrlMeta>(`/assets/${assetId}/upload-url`, {
    method: "POST",
    body: JSON.stringify({ kind, fileName, contentType, fileSizeBytes }),
  });
}

export async function registerAssetFile(
  assetId: string,
  body: {
    storagePath: string;
    fileName: string;
    fileType: string;
    fileSizeBytes: number;
    isPrimary?: boolean;
  }
): Promise<void> {
  await apiRequest(`/assets/${assetId}/files`, {
    method: "POST",
    body: JSON.stringify({ ...body, isPrimary: body.isPrimary ?? true }),
  });
}

export async function registerAssetImage(
  assetId: string,
  body: {
    storagePath: string;
    altText?: string;
    sortOrder?: number;
    isThumbnail?: boolean;
  }
): Promise<void> {
  await apiRequest(`/assets/${assetId}/images`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function uploadToSignedUrl(
  uploadUrl: string,
  file: File | Blob,
  contentType: string
): Promise<void> {
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!put.ok) {
    throw new Error(`Upload thất bại (${put.status})`);
  }
}
