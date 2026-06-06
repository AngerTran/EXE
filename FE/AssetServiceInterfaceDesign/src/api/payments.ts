import { apiRequest } from "./client";

export interface BankTransferInfo {
  bankBin: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrImageUrl?: string | null;
  vietQrImageUrl?: string | null;
}

export async function fetchBankTransferInfo(
  amountVnd?: number,
  transferMemo?: string
): Promise<BankTransferInfo> {
  const params = new URLSearchParams();
  if (amountVnd != null && amountVnd > 0) params.set("amountVnd", String(amountVnd));
  if (transferMemo) params.set("transferMemo", transferMemo);
  const qs = params.toString();
  return apiRequest<BankTransferInfo>(`/payments/bank-transfer-info${qs ? `?${qs}` : ""}`);
}
