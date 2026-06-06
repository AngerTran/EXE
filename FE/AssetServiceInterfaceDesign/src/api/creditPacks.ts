import { apiRequest } from "./client";

export interface CreditPackItem {
  id: string;
  name: string;
  credits: number;
  priceVnd: number;
  discountPercent?: number | null;
  sortOrder: number;
  isActive: boolean;
}

export async function fetchCreditPacks(): Promise<CreditPackItem[]> {
  const res = await apiRequest<{ data: CreditPackItem[] }>("/credit-packs", { auth: false });
  return res.data ?? [];
}

export async function fetchAdminCreditPacks(): Promise<CreditPackItem[]> {
  const res = await apiRequest<{ data: CreditPackItem[] }>("/admin/credit-packs");
  return res.data ?? [];
}

export interface AdminCreateCreditPackRequest {
  id: string;
  name: string;
  credits: number;
  priceVnd: number;
  discountPercent?: number | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface AdminUpdateCreditPackRequest {
  name?: string;
  credits?: number;
  priceVnd?: number;
  discountPercent?: number | null;
  sortOrder?: number;
  isActive?: boolean;
}

export async function createAdminCreditPack(
  body: AdminCreateCreditPackRequest
): Promise<CreditPackItem> {
  return apiRequest<CreditPackItem>("/admin/credit-packs", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminCreditPack(
  id: string,
  body: AdminUpdateCreditPackRequest
): Promise<CreditPackItem> {
  return apiRequest<CreditPackItem>(`/admin/credit-packs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteAdminCreditPack(id: string): Promise<void> {
  return apiRequest<void>(`/admin/credit-packs/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function hardDeleteAdminCreditPack(id: string): Promise<void> {
  return apiRequest<void>(`/admin/credit-packs/${encodeURIComponent(id)}/permanent`, {
    method: "DELETE",
  });
}
