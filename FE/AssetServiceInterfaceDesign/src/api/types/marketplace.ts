export interface CategoryItem {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  sortOrder: number;
}

export interface TagItem {
  id: string;
  groupId: string;
  name: string;
  slug: string;
  usageCount: number;
}

export interface TagGroupItem {
  id: string;
  slug: string;
  label: string;
  sortOrder: number;
  tags: TagItem[];
}

export interface AssetListItem {
  id: string;
  slug: string;
  title: string;
  shortDescription?: string | null;
  categoryId: string;
  categoryName: string;
  uploaderName: string;
  uploaderUsername: string;
  priceType: string;
  priceVnd: number;
  priceXu: number;
  displayPrice: number;
  ratingAvg: number;
  ratingCount: number;
  downloadCount: number;
  thumbnailUrl?: string | null;
  tags: string[];
  isFree: boolean;
  status?: string;
}

export interface AssetImageItem {
  id: string;
  storagePath: string;
  altText?: string | null;
  isThumbnail: boolean;
  sortOrder: number;
}

export interface AssetDetail extends AssetListItem {
  fullDescription?: string | null;
  uploaderId: string;
  uploaderUsername: string;
  artStyle?: string | null;
  license: string;
  status: string;
  engineUnity: boolean;
  engineUnreal: boolean;
  engineGodot: boolean;
  featureRigged: boolean;
  featureAnimated: boolean;
  featurePbr: boolean;
  featureVrReady: boolean;
  version?: string | null;
  createdAt: string;
  images?: AssetImageItem[];
}

export interface CreateAssetBody {
  title: string;
  shortDescription?: string;
  fullDescription?: string;
  categoryId: string;
  tagIds?: string[];
  artStyle?: string;
  priceType: "free" | "paid";
  priceVnd: number;
  priceXu: number;
  license?: string;
  engineUnity?: boolean;
  engineUnreal?: boolean;
  engineGodot?: boolean;
  featureRigged?: boolean;
  featureAnimated?: boolean;
  featurePbr?: boolean;
  featureVrReady?: boolean;
  version?: string;
  unityVersion?: string;
  fileSizeBytes?: number;
  polygonCount?: string;
  textureResolution?: string;
  thumbnailUrl?: string;
}

export interface UploadUrlMeta {
  uploadUrl: string;
  storagePath: string;
  bucket: string;
  expiresInSeconds: number;
}
