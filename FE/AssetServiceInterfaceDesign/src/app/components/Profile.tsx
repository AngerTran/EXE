import { useEffect, useMemo, useRef, useState } from "react";
import { Coins, Save, Shield, ShoppingCart, Upload, User } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";
import { ApiError } from "../../api/client";
import { useAuth, getUserAvatarSrc } from "../contexts/AuthContext";

function formatSubscription(sub: string | null | undefined) {
  if (!sub || sub === "free") return "FREE";
  return sub.toUpperCase();
}

export default function Profile() {
  const { user, updateProfile, refreshUserData } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setName(user?.name ?? "");
  }, [user?.name]);

  const subscriptionLabel = useMemo(
    () => formatSubscription(user?.subscription ?? "free"),
    [user?.subscription]
  );

  const avatarSrc = getUserAvatarSrc(user);

  if (!user) return null;

  const handlePickAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }
    if (file.size > 1_500_000) {
      toast.error("Ảnh quá lớn (tối đa 1.5MB)");
      return;
    }

    setUploadingAvatar(true);
    try {
      await updateProfile({ avatarFile: file });
      await refreshUserData();
      toast.success("Đã cập nhật avatar");
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Không upload được avatar";
      toast.error(msg);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    try {
      await updateProfile({ avatarUrl: "" });
      await refreshUserData();
      toast.message("Đã xoá avatar");
    } catch {
      toast.error("Không xoá được avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Tên không được để trống");
      return;
    }
    if (trimmed === user.name) {
      toast.message("Không có thay đổi để lưu");
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ name: trimmed });
      await refreshUserData();
      toast.success("Đã cập nhật hồ sơ");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/20 border border-primary/30 p-3 rounded-xl">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground">Hồ sơ người dùng</h1>
              <p className="text-muted-foreground text-sm truncate">
                Ảnh đại diện lưu trực tiếp vào tài khoản — hiển thị ngay trên hồ sơ và header
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Thông tin cơ bản</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Avatar
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-border bg-card flex items-center justify-center">
                    {avatarSrc ? (
                      <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-7 h-7 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                    <button
                      type="button"
                      onClick={handlePickAvatar}
                      disabled={uploadingAvatar}
                      className="bg-card hover:bg-card/80 border border-border hover:border-primary/50 text-foreground px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingAvatar ? "Đang tải..." : "Tải ảnh lên"}
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={!avatarSrc || uploadingAvatar}
                      className="bg-card hover:bg-card/80 border border-border text-muted-foreground px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Xoá
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Email
                </label>
                <input
                  value={user.email}
                  disabled
                  className="w-full bg-background/50 border border-border rounded-lg px-4 py-2 text-muted-foreground font-mono opacity-80"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Tên hiển thị
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 disabled:from-primary/50 disabled:to-secondary/50 text-primary-foreground py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(0,217,255,0.3)] disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold text-foreground">Tài khoản</h2>

            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-2">Hoạt động</p>
              <Link
                to="/orders"
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-4 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(0,217,255,0.25)]"
              >
                <ShoppingCart className="w-4 h-4" />
                Lịch sử mua
              </Link>
              <p className="text-xs text-muted-foreground mt-2">
                Xem các đơn hàng (gói dịch vụ & asset) bạn đã thanh toán.
              </p>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Credits (xu)</p>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-warning" />
                <p className="text-2xl font-bold text-foreground font-mono">
                  {user.credits ?? 0}
                </p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Gói hiện tại</p>
              <p className="text-2xl font-bold text-primary font-mono">
                {subscriptionLabel}
              </p>
              {user.subscriptionExpiry && (
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  Hết hạn: {new Date(user.subscriptionExpiry).toLocaleDateString("vi-VN")}
                </p>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground mb-1">Vai trò</p>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-secondary" />
                <p className="text-lg font-bold text-foreground font-mono">
                  {user.role.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
