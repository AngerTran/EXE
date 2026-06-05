import type { AssetListItem } from "./types/marketplace";
import type { Order } from "./types/commerce";
import type { UserAssetItem } from "./types/commerce";

/** Asset card dùng chung Marketplace / Dashboard gợi ý */
export interface MarketplaceAsset {
  id: string;
  title: string;
  category: string;
  price: number;
  rating: number;
  downloads: number;
  preview: string;
  author: string;
  tags: string[];
  isFree: boolean;
  thumbnailUrl?: string | null;
}

export function mapAssetListItem(item: AssetListItem): MarketplaceAsset {
  return {
    id: item.id,
    title: item.title,
    category: item.categoryName,
    price: item.displayPrice ?? item.priceXu,
    rating: item.ratingAvg,
    downloads: item.downloadCount,
    preview: item.thumbnailUrl || item.title.toLowerCase(),
    author: item.uploaderName,
    tags: item.tags,
    isFree: item.isFree,
    thumbnailUrl: item.thumbnailUrl,
  };
}

export type OrderStatusUi = "completed" | "pending" | "cancelled";

export function mapOrderStatus(status: string): OrderStatusUi {
  const s = status.toLowerCase();
  if (s === "completed") return "completed";
  if (s === "cancelled" || s === "refunded") return "cancelled";
  return "pending";
}

export interface OrderUi {
  id: string;
  orderCode: string;
  items: string[];
  total: number;
  status: OrderStatusUi;
  date: string;
}

export function mapOrderToUi(order: Order): OrderUi {
  return {
    id: order.id,
    orderCode: order.orderCode,
    items: order.items.map((i) => i.itemName),
    total: order.totalXu || order.totalVnd,
    status: mapOrderStatus(order.status),
    date: order.createdAt.split("T")[0],
  };
}

export interface PurchasedAssetUi {
  id: string;
  title: string;
  category: string;
  price: number;
  purchaseDate: string;
  downloadCount: number;
  fileSize: string;
  fileType: string;
  thumbnailUrl?: string | null;
}

export function mapUserAssetToUi(item: UserAssetItem): PurchasedAssetUi {
  return {
    id: item.assetId,
    title: item.title,
    category: item.categoryName,
    price: 0,
    purchaseDate: item.acquiredAt.split("T")[0],
    downloadCount: item.downloadCount,
    fileSize: "—",
    fileType: item.categoryName,
    thumbnailUrl: item.thumbnailUrl,
  };
}
