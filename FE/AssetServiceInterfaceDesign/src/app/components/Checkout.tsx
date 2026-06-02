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
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

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
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-[0_0_50px_rgba(0,217,255,0.08)]">
            <div className="w-20 h-20 bg-success/20 border border-success/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-success" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Thanh toán thành công
            </h2>
            <p className="text-muted-foreground mb-2">
              Bạn đã mua{" "}
              <span className="font-bold text-primary">{selectedPackage.name}</span>
            </p>
            {selectedPackage.credits === -1 ? (
              <p className="text-muted-foreground mb-6">
                <span className="text-2xl font-bold text-success">Không giới hạn ∞</span>{" "}
                lượt hỏi AI
                <br />
                <span className="text-sm">Sử dụng AI không giới hạn</span>
              </p>
            ) : (
              <p className="text-muted-foreground mb-6">
                <span className="text-2xl font-bold text-foreground font-mono">
                  +{selectedPackage.credits}
                </span>{" "}
                lượt đã được thêm vào tài khoản
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <Link
                to="/orders"
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-60"
              >
                Xem lịch sử mua
              </Link>
              <Link
                to="/dashboard"
                className="border border-border bg-card hover:bg-card/80 text-foreground px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
              >
                Đi tới Dashboard
              </Link>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm mt-4">
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
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại chọn gói
        </Link>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Left: Payment Form */}
          <div className="lg:col-span-2">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Thông tin thanh toán
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Thông tin cá nhân
                  </h3>
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
                      Email
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
                      Nội dung: <span className="font-bold">{user.email} {packageId}</span>
                    </p>
                  </div>
                )}

                {/* Security Notice */}
                <div className="bg-success/10 border border-success/30 rounded-xl p-4 flex items-start gap-3">
                  <Shield className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-foreground font-medium mb-1">
                      Thanh toán an toàn & bảo mật
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Thông tin thanh toán được mã hóa SSL 256-bit
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
                      Thanh toán {selectedPackage.price.toLocaleString("vi-VN")} xu
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Thông tin đơn hàng
              </h3>

              <div className="space-y-4">
                <div className="bg-gradient-to-br from-primary to-secondary rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-primary-foreground" />
                    <p className="font-bold text-primary-foreground">{selectedPackage.name}</p>
                  </div>
                  <p className="text-3xl font-bold text-primary-foreground mb-1 font-mono">
                    {selectedPackage.price.toLocaleString("vi-VN")} xu
                  </p>
                  {selectedPackage.credits === -1 ? (
                    <p className="text-primary-foreground/90 text-sm font-semibold">
                      Không giới hạn ∞ lượt hỏi AI
                    </p>
                  ) : (
                    <p className="text-primary-foreground/90 text-sm">
                      +{selectedPackage.credits} lượt hỏi AI
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Tính năng bao gồm:
                  </p>
                  {selectedPackage.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground">{feature}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tạm tính</span>
                    <span className="font-mono">{selectedPackage.price.toLocaleString("vi-VN")} xu</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>VAT (0%)</span>
                    <span className="font-mono">0 xu</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-foreground pt-2 border-t border-border">
                    <span>Tổng cộng</span>
                    <span className="font-mono">{selectedPackage.price.toLocaleString("vi-VN")} xu</span>
                  </div>
                </div>

                <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
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