import { apiRequest } from "./client";
import type { PagedResponse } from "./types/common";

export type NotificationApiItem = {
  id: string;
  type: "success" | "error" | "warning" | "info";
  category: string;
  title: string;
  description?: string | null;
  actionUrl?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  read: boolean;
  createdAt: string;
};

export async function fetchNotifications(params?: {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
}): Promise<PagedResponse<NotificationApiItem>> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.pageSize) search.set("pageSize", String(params.pageSize));
  if (params?.unreadOnly) search.set("unreadOnly", "true");
  const qs = search.toString();
  return apiRequest<PagedResponse<NotificationApiItem>>(
    `/notifications${qs ? `?${qs}` : ""}`,
  );
}

export async function fetchNotificationUnreadCount(): Promise<number> {
  const res = await apiRequest<{ count: number }>("/notifications/unread-count");
  return res.count;
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest<void>("/notifications/read-all", { method: "PATCH" });
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiRequest<void>(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function deleteAllNotifications(): Promise<void> {
  await apiRequest<void>("/notifications", { method: "DELETE" });
}

export async function deleteNotification(id: string): Promise<void> {
  await apiRequest<void>(`/notifications/${id}`, { method: "DELETE" });
}
