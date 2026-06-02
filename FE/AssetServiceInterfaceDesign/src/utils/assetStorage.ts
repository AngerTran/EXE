import type { AssetRecord } from "../types/asset";

const SUBMISSIONS_KEY = "asset_submissions";
const LEGACY_KEY = "admin_assets";
const AUTO_APPROVE_KEY = "admin_auto_approve";

function readSubmissions(): AssetRecord[] {
  migrateLegacyIfNeeded();
  const raw = localStorage.getItem(SUBMISSIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AssetRecord[];
  } catch {
    return [];
  }
}

function writeSubmissions(submissions: AssetRecord[]) {
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(submissions));
  syncLegacyAdminAssets(submissions);
}

function migrateLegacyIfNeeded() {
  if (localStorage.getItem(SUBMISSIONS_KEY)) return;

  const legacy = localStorage.getItem(LEGACY_KEY);
  if (!legacy) return;

  try {
    const parsed = JSON.parse(legacy) as Array<{
      id: string;
      title: string;
      category: string;
      price: number;
      rating: number;
      downloads: number;
      isFree: boolean;
    }>;

    const migrated: AssetRecord[] = parsed.map((a) => ({
      id: a.id,
      title: a.title,
      shortDescription: "",
      fullDescription: "",
      category: mapLegacyCategory(a.category),
      tags: [],
      engineSupport: { unity: true, unreal: false, godot: false },
      version: "1.0.0",
      fileSize: "—",
      features: { rigged: false, animated: false, pbr: false, vrReady: false },
      priceType: a.isFree ? "free" : "paid",
      price: a.price,
      license: "Standard License",
      isFree: a.isFree,
      status: "approved",
      submittedAt: new Date().toISOString(),
      rating: a.rating,
      downloads: a.downloads,
    }));

    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(migrated));
  } catch {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify([]));
  }
}

function mapLegacyCategory(category: string): AssetRecord["category"] {
  const map: Record<string, AssetRecord["category"]> = {
    "2D Characters": "3D Model",
    "2D Environments": "3D Model",
    "UI/UX": "UI",
    "Sound Effects": "Audio",
    Music: "Audio",
    "3D Models": "3D Model",
    Animations: "Animation",
    Particles: "VFX",
  };
  return map[category] ?? "Template";
}

function syncLegacyAdminAssets(submissions: AssetRecord[]) {
  const approved = submissions
    .filter((a) => a.status === "approved")
    .map((a) => ({
      id: a.id,
      title: a.title,
      category: a.category,
      price: a.price,
      rating: a.rating,
      downloads: a.downloads,
      isFree: a.isFree,
      status: a.status,
      tags: a.tags,
      shortDescription: a.shortDescription,
    }));

  localStorage.setItem(LEGACY_KEY, JSON.stringify(approved));
}

export function getAllSubmissions(): AssetRecord[] {
  return readSubmissions();
}

export function getApprovedAssets(): AssetRecord[] {
  return readSubmissions().filter((a) => a.status === "approved");
}

export function getPendingAssets(): AssetRecord[] {
  return readSubmissions().filter((a) => a.status === "pending_review");
}

export function submitAsset(
  data: Omit<AssetRecord, "id" | "status" | "submittedAt" | "rating" | "downloads">
): AssetRecord {
  const autoApproveEnabled = localStorage.getItem(AUTO_APPROVE_KEY) === "true";
  let shouldAutoApprove = false;
  if (autoApproveEnabled) {
    try {
      const currentUserRaw = localStorage.getItem("currentUser");
      const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
      shouldAutoApprove =
        currentUser?.role === "admin" &&
        !!data.creatorId &&
        currentUser?.id === data.creatorId;
    } catch {
      shouldAutoApprove = false;
    }
  }

  const asset: AssetRecord = {
    ...data,
    id: `asset-${Date.now()}`,
    status: shouldAutoApprove ? "approved" : "pending_review",
    submittedAt: new Date().toISOString(),
    rating: 0,
    downloads: 0,
    rejectedReason: undefined,
  };

  const all = [...readSubmissions(), asset];
  writeSubmissions(all);
  window.dispatchEvent(new CustomEvent("assetsUpdated"));
  return asset;
}

export function approveAsset(id: string) {
  const all = readSubmissions().map((a) =>
    a.id === id ? { ...a, status: "approved" as const, rejectedReason: undefined } : a
  );
  writeSubmissions(all);
  window.dispatchEvent(new CustomEvent("assetsUpdated"));
}

export function rejectAsset(id: string, reason?: string) {
  const all = readSubmissions().map((a) =>
    a.id === id
      ? { ...a, status: "rejected" as const, rejectedReason: reason?.trim() || undefined }
      : a
  );
  writeSubmissions(all);
  window.dispatchEvent(new CustomEvent("assetsUpdated"));
}

export function deleteAsset(id: string) {
  const all = readSubmissions().filter((a) => a.id !== id);
  writeSubmissions(all);
  window.dispatchEvent(new CustomEvent("assetsUpdated"));
}

export function updateAsset(id: string, patch: Partial<AssetRecord>) {
  const all = readSubmissions().map((a) => (a.id === id ? { ...a, ...patch } : a));
  writeSubmissions(all);
  window.dispatchEvent(new CustomEvent("assetsUpdated"));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
