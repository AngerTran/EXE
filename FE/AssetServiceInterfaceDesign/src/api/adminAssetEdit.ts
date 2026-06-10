import type { AdminUpdateAssetBody } from "./admin";
import type { AssetDetail } from "./types/marketplace";
import type { TagGroupItem } from "./types/marketplace";
import { getAssetPreviewImages } from "./mappers";
import type { AssetRecord, LicenseType } from "../types/asset";
import { normalizeArtStyleFromApi } from "../constants/artStyles";

const LICENSE_TO_API: Record<LicenseType, string> = {
  "Standard License": "standard",
  CC0: "cc0",
  "Royalty Free": "royaltyFree",
};

const API_LICENSE_TO_UI: Record<string, LicenseType> = {
  standard: "Standard License",
  cc0: "CC0",
  royaltyfree: "Royalty Free",
  royalty_free: "Royalty Free",
};

export function mapAssetDetailToEditRecord(detail: AssetDetail): AssetRecord {
  const licenseKey = detail.license?.toLowerCase().replace(/_/g, "") ?? "standard";
  const license =
    API_LICENSE_TO_UI[licenseKey] ??
    API_LICENSE_TO_UI[detail.license?.toLowerCase() ?? ""] ??
    "Standard License";

  return {
    id: detail.id,
    title: detail.title,
    shortDescription: detail.shortDescription ?? "",
    fullDescription: detail.fullDescription ?? "",
    category: detail.categoryName as AssetRecord["category"],
    categoryId: detail.categoryId,
    tags: detail.tags,
    engineSupport: {
      unity: detail.engineUnity,
      unreal: detail.engineUnreal,
      godot: detail.engineGodot,
    },
    version: detail.version ?? "1.0.0",
    fileSize: "—",
    features: {
      rigged: detail.featureRigged,
      animated: detail.featureAnimated,
      pbr: detail.featurePbr,
      vrReady: detail.featureVrReady,
    },
    priceType: detail.isFree ? "free" : "paid",
    price: detail.isFree ? 0 : detail.priceXu,
    license,
    isFree: detail.isFree,
    thumbnailPreview: detail.thumbnailUrl ?? undefined,
    previewImages: getAssetPreviewImages(detail.images),
    artStyle: normalizeArtStyleFromApi(detail.artStyle),
    status: "approved",
    rating: detail.ratingAvg,
    downloads: detail.downloadCount,
    submittedAt: detail.createdAt,
    creatorName: detail.uploaderName,
  };
}

export function buildAdminUpdateBody(
  asset: AssetRecord,
  tagGroups: TagGroupItem[]
): AdminUpdateAssetBody {
  const tagIds: string[] = [];
  for (const group of tagGroups) {
    for (const tag of group.tags) {
      if (asset.tags.includes(tag.name)) tagIds.push(tag.id);
    }
  }

  const priceXu = asset.isFree ? 0 : Math.max(1, Math.floor(asset.price));

  return {
    title: asset.title.trim(),
    shortDescription: asset.shortDescription.trim(),
    fullDescription: asset.fullDescription.trim(),
    categoryId: asset.categoryId,
    tagIds,
    priceType: asset.isFree ? "free" : "paid",
    priceVnd: 0,
    priceXu,
    license: LICENSE_TO_API[asset.license],
    engineUnity: asset.engineSupport.unity,
    engineUnreal: asset.engineSupport.unreal,
    engineGodot: asset.engineSupport.godot,
    featureRigged: asset.features.rigged,
    featureAnimated: asset.features.animated,
    featurePbr: asset.features.pbr,
    featureVrReady: asset.features.vrReady,
    version: asset.version.trim(),
    thumbnailUrl: asset.thumbnailPreview ?? null,
    ...(asset.artStyle ? { artStyle: asset.artStyle } : {}),
  };
}
