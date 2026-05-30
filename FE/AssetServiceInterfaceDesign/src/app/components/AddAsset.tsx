import { useState, useRef } from "react";
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
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  ASSET_CATEGORIES,
  LICENSE_OPTIONS,
  TAG_GROUPS,
  type AssetCategory,
  type LicenseType,
  type PriceType,
} from "../../types/asset";
import { submitAsset, formatFileSize } from "../../utils/assetStorage";

const CATEGORY_LABELS: Record<AssetCategory, string> = {
  "3D Model": "Mô hình 3D",
  UI: "Giao diện (UI)",
  Audio: "Âm thanh",
  Animation: "Hoạt ảnh",
  Shader: "Shader",
  VFX: "Hiệu ứng (VFX)",
  Template: "Mẫu dự án",
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
    <section className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 lg:p-8 hover:border-primary/20 transition-colors">
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
    </section>
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

export default function AddAsset() {
  const { user } = useAuth();
  const thumbnailRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLInputElement>(null);
  const zipRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [category, setCategory] = useState<AssetCategory>("3D Model");
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

  const [thumbnailName, setThumbnailName] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [previewNames, setPreviewNames] = useState<string[]>([]);
  const [zipFileName, setZipFileName] = useState("");

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleThumbnail = (file: File | null) => {
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setErrors(["Thumbnail phải là PNG, JPG hoặc WEBP"]);
      return;
    }
    setThumbnailName(file.name);
    const reader = new FileReader();
    reader.onload = () => setThumbnailPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePreviews = (files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files).slice(0, 10);
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    const valid = list.filter((f) => allowed.includes(f.type));
    setPreviewNames(valid.map((f) => f.name));
  };

  const handleZip = (file: File | null) => {
    if (!file) return;
    if (!file.name.endsWith(".zip")) {
      setErrors(["File asset phải là định dạng .zip"]);
      return;
    }
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
    if (!thumbnailName) errs.push("Tải lên ảnh thumbnail (PNG/JPG/WEBP)");
    if (previewNames.length < 1) errs.push("Tải lên ít nhất 1 ảnh preview");
    if (!zipFileName) errs.push("Tải lên file asset.zip");
    if (!version.trim()) errs.push("Nhập phiên bản");
    if (priceType === "paid" && price <= 0) errs.push("Nhập giá hợp lệ cho gói trả phí");
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (errs.length > 0) return;

    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));

    submitAsset({
      title: title.trim(),
      shortDescription: shortDescription.trim(),
      fullDescription: fullDescription.trim(),
      category,
      tags,
      engineSupport,
      version: version.trim(),
      fileSize: fileSize || "—",
      polygonCount: polygonCount.trim() || undefined,
      textureResolution: textureResolution.trim() || undefined,
      features,
      priceType,
      price: priceType === "free" ? 0 : price,
      license,
      isFree: priceType === "free",
      thumbnailName,
      thumbnailPreview: thumbnailPreview || undefined,
      previewNames,
      zipFileName,
      creatorId: user?.id,
      creatorName: user?.name,
    });

    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center py-16 px-4">
        <div className="max-w-lg w-full text-center bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-10">
          <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Đã gửi asset thành công!</h1>
          <p className="text-muted-foreground mb-2">
            Asset của bạn đang ở trạng thái <span className="text-warning font-mono">chờ duyệt</span>.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Admin sẽ xem preview, duyệt hoặc từ chối. Sau khi được duyệt, asset sẽ hiện trên Marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/admin"
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:shadow-[0_0_30px_rgba(0,217,255,0.4)] transition-all"
            >
              Về trang Admin
            </Link>
            <Link to="/marketplace" className="border border-border px-6 py-3 rounded-lg text-foreground hover:border-primary/50 transition-all">
              Xem Marketplace
            </Link>
          </div>
        </div>
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
            Tải asset mới lên GameAssets AI. Sau khi gửi, asset sẽ chờ admin duyệt trước khi lên Marketplace.
          </p>
        </header>

        {errors.length > 0 && (
          <div className="mb-6 bg-destructive/10 border border-destructive/30 rounded-xl p-4">
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
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AssetCategory)}
                  className={inputClass}
                >
                  {ASSET_CATEGORIES.map((c) => (
                    <option key={c} value={c} className="bg-card">
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel hint="Nhấn để chọn/bỏ chọn — danh sách cố định (demo, chưa kết nối API)">
                  Tags
                </FieldLabel>

                {tags.length > 0 && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Đã chọn <span className="text-primary font-mono font-medium">{tags.length}</span> tag
                  </p>
                )}

                <div className="space-y-4 rounded-xl border border-border bg-background/40 p-4 max-h-[420px] overflow-y-auto">
                  {TAG_GROUPS.map((group) => (
                    <div key={group.label}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        {group.label}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {group.tags.map((tag) => {
                          const selected = tags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all ${
                                selected
                                  ? "bg-primary/20 text-primary border-primary/50 shadow-[0_0_12px_rgba(0,217,255,0.15)]"
                                  : "bg-card/60 text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
                              }`}
                            >
                              {selected && <Check className="w-3 h-3" />}
                              {tag}
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
                <FieldLabel hint="1–10 ảnh showcase (gameplay, wireframe, animation...)">Ảnh preview</FieldLabel>
                <input ref={previewRef} type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(e) => handlePreviews(e.target.files)} />
                <button
                  type="button"
                  onClick={() => previewRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/50 hover:bg-primary/5 transition-all text-center"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {previewNames.length > 0
                      ? `${previewNames.length} ảnh đã chọn`
                      : "Tải ảnh preview"}
                  </p>
                  {previewNames.length > 0 && (
                    <p className="text-xs text-muted-foreground font-mono mt-2 truncate max-w-full px-4">
                      {previewNames.join(", ")}
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
                        onChange={() => setPriceType(type)}
                        className="w-4 h-4 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-foreground">{type === "free" ? "Miễn phí" : "Trả phí"}</span>
                    </label>
                  ))}
                </div>
              </div>

              {priceType === "paid" && (
                <div>
                  <FieldLabel htmlFor="price">Giá (VND)</FieldLabel>
                  <input
                    id="price"
                    type="number"
                    min={1000}
                    step={1000}
                    value={price || ""}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    placeholder="149000"
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
