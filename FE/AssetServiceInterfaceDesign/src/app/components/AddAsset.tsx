import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import {
  ArrowLeft,
  Upload,
  Check,
  Package,
  FileArchive,
  ImageIcon,
  Sparkles,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { toast } from "../../utils/notify";
import { useAuth } from "../contexts/AuthContext";
import { LICENSE_OPTIONS, type LicenseType, type PriceType } from "../../types/asset";
import { ART_STYLE_OPTIONS, type ArtStyleValue } from "../../constants/artStyles";
import { formatFileSize } from "../../utils/assetStorage";
import { fetchCategories, fetchTagGroups } from "../../api/lookup";
import {
  approveAsset,
  createAsset,
  getAssetUploadUrl,
  registerAssetFile,
  registerAssetImage,
  uploadToSignedUrl,
} from "../../api/assets";
import type { CategoryItem, TagGroupItem } from "../../api/types/marketplace";
import { ApiError } from "../../api/client";
import { BeamPanel } from "./BeamPanel";

const LICENSE_MAP: Record<LicenseType, string> = {
  "Standard License": "standard",
  CC0: "cc0",
  "Royalty Free": "royaltyFree",
};

const LICENSE_LABELS: Record<LicenseType, string> = {
  "Standard License": "Giấy phép tiêu chuẩn",
  CC0: "CC0 — Miễn phí hoàn toàn",
  "Royalty Free": "Miễn phí bản quyền",
};

const FEATURE_LABELS = {
  rigged: "Có rig",
  animated: "Có animation",
  pbr: "PBR",
  vrReady: "Hỗ trợ VR",
} as const;

function Section({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <BeamPanel
      beam={3.8 + step * 0.15}
      className="bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-6 lg:p-8 hover:border-primary/20 transition-colors"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center font-mono font-bold text-primary">
          {step}
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
      {children}
    </BeamPanel>
  );
}

function FieldLabel({ htmlFor, children, hint }: { htmlFor?: string; children: React.ReactNode; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground mb-2">
      {children}
      {hint && <span className="block text-xs text-muted-foreground font-normal mt-0.5">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full bg-background/60 border border-border rounded-lg px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";

const MAX_PREVIEW_IMAGES = 10;
const PREVIEW_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/jpg"]);
const PREVIEW_EXTENSION = /\.(png|jpe?g|webp)$/i;

function isPreviewImageFile(file: File): boolean {
  const mime = file.type.toLowerCase();
  if (PREVIEW_MIME_TYPES.has(mime)) return true;
  return PREVIEW_EXTENSION.test(file.name);
}

function resolveImageContentType(file: File): string {
  const mime = file.type.toLowerCase();
  if (PREVIEW_MIME_TYPES.has(mime)) return mime === "image/jpg" ? "image/jpeg" : mime;
  if (file.name.toLowerCase().endsWith(".png")) return "image/png";
  if (file.name.toLowerCase().endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

function mergePreviewFiles(existing: File[], incoming: File[]): File[] {
  const merged = [...existing];
  for (const file of incoming) {
    if (merged.length >= MAX_PREVIEW_IMAGES) break;
    const duplicate = merged.some((f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified);
    if (!duplicate) merged.push(file);
  }
  return merged;
}

export default function AddAsset() {
  const { user, isAdmin } = useAuth();
  const thumbnailRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);
  const errorsRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<"pending_review" | "approved">("pending_review");

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tagGroups, setTagGroups] = useState<TagGroupItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [engineSupport, setEngineSupport] = useState({ unity: true, unreal: false, godot: false });
  const [version, setVersion] = useState("1.0.0");
  const [fileSize, setFileSize] = useState("");
  const [polygonCount, setPolygonCount] = useState("");
  const [textureResolution, setTextureResolution] = useState("");
  const [features, setFeatures] = useState({ rigged: false, animated: false, pbr: false, vrReady: false });
  const [priceType, setPriceType] = useState<PriceType>("free");
  const [price, setPrice] = useState(0);
  const [license, setLicense] = useState<LicenseType>("Standard License");
  const [artStyle, setArtStyle] = useState<ArtStyleValue | "">("");

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailName, setThumbnailName] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [previewObjectUrls, setPreviewObjectUrls] = useState<string[]>([]);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipFileName, setZipFileName] = useState("");

  useEffect(() => {
    Promise.all([fetchCategories(), fetchTagGroups()])
      .then(([cats, groups]) => {
        setCategories(cats);
        setTagGroups(groups);
        if (cats.length > 0) setCategoryId(cats[0].id);
      })
      .catch(() => toast.error("Không tải được danh mục/tags"));
  }, []);

  useEffect(() => {
    const urls = previewFiles.map((file) => URL.createObjectURL(file));
    setPreviewObjectUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewFiles]);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleThumbnail = (file: File | null) => {
    if (!file) return;
    if (!isPreviewImageFile(file)) {
      const msg = "Thumbnail phải là PNG, JPG hoặc WEBP";
      setErrors([msg]);
      toast.error(msg);
      return;
    }
    setThumbnailFile(file);
    setThumbnailName(file.name);
    const reader = new FileReader();
    reader.onload = () => setThumbnailPreview(reader.result as string);
    reader.readAsDataURL(file);
    if (thumbnailRef.current) thumbnailRef.current.value = "";
  };

  const handlePreviews = (files: FileList | null) => {
    if (!files?.length) return;

    const incoming = Array.from(files);
    const valid = incoming.filter(isPreviewImageFile);
    const rejected = incoming.length - valid.length;

    if (valid.length === 0) {
      toast.error("Chỉ chấp nhận ảnh PNG, JPG hoặc WEBP");
      if (previewRef.current) previewRef.current.value = "";
      return;
    }

    setPreviewFiles((prev) => {
      const merged = mergePreviewFiles(prev, valid);
      if (merged.length >= MAX_PREVIEW_IMAGES && prev.length + valid.length > MAX_PREVIEW_IMAGES) {
        toast.message(`Tối đa ${MAX_PREVIEW_IMAGES} ảnh preview`);
      }
      return merged;
    });

    if (rejected > 0) {
      toast.error(`${rejected} file không hợp lệ — chỉ PNG, JPG, WEBP`);
    }

    if (previewRef.current) previewRef.current.value = "";
  };

  const removePreviewAt = (index: number) => {
    setPreviewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleZip = (file: File | null) => {
    if (!file) return;
    if (!file.name.endsWith(".zip")) {
      setErrors(["File asset phải là định dạng .zip"]);
      return;
    }
    setZipFile(file);
    setZipFileName(file.name);
    setFileSize(formatFileSize(file.size));
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!title.trim()) errs.push("Vui lòng nhập tên asset");
    if (!shortDescription.trim()) errs.push("Vui lòng nhập mô tả ngắn");
    if (!fullDescription.trim()) errs.push("Vui lòng nhập mô tả chi tiết");
    if (tags.length === 0) errs.push("Chọn ít nhất 1 tag");
    if (!engineSupport.unity && !engineSupport.unreal && !engineSupport.godot)
      errs.push("Chọn ít nhất 1 engine hỗ trợ");
    if (!categoryId) errs.push("Chọn danh mục asset");
    if (!thumbnailFile) errs.push("Tải lên ảnh thumbnail (PNG/JPG/WEBP)");
    if (previewFiles.length < 1) errs.push("Tải lên ít nhất 1 ảnh preview");
    if (!zipFile) errs.push("Tải lên file asset.zip");
    if (!version.trim()) errs.push("Nhập phiên bản");
    if (priceType === "paid" && price < 1) errs.push("Giá trả phí tối thiểu 1 xu");
    return errs;
  };

  const showValidationErrors = (errs: string[]) => {
    setErrors(errs);
    toast.error(errs[0] ?? "Vui lòng kiểm tra lại form");
    requestAnimationFrame(() => {
      errorsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (errs.length > 0 || !thumbnailFile || !zipFile) {
      if (errs.length === 0) {
        if (!thumbnailFile) errs.push("Tải lên ảnh thumbnail (PNG/JPG/WEBP)");
        if (previewFiles.length < 1) errs.push("Tải lên ít nhất 1 ảnh preview");
        if (!zipFile) errs.push("Tải lên file asset.zip");
      }
      showValidationErrors(errs);
      return;
    }

    setErrors([]);
    setSubmitting(true);
    try {
      const tagIds: string[] = [];
      for (const group of tagGroups) {
        for (const t of group.tags) {
          if (tags.includes(t.name)) tagIds.push(t.id);
        }
      }

      const priceXu = priceType === "free" ? 0 : Math.max(1, Math.floor(price));
      const created = await createAsset({
        title: title.trim(),
        shortDescription: shortDescription.trim(),
        fullDescription: fullDescription.trim(),
        categoryId,
        tagIds,
        ...(artStyle ? { artStyle } : {}),
        priceType,
        priceVnd: 0,
        priceXu,
        license: LICENSE_MAP[license],
        engineUnity: engineSupport.unity,
        engineUnreal: engineSupport.unreal,
        engineGodot: engineSupport.godot,
        featureRigged: features.rigged,
        featureAnimated: features.animated,
        featurePbr: features.pbr,
        featureVrReady: features.vrReady,
        version: version.trim(),
        fileSizeBytes: zipFile.size,
        polygonCount: polygonCount.trim() || undefined,
        textureResolution: textureResolution.trim() || undefined,
      });

      const assetId = created.id;

      const thumbMeta = await getAssetUploadUrl(
        assetId,
        "Image",
        thumbnailFile.name,
        resolveImageContentType(thumbnailFile),
        thumbnailFile.size
      );
      await uploadToSignedUrl(thumbMeta.uploadUrl, thumbnailFile, resolveImageContentType(thumbnailFile));
      await registerAssetImage(assetId, {
        storagePath: thumbMeta.storagePath,
        altText: title.trim(),
        sortOrder: 0,
        isThumbnail: true,
      });

      for (let i = 0; i < previewFiles.length; i++) {
        const file = previewFiles[i];
        const contentType = resolveImageContentType(file);
        const meta = await getAssetUploadUrl(assetId, "Image", file.name, contentType, file.size);
        await uploadToSignedUrl(meta.uploadUrl, file, contentType);
        await registerAssetImage(assetId, {
          storagePath: meta.storagePath,
          altText: `${title} preview ${i + 1}`,
          sortOrder: i + 1,
          isThumbnail: false,
        });
      }

      const zipMeta = await getAssetUploadUrl(
        assetId,
        "File",
        zipFile.name,
        "application/zip",
        zipFile.size
      );
      await uploadToSignedUrl(zipMeta.uploadUrl, zipFile, "application/zip");
      await registerAssetFile(assetId, {
        storagePath: zipMeta.storagePath,
        fileName: zipFile.name,
        fileType: "zip",
        fileSizeBytes: zipFile.size,
        isPrimary: true,
      });

      let finalStatus = created.status;
      if (isAdmin()) {
        const approved = await approveAsset(assetId);
        finalStatus = approved.status;
      }

      setSubmittedStatus(finalStatus === "approved" ? "approved" : "pending_review");
      setSubmitted(true);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Gửi asset thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center py-16 px-4">
        <BeamPanel className="max-w-lg w-full text-center bg-white/95 dark:bg-card/70 backdrop-blur-lg border border-border rounded-2xl p-10" beam={4}>
          <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Đã gửi asset thành công!</h1>
          <p className="text-muted-foreground mb-2">
            Asset của bạn đang ở trạng thái{" "}
            {submittedStatus === "approved" ? (
              <span className="text-success font-mono">đã duyệt</span>
            ) : (
              <span className="text-warning font-mono">chờ duyệt</span>
            )}
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            {submittedStatus === "approved"
              ? "Vì bạn là admin, asset đã được duyệt ngay và sẽ xuất hiện trên Chợ Assets."
              : "Admin sẽ xem preview, duyệt hoặc từ chối. Sau khi được duyệt, asset sẽ hiện trên Chợ Assets."}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/admin"
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:shadow-[0_0_30px_rgba(0,217,255,0.4)] transition-all"
            >
              Về trang Admin
            </Link>
            <Link to="/marketplace" className="border border-border px-6 py-3 rounded-lg text-foreground hover:border-primary/50 transition-all">
              Xem Chợ Assets
            </Link>
          </div>
        </BeamPanel>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại Admin
        </Link>

        <header className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/30">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Thêm Asset</h1>
          </div>
          <p className="text-muted-foreground">
            Tải asset mới lên AssetBox. Sau khi gửi, asset sẽ chờ admin duyệt trước khi lên Chợ Assets.
          </p>
        </header>

        {errors.length > 0 && (
          <div ref={errorsRef} className="mb-6 bg-destructive/10 border border-destructive/30 rounded-xl p-4">
            <p className="font-bold text-destructive mb-2">Vui lòng kiểm tra lại:</p>
            <ul className="list-disc list-inside text-sm text-destructive space-y-1">
              {errors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1 */}
          <Section step={1} title="Thông tin cơ bản" description="Tên và mô tả asset">
            <div className="space-y-5">
              <div>
                <FieldLabel htmlFor="title">Tên asset</FieldLabel>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Cyberpunk UI Pack"
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor="shortDesc" hint="1–2 dòng mô tả ngắn">
                  Mô tả ngắn
                </FieldLabel>
                <input
                  id="shortDesc"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Stylized futuristic UI for sci-fi games."
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel htmlFor="fullDesc" hint="Gồm gì, dùng cho game nào, style, số file...">
                  Mô tả chi tiết
                </FieldLabel>
                <textarea
                  id="fullDesc"
                  rows={5}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  placeholder="Pack gồm 120+ UI elements, phù hợp sci-fi / cyberpunk mobile & PC..."
                  className={`${inputClass} resize-y min-h-[120px]`}
                />
              </div>
            </div>
          </Section>

          {/* SECTION 2 */}
          <Section step={2} title="Danh mục & Tags" description="Phân loại và gắn tag để AI gợi ý chính xác hơn">
            <div className="space-y-5">
              <div>
                <FieldLabel htmlFor="category">Danh mục</FieldLabel>
                <select
                  id="category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={inputClass}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-card">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel htmlFor="artStyle" hint="Phong cách hình ảnh — giúp lọc & AI gợi ý">
                  Phong cách nghệ thuật
                </FieldLabel>
                <select
                  id="artStyle"
                  value={artStyle}
                  onChange={(e) => setArtStyle(e.target.value as ArtStyleValue | "")}
                  className={inputClass}
                >
                  <option value="">— Không chọn —</option>
                  {ART_STYLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-card">
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel hint="Nhấn để chọn/bỏ chọn tag từ BE">
                  Tags
                </FieldLabel>

                {tags.length > 0 && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Đã chọn <span className="text-primary font-mono font-medium">{tags.length}</span> tag
                  </p>
                )}

                <div className="space-y-4 rounded-xl border border-border bg-background/40 p-4 max-h-[420px] overflow-y-auto">
                  {tagGroups.map((group) => (
                    <div key={group.id}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        {group.label}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {group.tags.map((tag) => {
                          const selected = tags.includes(tag.name);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleTag(tag.name)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all ${
                                selected
                                  ? "bg-primary/20 text-primary border-primary/50 shadow-[0_0_12px_rgba(0,217,255,0.15)]"
                                  : "bg-card/60 text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
                              }`}
                            >
                              {selected && <Check className="w-3 h-3" />}
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <FieldLabel>Engine hỗ trợ</FieldLabel>
                <div className="flex flex-wrap gap-6">
                  {(
                    [
                      ["unity", "Unity"],
                      ["unreal", "Unreal"],
                      ["godot", "Godot"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={engineSupport[key]}
                        onChange={(e) => setEngineSupport((s) => ({ ...s, [key]: e.target.checked }))}
                        className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* SECTION 3 */}
          <Section step={3} title="Tải file lên" description="Ảnh đại diện, ảnh preview và file ZIP chính">
            <div className="space-y-6">
              <div>
                <FieldLabel hint="PNG / JPG / WEBP — 1 ảnh">Ảnh đại diện (Thumbnail)</FieldLabel>
                <input ref={thumbnailRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => handleThumbnail(e.target.files?.[0] ?? null)} />
                <button
                  type="button"
                  onClick={() => thumbnailRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/50 hover:bg-primary/5 transition-all text-center"
                >
                  {thumbnailPreview ? (
                    <div className="flex flex-col items-center gap-3">
                      <img src={thumbnailPreview} alt="Thumbnail" className="h-24 w-24 object-cover rounded-lg border border-border" />
                      <span className="text-sm text-muted-foreground font-mono">{thumbnailName}</span>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Nhấn để tải ảnh đại diện</p>
                    </>
                  )}
                </button>
              </div>

              <div>
                <FieldLabel hint="1–10 ảnh showcase (gameplay, wireframe, animation...) — giữ Ctrl để chọn nhiều ảnh cùng lúc, hoặc bấm thêm nhiều lần">
                  Ảnh preview
                </FieldLabel>
                <input
                  ref={previewRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handlePreviews(e.target.files)}
                />
                {previewFiles.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                    {previewFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${file.size}-${file.lastModified}`}
                        className="relative aspect-video rounded-lg overflow-hidden border border-border bg-background/40 group"
                      >
                        <img
                          src={previewObjectUrls[index]}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePreviewAt(index)}
                          className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          aria-label={`Xóa ${file.name}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <p className="absolute bottom-0 inset-x-0 bg-black/55 text-[10px] text-white px-1.5 py-1 truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => previewRef.current?.click()}
                  disabled={previewFiles.length >= MAX_PREVIEW_IMAGES}
                  className="w-full border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/50 hover:bg-primary/5 transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {previewFiles.length > 0
                      ? previewFiles.length >= MAX_PREVIEW_IMAGES
                        ? `Đã đủ ${MAX_PREVIEW_IMAGES} ảnh preview`
                        : `Thêm ảnh preview (${previewFiles.length}/${MAX_PREVIEW_IMAGES})`
                      : "Tải ảnh preview"}
                  </p>
                  {previewFiles.length > 0 && previewFiles.length < MAX_PREVIEW_IMAGES && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Bấm để thêm ảnh — có thể chọn nhiều file một lúc
                    </p>
                  )}
                </button>
              </div>

              <div>
                <FieldLabel hint="ZIP chứa Models/, Textures/, Demo/, Docs/">File asset</FieldLabel>
                <input ref={zipRef} type="file" accept=".zip,application/zip" className="hidden" onChange={(e) => handleZip(e.target.files?.[0] ?? null)} />
                <button
                  type="button"
                  onClick={() => zipRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-6 hover:border-secondary/50 hover:bg-secondary/5 transition-all text-center"
                >
                  <FileArchive className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-foreground font-medium">
                    {zipFileName || "Tải lên asset.zip"}
                  </p>
                  {fileSize && <p className="text-xs text-muted-foreground font-mono mt-1">{fileSize}</p>}
                </button>
              </div>
            </div>
          </Section>

          {/* SECTION 4 */}
          <Section step={4} title="Thông số kỹ thuật" description="Một số trường là tùy chọn">
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <FieldLabel htmlFor="version">Phiên bản</FieldLabel>
                <input id="version" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="1.0.0" className={inputClass} />
              </div>
              <div>
                <FieldLabel htmlFor="fileSize">Dung lượng file</FieldLabel>
                <input id="fileSize" value={fileSize} readOnly placeholder="Tự động từ file ZIP" className={`${inputClass} opacity-80`} />
              </div>
              <div>
                <FieldLabel htmlFor="poly" hint="Tùy chọn">Số polygon</FieldLabel>
                <input id="poly" value={polygonCount} onChange={(e) => setPolygonCount(e.target.value)} placeholder="15k tris" className={inputClass} />
              </div>
              <div>
                <FieldLabel htmlFor="tex" hint="Tùy chọn">Độ phân giải texture</FieldLabel>
                <input id="tex" value={textureResolution} onChange={(e) => setTextureResolution(e.target.value)} placeholder="2048x2048" className={inputClass} />
              </div>
            </div>
            <div className="mt-5">
              <FieldLabel>Tính năng</FieldLabel>
              <div className="grid sm:grid-cols-2 gap-3">
                {(
                  [
                    ["rigged", FEATURE_LABELS.rigged],
                    ["animated", FEATURE_LABELS.animated],
                    ["pbr", FEATURE_LABELS.pbr],
                    ["vrReady", FEATURE_LABELS.vrReady],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer select-none p-3 rounded-lg border border-border bg-background/40">
                    <input
                      type="checkbox"
                      checked={features[key]}
                      onChange={(e) => setFeatures((f) => ({ ...f, [key]: e.target.checked }))}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </Section>

          {/* SECTION 5 */}
          <Section step={5} title="Giá & Gửi duyệt">
            <div className="space-y-5">
              <div>
                <FieldLabel>Loại giá</FieldLabel>
                <div className="flex gap-6">
                  {(["free", "paid"] as PriceType[]).map((type) => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="priceType"
                        checked={priceType === type}
                        onChange={() => {
                          setPriceType(type);
                          if (type === "paid" && price < 1) setPrice(1);
                        }}
                        className="w-4 h-4 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">{type === "free" ? "Miễn phí" : "Trả phí"}</span>
                    </label>
                  ))}
                </div>
              </div>

              {priceType === "paid" && (
                <div>
                  <FieldLabel htmlFor="price" hint="Tối thiểu 1 xu">
                    Giá (xu)
                  </FieldLabel>
                  <input
                    id="price"
                    type="number"
                    min={1}
                    step={1}
                    value={price || ""}
                    onChange={(e) => setPrice(Math.max(1, Number(e.target.value) || 0))}
                    placeholder="Ví dụ: 10 xu"
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <FieldLabel htmlFor="license">Giấy phép sử dụng</FieldLabel>
                <select id="license" value={license} onChange={(e) => setLicense(e.target.value as LicenseType)} className={inputClass}>
                  {LICENSE_OPTIONS.map((l) => (
                    <option key={l} value={l} className="bg-card">
                      {LICENSE_LABELS[l]}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_30px_rgba(0,217,255,0.5)] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang tải lên...
                  </>
                ) : (
                  <>
                    <Package className="w-5 h-5" />
                    Gửi asset
                  </>
                )}
              </button>
            </div>
          </Section>
        </form>
      </div>
    </div>
  );
}
