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

export async function createAssetOrder(assetIds?: string[]): Promise<Order> {
  return apiRequest<Order>("/orders/assets", {
    method: "POST",
    body: JSON.stringify({ assetIds }),
  });
}

export async function createCreditPackOrder(packId: string): Promise<Order> {
  return apiRequest<Order>("/orders/credit-packs", {
    method: "POST",
    body: JSON.stringify({ packId, paymentMethod: "bank" }),
  });
}

export async function fetchAllOrders(
  page = 1,
  pageSize = 50,
  userId?: string,
  status?: string,
): Promise<PagedResponse<Order>> {
  const params = new URLSearchParams({
    all: "true",
    page: String(page),
    pageSize: String(pageSize),
  });
  if (userId) params.set("userId", userId);
  if (status) params.set("status", status);
  return apiRequest<PagedResponse<Order>>(`/orders?${params}`);
}

/** Đơn chờ admin xác nhận (chuyển khoản gói / nạp xu). */
export async function fetchPendingOrdersForAdmin(
  pageSize = 50,
): Promise<PagedResponse<Order>> {
  return fetchAllOrders(1, pageSize, undefined, "pending");
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

/** Khách báo đã chuyển khoản — đưa đơn vào hàng chờ admin xác nhận. */
export async function reportBankTransfer(orderId: string): Promise<Order> {
  return apiRequest<Order>(`/orders/${orderId}/report-transfer`, {
    method: "POST",
  });
}
