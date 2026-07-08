# Đặt file APK tại đây: assetbox.apk
# Web phục vụ tại: /downloads/assetbox.apk?v=<VITE_APK_VERSION>
#
# Build (BE production hiện tại):
#   cd Flutter
#   flutter build apk --release --dart-define=API_BASE_URL=https://exe-k16l.onrender.com/api/v1
#   copy build\app\outputs\flutter-apk\app-release.apk ..\FE\AssetServiceInterfaceDesign\public\downloads\assetbox.apk
#
# Bump version trên web (src/constants/mobileApp.ts hoặc env):
#   VITE_APK_VERSION=1.0.1
#
# Production (Vercel): file *.apk bị gitignore — deploy kèm file local
# hoặc host trên Supabase Storage / GitHub Releases rồi set
#   VITE_APK_DOWNLOAD_URL=https://...
