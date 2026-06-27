import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Store, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "../../utils/notify";
import { ApiError } from "../../api/client";
import { applySeller } from "../../api/seller";
import { useAuth } from "../contexts/AuthContext";
import { BeamPanel } from "./BeamPanel";
import { componentClasses } from "../../constants/theme";

export default function SellerApply() {
  const { user, isSeller, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isSeller()) {
      navigate("/seller", { replace: true });
    }
  }, [isSeller, navigate]);

  const handleActivate = async () => {
    setSubmitting(true);
    try {
      await applySeller();
      await refreshUserData();
      toast.success("Đã kích hoạt tài khoản người bán");
      navigate("/seller", { replace: true });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Kích hoạt thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/profile" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </Link>

        <BeamPanel className="bg-white/95 dark:bg-card/70 border border-border rounded-2xl p-8" beam={4}>
          <div className="flex items-center gap-3 mb-6">
            <Store className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Trở thành người bán</h1>
              <p className="text-muted-foreground text-sm">Kích hoạt ngay để upload và bán asset</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Tài khoản <strong className="text-foreground">{user?.email}</strong> sẽ được nâng cấp lên
            người bán. Asset vẫn cần admin duyệt trước khi hiển thị trên chợ.
          </p>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleActivate()}
            className={`w-full py-3 rounded-lg font-bold inline-flex items-center justify-center gap-2 ${componentClasses.ctaGradientInteractive} disabled:opacity-60`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang kích hoạt...
              </>
            ) : (
              "Kích hoạt người bán"
            )}
          </button>
        </BeamPanel>
      </div>
    </div>
  );
}
