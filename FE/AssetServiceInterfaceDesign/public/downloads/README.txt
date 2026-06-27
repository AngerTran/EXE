# Đặt file APK tại đây: assetbox.apk
# Web phục vụ tại: /downloads/assetbox.apk
#
# Build (thay URL BE production):
#   cd Flutter
#   flutter build apk --release --dart-define=API_BASE_URL=https://YOUR-BE.onrender.com/api/v1
#   copy build\app\outputs\flutter-apk\app-release.apk ..\FE\AssetServiceInterfaceDesign\public\downloads\assetbox.apk
#
# Production (Vercel): host APK trên Supabase Storage / GitHub Releases và set
#   VITE_APK_DOWNLOAD_URL=https://...
