/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_APK_DOWNLOAD_URL?: string;
  readonly VITE_APK_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
