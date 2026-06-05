export interface OrderItem {
  id: string;
  assetId?: string | null;
  planId?: string | null;
  itemName: string;
  unitPriceVnd: number;
  quantity: number;
  lineTotalVnd: number;
}

export interface Order {
  id: string;
  orderCode: string;
  orderType: string;
  status: string;
  subtotalVnd: number;
  discountVnd: number;
  totalVnd: number;
  totalXu: number;
  completedAt?: string | null;
  createdAt: string;
  items: OrderItem[];
  paymentId?: string | null;
  paymentRedirectUrl?: string | null;
}

export interface OrdersSummary {
  totalOrders: number;
  totalSpentVnd: number;
  completedOrders: number;
  pendingOrders: number;
}

export interface CartAssetPreview {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  categoryName: string;
  priceType: string;
  priceVnd: number;
  isFree: boolean;
}

export interface CartItem {
  id: string;
  assetId: string;
  quantity: number;
  asset: CartAssetPreview;
  lineTotalVnd: number;
}

export interface Cart {
  items: CartItem[];
  subtotalVnd: number;
  itemCount: number;
}

export interface UserAssetItem {
  assetId: string;
  title: string;
  slug: string;
  categoryName: string;
  thumbnailUrl?: string | null;
  acquiredVia: string;
  downloadCount: number;
  lastDownloadAt?: string | null;
  acquiredAt: string;
}

export interface UserAssetDetail extends UserAssetItem {
  shortDescription?: string | null;
  downloadUrl?: string | null;
  downloadExpiresInSeconds?: number | null;
}
