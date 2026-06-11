export type AssetCategory =
  | "3D Model"
  | "2D Model"
  | "UI"
  | "Audio"
  | "Animation"
  | "Shader"
  | "VFX"
  | "Template";

export type AssetStatus = "approved" | "pending_review" | "rejected";

export type LicenseType = "Standard License" | "CC0" | "Royalty Free";

export type PriceType = "free" | "paid";

export interface EngineSupport {
  unity: boolean;
  unreal: boolean;
  godot: boolean;
}

export interface AssetFeatures {
  rigged: boolean;
  animated: boolean;
  pbr: boolean;
  vrReady: boolean;
}

import type { ArtStyleValue } from "../constants/artStyles";
import type { AssetImageItem } from "../api/types/marketplace";

export interface AssetRecord {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  category: AssetCategory;
  tags: string[];
  engineSupport: EngineSupport;
  version: string;
  fileSize: string;
  polygonCount?: string;
  textureResolution?: string;
  features: AssetFeatures;
  priceType: PriceType;
  price: number;
  license: LicenseType;
  isFree: boolean;
  thumbnailName?: string;
  thumbnailPreview?: string;
  previewImages?: AssetImageItem[];
  previewNames?: string[];
  zipFileName?: string;
  status: AssetStatus;
  rejectedReason?: string;
  creatorId?: string;
  creatorName?: string;
  submittedAt: string;
  rating: number;
  downloads: number;
  /** UUID danh mục từ API — dùng khi admin sửa asset */
  categoryId?: string;
  /** Phong cách nghệ thuật (API camelCase) */
  artStyle?: ArtStyleValue;
}

export const ASSET_CATEGORIES: AssetCategory[] = [
  "3D Model",
  "2D Model",
  "UI",
  "Audio",
  "Animation",
  "Shader",
  "VFX",
  "Template",
];

/** Tags cố định — demo local, chưa kết nối API */
export const TAG_GROUPS = [
  {
    label: "Phong cách",
    tags: [
      "Cyberpunk",
      "Sci-Fi",
      "Fantasy",
      "Stylized",
      "Realistic",
      "Cartoon",
      "Anime",
      "Pixel Art",
      "Low Poly",
      "Hand Painted",
      "Minimalist",
      "Retro",
      "PSX",
      "8-Bit",
      "Cozy",
      "Chiptune",
    ],
  },
  {
    label: "Thể loại game",
    tags: [
      "RPG",
      "Life Sim",
      "Action",
      "Horror",
      "Survival",
      "Strategy",
      "Puzzle",
      "Racing",
      "Platformer",
      "Shooter",
      "MMO",
      "Roguelike",
      "Simulation",
    ],
  },
  {
    label: "Chủ đề",
    tags: [
      "Medieval",
      "Nature",
      "Urban",
      "Space",
      "Underwater",
      "Post-Apocalyptic",
      "Steampunk",
      "Military",
      "Magic",
      "Zombie",
      "Character",
      "Interior",
      "Furniture",
      "Environment",
      "Tree",
      "Vegetation",
      "Village",
      "Farm",
    ],
  },
  {
    label: "Nền tảng & mục đích",
    tags: [
      "Mobile",
      "PC",
      "Console",
      "VR",
      "Indie",
      "Prototype",
      "Educational",
      "UI Kit",
    ],
  },
  {
    label: "Kỹ thuật & asset",
    tags: [
      "PBR",
      "Rigged",
      "Animated",
      "Tileset",
      "Tile",
      "Modular",
      "Particle",
      "SFX Pack",
      "Music Pack",
      "BGM",
      "Soundtrack",
      "Ambient",
      "Loop",
      "Sprite Sheet",
      "Seamless",
      "Pattern",
      "Textures",
      "Top-Down",
      "Tiled",
    ],
  },
  {
    label: "Thành phần UI",
    tags: ["Input", "Prompt", "Button", "Gamepad", "Control", "Interface"],
  },
  {
    label: "Phương tiện",
    tags: ["Car", "Vehicle", "Transportation", "Oopi"],
  },
] as const;

export const PREDEFINED_TAGS = TAG_GROUPS.flatMap((g) => g.tags);

export const LICENSE_OPTIONS: LicenseType[] = [
  "Standard License",
  "CC0",
  "Royalty Free",
];
