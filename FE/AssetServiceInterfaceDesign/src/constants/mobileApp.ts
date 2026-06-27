/** APK sideload — file đặt tại `public/downloads/assetbox.apk` hoặc override bằng env. */
const envApk = (import.meta.env.VITE_APK_DOWNLOAD_URL ?? "").trim();

export const mobileAppLinks = {
  apk: envApk || "/downloads/assetbox.apk",
} as const;

export const mobileAppVersion =
  (import.meta.env.VITE_APK_VERSION ?? "1.0.0").trim() || "1.0.0";
