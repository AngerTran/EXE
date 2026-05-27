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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              {totalPrice === 0 ? "Tải về thành công! 🎉" : "Thanh toán thành công! 🎉"}
            </h2>
            <p className="text-gray-300 mb-2">
              Bạn đã {totalPrice === 0 ? "tải" : "mua"}{" "}
              <span className="font-bold text-purple-400">{selectedAssets.length} assets</span>
            </p>
            <p className="text-gray-300 mb-6">
              {totalPrice === 0 ? (
                <span className="text-green-400">
                  ✨ Tất cả đều miễn phí!
                </span>
              ) : (
                <>
                  Tổng giá trị:{" "}
                  <span className="text-2xl font-bold text-white">
                    {totalPrice.toLocaleString("vi-VN")}đ
                  </span>
                </>
              )}
            </p>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 justify-center text-purple-200 mb-2">
                <Download className="w-5 h-5" />
                <p className="font-medium">Link tải xuống</p>
              </div>
              <p className="text-sm text-purple-100">
                Đã gửi qua email: {user.email}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Clock className="w-4 h-4" />
              Chuyển về Marketplace trong giây lát...
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
          className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại Marketplace
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Package className="w-7 h-7" />
                Thông tin thanh toán
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Thông tin nhận hàng
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Họ và tên
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        placeholder="0123456789"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email nhận link tải
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {totalPrice > 0 ? (
                  <>
                    {/* Payment Method */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">
                        Phương thức thanh toán
                      </h3>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("momo")}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            paymentMethod === "momo"
                              ? "border-purple-500 bg-purple-500/20"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <Wallet className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                          <p className="text-white font-medium">MoMo</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("bank")}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            paymentMethod === "bank"
                              ? "border-purple-500 bg-purple-500/20"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <CreditCard className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                          <p className="text-white font-medium">Chuyển khoản</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("card")}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            paymentMethod === "card"
                              ? "border-purple-500 bg-purple-500/20"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <CreditCard className="w-8 h-8 text-green-400 mx-auto mb-2" />
                          <p className="text-white font-medium">Thẻ tín dụng</p>
                        </button>
                      </div>
                    </div>

                    {/* Payment Details */}
                    {paymentMethod === "card" && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">
                          Thông tin thẻ
                        </h3>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
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
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Tên chủ thẻ
                          </label>
                          <input
                            type="text"
                            name="cardName"
                            value={formData.cardName}
                            onChange={handleInputChange}
                            required={paymentMethod === "card"}
                            placeholder="NGUYEN VAN A"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
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
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
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
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === "momo" && (
                      <div className="bg-pink-500/10 border border-pink-500/30 rounded-xl p-4">
                        <p className="text-pink-200 text-sm">
                          💡 Bạn sẽ được chuyển đến ứng dụng MoMo để hoàn tất thanh toán
                        </p>
                      </div>
                    )}

                    {paymentMethod === "bank" && (
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 space-y-2">
                        <p className="text-blue-200 font-medium">
                          Thông tin chuyển khoản:
                        </p>
                        <p className="text-blue-100 text-sm">
                          Ngân hàng: <span className="font-bold">VCB - Vietcombank</span>
                        </p>
                        <p className="text-blue-100 text-sm">
                          Số TK: <span className="font-bold">1234567890</span>
                        </p>
                        <p className="text-blue-100 text-sm">
                          Chủ TK: <span className="font-bold">CONG TY GAMEASSETS AI</span>
                        </p>
                        <p className="text-blue-100 text-sm">
                          Nội dung:{" "}
                          <span className="font-bold">
                            {user.email} ASSETS
                          </span>
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center">
                    <Download className="w-12 h-12 text-green-400 mx-auto mb-3" />
                    <p className="text-green-200 font-bold text-lg mb-2">
                      Tất cả assets đều miễn phí! 🎉
                    </p>
                    <p className="text-green-100 text-sm">
                      Nhấn nút bên dưới để nhận link tải về
                    </p>
                  </div>
                )}

                {/* Security Notice */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-200 font-medium mb-1">
                      {totalPrice > 0 ? "Thanh toán an toàn & bảo mật" : "Tải về an toàn"}
                    </p>
                    <p className="text-green-100 text-sm">
                      {totalPrice > 0
                        ? "Thông tin thanh toán được mã hóa SSL 256-bit"
                        : "Link tải sẽ được gửi qua email đã đăng ký"}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-4 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Đang xử lý...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Lock className="w-5 h-5" />
                      {totalPrice > 0
                        ? `Thanh toán ${totalPrice.toLocaleString("vi-VN")}đ`
                        : "Tải về miễn phí"}
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 sticky top-24">
              <h3 className="text-lg font-bold text-white mb-4">
                Đơn hàng của bạn
              </h3>

              <div className="space-y-4">
                {/* Assets List */}
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {selectedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="bg-white/5 border border-white/10 rounded-lg p-3 flex gap-3"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-lg overflow-hidden flex-shrink-0">
                        <ImageWithFallback
                          src={`https://source.unsplash.com/200x200/?${encodeURIComponent(
                            asset.preview
                          )}`}
                          alt={asset.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-white text-sm mb-1 truncate">
                          {asset.title}
                        </h4>
                        <p className="text-xs text-gray-400 mb-1">
                          {asset.author}
                        </p>
                        {hasActiveSubscription ? (
                          <div>
                            <p className="font-bold text-green-400 text-sm">Miễn phí với gói</p>
                            {!asset.isFree && (
                              <p className="text-xs text-gray-500 line-through">
                                {asset.price.toLocaleString("vi-VN")}đ
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="font-bold text-white text-sm">
                            {asset.isFree
                              ? "Miễn phí"
                              : `${asset.price.toLocaleString("vi-VN")}đ`}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-300">
                    <span>Số lượng:</span>
                    <span className="font-medium text-white">
                      {selectedAssets.length} assets
                    </span>
                  </div>
                  {freeItemsCount > 0 && (
                    <div className="flex justify-between text-gray-300">
                      <span>Miễn phí:</span>
                      <span className="font-medium text-green-400">
                        {freeItemsCount} items
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-300">
                    <span>Tạm tính:</span>
                    <span className="font-medium text-white">
                      {totalPrice.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>VAT (0%):</span>
                    <span>0đ</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/10">
                    <span>Tổng cộng:</span>
                    <span className="text-purple-400">
                      {totalPrice.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-200">
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