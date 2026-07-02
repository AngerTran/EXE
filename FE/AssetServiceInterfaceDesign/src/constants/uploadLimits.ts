import { formatFileSize } from "../utils/assetStorage";

/** Giới hạn mặc định 50 MB — khớp Supabase free tier (global file size limit). */
const DEFAULT_MAX_ARCHIVE_BYTES = 50 * 1024 * 1024;

function readMaxArchiveBytes(): number {
  const raw = import.meta.env.VITE_MAX_ARCHIVE_BYTES;
  if (!raw) return DEFAULT_MAX_ARCHIVE_BYTES;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_MAX_ARCHIVE_BYTES;
}

export const MAX_ARCHIVE_BYTES = readMaxArchiveBytes();

export function maxArchiveSizeLabel(): string {
  return formatFileSize(MAX_ARCHIVE_BYTES);
}

export function isArchiveWithinLimit(bytes: number): boolean {
  return bytes > 0 && bytes <= MAX_ARCHIVE_BYTES;
}

export function archiveTooLargeMessage(fileName: string, bytes: number): string {
  return `File "${fileName}" (${formatFileSize(bytes)}) vượt giới hạn ${maxArchiveSizeLabel()}. Hãy nén nhẹ hơn, tách gói nhỏ hơn hoặc liên hệ admin nếu cần tăng hạn mức lưu trữ.`;
}
