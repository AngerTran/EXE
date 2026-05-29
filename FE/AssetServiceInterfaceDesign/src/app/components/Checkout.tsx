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
  Sparkles,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Package {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
}

const packages: Record<string, Package> = {
  student: {
    id: "student",
    name: "Gói STUDENT",
    price: 29000,
    credits: 100,
    features: [
      "100 lượt hỏi AI/tháng",
      "Full Asset Unity/Godot",
      "Gợi ý assets chi tiết",
      "Hỗ trợ ưu tiên",
      "Tài liệu hướng dẫn tiếng Việt",
    ],
  },
  indie: {
    id: "indie",
    name: "Gói INDIE",
    price: 99000,
    credits: -1, // unlimited
    features: [
      "Không giới hạn lượt hỏi AI",
      "Gợi ý assets tùy chỉnh",
      "Full library assets",
      "Review assets miễn phí",
      "Hỗ trợ 24/7",
    ],
  },
  pro: {
    id: "pro",
    name: "Gói PRO",
    price: 199000,
    credits: -1, // unlimited
    features: [
      "Không giới hạn lượt hỏi AI",
      "Hỗ trợ Team (nhiều thành viên)",
      "Source code mẫu chất lượng cao",
      "Review dự án game",
      "Priority support 24/7",
      "Asset packs độc quyền",
    ],
  },
};

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get("package") || "student";
  const selectedPackage = packages[packageId] || packages.student;

  const { user, updateCredits, updateSubscription } = useAuth();
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

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

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

      // Update user data based on package type
      if (user) {
        // Calculate subscription expiry (30 days from now)
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);
        const expiryString = expiry.toISOString();

        // Update subscription
        updateSubscription(packageId as any, expiryString);

        // For unlimited packages (indie, pro), set a high number
        if (selectedPackage.credits === -1) {
          const newCredits = user.credits + 999999; // Effectively unlimited
          updateCredits(newCredits);
        } else {
          // For other packages: Add credits
          const newCredits = user.credits + selectedPackage.credits;
          updateCredits(newCredits);
        }

        // Update total spent
        const usersData = localStorage.getItem("users");
        if (usersData) {
          const users = JSON.parse(usersData);
          if (users[user.email]) {
            users[user.email].totalSpent = (users[user.email].totalSpent || 0) + selectedPackage.price;
            localStorage.setItem("users", JSON.stringify(users));
          }
        }

        // Record order
        const ordersData = localStorage.getItem("admin_orders");
        const orders = ordersData ? JSON.parse(ordersData) : [];
        orders.push({
          id: `ORD-${Date.now()}`,
          userId: user.id,
          userName: user.name,
          items: [selectedPackage.name],
          total: selectedPackage.price,
          status: "completed",
          date: new Date().toISOString().split('T')[0],
        });
        localStorage.setItem("admin_orders", JSON.stringify(orders));

        // Update package sales count in admin_packages
        const packagesData = localStorage.getItem("admin_packages");
        if (packagesData) {
          const adminPackages = JSON.parse(packagesData);
          // Match by packageId (student, indie, pro) with package name (STUDENT, INDIE, PRO)
          const packageToUpdate = adminPackages.find((p: any) => 
            p.name.toUpperCase() === packageId.toUpperCase()
          );
          if (packageToUpdate) {
            packageToUpdate.sales = (packageToUpdate.sales || 0) + 1;
            packageToUpdate.revenue = (packageToUpdate.revenue || 0) + selectedPackage.price;
            localStorage.setItem("admin_packages", JSON.stringify(adminPackages));
            
            // Dispatch custom event to notify admin dashboard
            window.dispatchEvent(new CustomEvent('packageUpdated'));
          }
        }
      }

      // Redirect after 3 seconds
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    }, 2000);
  };

  if (!user) {
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
              Thanh toán thành công! 🎉
            </h2>
            <p className="text-gray-300 mb-2">
              Bạn đã mua <span className="font-bold text-purple-400">{selectedPackage.name}</span>
            </p>
            {selectedPackage.credits === -1 ? (
              <p className="text-gray-300 mb-6">
                <span className="text-2xl font-bold text-green-400">Không giới hạn ∞</span> lượt hỏi AI!
                <br />
                <span className="text-sm">Sử dụng AI không giới hạn</span>
              </p>
            ) : (
              <p className="text-gray-300 mb-6">
                <span className="text-2xl font-bold text-white">+{selectedPackage.credits}</span> lượt
                đã được thêm vào tài khoản
              </p>
            )}
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Clock className="w-4 h-4" />
              Chuyển đến Dashboard trong giây lát...
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
          to="/pricing"
          className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại chọn gói
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">
                Thông tin thanh toán
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">
                    Thông tin cá nhân
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
                      Email
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
                        S thẻ
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
                      Nội dung: <span className="font-bold">{user.email} {packageId}</span>
                    </p>
                  </div>
                )}

                {/* Security Notice */}
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-200 font-medium mb-1">
                      Thanh toán an toàn & bảo mật
                    </p>
                    <p className="text-green-100 text-sm">
                      Thông tin thanh toán được mã hóa SSL 256-bit
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
                      Thanh toán {selectedPackage.price.toLocaleString("vi-VN")}đ
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
                Thông tin đơn hàng
              </h3>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-white" />
                    <p className="font-bold text-white">{selectedPackage.name}</p>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">
                    {selectedPackage.price.toLocaleString("vi-VN")}đ
                  </p>
                  {selectedPackage.credits === -1 ? (
                    <p className="text-purple-100 text-sm font-semibold">
                      Không giới hạn ∞ lượt hỏi AI
                    </p>
                  ) : (
                    <p className="text-purple-100 text-sm">
                      +{selectedPackage.credits} lượt hỏi AI
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-300">
                    Tính năng bao gồm:
                  </p>
                  {selectedPackage.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-200">{feature}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-300">
                    <span>Tạm tính</span>
                    <span>{selectedPackage.price.toLocaleString("vi-VN")}đ</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>VAT (0%)</span>
                    <span>0đ</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/10">
                    <span>Tổng cộng</span>
                    <span>{selectedPackage.price.toLocaleString("vi-VN")}đ</span>
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-200">
                    Credits sẽ được cộng ngay sau khi thanh toán thành công
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