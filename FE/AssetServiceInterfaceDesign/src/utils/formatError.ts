import { ApiError } from "../api/client";
import { maxArchiveSizeLabel } from "../constants/uploadLimits";

/** Chuyển lỗi API / upload / unknown thành câu tiếng Việt dễ đọc. */
export function formatAppError(error: unknown, fallback = "Đã xảy ra lỗi không xác định"): string {
  if (error instanceof ApiError) {
    const parts = [humanizeStorageError(error.message), `mã HTTP ${error.status}`];
    if (error.code) parts.push(`[${error.code}]`);
    return parts.join(" — ");
  }

  if (error instanceof Error && error.message.trim()) {
    return humanizeStorageError(error.message.trim());
  }

  if (typeof error === "string" && error.trim()) {
    return humanizeStorageError(error.trim());
  }

  return fallback;
}

/** Gợi ý tiếng Việt cho lỗi Supabase Storage phổ biến. */
export function humanizeStorageError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("maximum allowed size") ||
    lower.includes("payload too large") ||
    lower.includes("entity too large") ||
    /\b413\b/.test(lower)
  ) {
    return `File quá lớn — vượt giới hạn lưu trữ (tối đa ${maxArchiveSizeLabel()}). Hãy nén nhẹ hơn hoặc tách thành nhiều gói nhỏ.`;
  }
  return message;
}

/** Bọc từng bước upload để thông báo lỗi ghi rõ đang lỗi ở bước nào. */
export async function runUploadStep<T>(stepLabel: string, action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    throw new Error(`${stepLabel}: ${formatAppError(error)}`);
  }
}
