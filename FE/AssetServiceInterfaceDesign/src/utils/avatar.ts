const MAX_EDGE_PX = 256;
const MAX_OUTPUT_BYTES = 400_000;
const JPEG_QUALITY_START = 0.88;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không đọc được file ảnh"));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Không nén được ảnh"))),
      "image/jpeg",
      quality
    );
  });
}

/** Nén ảnh avatar → data URL JPEG, lưu thẳng vào profile (không cần Supabase). */
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh");

  ctx.drawImage(img, 0, 0, width, height);

  let quality = JPEG_QUALITY_START;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > MAX_OUTPUT_BYTES && quality > 0.45) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, quality);
  }

  if (blob.size > MAX_OUTPUT_BYTES) {
    throw new Error("Ảnh quá lớn sau khi nén — chọn ảnh nhỏ hơn");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Không đọc được ảnh đã nén"));
    reader.readAsDataURL(blob);
  });
}
