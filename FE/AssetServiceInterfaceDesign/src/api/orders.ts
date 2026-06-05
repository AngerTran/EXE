import { apiRequest } from "./client";
import type { Order, OrdersSummary } from "./types/commerce";
import type { PagedResponse } from "./types/common";

export async function fetchMyOrders(page = 1, pageSize = 20): Promise<PagedResponse<Order>> {
  return apiRequest<PagedResponse<Order>>(`/orders?page=${page}&pageSize=${pageSize}`);
}

export async function fetchOrdersSummary(): Promise<OrdersSummary> {
  return apiRequest<OrdersSummary>("/orders/me/summary");
}

export async function fetchOrderById(id: string): Promise<Order> {
  return apiRequest<Order>(`/orders/${id}`);
}

export async function createSubscriptionOrder(
  planId: string,
  paymentMethod: string
): Promise<Order> {
  return apiRequest<Order>("/orders/subscription", {
    method: "POST",
    body: JSON.stringify({ planId, paymentMethod }),
  });
}

export async function createAssetOrder(
  paymentMethod: string,
  useSubscriptionFreeAssets = true,
  assetIds?: string[]
): Promise<Order> {
  return apiRequest<Order>("/orders/assets", {
    method: "POST",
    body: JSON.stringify({ paymentMethod, useSubscriptionFreeAssets, assetIds }),
  });
}

export async function fetchAllOrders(
  page = 1,
  pageSize = 50,
  userId?: string
): Promise<PagedResponse<Order>> {
  const params = new URLSearchParams({
    all: "true",
    page: String(page),
    pageSize: String(pageSize),
  });
  if (userId) params.set("userId", userId);
  return apiRequest<PagedResponse<Order>>(`/orders?${params}`);
}

export async function updateOrderStatus(
  orderId: string,
  status: string
): Promise<Order> {
  return apiRequest<Order>(`/orders/${orderId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
