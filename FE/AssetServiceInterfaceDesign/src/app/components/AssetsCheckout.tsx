import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import {
  CreditCard,
  Wallet,
  CheckCircle,
  ArrowLeft,
  Shield,
  Lock,
  Clock,
  AlertCircle,
  Download,
  Package,
} from "lucide-react";
import { mockAssets } from "./AssetsMarketplace";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export default function AssetsCheckout() {
  const [searchParams] = useSearchParams();
  const assetIdsParam = searchParams.get("assets") || "";
  const assetIds = assetIdsParam.split(",").filter(Boolean);

  const { user } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<"momo" | "bank" | "card">("momo");
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check if user has an active subscription (STUDENT, INDIE, or PRO)
  const hasActiveSubscription = user?.subscription && ["student", "indie", "pro"].includes(user.subscription);

  // Get selected assets
  const selectedAssets = mockAssets.filter((asset) => assetIds.includes(asset.id));
  
  // If user has subscription, all assets are free
  const totalPrice = hasActiveSubscription 
    ? 0 
    : selectedAssets.reduce((sum, asset) => sum + asset.price, 0);
  
  const freeItemsCount = hasActiveSubscription 
    ? selectedAssets.length 
    : selectedAssets.filter((asset) => asset.isFree).length;

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
    if (assetIds.length === 0) {
      navigate("/marketplace");
    }
  }, [user, assetIds, navigate]);

  const normalizePhone = (raw: string) => raw.replace(/\D/g, "").slice(0, 11);
  const isValidPhone = (digits: string) =>
    /^(0\d{9}|84\d{9})$/.test(digits);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone") {
      const next = normalizePhone(value);
      setFormData({ ...formData, phone: next });
      return;
    }
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const phoneOk = isValidPhone(formData.phone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneTouched(true);
    if (!phoneOk) return;
    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setShowSuccess(true);

      // Save purchased assets to localStorage
      if (user) {
        const existingAssets = localStorage.getItem(`purchased_assets_${user.id}`);
        const purchasedAssets = existingAssets ? JSON.parse(existingAssets) : [];
        
        const newPurchases = selectedAssets.map((asset) => ({
          id: asset.id,
          title: asset.title,
          category: asset.category,
          price: hasActiveSubscription ? 0 : asset.price, // If has subscription, price = 0
          purchaseDate: new Date().toISOString().split('T')[0],
          downloadCount: 0,
          fileSize: "120 MB",
          fileType: asset.category === "Sound Effects" || asset.category === "Music" ? "MP3, WAV" : asset.category === "UI/UX" ? "PSD, AI, SVG" : "PNG, PSD",
        }));

        const updatedAssets = [...purchasedAssets, ...newPurchases];
        localStorage.setItem(`purchased_assets_${user.id}`, JSON.stringify(updatedAssets));

        // Update total spent in users data (only if actually paid)
        if (totalPrice > 0) {
          const usersData = localStorage.getItem("users");
          if (usersData) {
            const users = JSON.parse(usersData);
            if (users[user.email]) {
              users[user.email].totalSpent = (users[user.email].totalSpent || 0) + totalPrice;
              localStorage.setItem("users", JSON.stringify(users));
            }
          }

          // Record order in admin_orders (only if actually paid)
          const ordersData = localStorage.getItem("admin_orders");
          const orders = ordersData ? JSON.parse(ordersData) : [];
          orders.push({
            id: `ORD-${Date.now()}`,
            userId: user.id,
            userName: user.name,
            items: selectedAssets.map(a => a.title),
            total: totalPrice,
            status: "completed",
            date: new Date().toISOString().split('T')[0],
          });
          localStorage.setItem("admin_orders", JSON.stringify(orders));
        }

        // Clear cart
        localStorage.removeItem(`cart_${user.id}`);
      }

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/my-assets");
      }, 3000);
    }, 2000);
  };

  if (!user || assetIds.length === 0) {
    return null;
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-[0_0_50px_rgba(0,217,255,0.08)]">
            <div className="w-20 h-20 bg-success/20 border border-success/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {totalPrice === 0 ? "Tải về thành công" : "Thanh toán thành công"}
            </h2>
            <p className="text-muted-foreground mb-2">
              Bạn đã {totalPrice === 0 ? "tải" : "mua"}{" "}
              <span className="font-bold text-primary">{selectedAssets.length} assets</span>
            </p>
            <p className="text-muted-foreground mb-6">
              {totalPrice === 0 ? (
                <span className="text-success font-semibold">Tất cả đều miễn phí</span>
              ) : (
                <>
                  Tổng giá trị:{" "}
                  <span className="text-2xl font-bold text-foreground font-mono">
                    {totalPrice.toLocaleString("vi-VN")} xu
                  </span>
                </>
              )}
            </p>
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 justify-center text-foreground mb-2">
                <Download className="w-5 h-5" />
                <p className="font-medium">Link tải xuống</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Đã gửi qua email: {user.email}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
              <Link
                to="/orders"
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-60"
              >
                Xem lịch sử mua
              </Link>
              <Link
                to="/my-assets"
                className="border border-border bg-card hover:bg-card/80 text-foreground px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
              >
                Về thư viện
              </Link>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mt-4">
              <Clock className="w-4 h-4" />
              Chuyển về thư viện trong giây lát...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại Marketplace
        </Link>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Left: Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Package className="w-7 h-7" />
                Thông tin thanh toán
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        onBlur={() => setPhoneTouched(true)}
                        required
                        placeholder="0123456789"
                        inputMode="numeric"
                        pattern="^(0\d{9}|84\d{9})$"
                        className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                      {phoneTouched && !phoneOk && (
                        <p className="mt-2 text-sm text-destructive">
                          Số điện thoại không hợp lệ (chỉ nhập số, 10 chữ số bắt đầu bằng 0 hoặc 84 + 9 chữ số).
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Email nhận link tải
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {totalPrice > 0 ? (
                  <>
                    {/* Payment Method */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">
                        Phương thức thanh toán
                      </h3>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("momo")}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            paymentMethod === "momo"
                              ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,217,255,0.12)]"
                              : "border-border bg-card hover:bg-card/80 hover:border-primary/50"
                          }`}
                        >
                          <Wallet className="w-8 h-8 text-secondary mx-auto mb-2" />
                          <p className="text-foreground font-medium">MoMo</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("bank")}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            paymentMethod === "bank"
                              ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,217,255,0.12)]"
                              : "border-border bg-card hover:bg-card/80 hover:border-primary/50"
                          }`}
                        >
                          <CreditCard className="w-8 h-8 text-primary mx-auto mb-2" />
                          <p className="text-foreground font-medium">Chuyển khoản</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("card")}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            paymentMethod === "card"
                              ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,217,255,0.12)]"
                              : "border-border bg-card hover:bg-card/80 hover:border-primary/50"
                          }`}
                        >
                          <CreditCard className="w-8 h-8 text-success mx-auto mb-2" />
                          <p className="text-foreground font-medium">Thẻ tín dụng</p>
                        </button>
                      </div>
                    </div>

                    {/* Payment Details */}
                    {paymentMethod === "card" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-foreground">
                          Thông tin thẻ
                        </h3>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Số thẻ
                          </label>
                          <input
                            type="text"
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                            required={paymentMethod === "card"}
                            placeholder="1234 5678 9012 3456"
                            maxLength={19}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-2">
                            Tên chủ thẻ
                          </label>
                          <input
                            type="text"
                            name="cardName"
                            value={formData.cardName}
                            onChange={handleInputChange}
                            required={paymentMethod === "card"}
                            placeholder="NGUYEN VAN A"
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                              Ngày hết hạn
                            </label>
                            <input
                              type="text"
                              name="expiryDate"
                              value={formData.expiryDate}
                              onChange={handleInputChange}
                              required={paymentMethod === "card"}
                              placeholder="MM/YY"
                              maxLength={5}
                              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">
                              CVV
                            </label>
                            <input
                              type="text"
                              name="cvv"
                              value={formData.cvv}
                              onChange={handleInputChange}
                              required={paymentMethod === "card"}
                              placeholder="123"
                              maxLength={3}
                              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "momo" && (
                      <div className="bg-secondary/10 border border-secondary/30 rounded-xl p-4">
                        <p className="text-foreground text-sm">
                          Bạn sẽ được chuyển đến ứng dụng MoMo để hoàn tất thanh toán
                        </p>
                      </div>
                    )}

                    {paymentMethod === "bank" && (
                      <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 space-y-2">
                        <p className="text-foreground font-medium">
                          Thông tin chuyển khoản:
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Ngân hàng: <span className="font-bold">VCB - Vietcombank</span>
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Số TK: <span className="font-bold">1234567890</span>
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Chủ TK: <span className="font-bold">CONG TY GAMEASSETS AI</span>
                        </p>
                        <p className="text-muted-foreground text-sm">
                          Nội dung:{" "}
                          <span className="font-bold">
                            {user.email} ASSETS
                          </span>
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-success/10 border border-success/30 rounded-xl p-6 text-center">
                    <Download className="w-12 h-12 text-success mx-auto mb-3" />
                    <p className="text-foreground font-bold text-lg mb-2">
                      Tất cả assets đều miễn phí!
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Nhấn nút bên dưới để nhận link tải về
                    </p>
                  </div>
                )}

                {/* Security Notice */}
                <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-foreground font-medium mb-1">
                      {totalPrice > 0 ? "Thanh toán an toàn & bảo mật" : "Tải về an toàn"}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {totalPrice > 0
                        ? "Thông tin thanh toán được mã hóa SSL 256-bit"
                        : "Link tải sẽ được gửi qua email đã đăng ký"}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing || !phoneOk}
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground py-4 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                      Đang xử lý...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Lock className="w-5 h-5" />
                      {totalPrice > 0
                        ? `Thanh toán ${totalPrice.toLocaleString("vi-VN")} xu`
                        : "Tải về miễn phí"}
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 lg:sticky lg:top-24 lg:max-h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Đơn hàng của bạn
              </h3>

              <div className="flex flex-col gap-4 min-h-0">
                {/* Assets List */}
                <div className="flex-1 min-h-0 overflow-y-auto space-y-3 pr-1">
                  {selectedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-card border border-border rounded-lg p-3 flex gap-3"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg overflow-hidden flex-shrink-0">
                        <ImageWithFallback
                          src={`https://source.unsplash.com/200x200/?${encodeURIComponent(
                            asset.preview
                          )}`}
                          alt={asset.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-foreground text-sm mb-1 truncate">
                          {asset.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-1">
                          {asset.author}
                        </p>
                        {hasActiveSubscription ? (
                          <div>
                            <p className="font-bold text-success text-sm">Miễn phí với gói</p>
                            {!asset.isFree && (
                              <p className="text-xs text-muted-foreground line-through opacity-70">
                                {asset.price.toLocaleString("vi-VN")} xu
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="font-bold text-foreground text-sm">
                            {asset.isFree
                              ? "Miễn phí"
                              : `${asset.price.toLocaleString("vi-VN")} xu`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Số lượng:</span>
                    <span className="font-medium text-foreground">
                      {selectedAssets.length} assets
                    </span>
                  </div>
                  {freeItemsCount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Miễn phí:</span>
                      <span className="font-medium text-success">
                        {freeItemsCount} items
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tạm tính:</span>
                    <span className="font-medium text-foreground">
                      {totalPrice.toLocaleString("vi-VN")} xu
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>VAT (0%):</span>
                    <span>0 xu</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-foreground pt-2 border-t border-border">
                    <span>Tổng cộng:</span>
                    <span className="text-primary">
                      {totalPrice.toLocaleString("vi-VN")} xu
                    </span>
                  </div>
                </div>

                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Link tải sẽ được gửi qua email sau khi thanh toán thành công
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}