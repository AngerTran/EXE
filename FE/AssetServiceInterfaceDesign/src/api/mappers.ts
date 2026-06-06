import type { AssetDetail, AssetListItem } from "./types/marketplace";
import { ART_STYLE_OPTIONS } from "../constants/artStyles";
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

/** Chi tiết asset — drawer marketplace */
export interface MarketplaceAssetDetail extends MarketplaceAsset {
  shortDescription?: string | null;
  fullDescription?: string | null;
  license?: string;
  artStyle?: string | null;
  version?: string | null;
  engineUnity: boolean;
  engineUnreal: boolean;
  engineGodot: boolean;
  featureRigged: boolean;
  featureAnimated: boolean;
  featurePbr: boolean;
  featureVrReady: boolean;
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

export function mapAssetDetail(detail: AssetDetail): MarketplaceAssetDetail {
  return {
    ...mapAssetListItem(detail),
    shortDescription: detail.shortDescription,
    fullDescription: detail.fullDescription,
    license: detail.license,
    artStyle: detail.artStyle,
    version: detail.version,
    engineUnity: detail.engineUnity,
    engineUnreal: detail.engineUnreal,
    engineGodot: detail.engineGodot,
    featureRigged: detail.featureRigged,
    featureAnimated: detail.featureAnimated,
    featurePbr: detail.featurePbr,
    featureVrReady: detail.featureVrReady,
  };
}

export function getMarketplaceAssetDescription(detail: MarketplaceAssetDetail | null): string | null {
  if (!detail) return null;
  const full = detail.fullDescription?.trim();
  if (full) return full;
  const short = detail.shortDescription?.trim();
  if (short) return short;
  return null;
}

export function getMarketplaceAssetFeatures(detail: MarketplaceAssetDetail): string[] {
  const features: string[] = [];
  const engines: string[] = [];
  if (detail.engineUnity) engines.push("Unity");
  if (detail.engineUnreal) engines.push("Unreal Engine");
  if (detail.engineGodot) engines.push("Godot");
  if (engines.length) features.push(`Engine: ${engines.join(", ")}`);
  if (detail.featureRigged) features.push("Rigged (có xương)");
  if (detail.featureAnimated) features.push("Animated (có animation)");
  if (detail.featurePbr) features.push("PBR materials");
  if (detail.featureVrReady) features.push("VR ready");
  if (detail.artStyle) {
    const label =
      ART_STYLE_OPTIONS.find((o) => o.value === detail.artStyle)?.label ?? detail.artStyle;
    features.push(`Art style: ${label}`);
  }
  if (detail.license?.trim()) features.push(`License: ${detail.license.trim()}`);
  if (detail.version?.trim()) features.push(`Version ${detail.version.trim()}`);
  return features;
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
