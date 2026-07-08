/** APK sideload — file đặt tại `public/downloads/assetbox.apk` hoặc override bằng env. */
const envApk = (import.meta.env.VITE_APK_DOWNLOAD_URL ?? "").trim();
const apkVersion =
  (import.meta.env.VITE_APK_VERSION ?? "1.0.1").trim() || "1.0.1";

export const mobileAppVersion = apkVersion;

export const mobileAppLinks = {
  // Cache-bust query so CDN/browser lấy bản APK mới sau mỗi lần bump version.
  apk: envApk || `/downloads/assetbox.apk?v=${encodeURIComponent(apkVersion)}`,
} as const;
