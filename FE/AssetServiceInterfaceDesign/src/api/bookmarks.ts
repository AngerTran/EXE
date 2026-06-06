import { apiRequest } from "./client";
import type { AssetListItem } from "./types/marketplace";

export async function fetchBookmarks(): Promise<AssetListItem[]> {
  const res = await apiRequest<{ data: AssetListItem[] }>("/bookmarks");
  return res.data;
}

export async function addBookmark(assetId: string): Promise<void> {
  await apiRequest<void>("/bookmarks", {
    method: "POST",
    body: JSON.stringify({ assetId }),
  });
}

export async function removeBookmark(assetId: string): Promise<void> {
  await apiRequest<void>(`/bookmarks/${assetId}`, { method: "DELETE" });
}
