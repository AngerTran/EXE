/** Chuẩn hóa orderType từ API (asset | subscription | credit_pack | creditpack). */
export function normalizeOrderType(orderType?: string | null): string {
  return (orderType ?? "").toLowerCase().replace(/_/g, "");
}

/** Đơn CK chờ admin xác nhận (gói đăng ký hoặc nạp xu). */
export function isBankTransferAwaitingConfirmation(order: {
  status: string;
  orderType?: string | null;
}): boolean {
  if (order.status.toLowerCase() !== "pending") return false;
  const type = normalizeOrderType(order.orderType);
  return type === "subscription" || type === "creditpack";
}

export function orderTypeDisplayLabel(orderType?: string | null): string {
  const type = normalizeOrderType(orderType);
  if (type === "subscription") return "Gói DV";
  if (type === "creditpack") return "Nạp xu";
  return "Asset";
}

export function isAssetOrderType(orderType?: string | null): boolean {
  return normalizeOrderType(orderType) === "asset";
}
