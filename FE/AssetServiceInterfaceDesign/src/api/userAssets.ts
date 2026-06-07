import { ApiError, apiRequest, getAccessToken, getApiBaseUrl } from "./client";
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

async function fetchAssetFileBlob(assetId: string): Promise<Response> {
  const token = getAccessToken();
  if (!token) {
    throw new ApiError("Vui lòng đăng nhập để tải asset", 401);
  }

  const headers = { Authorization: `Bearer ${token}` };
  const base = getApiBaseUrl();
  const primaryUrl = `${base}/user-assets/${assetId}/file`;
  let response = await fetch(primaryUrl, { headers });

  if (response.status === 404) {
    response = await fetch(`${base}/assets/${assetId}/download/file`, { headers });
  }

  return response;
}

export async function downloadUserAssetFile(assetId: string, fileName: string): Promise<void> {
  const response = await fetchAssetFileBlob(assetId);

  if (!response.ok) {
    let message = response.statusText || "Tải xuống thất bại";
    try {
      const data = (await response.json()) as { message?: string };
      if (data.message) message = data.message;
    } catch {
      /* binary or empty body */
    }
    if (response.status === 503) {
      message =
        "Storage chưa cấu hình (Supabase ServiceRoleKey). Liên hệ admin hoặc kiểm tra BE/appsettings.json.";
    }
    throw new ApiError(message, response.status);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName || "asset.zip";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function removeUserAssetFromLibrary(assetId: string): Promise<void> {
  await apiRequest<void>(`/user-assets/${assetId}`, { method: "DELETE" });
}
