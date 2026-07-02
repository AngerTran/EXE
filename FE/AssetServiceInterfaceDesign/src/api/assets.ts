import { apiRequest } from "./client";
import { humanizeStorageError } from "../utils/formatError";
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
  uploaderId?: string;
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
  if (params.uploaderId) q.set("uploaderId", params.uploaderId);
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
  return apiRequest<PagedResponse<AssetListItem>>(`/assets${buildQuery(params)}`);
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

export interface UpdateAssetBody {
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
  unityVersion?: string;
  polygonCount?: string;
  textureResolution?: string;
  thumbnailUrl?: string | null;
  artStyle?: string;
}

export async function updateAsset(id: string, body: UpdateAssetBody): Promise<AssetDetail> {
  return apiRequest<AssetDetail>(`/assets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function fetchMyAssetById(id: string): Promise<AssetDetail> {
  return apiRequest<AssetDetail>(`/seller/assets/${id}`);
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
  const normalizedType = normalizeStorageContentType(file, contentType);
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": normalizedType,
      "x-upsert": "true",
      "cache-control": "max-age=3600",
    },
    body: file,
  });
  if (!put.ok) {
    const detail = await put.text().catch(() => "");
    const parsed = parseStorageErrorBody(detail, put.status);
    const trimmed = parsed ?? detail.replace(/\s+/g, " ").trim().slice(0, 320);
    throw new Error(trimmed ? `Upload thất bại (${put.status}): ${trimmed}` : `Upload thất bại (${put.status})`);
  }
}

function parseStorageErrorBody(body: string, httpStatus?: number): string | null {
  const text = body.trim();
  if (!text && httpStatus === 413) {
    return humanizeStorageError("Payload too large");
  }
  if (!text) return null;
  try {
    const json = JSON.parse(text) as { message?: string; error?: string; statusCode?: string | number };
    const raw = [json.message, json.error].filter(Boolean).join(" — ");
    const code = json.statusCode ?? httpStatus;
    const withCode = raw && code != null ? `${raw} (mã ${code})` : raw || (code != null ? `mã ${code}` : "");
    return withCode ? humanizeStorageError(withCode) : null;
  } catch {
    return humanizeStorageError(text.slice(0, 320));
  }
}

/** Chuẩn hoá MIME trước khi PUT lên Supabase — tránh 400 do Windows gửi application/x-zip-compressed. */
export function normalizeStorageContentType(file: File | Blob, contentType: string): string {
  if (file instanceof File) {
    const lower = file.name.toLowerCase();
    if (lower.endsWith(".zip")) return "application/zip";
    if (lower.endsWith(".rar")) return "application/vnd.rar";
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".webp")) return "image/webp";
  }
  if (contentType === "application/x-zip-compressed") return "application/zip";
  return contentType || "application/octet-stream";
}
