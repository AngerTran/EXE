/** Giá trị gửi API (JsonStringEnumConverter camelCase). */
export type ArtStyleValue =
  | "pixelArt"
  | "lowPoly"
  | "anime"
  | "realistic"
  | "stylized"
  | "cartoon"
  | "handPainted"
  | "minimalist"
  | "retro"
  | "cyberpunk"
  | "sciFi";

export const ART_STYLE_OPTIONS: { value: ArtStyleValue; label: string }[] = [
  { value: "pixelArt", label: "Pixel Art" },
  { value: "lowPoly", label: "Low Poly" },
  { value: "anime", label: "Anime" },
  { value: "realistic", label: "Realistic" },
  { value: "stylized", label: "Stylized" },
  { value: "cartoon", label: "Cartoon" },
  { value: "handPainted", label: "Hand Painted" },
  { value: "minimalist", label: "Minimalist" },
  { value: "retro", label: "Retro" },
  { value: "cyberpunk", label: "Cyberpunk" },
  { value: "sciFi", label: "Sci-Fi" },
];

const FROM_API: Record<string, ArtStyleValue> = {
  pixelart: "pixelArt",
  pixel_art: "pixelArt",
  lowpoly: "lowPoly",
  low_poly: "lowPoly",
  anime: "anime",
  realistic: "realistic",
  stylized: "stylized",
  cartoon: "cartoon",
  handpainted: "handPainted",
  hand_painted: "handPainted",
  minimalist: "minimalist",
  retro: "retro",
  cyberpunk: "cyberpunk",
  scifi: "sciFi",
  sci_fi: "sciFi",
};

export function normalizeArtStyleFromApi(raw?: string | null): ArtStyleValue | undefined {
  if (!raw) return undefined;
  const normalized = raw.toLowerCase().replace(/-/g, "_");
  return FROM_API[normalized.replace(/_/g, "")] ?? FROM_API[normalized];
}
