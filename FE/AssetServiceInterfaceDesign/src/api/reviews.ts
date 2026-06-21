import { apiRequest } from "./client";

export interface ReviewItem {
  id: string;
  assetId: string;
  userName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  isOwn: boolean;
}

export async function fetchAssetReviews(assetId: string): Promise<ReviewItem[]> {
  // Gửi token nếu đã đăng nhập — BE mới trả isOwn để hiện Sửa/Xóa.
  return apiRequest<ReviewItem[]>(`/assets/${assetId}/reviews`);
}

export async function createReview(
  assetId: string,
  rating: number,
  comment?: string
): Promise<ReviewItem> {
  return apiRequest<ReviewItem>(`/assets/${assetId}/reviews`, {
    method: "POST",
    body: JSON.stringify({ rating, comment: comment?.trim() || null }),
  });
}

export async function updateReview(
  id: string,
  data: { rating?: number; comment?: string | null }
): Promise<ReviewItem> {
  return apiRequest<ReviewItem>(`/reviews/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteReview(id: string): Promise<void> {
  await apiRequest<void>(`/reviews/${id}`, { method: "DELETE" });
}
