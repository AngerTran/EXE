import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "../../utils/notify";
import { ApiError } from "../../api/client";
import { fetchMyAssetById, updateAsset } from "../../api/assets";
import { fetchCategories, fetchTagGroups } from "../../api/lookup";
import { buildAdminUpdateBody, mapAssetDetailToEditRecord } from "../../api/adminAssetEdit";
import type { CategoryItem, TagGroupItem } from "../../api/types/marketplace";
import type { AssetRecord, LicenseType, PriceType } from "../../types/asset";
import { LICENSE_OPTIONS } from "../../types/asset";
import { ART_STYLE_OPTIONS } from "../../constants/artStyles";
import { BeamPanel } from "./BeamPanel";
import { componentClasses } from "../../constants/theme";

const inputClass =
  "w-full bg-background/60 border border-border rounded-lg px-4 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";

function canSellerEdit(status: string): boolean {
  const s = status.toLowerCase();
  return s === "draft" || s === "pending_review" || s === "rejected";
}

export default function SellerEditAsset() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [asset, setAsset] = useState<AssetRecord | null>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [tagGroups, setTagGroups] = useState<TagGroupItem[]>([]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [detail, cats, tags] = await Promise.all([
          fetchMyAssetById(id),
          fetchCategories(),
          fetchTagGroups(),
        ]);
        if (cancelled) return;
        const record = mapAssetDetailToEditRecord(detail);
        if (!canSellerEdit(record.status)) {
          toast.error("Asset đã duyệt — không thể sửa. Xóa và upload lại nếu cần.");
          navigate("/seller", { replace: true });
          return;
        }
        setAsset(record);
        setCategories(cats);
        setTagGroups(tags);
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof ApiError ? error.message : "Không tải được asset");
          navigate("/seller", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const toggleTag = (tagName: string) => {
    setAsset((prev) => {
      if (!prev) return prev;
      const has = prev.tags.includes(tagName);
      return {
        ...prev,
        tags: has ? prev.tags.filter((t) => t !== tagName) : [...prev.tags, tagName],
      };
    });
  };

  const handleSave = async () => {
    if (!asset || !id) return;
    if (!asset.title.trim()) {
      toast.error("Vui lòng nhập tên asset");
      return;
    }
    if (!asset.categoryId) {
      toast.error("Vui lòng chọn danh mục");
      return;
    }
    setSaving(true);
    try {
      await updateAsset(id, buildAdminUpdateBody(asset, tagGroups));
      toast.success(
        asset.status === "rejected"
          ? "Đã cập nhật và gửi lại chờ duyệt"
          : "Đã cập nhật asset"
      );
      navigate("/seller");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !asset) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className={`${componentClasses.container} max-w-3xl`}>
        <Link to="/seller" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" />
          Seller Hub
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Sửa asset</h1>
          {asset.status === "rejected" && (
            <p className="text-sm text-muted-foreground mt-2">
              Asset bị từ chối — chỉnh sửa và lưu để gửi lại chờ duyệt.
            </p>
          )}
        </div>

        <div className="space-y-6">
          <BeamPanel className="bg-white/95 dark:bg-card/70 border border-border rounded-xl p-6" beam={4}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tên asset</label>
                <input
                  className={inputClass}
                  value={asset.title}
                  onChange={(e) => setAsset({ ...asset, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mô tả ngắn</label>
                <input
                  className={inputClass}
                  value={asset.shortDescription}
                  onChange={(e) => setAsset({ ...asset, shortDescription: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Mô tả chi tiết</label>
                <textarea
                  rows={5}
                  className={`${inputClass} resize-y`}
                  value={asset.fullDescription}
                  onChange={(e) => setAsset({ ...asset, fullDescription: e.target.value })}
                />
              </div>
            </div>
          </BeamPanel>

          <BeamPanel className="bg-white/95 dark:bg-card/70 border border-border rounded-xl p-6" beam={4}>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Danh mục</label>
                <select
                  className={inputClass}
                  value={asset.categoryId ?? ""}
                  onChange={(e) => {
                    const cat = categories.find((c) => c.id === e.target.value);
                    setAsset({
                      ...asset,
                      categoryId: e.target.value,
                      category: (cat?.name as AssetRecord["category"]) ?? asset.category,
                    });
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phong cách</label>
                <select
                  className={inputClass}
                  value={asset.artStyle ?? ""}
                  onChange={(e) => setAsset({ ...asset, artStyle: e.target.value as AssetRecord["artStyle"] })}
                >
                  <option value="">—</option>
                  {ART_STYLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Tags ({asset.tags.length} đã chọn)</p>
            <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-3">
              {tagGroups.map((group) => (
                <div key={group.id}>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">{group.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.tags.map((tag) => {
                      const selected = asset.tags.includes(tag.name);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.name)}
                          className={`px-2 py-1 rounded-md text-xs border transition-colors ${
                            selected
                              ? "border-primary bg-primary/15 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </BeamPanel>

          <BeamPanel className="bg-white/95 dark:bg-card/70 border border-border rounded-xl p-6" beam={4}>
            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={asset.priceType === "free"}
                    onChange={() => setAsset({ ...asset, priceType: "free" as PriceType, isFree: true, price: 0 })}
                  />
                  Miễn phí
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={asset.priceType === "paid"}
                    onChange={() => setAsset({ ...asset, priceType: "paid" as PriceType, isFree: false })}
                  />
                  Trả phí (xu)
                </label>
              </div>
              {asset.priceType === "paid" && (
                <input
                  type="number"
                  min={1}
                  className={inputClass}
                  value={asset.price}
                  onChange={(e) => setAsset({ ...asset, price: Number(e.target.value) || 1 })}
                />
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Giấy phép</label>
                <select
                  className={inputClass}
                  value={asset.license}
                  onChange={(e) => setAsset({ ...asset, license: e.target.value as LicenseType })}
                >
                  {LICENSE_OPTIONS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </BeamPanel>

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className={`w-full py-3 rounded-lg font-bold inline-flex items-center justify-center gap-2 ${componentClasses.ctaGradientInteractive} disabled:opacity-60`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}
