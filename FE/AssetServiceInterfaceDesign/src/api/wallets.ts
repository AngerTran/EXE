import { apiRequest } from "./client";
import type { PagedResponse } from "./types/common";
import type { WalletTransaction } from "./types/billing";

export async function fetchMyWalletTransactions(
  page = 1,
  pageSize = 20
): Promise<PagedResponse<WalletTransaction>> {
  return apiRequest<PagedResponse<WalletTransaction>>(
    `/wallets/me/transactions?page=${page}&pageSize=${pageSize}`
  );
}
