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

/** Tags cố định — demo local; form thật lấy từ API tag-groups */
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
      "Voxel",
      "Cel-Shaded",
      "Flat Color",
      "Noir / Monochrome",
      "Vector",
      "Game Boy",
      "GBA",
      "NES",
      "Sega Genesis",
      "Gothic",
      "Cute",
      "PICO-8",
      "SNES",
    ],
  },
  {
    label: "Thể loại game",
    tags: [
      "RPG",
      "JRPG",
      "Life Sim",
      "Action",
      "Adventure",
      "Combat",
      "Horror",
      "Survival",
      "Strategy",
      "Puzzle",
      "Racing",
      "Platformer",
      "Shooter",
      "FPS",
      "TPS",
      "MMO",
      "Roguelike",
      "Simulation",
      "Visual Novel",
      "Bullet Hell",
      "Metroidvania",
      "Clicker / Idle",
      "Walking Simulator",
      "Tower Defense",
      "Fighting",
      "Card Game",
      "Deckbuilder",
      "Rhythm",
    ],
  },
  {
    label: "Chủ đề",
    tags: [
      "Medieval",
      "Fantasy",
      "Nature",
      "Forest",
      "Urban",
      "Suburb",
      "Space",
      "Underwater",
      "Deep Sea",
      "Desert",
      "Oasis",
      "Volcano",
      "Lava",
      "Winter",
      "Ice",
      "Snow",
      "Swamp",
      "Marsh",
      "Sky",
      "Floating Island",
      "Post-Apocalyptic",
      "Steampunk",
      "Solarpunk",
      "Biopunk",
      "Cyberpunk",
      "Dystopian",
      "Retro-Futurism",
      "Military",
      "Magic",
      "Mythology",
      "Pirate",
      "Nautical",
      "Historical",
      "Wild West",
      "Western",
      "Oriental",
      "Eastern",
      "Asian",
      "Alien",
      "Mecha",
      "Robot",
      "Zombie",
      "Zombie Apocalypse",
      "Lovecraftian",
      "Cosmic Horror",
      "Psychological Horror",
      "Vampire",
      "Werewolf",
      "Surreal",
      "Dreamcore",
      "Weirdcore",
      "School",
      "Hospital",
      "Asylum",
      "Office",
      "Cooking",
      "Restaurant",
      "Crafting",
      "Farm",
      "Kawaii",
      "Comedy",
      "Parody",
      "Abstract",
      "Manga",
      "Character",
      "Interior",
      "Furniture",
      "Environment",
      "Dungeon",
      "Castle",
      "Knight",
      "Monster",
    ],
  },
  {
    label: "Nền tảng & mục đích",
    tags: [
      "Mobile",
      "PC",
      "Console",
      "VR",
      "Web",
      "WebGL",
      "HTML5",
      "Windows",
      "macOS",
      "Linux",
      "Android",
      "iOS",
      "Unity",
      "Unreal Engine",
      "Godot",
      "GameMaker",
      "Game Jam",
      "Indie",
      "Prototype",
      "Educational",
      "UI Kit",
    ],
  },
  {
    label: "Kỹ thuật & asset",
    tags: [
      "3D Models",
      "Mesh",
      "2D",
      "Sprites",
      "High Poly",
      "PBR",
      "Rigged",
      "Unrigged",
      "Animated",
      "VFX",
      "Shaders",
      "Materials",
      "Fonts",
      "Tileset",
      "Tile",
      "Tileable",
      "Modular",
      "Particle",
      "8x8",
      "16x16",
      "32x32",
      "64x64",
      "SFX Pack",
      "Music Pack",
      "BGM",
      "Soundtrack",
      "Voice Acting",
      "Foley",
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
    tags: [
      "Input",
      "Prompt",
      "Button",
      "Gamepad",
      "Control",
      "Interface",
      "Inventory",
      "Minimap",
      "Skill Tree",
      "Dialogue Box",
      "Crosshair",
      "Main Menu",
      "Splash Screen",
      "Shop UI",
      "Merchant UI",
      "Health Bar",
      "HUD",
    ],
  },
  {
    label: "Phương tiện",
    tags: [
      "Car",
      "Vehicle",
      "Transportation",
      "Motorcycle",
      "Bicycle",
      "Aircraft",
      "Airplane",
      "Helicopter",
      "Boat",
      "Ship",
      "Submarine",
      "Train",
      "Tram",
      "Spaceship",
      "Oopi",
    ],
  },
  {
    label: "Thiên nhiên & vật chất",
    tags: [
      "Earth",
      "Rock",
      "Stone",
      "Boulder",
      "Sand",
      "Clay",
      "Mud",
      "Dirt",
      "Soil",
      "Gravel",
      "Crystal",
      "Mineral",
      "Ore",
      "Gem",
      "Iron",
      "Copper",
      "Gold",
      "Silver",
      "Bronze",
      "Metal",
      "Water",
      "River",
      "Stream",
      "Lake",
      "Pond",
      "Ocean",
      "Sea",
      "Beach",
      "Rain",
      "Steam",
      "Cloud",
      "Fog",
      "Mist",
      "Wind",
      "Air",
      "Atmosphere",
      "Fire",
      "Flame",
      "Smoke",
      "Ash",
      "Ember",
      "Spark",
      "Lightning",
      "Thunder",
      "Grass",
      "Plant",
      "Flower",
      "Bush",
      "Shrub",
      "Fern",
      "Moss",
      "Vine",
      "Leaf",
      "Root",
      "Seed",
      "Flora",
      "Crop",
      "Agriculture",
      "Bamboo",
      "Wood",
      "Tree",
      "Vegetation",
      "Mushroom",
      "Fungus",
      "Seaweed",
      "Algae",
      "Wilderness",
      "Grassland",
      "Waterfall",
      "Cave",
      "Biome",
      "Animal",
      "Wildlife",
      "Fauna",
      "Bird",
      "Fish",
      "Insect",
      "Bug",
      "Mammal",
      "Reptile",
      "Amphibian",
      "Beast",
      "Creature",
      "Bone",
      "Leather",
      "Fur",
      "Feather",
      "Shell",
      "Coral",
      "Iceberg",
      "Snowflake",
      "Pebble",
      "Stalactite",
      "Stalagmite",
    ],
  },
] as const;

export const PREDEFINED_TAGS = TAG_GROUPS.flatMap((g) => g.tags);

export const LICENSE_OPTIONS: LicenseType[] = [
  "Standard License",
  "CC0",
  "Royalty Free",
];
