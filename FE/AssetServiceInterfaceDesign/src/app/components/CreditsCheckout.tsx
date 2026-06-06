import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import {
  CheckCircle,
  ArrowLeft,
  Coins,
  Clock,
  AlertCircle,
  Loader2,
  QrCode,
  Copy,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "../../api/client";
import { createCreditPackOrder } from "../../api/orders";
import { fetchBankTransferInfo, type BankTransferInfo } from "../../api/payments";
import type { Order } from "../../api/types/commerce";
import { fetchCreditPacks } from "../../api/creditPacks";
import {
  CREDIT_PACKS_FALLBACK,
  getCreditPackById,
  formatPackPrice,
  formatUnitPricePer100,
  mapCreditPackItem,
  sortCreditPacks,
  type CreditPack,
} from "../../constants/creditPacks";
import { hasPaidSubscription } from "../../constants/subscriptionPlanTemplates";
import { componentClasses } from "../../constants/theme";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
import { usePollOrderCompletion } from "../../hooks/usePollOrderCompletion";

export default function CreditsCheckout() {
  const [searchParams] = useSearchParams();
  const packIdParam = searchParams.get("pack") || "";

  const { user, refreshUserData } = useAuth();
  const navigate = useNavigate();

  const [packs, setPacks] = useState<CreditPack[]>(CREDIT_PACKS_FALLBACK);
  const [packsLoading, setPacksLoading] = useState(true);
  const packId = packIdParam || packs[1]?.id || packs[0]?.id || "";
  const selectedPack = getCreditPackById(packs, packId) ?? packs[0];
  const canBuy = hasPaidSubscription(user?.subscription);

  const [order, setOrder] = useState<Order | null>(null);
  const [bankInfo, setBankInfo] = useState<BankTransferInfo | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const orderCompleted = usePollOrderCompletion(order?.id, paymentSubmitted, {
    onCompleted: () =>
      toast.success("Xu đã được cộng — số xu trên header đã cập nhật"),
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchCreditPacks();
        if (!cancelled && data.length > 0) {
          setPacks(sortCreditPacks(data.map(mapCreditPackItem)));
        }
      } finally {
        if (!cancelled) setPacksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) navigate("/auth");
    else if (!canBuy) navigate("/pricing");
  }, [user, canBuy, navigate]);

  useEffect(() => {
    if (!user || !canBuy || !selectedPack || packsLoading) return;

    let cancelled = false;
    (async () => {
      setCheckoutLoading(true);
      try {
        const created = await createCreditPackOrder(selectedPack.id);
        if (cancelled) return;
        setOrder(created);
        if (created.status === "completed") {
          await refreshUserData();
        }

        try {
          const bank = await fetchBankTransferInfo(selectedPack.priceVnd, created.orderCode);
          if (!cancelled) setBankInfo(bank);
        } catch (bankError) {
          if (!cancelled) {
            toast.error(
              bankError instanceof ApiError
                ? bankError.message
                : "Không tải được thông tin ngân hàng"
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.code === "subscription_required") {
            toast.error("Chỉ thành viên gói STUDENT hoặc PRO mới mua thêm xu được.");
          } else {
            toast.error(error instanceof ApiError ? error.message : "Không tạo được đơn mua xu");
          }
          navigate("/pricing");
        }
      } finally {
        if (!cancelled) setCheckoutLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, canBuy, selectedPack, packsLoading, navigate, refreshUserData]);

  const qrImageUrl = bankInfo?.qrImageUrl || bankInfo?.vietQrImageUrl || null;

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
    toast.success("Đã ghi nhận. Xu sẽ được cộng sau khi xác nhận chuyển khoản.");
  };

  if (!user || !canBuy || packsLoading || !selectedPack) {
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
          <div className={cn(componentClasses.card, "p-8 hover:scale-100")}>
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
                  <span className="font-bold text-primary">
                    {selectedPack.credits.toLocaleString("vi-VN")} xu
                  </span>{" "}
                  đã được cộng vào ví. Số xu trên header đã được cập nhật.
                </>
              ) : (
                <>
                  Bạn đã báo chuyển khoản gói{" "}
                  <span className="font-bold text-primary">
                    {selectedPack.credits.toLocaleString("vi-VN")} xu
                  </span>
                  .
                </>
              )}
            </p>
            {!orderCompleted && (
              <p className="text-muted-foreground text-sm mb-6">
                Sau khi admin đối soát, xu sẽ được cộng vào ví tự động.
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
          Quay lại chọn gói xu
        </Link>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3">
            <div className={cn(componentClasses.card, "p-8 hover:scale-100")}>
              <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <QrCode className="w-7 h-7 text-primary" />
                Quét mã QR chuyển khoản
              </h2>
              <p className="text-muted-foreground mb-8">
                Mua thêm xu cho tài khoản đang dùng gói trả phí — thanh toán một lần, không
                gia hạn tự động.
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
                    QR gắn sẵn{" "}
                    <strong className="text-foreground font-mono">
                      {formatPackPrice(selectedPack)}
                    </strong>
                    {order && (
                      <>
                        {" "}
                        — nội dung{" "}
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
                    Cấu hình BankTransfer trong BE/appsettings.json
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
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Số tiền</p>
                      <p className="font-mono font-bold text-foreground">
                        {formatPackPrice(selectedPack)}
                      </p>
                    </div>
                    {order && (
                      <div>
                        <p className="text-muted-foreground">Nội dung CK</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="font-mono font-bold text-primary">{order.orderCode}</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => copyText(order.orderCode, "nội dung CK")}
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
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className={cn(componentClasses.card, "p-6 sticky top-24 hover:scale-100")}>
              <h3 className="text-lg font-bold text-foreground mb-4">Gói xu đã chọn</h3>
              <div className="bg-gradient-to-br from-primary to-secondary rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="w-5 h-5 text-primary-foreground" />
                  <p className="font-bold text-primary-foreground">
                    {selectedPack.credits.toLocaleString("vi-VN")} xu
                  </p>
                </div>
                <p className="text-3xl font-bold text-primary-foreground font-mono">
                  {formatPackPrice(selectedPack)}
                </p>
                <p className="text-primary-foreground/90 text-sm mt-1">
                  ({formatUnitPricePer100(selectedPack)} / 100 xu)
                </p>
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

              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  Xu cộng một lần vào ví — dùng cho AI & marketplace
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  Không ảnh hưởng chu kỳ gói đăng ký hiện tại
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
