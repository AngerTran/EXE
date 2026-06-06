import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import {
  CheckCircle,
  ArrowLeft,
  Sparkles,
  Clock,
  AlertCircle,
  Loader2,
  QrCode,
  Copy,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "../../api/client";
import { fetchSubscriptionPlanBySlug } from "../../api/subscriptionPlans";
import { createSubscriptionOrder } from "../../api/orders";
import { fetchBankTransferInfo, type BankTransferInfo } from "../../api/payments";
import type { SubscriptionPlan } from "../../api/types/billing";
import type { Order } from "../../api/types/commerce";
import { componentClasses } from "../../constants/theme";
import { resolvePlanFeatures } from "../../constants/planDisplay";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { usePollOrderCompletion } from "../../hooks/usePollOrderCompletion";

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const packageSlug = searchParams.get("package") || "student";

  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [bankInfo, setBankInfo] = useState<BankTransferInfo | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const orderCompleted = usePollOrderCompletion(order?.id, paymentSubmitted, {
    onCompleted: () =>
      toast.success("Gói đã được kích hoạt — số xu trên header đã cập nhật"),
  });

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPlanLoading(true);
      try {
        const plan = await fetchSubscriptionPlanBySlug(packageSlug);
        if (!cancelled) setSelectedPlan(plan);
      } catch {
        if (!cancelled) {
          toast.error("Không tải được thông tin gói");
          navigate("/pricing");
        }
      } finally {
        if (!cancelled) setPlanLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [packageSlug, navigate]);

  useEffect(() => {
    if (!user || !selectedPlan || selectedPlan.priceVnd <= 0) return;

    let cancelled = false;
    (async () => {
      setCheckoutLoading(true);
      try {
        const created = await createSubscriptionOrder(selectedPlan.id, "bank");
        if (cancelled) return;
        setOrder(created);
        if (created.status === "completed") {
          await refreshUserData();
        }

        try {
          const bank = await fetchBankTransferInfo(
            selectedPlan.priceVnd,
            created.orderCode
          );
          if (!cancelled) setBankInfo(bank);
        } catch (bankError) {
          if (!cancelled) {
            const msg =
              bankError instanceof ApiError
                ? bankError.message
                : "Không tải được thông tin ngân hàng";
            toast.error(msg);
          }
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof ApiError ? error.message : "Không tạo được đơn thanh toán");
          navigate("/pricing");
        }
      } finally {
        if (!cancelled) setCheckoutLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, selectedPlan, navigate, refreshUserData]);

  const qrImageUrl =
    bankInfo?.qrImageUrl || bankInfo?.vietQrImageUrl || null;

  const copyText = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Đã copy ${label}`);
    } catch {
      toast.error("Không copy được");
    }
  }, []);

  const handleConfirmTransfer = () => {
    setPaymentSubmitted(true);
    toast.success("Đã ghi nhận. Chúng tôi sẽ kích hoạt gói sau khi xác nhận chuyển khoản.");
  };

  if (!user) return null;

  if (planLoading || !selectedPlan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (paymentSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className={cn(componentClasses.card, "p-8 hover:scale-100 shadow-[0_0_50px_rgba(0,217,255,0.08)]")}>
            <div
              className={cn(
                "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border",
                orderCompleted
                  ? "bg-success/20 border-success/30"
                  : "bg-warning/20 border-warning/30"
              )}
            >
              {orderCompleted ? (
                <CheckCircle className="w-12 h-12 text-success" />
              ) : (
                <Clock className="w-12 h-12 text-warning" />
              )}
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {orderCompleted ? "Thanh toán thành công" : "Đang chờ xác nhận"}
            </h2>
            {order && (
              <p className="text-sm text-muted-foreground mb-2 font-mono">Mã đơn: {order.orderCode}</p>
            )}
            <p className="text-muted-foreground mb-4">
              {orderCompleted ? (
                <>
                  Gói <span className="font-bold text-primary">{selectedPlan.name}</span> đã được kích hoạt.
                  Số xu trên header đã được cập nhật.
                </>
              ) : (
                <>
                  Bạn đã báo chuyển khoản gói{" "}
                  <span className="font-bold text-primary">{selectedPlan.name}</span>.
                </>
              )}
            </p>
            {!orderCompleted && (
              <p className="text-muted-foreground text-sm mb-6">
                Sau khi hệ thống đối soát thành công, gói và xu sẽ được kích hoạt tự động.
                Thường mất từ vài phút đến 24 giờ.
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="gradient" size="lg" asChild>
                <Link to="/orders">Xem đơn hàng</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/pricing">Về bảng giá</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(componentClasses.page, "px-4")}>
      <div className="max-w-5xl mx-auto">
        <Link
          to="/pricing"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại chọn gói
        </Link>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3">
            <div className={cn(componentClasses.card, "p-8 hover:scale-100")}>
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <QrCode className="w-7 h-7 text-primary" />
                Quét mã QR chuyển khoản
              </h2>
              <p className="text-muted-foreground mb-8">
                Mở app ngân hàng → Quét QR → Kiểm tra số tiền và nội dung chuyển khoản → Xác nhận.
              </p>

              {checkoutLoading ? (
                <div className="flex flex-col items-center py-16 gap-4">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <p className="text-muted-foreground">Đang tạo đơn và mã QR...</p>
                </div>
              ) : qrImageUrl ? (
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-2xl shadow-lg border border-border mb-6">
                    <img
                      src={qrImageUrl}
                      alt="Mã QR chuyển khoản"
                      className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    QR đã gắn sẵn số tiền{" "}
                    <strong className="text-foreground font-mono">
                      {selectedPlan.priceVnd.toLocaleString("vi-VN")}đ
                    </strong>
                    {order && (
                      <>
                        {" "}
                        và nội dung{" "}
                        <strong className="text-primary font-mono">{order.orderCode}</strong>
                      </>
                    )}
                  </p>
                </div>
              ) : (
                <div className="bg-warning/10 border border-warning/30 rounded-xl p-6 text-center">
                  <AlertCircle className="w-10 h-10 text-warning mx-auto mb-3" />
                  <p className="text-foreground font-medium">Chưa có mã QR</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Cấu hình tài khoản ngân hàng trong BE/appsettings.json → BankTransfer
                  </p>
                </div>
              )}

              {bankInfo && (
                <div className="mt-8 bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-4">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Thông tin chuyển khoản thủ công
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Ngân hàng</p>
                      <p className="font-semibold text-foreground">{bankInfo.bankName}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Chủ tài khoản</p>
                      <p className="font-semibold text-foreground">{bankInfo.accountHolder}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-muted-foreground">Số tài khoản</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="font-mono font-bold text-lg text-foreground">
                          {bankInfo.accountNumber}
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => copyText(bankInfo.accountNumber, "số tài khoản")}
                          title="Copy STK"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Số tiền</p>
                      <p className="font-mono font-bold text-foreground">
                        {selectedPlan.priceVnd.toLocaleString("vi-VN")}đ
                      </p>
                    </div>
                    {order && (
                      <div>
                        <p className="text-muted-foreground">Nội dung CK (bắt buộc)</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="font-mono font-bold text-primary">{order.orderCode}</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => copyText(order.orderCode, "nội dung CK")}
                            title="Copy nội dung"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="button"
                variant="gradient"
                size="lg"
                className="w-full mt-8"
                onClick={handleConfirmTransfer}
                disabled={checkoutLoading || !order}
              >
                Tôi đã chuyển khoản
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                Nhấn sau khi đã chuyển khoản thành công. Gói sẽ được kích hoạt khi admin xác nhận.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className={cn(componentClasses.card, "p-6 sticky top-24 hover:scale-100")}>
              <h3 className="text-lg font-bold text-foreground mb-4">Thông tin đơn hàng</h3>

              <div className="bg-gradient-to-br from-primary to-secondary rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                  <p className="font-bold text-primary-foreground">{selectedPlan.name}</p>
                </div>
                <p className="text-3xl font-bold text-primary-foreground font-mono">
                  {selectedPlan.priceVnd.toLocaleString("vi-VN")}đ
                </p>
                {selectedPlan.isUnlimited ? (
                  <p className="text-primary-foreground/90 text-sm font-semibold mt-1">
                    Không giới hạn xu
                  </p>
                ) : (
                  <p className="text-primary-foreground/90 text-sm mt-1">
                    +{selectedPlan.creditsMonthly ?? 0} xu/tháng
                  </p>
                )}
              </div>

              {order && (
                <div className={cn(componentClasses.cardSimple, "mb-4 p-3 hover:scale-100")}>
                  <p className="text-xs text-muted-foreground">Mã đơn</p>
                  <p className="font-mono font-bold text-foreground">{order.orderCode}</p>
                  <span className={cn(componentClasses.badgeWarning, "inline-block mt-2")}>
                    Chờ thanh toán
                  </span>
                </div>
              )}

              <ul className="space-y-2 mb-4">
                {resolvePlanFeatures(selectedPlan).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Vui lòng ghi đúng nội dung chuyển khoản để hệ thống đối soát nhanh hơn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
